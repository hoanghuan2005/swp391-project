import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient, { backendBaseUrl } from "@/api/axiosClient";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { forceDownload } from "@/lib/downloadHelper";
import { getFileExtension } from "@/lib/utils";
import { CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Search,
  FileText,
  BookOpen,
  Download,
  Eye,
  Share2,
  Copy,
  Star,
  Heart,
  ChevronLeft,
  ListChecks,
  Layers,
  Send,
  MessageSquare,
} from "lucide-react";

const REACTION_EMOJIS = {
  LIKE: "👍",
  LOVE: "❤️",
  HAHA: "😆",
  WOW: "😮",
  SAD: "😢",
  ANGRY: "😡",
};

export default function CourseDetailPage() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState("materials");
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Threading and reaction state
  const [replyMessages, setReplyMessages] = useState({});
  const [activeReactionPicker, setActiveReactionPicker] = useState(null);
  const [expandedReplyComments, setExpandedReplyComments] = useState({});
  const replyInputRefs = useRef({});
  const hideTimeoutRef = useRef(null);

  // Fetch user profile for chat sender match
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axiosClient.get("/api/profile");
          setCurrentUser(res.data);
        } catch (e) {
          console.error("Failed to fetch profile for chat", e);
        }
      }
    };
    fetchProfile();
  }, []);

  // Handle WebSocket Connection and Chat History
  useEffect(() => {
    if (activeTab !== "chat" || !id) {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsChatConnected(false);
      }
      return;
    }

    const fetchChatHistory = async () => {
      try {
        const res = await axiosClient.get(`/api/courses/${id}/messages`);
        setMessages(res.data || []);
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    };

    fetchChatHistory();

    const token = localStorage.getItem("token");
    if (!token) return;

    const wsBaseUrl = backendBaseUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");

    const wsUrl = `${wsBaseUrl}/chat-ws/${id}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsChatConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event === "NEW_COMMENT") {
          setMessages((prev) => [...prev, parsed.data]);
        } else if (parsed.event === "REACTION_UPDATE") {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === parsed.data.id ? parsed.data : msg))
          );
        }
      } catch (err) {
        console.error("Failed to parse message", err);
      }
    };

    ws.onclose = () => {
      setIsChatConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    setSocket(ws);

    return () => {
      ws.close();
      setIsChatConnected(false);
    };
  }, [activeTab, id]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (content, parentId = null) => {
    if (!content.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

    const payload = JSON.stringify({
      type: "COMMENT",
      content: content.trim(),
      parentId: parentId,
    });

    socket.send(payload);
  };

  const handleSendRootMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    handleSendMessage(chatMessage, null);
    setChatMessage("");
  };

  const handleSendReplyMessage = (e, parentId) => {
    e.preventDefault();
    const content = replyMessages[parentId];
    if (!content || !content.trim()) return;
    handleSendMessage(content, parentId);
    setReplyMessages((prev) => ({ ...prev, [parentId]: "" }));
  };

  const handleToggleReaction = (messageId, reactionType) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const payload = JSON.stringify({
      type: "REACTION",
      messageId: messageId,
      reactionType: reactionType,
    });

    socket.send(payload);
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const handleReplyClick = (commentId) => {
    setExpandedReplyComments((prev) => ({ ...prev, [commentId]: true }));
    setTimeout(() => {
      if (replyInputRefs.current[commentId]) {
        replyInputRefs.current[commentId].focus();
      }
    }, 50);
  };

  const getReactionSummary = (reactions = []) => {
    if (!reactions || reactions.length === 0) return null;
    const counts = {};
    reactions.forEach((r) => {
      counts[r.reactionType] = (counts[r.reactionType] || 0) + 1;
    });
    const sortedTypes = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const totalCount = reactions.length;
    return {
      types: sortedTypes.slice(0, 3),
      totalCount,
      counts,
    };
  };

  const getUserReaction = (reactions = []) => {
    if (!currentUser || !reactions) return null;
    const found = reactions.find((r) => r.userId === currentUser.id);
    return found ? found.reactionType : null;
  };

  const renderMessageBubble = (msg, isReply = false) => {
    const userReactionType = getUserReaction(msg.reactions);
    const reactionSummary = getReactionSummary(msg.reactions);
    const senderInitial = msg.sender?.fullName?.charAt(0).toUpperCase() || msg.sender?.username?.charAt(0).toUpperCase() || "U";
    const senderName = msg.sender?.fullName || msg.sender?.username || msg.sender?.email || "User";

    return (
      <div key={msg.id} className={`flex gap-3 items-start ${isReply ? "mt-3 pl-3 border-l-2 border-slate-200/60 ml-2" : ""}`}>
        {/* Avatar */}
        <Avatar className={`${isReply ? "w-7 h-7" : "w-9 h-9"} rounded-full border shadow-sm shrink-0 mt-0.5`}>
          <AvatarImage src={msg.sender?.avatarUrl} alt={senderName} className="object-cover" />
          <AvatarFallback className="bg-[#f66810] text-white text-xs font-bold uppercase">
            {senderInitial}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Bubble wrapper */}
          <div className="relative inline-block max-w-[90%] bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <span className="block text-xs font-bold text-slate-800 mb-0.5">
              {senderName}
            </span>
            <p className="text-slate-700 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
              {msg.content}
            </p>

            {/* Reaction badge inside the bubble bottom right */}
            {reactionSummary && (
              <div className="absolute -bottom-2.5 right-3 bg-white border border-slate-100 shadow-sm rounded-full px-2 py-0.5 flex items-center gap-1 text-[11px] select-none z-10">
                <div className="flex -space-x-1">
                  {reactionSummary.types.map((type) => (
                    <span key={type} className="text-xs" title={type}>
                      {REACTION_EMOJIS[type]}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-extrabold text-slate-500 ml-0.5">
                  {reactionSummary.totalCount}
                </span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2.5 mt-1 ml-2 text-[10px] text-slate-400 select-none">
            <span className="font-semibold">{formatMessageTime(msg.createdAt)}</span>
            <span>•</span>

            {/* Like with hover emoji picker */}
            <div
              className="relative inline-block"
              onMouseEnter={() => {
                if (hideTimeoutRef.current) {
                  clearTimeout(hideTimeoutRef.current);
                  hideTimeoutRef.current = null;
                }
                setActiveReactionPicker(msg.id);
              }}
              onMouseLeave={() => {
                hideTimeoutRef.current = setTimeout(() => {
                  setActiveReactionPicker(null);
                }, 300);
              }}
            >
              <button
                onClick={() => {
                  if (userReactionType) {
                    handleToggleReaction(msg.id, userReactionType);
                  } else {
                    handleToggleReaction(msg.id, "LIKE");
                  }
                }}
                className={`font-bold transition-colors cursor-pointer hover:underline ${
                  userReactionType ? "text-[#f66810]" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {userReactionType ? `${REACTION_EMOJIS[userReactionType]} ${userReactionType.toLowerCase()}` : "Thích"}
              </button>

              {activeReactionPicker === msg.id && (
                <div className="absolute bottom-full left-0 mb-1.5 bg-white border border-slate-200/80 rounded-full shadow-lg px-2 py-1 flex gap-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                    <button
                      key={type}
                      onClick={() => {
                        handleToggleReaction(msg.id, type);
                        setActiveReactionPicker(null);
                        if (hideTimeoutRef.current) {
                          clearTimeout(hideTimeoutRef.current);
                          hideTimeoutRef.current = null;
                        }
                      }}
                      className="text-lg hover:scale-130 transition-transform cursor-pointer p-0.5"
                      title={type}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply action (only on root comments) */}
            {!isReply && (
              <>
                <span>•</span>
                <button
                  onClick={() => handleReplyClick(msg.id)}
                  className="font-bold text-slate-500 hover:text-slate-800 transition-colors hover:underline cursor-pointer"
                >
                  Phản hồi
                </button>
              </>
            )}
          </div>

          {/* If it's a root comment, render replies list and reply box */}
          {!isReply && (
            <div className="mt-3 space-y-3">
              {/* Replies list */}
              {messages.filter((m) => m.parentId === msg.id).map((reply) =>
                renderMessageBubble(reply, true)
              )}

              {/* Reply Input Box */}
              {(expandedReplyComments[msg.id] || messages.filter((m) => m.parentId === msg.id).length > 0) && (
                <form
                  onSubmit={(e) => handleSendReplyMessage(e, msg.id)}
                  className="flex items-center gap-2 mt-2.5 pl-3"
                >
                  <Avatar className="w-6.5 h-6.5 rounded-full border shadow-xs shrink-0">
                    <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.fullName || "User"} className="object-cover" />
                    <AvatarFallback className="bg-orange-500 text-white text-[10px] font-bold uppercase">
                      {(currentUser?.fullName || currentUser?.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-1.5 items-center">
                    <Input
                      ref={(el) => (replyInputRefs.current[msg.id] = el)}
                      placeholder="Viết câu trả lời..."
                      value={replyMessages[msg.id] || ""}
                      onChange={(e) =>
                        setReplyMessages((prev) => ({
                          ...prev,
                          [msg.id]: e.target.value,
                        }))
                      }
                      disabled={!isChatConnected}
                      className="flex-1 rounded-full h-8 border-slate-200/80 focus-visible:ring-[#f66810] text-[11px] px-3.5 bg-slate-50/30"
                    />
                    <Button
                      type="submit"
                      disabled={!(replyMessages[msg.id] || "").trim() || !isChatConnected}
                      className="rounded-full bg-[#f66810] hover:bg-[#de5b0b] text-white h-8 w-8 p-0 shrink-0 shadow-xs cursor-pointer flex items-center justify-center"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const [favoritedIds, setFavoritedIds] = useState([]);
  const [favoritedFlashcardIds, setFavoritedFlashcardIds] = useState([]);
  const [likeConfirmOpen, setLikeConfirmOpen] = useState(false);
  const [docToLike, setDocToLike] = useState(null);
  const [likeFlashcardConfirmOpen, setLikeFlashcardConfirmOpen] = useState(false);
  const [flashcardToLike, setFlashcardToLike] = useState(null);

  const fetchUserFavorites = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axiosClient.get("/api/documents/favorites");
      if (Array.isArray(res.data)) {
        setFavoritedIds(res.data.map((doc) => doc.id));
      }
    } catch (e) {
      if (e.response?.status !== 401) {
        console.error("Failed to fetch initial favorites status:", e);
      }
    }
  }, []);

  const fetchUserFavoriteFlashcards = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axiosClient.get("/api/ai_flashcard/favorites");
      if (Array.isArray(res.data)) {
        setFavoritedFlashcardIds(res.data.map((fc) => fc.id));
      }
    } catch (e) {
      if (e.response?.status !== 401) {
        console.error("Failed to fetch initial favorite flashcards status:", e);
      }
    }
  }, []);

  useEffect(() => {
    fetchCourse();
    fetchUserFavorites();
    fetchUserFavoriteFlashcards();
  }, [id, fetchUserFavorites, fetchUserFavoriteFlashcards]);

  const fetchCourse = async () => {
    // Validate UUID format to prevent backend 500 error for invalid ID like 'undefined'
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !uuidRegex.test(id)) {
      setCourse(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [courseRes, docsRes, followStatusRes, quizzesRes, flashcardsRes] =
        await Promise.all([
          axiosClient.get(`/api/courses/${id}`),
          axiosClient.get(`/api/courses/${id}/documents`),
          token
            ? axiosClient.get(`/api/courses/${id}/follow-status`)
            : Promise.resolve({ data: false }),
          token
            ? axiosClient.get(`/api/quizzes/course/${id}`)
            : Promise.resolve({ data: [] }),
          token
            ? axiosClient.get(`/api/ai_flashcard/course/${id}`)
            : Promise.resolve({ data: [] }),
        ]);

      setCourse(courseRes.data);
      if (courseRes.data?.name) {
        document.title = `Mindocu | ${courseRes.data.name}`;
      }
      setDocuments(docsRes.data.content || []);
      setIsFollowing(followStatusRes.data);
      setQuizzes(quizzesRes.data || []);
      setFlashcards(flashcardsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (err) {
      console.error(err);
    }
  };

  // Hàm xử lý tải file (Tăng view và tải về máy)
  const handleDownload = async (id, title) => {
    try {
      const res = await axiosClient.get(`/api/documents/${id}/download`);
      const url = res.data.downloadUrl;
      if (url) {
        await forceDownload(url, title || "document");
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Error downloading document!");
    }
  };

  // --- Favorite Documents Handlers ---
  const handleToggleFavoriteClick = (doc) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to save documents!");
      return;
    }

    const isCurrentlyFavorited = favoritedIds.includes(doc.id);
    if (isCurrentlyFavorited) {
      performToggleFavorite(doc.id, true);
    } else {
      setDocToLike(doc);
      setLikeConfirmOpen(true);
    }
  };

  const handleConfirmLike = async () => {
    if (!docToLike) return;
    setLikeConfirmOpen(false);
    await performToggleFavorite(docToLike.id, false);
    setDocToLike(null);
  };

  const performToggleFavorite = async (docId, isRemoving) => {
    if (isRemoving) {
      setFavoritedIds((prev) => prev.filter((fid) => fid !== docId));
      toast.success("Removed from Library");
    } else {
      setFavoritedIds((prev) => [...prev, docId]);
      toast.success("Added to favorites successfully!");
    }

    try {
      await axiosClient.post(`/api/documents/${docId}/favorite`);
    } catch (error) {
      if (isRemoving) {
        setFavoritedIds((prev) => [...prev, docId]);
      } else {
        setFavoritedIds((prev) => prev.filter((fid) => fid !== docId));
      }
      if (error.response?.status === 401) {
        toast.error("Session expired, please log in again!");
      } else {
        toast.error("System error, failed to save document");
      }
    }
  };

  // --- Favorite Flashcards Handlers ---
  const handleToggleFavoriteFlashcardClick = (fc) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to save flashcards!");
      return;
    }

    const isCurrentlyFavorited = favoritedFlashcardIds.includes(fc.id);
    if (isCurrentlyFavorited) {
      performToggleFavoriteFlashcard(fc.id, true);
    } else {
      setFlashcardToLike(fc);
      setLikeFlashcardConfirmOpen(true);
    }
  };

  const handleConfirmLikeFlashcard = async () => {
    if (!flashcardToLike) return;
    setLikeFlashcardConfirmOpen(false);
    await performToggleFavoriteFlashcard(flashcardToLike.id, false);
    setFlashcardToLike(null);
  };

  const performToggleFavoriteFlashcard = async (fcId, isRemoving) => {
    if (isRemoving) {
      setFavoritedFlashcardIds((prev) => prev.filter((fid) => fid !== fcId));
      toast.success("Removed flashcard from favorites");
    } else {
      setFavoritedFlashcardIds((prev) => [...prev, fcId]);
      toast.success("Added flashcard to favorites successfully!");
    }

    try {
      await axiosClient.post(`/api/ai_flashcard/${fcId}/favorite`);
    } catch (error) {
      if (isRemoving) {
        setFavoritedFlashcardIds((prev) => [...prev, fcId]);
      } else {
        setFavoritedFlashcardIds((prev) => prev.filter((fid) => fid !== fcId));
      }
      if (error.response?.status === 401) {
        toast.error("Session expired, please log in again!");
      } else {
        toast.error("System error, failed to save flashcard");
      }
    }
  };

  const handleFollowToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để theo dõi môn học!");
      return;
    }

    try {
      if (isFollowing) {
        await axiosClient.delete(`/api/courses/${id}/follow`);
        setIsFollowing(false);
      } else {
        await axiosClient.post(`/api/courses/${id}/follow`);
        setIsFollowing(true);
      }

      // refresh sidebar
      window.dispatchEvent(new CustomEvent("courses:updated"));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  }

  if (!course) {
    return (
      <div className="text-center py-20 text-slate-500 font-medium">
        Không tìm thấy thông tin môn học.
      </div>
    );
  }

  const filteredDocuments = documents.filter((doc) => {
    const searchTarget = [
      doc.title,
      doc.description
    ].filter(Boolean).join(" ").toLowerCase();
    return searchTarget.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="py-4">
      {/* COURSE HEADER */}
      <div className="rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50/60 to-white overflow-hidden mb-6 shadow-sm transition-all px-2">
        <div className="p-7 px-8">
          
          {/* BREADCRUMB & BACK BUTTON */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <Link
              to="/home"
              className="flex items-center justify-center -ml-1 rounded-full text-slate-455 hover:text-[#f66810] hover:bg-orange-50 transition-colors cursor-pointer shrink-0"
              title="Back to Home"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Link to="/" className="hover:text-[#f66810] transition-colors font-medium">
              {course.major?.school?.name || "University"}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="hover:text-[#f66810] transition-colors font-medium">{course.major?.name || "General"}</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#f66810] font-semibold truncate max-w-[250px]">
              {course.code}
            </span>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            
            {/* LEFT COLUMN: Icon + Title + Badges */}
            <div className="flex items-start gap-4.5 flex-1 min-w-0">
              {/* ICON (Phóng to lên w-14 h-14) */}
              <div className="w-14 h-14 rounded-2xl bg-[#f66810] flex items-center justify-center text-white shadow-md shadow-orange-500/10 shrink-0">
                <BookOpen className="w-8 h-8" />
              </div>

              {/* TEXT CONTENT */}
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  {/* TITLE */}
                  <h1 className="text-2xl font-extrabold text-slate-850 tracking-tight leading-tight">
                    {course.name}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">{course.code}</p>
                </div>

                {/* STATS BADGES */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <div className="flex items-center gap-2 bg-white border border-orange-100/90 rounded-full px-3.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    <FileText className="w-4 h-4 text-[#f66810]" />
                    <span>{documents.length} documents</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-orange-100/90 rounded-full px-3.5 py-1 text-xs font-medium text-slate-650 shadow-sm">
                    <Eye className="w-4 h-4 text-[#f66810]" />
                    <span>2.1k views</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-orange-100/90 rounded-full px-3.5 py-1 text-xs font-medium text-slate-650 shadow-sm">
                    <Star className="w-4 h-4 text-[#f66810] fill-[#f66810]" />
                    <span>
                      {course.averageRating ? course.averageRating.toFixed(1) : "0.0"}{" "}
                      ({course.reviewCount || 0})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 w-full xl:w-auto justify-start xl:justify-end shrink-0 pt-2 xl:pt-0">
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end shrink-0 pt-2 xl:pt-0">
                <Button
                  variant="outline"
                  onClick={() => setShareOpen(true)}
                  className="rounded-2xl border-orange-200/80 hover:bg-orange-50/40 h-11 px-6 text-sm font-semibold text-slate-700 shadow-sm transition-all"
                >
                  <Share2 className="w-4 h-4 mr-2 text-slate-500" />
                  Share
                </Button>

                <Button
                  variant="secondary"
                  className="rounded-2xl bg-orange-100/70 hover:bg-orange-200/70 text-[#f66810] h-11 px-6 text-sm font-bold border-0 outline-none focus:ring-0 cursor-pointer shadow-sm transition-all"
                >
                  Practice Quiz
                </Button>

                <Button
                  className="rounded-2xl bg-[#f66810] hover:bg-[#de5b0b] text-white h-11 px-6 text-sm font-bold shadow-md shadow-orange-500/15 flex items-center cursor-pointer transition-all"
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? "Unfollow" : "Follow Course"}
                </Button>
              </div>

              {/* SEARCH INPUT (Chiều cao h-11 đồng bộ) */}
              <div className="relative w-full sm:w-[260px] md:w-[428px] pt-1">
                <Search className="absolute left-4.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <Input
                  placeholder={`Search in ${course.code}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 rounded-2xl border-orange-200/60 bg-white focus-visible:ring-[#f66810] w-full text-sm shadow-sm"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/80 px-1 py-4 rounded-2xl flex w-max gap-1 mb-5 border border-slate-200/50">
          <TabsTrigger
            value="materials"
            className="rounded-xl px-4 py-3 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#f66810] data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 mr-1" />
            Study Materials
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-xl px-4 py-3 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#f66810] data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Q&A Chat Room
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-6 mt-0">

      {/* TRENDING */}
      <section className="">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col mb-0.5">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-[#f66810]" />
              <span>Trending Documents</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Explore the most popular study materials in this course.
            </p>
          </div>
          <Button variant="ghost">View All</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDocuments.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-[20px] border border-dashed border-slate-200">
              No documents match "{searchQuery}"
            </div>
          ) : (
            filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
            >
              <CardContent className="p-3.5 flex-1 flex flex-col">
                {/* Thumbnail ảo mờ mờ cho đẹp */}
                <div className="relative w-full aspect-[4/3] bg-slate-50 rounded-xl mb-3 -mt-4 border border-slate-200 group-hover:border-[#f26522]/20 transition-colors flex items-center justify-center overflow-hidden">
                  {/* Simulated Paper Sheet */}
                  <div className="w-[85%] h-[80%] bg-white rounded-lg shadow-sm border border-slate-100 p-2.5 flex flex-col gap-1 transform rotate-1 group-hover:rotate-0 transition-transform duration-200 select-none overflow-hidden">
                    {/* Top bar representing header */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100/70">
                      <span className="text-[9px] font-extrabold text-[#f26522] uppercase tracking-wider">
                        {getFileExtension(doc)}
                      </span>
                      <FileText className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    
                    {/* Body showing document content snippet */}
                    <p className="text-[9.5px] text-slate-400 font-serif leading-relaxed line-clamp-3 text-left whitespace-normal break-words">
                      {doc.description || doc.title || "No description provided for this document. Open to view full study guide content."}
                    </p>
                    
                    {/* Simulated lines decoration if description is short */}
                    <div className="mt-auto flex flex-col gap-1 opacity-50">
                      <div className="w-[90%] h-0.5 bg-slate-100 rounded-full" />
                      <div className="w-[70%] h-0.5 bg-slate-100 rounded-full" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFavoriteClick(doc);
                    }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90 hover:scale-105 z-10 ${
                      favoritedIds.includes(doc.id)
                        ? "bg-red-50 text-red-500 border-red-100"
                        : "bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white border-slate-100"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favoritedIds.includes(doc.id) ? "fill-current" : ""}`} />
                  </button>
                </div>

                <CardTitle
                  className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                  title={doc.title}
                >
                  {doc.title || "Untitled Document"}
                </CardTitle>

                <div className="flex items-center justify-between mb-3">
                  <CardDescription className="text-xs text-slate-500 font-medium flex items-center gap-1.5 m-0">
                    <BookOpen className="w-3.5 h-3.5" />{" "}
                    {doc.course?.code || "General"}
                  </CardDescription>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= Math.round(doc.averageRating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    {doc.reviewCount > 0 && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        ({doc.reviewCount})
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 -mt-1 flex justify-between items-center">
                  <span>
                    {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> {doc.downloadCount || 0}
                  </span>
                </div>
              </CardContent>

              {/* Khu vực nút bấm */}
              <CardFooter className="-mt-3 px-4 py-3 flex gap-2">
                <Button
                  asChild
                  variant="secondary"
                  className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl h-9 cursor-pointer"
                >
                  <Link to={`/documents/${doc.id}`}>
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                  </Link>
                </Button>

                <Button
                  onClick={() => handleDownload(doc.id, doc.title)}
                  className="w-9 h-9 rounded-xl bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white flex items-center justify-center transition-colors shrink-0 p-0 cursor-pointer"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          )))}
        </div>
      </section>

      {/* Quizzes Section */}
      {quizzes.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-col mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <ListChecks className="w-6 h-6 text-[#f66810]" />
              <span>Published Quizzes</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Test your knowledge with these quizzes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="shadow-sm border-orange-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-gradient-to-b from-[#fffaf7] to-white"
              >
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="w-full aspect-[4/3] bg-orange-50 rounded-xl mb-3 -mt-4 border border-orange-100 flex items-center justify-center text-[#f26522]">
                    <Star className="w-12 h-12 opacity-50" />
                  </div>
                  <CardTitle
                    className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                    title={quiz.title}
                  >
                    {quiz.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-[#f26522] font-medium mb-3 flex items-center gap-1.5">
                    {quiz.questions?.length || 0} Questions
                  </CardDescription>
                </CardContent>
                <CardFooter className="-mt-3 px-4 py-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => toast.success("Quiz added to library!")}
                    className="flex-none px-2.5 rounded-xl border-slate-200 text-slate-500 hover:text-[#f22222] hover:bg-[#f22222]/10 transition-colors cursor-pointer h-9"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    asChild
                    className="flex-1 bg-[#f26522] hover:bg-[#de5b0b] text-white font-semibold text-xs rounded-xl h-9 cursor-pointer"
                  >
                    <Link to={quiz.ownerId === currentUser?.id ? `/ai-tools/ai-quiz?id=${quiz.id}&mode=study` : `/quiz/${quiz.id}`}>Take Quiz</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Flashcards Section */}
      {flashcards.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-col mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-blue-500" />
              <span>Published Flashcards</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Review key concepts with flashcards.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {flashcards.map((fc) => (
              <Card
                key={fc.id}
                className="shadow-sm border-blue-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-gradient-to-b from-[#f7faff] to-white"
              >
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="w-full aspect-[4/3] bg-blue-50 rounded-xl mb-3 -mt-4 border border-blue-100 flex items-center justify-center text-blue-500">
                    <BookOpen className="w-12 h-12 opacity-50" />
                  </div>
                  <CardTitle
                    className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                    title={fc.title}
                  >
                    {fc.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-500 font-medium mb-3 flex items-center gap-1.5">
                    {fc.cards || 0} Cards
                  </CardDescription>
                </CardContent>
                <CardFooter className="-mt-3 px-4 py-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleToggleFavoriteFlashcardClick(fc)}
                    className={`flex-none px-2.5 rounded-xl border-slate-200 h-9 transition-colors ${
                      favoritedFlashcardIds.includes(fc.id)
                        ? "text-red-500 bg-red-50 hover:bg-red-100 border-red-100"
                        : "text-slate-500 hover:text-red-500 hover:bg-red-50"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favoritedFlashcardIds.includes(fc.id) ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    asChild
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl h-9 cursor-pointer"
                  >
                    <Link to={fc.ownerId === currentUser?.id ? `/ai-tools/ai-flashcard?id=${fc.id}&mode=study` : `/flashcard/${fc.id}`}>Study Now</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}
      </TabsContent>

      <TabsContent value="chat" className="mt-0">
        <Card className="rounded-[28px] border-orange-100 shadow-sm bg-white overflow-hidden flex flex-col h-[650px]">
          {/* Chat Header */}
          <div className="px-6 py-4 -mt-4 border-b border-orange-50 bg-gradient-to-r from-orange-500/10 to-transparent flex items-center justify-between">
            <div className="">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#f66810]" />
                Phòng thảo luận - {course.code}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hỏi đáp, trao đổi bài tập và tài liệu học tập cùng bạn bè cùng lớp.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isChatConnected ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
              <span className="text-xs font-bold text-slate-500">
                {isChatConnected ? "Online" : "Connecting..."}
              </span>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 space-y-5">
            {messages.filter((m) => !m.parentId).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Chưa có cuộc hội thoại nào</p>
                <p className="text-xs text-slate-400 mt-1">Gửi tin nhắn đầu tiên để bắt đầu thảo luận!</p>
              </div>
            ) : (
              messages.filter((m) => !m.parentId).map((msg) => renderMessageBubble(msg, false))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-5 -mb-4 border-t border-slate-100 bg-white">
            {localStorage.getItem("token") ? (
              <form onSubmit={handleSendRootMessage} className="flex gap-2">
                <Input
                  placeholder="Đặt câu hỏi hoặc bắt đầu chủ đề thảo luận mới..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  disabled={!isChatConnected}
                  className="flex-1 rounded-full h-11 border-slate-200/80 focus-visible:ring-[#f66810] text-sm px-5 bg-slate-50/50"
                />
                <Button
                  type="submit"
                  disabled={!chatMessage.trim() || !isChatConnected}
                  className="rounded-full bg-[#f66810] hover:bg-[#de5b0b] text-white h-11 w-11 p-0 shrink-0 shadow-md shadow-orange-500/15 cursor-pointer"
                >
                  <Send className="w-4.5 h-4.5" />
                </Button>
              </form>
            ) : (
              <div className="text-center py-2 text-sm font-semibold text-slate-500">
                Vui lòng <Link to="/login" className="text-[#f66810] underline">đăng nhập</Link> để tham gia thảo luận.
              </div>
            )}
          </div>
        </Card>
      </TabsContent>
      </Tabs>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-xl rounded-[28px] border-0 p-0 overflow-hidden">
          <div className="p-8">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-slate-800">
                Share Course
              </DialogTitle>
            </DialogHeader>

            <p className="text-slate-500 mt-3 leading-relaxed">
              Share this course with your friends and classmates.
            </p>

            {/* URL */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Share URL
              </p>

              <div className="flex gap-3">
                <Input
                  readOnly
                  value={window.location.href}
                  className="rounded-full h-12"
                />

                <Button
                  onClick={handleCopyLink}
                  className="rounded-full bg-[#f66810] hover:bg-[#de5b0b] h-12 px-6"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Adding Document to Favorites */}
      <Dialog open={likeConfirmOpen} onOpenChange={setLikeConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              Add to Favorites
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              Are you sure you want to add <strong>"{docToLike?.title}"</strong> to your favorites?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setLikeConfirmOpen(false);
                setDocToLike(null);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLike}
              className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white font-semibold"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Adding Flashcard to Favorites */}
      <Dialog open={likeFlashcardConfirmOpen} onOpenChange={setLikeFlashcardConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              Add Flashcard to Favorites
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              Are you sure you want to add <strong>"{flashcardToLike?.title}"</strong> to your favorite flashcards?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setLikeFlashcardConfirmOpen(false);
                setFlashcardToLike(null);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLikeFlashcard}
              className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white font-semibold"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
