import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { forceDownload } from "@/lib/downloadHelper";
import { getFileExtension } from "@/lib/utils";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  Heart,
  MessageCircle,
  X,
  UserPlus,
  UserCheck,
  GraduationCap,
  Users,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { askAi, createAiConversation } from "@/api/aiApi";
import RecentDocuments from "@/components/documents/RecentDocuments";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";
import CourseCard from "@/components/ui/CourseCard";
import ChatInterface from "@/components/chat/ChatInterface";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const HOMEPAGE_WELCOME_MESSAGE = {
  id: "homepage-welcome",
  role: "ASSISTANT",
  content:
    "Hi, I am StudyMate AI. Ask me about study planning, document discovery, or any topic you are learning.",
};

const DEFAULT_FILTER_DATA = { school: "", major: "", course: "", category: "" };

export default function Homepage() {
  const context = useOutletContext();
  const searchQuery = context?.searchQuery || "";
  const filterData = context?.filterData || DEFAULT_FILTER_DATA;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [likeConfirmOpen, setLikeConfirmOpen] = useState(false);
  const [docToLike, setDocToLike] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/follows/suggestions?limit=5");
      setSuggestions(res.data || []);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  }, []);

  const handleSuggestionFollowToggle = async (
    targetUserId,
    isCurrentlyFollowing,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to follow creators!");
      return;
    }
    try {
      if (isCurrentlyFollowing) {
        await axiosClient.delete(`/api/follows/${targetUserId}`);
        toast.success("Unfollowed");
      } else {
        await axiosClient.post(`/api/follows/${targetUserId}`);
        toast.success("Followed");
      }
      fetchSuggestions();
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("Action failed");
    }
  };
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => [
    HOMEPAGE_WELCOME_MESSAGE,
  ]);
  const [chatConversationId, setChatConversationId] = useState(null);
  const [isChatSending, setIsChatSending] = useState(false);

  // Quản lý danh sách ID tài liệu đã thả tim để đồng bộ UI lập tức
  const [favoritedIds, setFavoritedIds] = useState([]);

  // Lấy danh sách các file đã thích sẵn để tô đỏ trái tim từ đầu (CHỈ GỌI KHI ĐÃ ĐĂNG NHẬP)
  const fetchUserFavorites = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // Nếu chưa đăng nhập (Guest) thì không gọi API để tránh lỗi 401

    try {
      const res = await axiosClient.get("/api/documents/favorites");
      if (Array.isArray(res.data)) {
        setFavoritedIds(res.data.map((doc) => doc.id));
      }
    } catch (e) {
      // Ẩn lỗi 401 đi cho màn hình console sạch sẽ nếu token hết hạn
      if (e.response?.status !== 401) {
        console.error("Failed to fetch initial favorites status:", e);
      }
    }
  }, []);

  const upsertPublicDocument = useCallback((doc) => {
    if (!doc) return;
    const isPublic = doc.visibility ? doc.visibility === "PUBLIC" : true;
    if (!isPublic) return;

    setDocuments((prev) => {
      const exists = prev.find((item) => item.id === doc.id);
      if (exists) return prev.map((item) => (item.id === doc.id ? doc : item));
      return [doc, ...prev];
    });
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/courses");
      setCourses(response.data?.content || []);
    } catch (error) {
      setCourses([]);
    }
  }, []);

  const fetchDocuments = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      if (!silent) setIsLoading(true);
      const response = await axiosClient.get("/api/documents");
      const publicDocs = (response.data || [])
        .filter((doc) => doc.visibility === "PUBLIC")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDocuments(publicDocs);
    } catch (error) {
      setDocuments([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchCourses();
    fetchUserFavorites(); // Chạy lấy status trái tim đỏ
    fetchSuggestions();

    const handleUploaded = (event) => {
      upsertPublicDocument(event?.detail);
      fetchDocuments({ silent: true });
    };

    window.addEventListener("documents:uploaded", handleUploaded);
    return () =>
      window.removeEventListener("documents:uploaded", handleUploaded);
  }, [
    fetchDocuments,
    fetchCourses,
    fetchUserFavorites,
    fetchSuggestions,
    upsertPublicDocument,
  ]);

  // Xử lý toggle thả tim / bỏ thả tim thông minh (CHẶN KHI CHƯA ĐĂNG NHẬP)
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

  const performToggleFavorite = async (id, isRemoving) => {
    if (isRemoving) {
      setFavoritedIds((prev) => prev.filter((favId) => favId !== id));
      toast.success("Removed from Library");
    } else {
      setFavoritedIds((prev) => [...prev, id]);
      toast.success("Added to favorites successfully!");
    }

    try {
      await axiosClient.post(`/api/documents/${id}/favorite`);
    } catch (error) {
      if (isRemoving) {
        setFavoritedIds((prev) => [...prev, id]);
      } else {
        setFavoritedIds((prev) => prev.filter((favId) => favId !== id));
      }

      if (error.response?.status === 401) {
        toast.error("Session expired, please log in again!");
      } else {
        toast.error("System error, failed to save document");
      }
    }
  };

  const handleDownload = async (id, title) => {
    try {
      const res = await axiosClient.get(`/api/documents/${id}/download`);
      const url = res.data.downloadUrl;
      if (url) await forceDownload(url, title || "document");
    } catch (error) {
      alert("Error downloading document!");
    }
  };

  const handleSendChatMessage = useCallback(
    async (message) => {
      if (!message || isChatSending) return;
      const userMessage = {
        id: `user-${Date.now()}`,
        role: "USER",
        content: message,
      };
      setChatMessages((prev) => [...prev, userMessage]);
      setIsChatSending(true);

      try {
        let conversationId = chatConversationId;
        if (!conversationId) {
          const conversation = await createAiConversation({
            title: "Homepage Chat",
          });
          conversationId = conversation.id;
          setChatConversationId(conversationId);
        }
        const response = await askAi({
          conversationId,
          message,
          mode: "HOMEPAGE_ASSISTANT",
        });
        setChatMessages((prev) => [
          ...prev,
          {
            id: response.assistantMessageId || `assistant-${Date.now()}`,
            role: "ASSISTANT",
            content: response.answer || "I could not generate a response.",
          },
        ]);
      } catch (error) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "ASSISTANT",
            content: "Sorry, please try again.",
          },
        ]);
      } finally {
        setIsChatSending(false);
      }
    },
    [chatConversationId, isChatSending],
  );

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const docSearchText = [
        doc.title,
        doc.course?.code,
        doc.course?.name,
        doc.course?.major?.code,
        doc.course?.major?.name,
        doc.course?.major?.school?.code,
        doc.course?.major?.school?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchQuery
        ? docSearchText.includes(searchQuery.toLowerCase())
        : true;

      const matchesCourse = filterData.course
        ? doc.course?.code
            ?.toLowerCase()
            .includes(filterData.course.toLowerCase()) ||
          doc.course?.name
            ?.toLowerCase()
            .includes(filterData.course.toLowerCase()) ||
          doc.course?.major?.code
            ?.toLowerCase()
            .includes(filterData.course.toLowerCase()) ||
          doc.course?.major?.name
            ?.toLowerCase()
            .includes(filterData.course.toLowerCase())
        : true;

      const matchesCategory = filterData.category
        ? doc.category?.toLowerCase() === filterData.category.toLowerCase()
        : true;

      const docSchoolCode =
        doc.course?.major?.school?.code ||
        doc.schoolCode ||
        doc.school?.code ||
        doc.course?.schoolCode ||
        "";
      const docSchoolName =
        doc.course?.major?.school?.name || doc.school?.name || "";
      const matchesSchool = filterData.school
        ? docSchoolCode
            .toLowerCase()
            .includes(filterData.school.toLowerCase()) ||
          docSchoolName
            .toLowerCase()
            .includes(filterData.school.toLowerCase()) ||
          filterData.school.toLowerCase().includes(docSchoolCode.toLowerCase())
        : true;

      const matchesMajor = filterData.major
        ? doc.course?.major?.code?.toLowerCase() ===
            filterData.major.toLowerCase() ||
          doc.course?.major?.name
            ?.toLowerCase()
            ?.includes(filterData.major.toLowerCase())
        : true;

      return (
        matchesSearch &&
        matchesSchool &&
        matchesMajor &&
        matchesCourse &&
        matchesCategory
      );
    });
  }, [documents, searchQuery, filterData]);

  return (
    <>
      <main className="flex-1">
        <div className="mb-8 p-6 rounded-[24px] bg-orange-500/10 border border-orange-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f26522] flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
                  Knowledge Hub
                </h2>
                <span className="bg-[#f26522]/10 text-[#f26522] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Featured
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                AI-integrated document sharing and smart learning support platform
              </p>
            </div>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="rounded-xl bg-[#f26522] hover:bg-[#d9581c] text-white text-xs font-bold px-4 h-10 shadow-md shadow-orange-500/10 shrink-0 md:self-center self-start"
          >
            Upload Material
          </Button>
        </div>

        <RecentDocuments
          favoritedIds={favoritedIds}
          onToggleFavorite={handleToggleFavoriteClick}
        />
        <UploadDocumentDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUploadSuccess={(newDoc) => upsertPublicDocument(newDoc)}
        />

        <section className="mb-10">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#f26522]" />
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Public Documents
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 pl-8">
              Explore and reference helpful study materials shared by the community
            </p>
          </div>

          {isLoading ? (
            <div className="text-center text-slate-500 font-medium py-10">
              Loading documents...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center bg-slate-50 rounded-2xl text-slate-500 border border-slate-100 p-8">
              No documents found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4.5">
              {filteredDocuments.map((doc) => {
                const isFavorited = favoritedIds.includes(doc.id); // Check xem file đã thích chưa
                return (
                  <Card
                    key={doc.id}
                    className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
                  >
                    <CardContent className="p-3.5 flex-1 flex flex-col">
                      <div className="relative w-full aspect-[4/3] bg-slate-50 rounded-xl mb-3 -mt-4 border border-slate-200 group-hover:border-[#f26522]/20 transition-colors flex items-center justify-center overflow-hidden">
                        {/* Simulated Paper Sheet */}
                        <div className="w-[85%] h-[80%] bg-white rounded-lg shadow-sm border border-slate-100 p-2.5 flex flex-col gap-1 transform rotate-1 group-hover:rotate-0 transition-transform duration-200 select-none overflow-hidden">
                          {/* Top bar representing header */}
                          <div className="flex items-center gap-1 pb-1 border-b border-slate-100/70">
                            <FileText className="w-3.5 h-3.5 text-slate-300" />
                            <span className="text-[9px] font-extrabold text-[#f26522] uppercase tracking-wider">
                              {getFileExtension(doc)}
                            </span>
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
                          className={`absolute top-1 right-1 w-7.5 h-7.5 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90 hover:scale-105 z-10 ${
                            isFavorited
                              ? "bg-red-50 text-red-500 border-red-100"
                              : "bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white border-slate-100"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
                        </button>
                      </div>
                      <CardTitle
                        className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                        title={doc.title}
                      >
                        {doc.title || "Untitled Document"}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />{" "}
                        {doc.course?.code || "General"}
                      </CardDescription>
                      <div className="text-[11px] text-slate-400 mt-auto flex justify-between items-center">
                        <span>
                          {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> {doc.downloadCount || 0}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="-mt-5 px-3.5 py-2.5 flex gap-2">
                      <Button
                        asChild
                        variant="secondary"
                        className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl h-9"
                      >
                        <Link to={`/documents/${doc.id}`}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                        </Link>
                      </Button>
                      <Button
                        onClick={() => handleDownload(doc.id, doc.title)}
                        className="w-9 h-9 rounded-xl bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white flex items-center justify-center transition-colors shrink-0 p-0"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* SUGGESTED CREATORS SECTION */}
        <section className="mb-10">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-[#f26522]" />
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Featured Creators
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 pl-8">
              Users who contribute highly valuable study materials to the platform
            </p>
          </div>

          {suggestions.length === 0 ? (
            <div className="text-center bg-slate-50 rounded-2xl text-slate-500 border border-slate-100 p-8 text-xs font-medium">
              No suggested creators available.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {suggestions.map((user) => {
                const userInitial =
                  user.fullName?.charAt(0).toUpperCase() || "U";
                return (
                  <div
                    key={user.id}
                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center group relative overflow-hidden"
                  >
                    {/* User Avatar */}
                    <Link
                      to={`/users/${user.id}`}
                      className="block relative group-hover:scale-105 transition-transform duration-200"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-16 h-16 rounded-full object-cover border-4 border-orange-50 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#f26522]/10 text-[#f26522] font-bold text-xl flex items-center justify-center border-4 border-orange-50 shadow-sm">
                          {userInitial}
                        </div>
                      )}
                    </Link>

                    {/* Name & Bio */}
                    <Link
                      to={`/users/${user.id}`}
                      className="block mt-4 flex-1"
                    >
                      <h4 className="font-extrabold text-slate-800 text-sm line-clamp-1 group-hover:text-[#f26522] transition-colors">
                        {user.fullName}
                      </h4>
                      <div className="flex flex-col gap-0.5 mt-1 mb-4">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {user.followersCount || 0} followers
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {user.documentCount || 0} documents
                        </span>
                      </div>
                    </Link>

                    {/* Follow button */}
                    <Button
                      size="sm"
                      onClick={() =>
                        handleSuggestionFollowToggle(
                          user.id,
                          user.isFollowedByCurrentUser,
                        )
                      }
                      className={`w-full rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 h-9 flex items-center justify-center gap-1.5 ${
                        user.isFollowedByCurrentUser
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                          : "bg-[#f26522] text-white hover:bg-[#d9581c] shadow-md shadow-orange-500/10"
                      }`}
                    >
                      {user.isFollowedByCurrentUser ? (
                        <>
                          <UserCheck size={14} />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>Follow</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COURSES SECTION */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#f26522]" />
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  Featured Courses
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 pl-8">
                Study and prepare for exams by selecting specific subjects
              </p>
            </div>

            <Button
              variant="outline"
              className="rounded-xl border-slate-200 hover:border-[#f26522]/30"
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="text-center text-[13px] text-slate-400 font-medium border-t border-gray-100 py-6 -mb-6">
        © 2026 Knowledge Base — Modern Document Sharing Platform
      </footer>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isChatOpen ? (
          <div className="h-[min(620px,calc(100vh-7rem))] w-[min(calc(100vw-2rem),420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <ChatInterface
              title="Homepage Chat"
              subtitle="Authenticated StudyMate AI"
              messages={chatMessages}
              isSending={isChatSending}
              onSendMessage={handleSendChatMessage}
            />
          </div>
        ) : null}

        <Button
          type="button"
          onClick={() => setIsChatOpen((open) => !open)}
          className="h-14 w-14 rounded-full bg-[#f26522] text-white shadow-lg hover:bg-[#e45a1b]"
          aria-label={
            isChatOpen ? "Close homepage AI chat" : "Open homepage AI chat"
          }
        >
          {isChatOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Confirmation Dialog for Adding to Favorites */}
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
    </>
  );
}
