import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  UserCheck,
  FileText,
  Users,
  User,
  Calendar,
  Download,
  Eye,
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  ListChecks,
  Layers,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { forceDownload } from "@/lib/downloadHelper";
import { getFileExtension } from "@/lib/utils";

export default function UserPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isQuizzesLoading, setIsQuizzesLoading] = useState(false);
  const [isFlashcardsLoading, setIsFlashcardsLoading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [docPage, setDocPage] = useState(0);
  const [docTotalPages, setDocTotalPages] = useState(1);

  const [quizPage, setQuizPage] = useState(0);
  const [quizTotalPages, setQuizTotalPages] = useState(1);

  const [flashcardPage, setFlashcardPage] = useState(0);
  const [flashcardTotalPages, setFlashcardTotalPages] = useState(1);

  const [favoritedIds, setFavoritedIds] = useState([]);
  const [favoritedFlashcardIds, setFavoritedFlashcardIds] = useState([]);

  const [likeConfirmOpen, setLikeConfirmOpen] = useState(false);
  const [docToLike, setDocToLike] = useState(null);
  const [likeFlashcardConfirmOpen, setLikeFlashcardConfirmOpen] = useState(false);
  const [flashcardToLike, setFlashcardToLike] = useState(null);

  // Modals state
  const [modalType, setModalType] = useState(null); // 'followers' or 'following' or null
  const [modalData, setModalData] = useState([]);
  const [modalPage, setModalPage] = useState(0);
  const [modalTotalPages, setModalTotalPages] = useState(0);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setIsQuizzesLoading(true);
        setIsFlashcardsLoading(true);
        const [profileRes, docsRes, quizzesRes, flashcardsRes] = await Promise.all([
          axiosClient.get(`/api/follows/profile/${userId}`),
          axiosClient.get(`/api/follows/profile/${userId}/documents`),
          axiosClient.get(`/api/follows/profile/${userId}/quizzes`),
          axiosClient.get(`/api/follows/profile/${userId}/flashcards`),
        ]);
        if (!isMounted) return;
        setUserProfile(profileRes.data);

        const docs = docsRes.data || [];
        setDocuments(docs);
        setDocTotalPages(Math.ceil(docs.length / 10) || 1);

        const qzs = quizzesRes.data || [];
        setQuizzes(qzs);
        setQuizTotalPages(Math.ceil(qzs.length / 10) || 1);

        const fcs = flashcardsRes.data || [];
        setFlashcards(fcs);
        setFlashcardTotalPages(Math.ceil(fcs.length / 10) || 1);

        if (localStorage.getItem("isLoggedIn") === "true") {
          try {
            const [favDocsRes, favFcRes] = await Promise.all([
              axiosClient.get("/api/documents/favorites"),
              axiosClient.get("/api/ai_flashcard/favorites"),
            ]);
            if (isMounted) {
              if (Array.isArray(favDocsRes.data)) {
                setFavoritedIds(favDocsRes.data.map((doc) => doc.id));
              }
              if (Array.isArray(favFcRes.data)) {
                setFavoritedFlashcardIds(favFcRes.data.map((fc) => fc.id));
              }
            }
          } catch (e) {
            console.error("Error loading favorites:", e);
          }
        }
      } catch (err) {
        console.error("Failed to load user channel data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsQuizzesLoading(false);
          setIsFlashcardsLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleToggleFavoriteClick = (doc) => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
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
      console.error(error);
      toast.error("Error downloading document!");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setIsQuizzesLoading(true);
        setIsFlashcardsLoading(true);
        const [profileRes, docsRes, quizzesRes, flashcardsRes] = await Promise.all([
          axiosClient.get(`/api/follows/profile/${userId}`),
          axiosClient.get(`/api/follows/profile/${userId}/documents`),
          axiosClient.get(`/api/follows/profile/${userId}/quizzes`),
          axiosClient.get(`/api/follows/profile/${userId}/flashcards`),
        ]);
        if (!isMounted) return;
        setUserProfile(profileRes.data);

        const docs = docsRes.data || [];
        setDocuments(docs);
        setDocTotalPages(Math.ceil(docs.length / 10) || 1);

        const qzs = quizzesRes.data || [];
        setQuizzes(qzs);
        setQuizTotalPages(Math.ceil(qzs.length / 10) || 1);

        const fcs = flashcardsRes.data || [];
        setFlashcards(fcs);
        setFlashcardTotalPages(Math.ceil(fcs.length / 10) || 1);
      } catch (err) {
        console.error("Failed to load user channel data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsQuizzesLoading(false);
          setIsFlashcardsLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleToggleFavoriteFlashcardClick = (fc) => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
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

  const performToggleFavoriteFlashcard = async (id, isRemoving) => {
    if (isRemoving) {
      setFavoritedFlashcardIds((prev) => prev.filter((favId) => favId !== id));
      toast.success("Removed from Library");
    } else {
      setFavoritedFlashcardIds((prev) => [...prev, id]);
      toast.success("Added flashcard to favorites!");
    }

    try {
      await axiosClient.post(`/api/ai_flashcard/sets/${id}/favorite`);
    } catch (error) {
      if (isRemoving) {
        setFavoritedFlashcardIds((prev) => [...prev, id]);
      } else {
        setFavoritedFlashcardIds((prev) => prev.filter((favId) => favId !== id));
      }
      if (error.response?.status === 401) {
        toast.error("Session expired, please log in again!");
      } else {
        toast.error("System error, failed to save flashcard");
      }
    }
  };

  const PAGE_SIZE = 10;
  const paginatedDocs = documents.slice(docPage * PAGE_SIZE, (docPage + 1) * PAGE_SIZE);
  const paginatedQuizzes = quizzes.slice(quizPage * PAGE_SIZE, (quizPage + 1) * PAGE_SIZE);
  const paginatedFlashcards = flashcards.slice(flashcardPage * PAGE_SIZE, (flashcardPage + 1) * PAGE_SIZE);

  // Follow / Unfollow logic
  const handleFollowToggle = async () => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      toast.error("Please log in to follow this user!");
      navigate("/login");
      return;
    }

    if (isFollowLoading || !userProfile) return;
    setIsFollowLoading(true);

    try {
      const isFollowing = userProfile.isFollowedByCurrentUser;
      if (isFollowing) {
        await axiosClient.delete(`/api/follows/${userId}`);
        toast.success(`Unfollowed ${userProfile.fullName}`);
        setUserProfile((prev) => ({
          ...prev,
          isFollowedByCurrentUser: false,
          followersCount: Math.max(0, prev.followersCount - 1),
        }));
      } else {
        await axiosClient.post(`/api/follows/${userId}`);
        toast.success(`Following ${userProfile.fullName}`);
        setUserProfile((prev) => ({
          ...prev,
          isFollowedByCurrentUser: true,
          followersCount: prev.followersCount + 1,
        }));
      }
    } catch (error) {
      console.error("Follow action failed:", error);
      toast.error(error.response?.data?.message || "System error");
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Load modal follow list
  const loadModalData = useCallback(async (type, page) => {
    setIsModalLoading(true);
    try {
      const endpoint = `/api/follows/${type}/${userId}?page=${page}&size=10`;
      const res = await axiosClient.get(endpoint);
      setModalData(res.data.content || []);
      setModalTotalPages(res.data.totalPages || 0);
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
    } finally {
      setIsModalLoading(false);
    }
  }, [userId]);

  const openModal = (type) => {
    setModalType(type);
    setModalPage(0);
    loadModalData(type, 0);
  };

  const handleModalPageChange = (newPage) => {
    if (newPage >= 0 && newPage < modalTotalPages) {
      setModalPage(newPage);
      loadModalData(modalType, newPage);
    }
  };

  const handleModalFollowToggle = async (item, index) => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      toast.error("Please log in!");
      navigate("/login");
      return;
    }

    try {
      if (item.isFollowedByCurrentUser) {
        await axiosClient.delete(`/api/follows/${item.id}`);
        toast.success(`Unfollowed ${item.fullName}`);
        setModalData((prev) =>
          prev.map((itm, idx) =>
            idx === index ? { ...itm, isFollowedByCurrentUser: false } : itm
          )
        );
        // If viewing current user's profile, we update counts accordingly
        if (userId === currentUserId && modalType === "following") {
          setUserProfile((prev) => ({
            ...prev,
            followingCount: Math.max(0, prev.followingCount - 1),
          }));
        }
      } else {
        await axiosClient.post(`/api/follows/${item.id}`);
        toast.success(`Following ${item.fullName}`);
        setModalData((prev) =>
          prev.map((itm, idx) =>
            idx === index ? { ...itm, isFollowedByCurrentUser: true } : itm
          )
        );
        if (userId === currentUserId && modalType === "following") {
          setUserProfile((prev) => ({
            ...prev,
            followingCount: prev.followingCount + 1,
          }));
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f26522]" />
      </div>
    );
  }

  const isSelf = currentUserId === userId;
  const userInitial = userProfile.fullName.charAt(0).toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* User Header Profile Card */}
      <div className="bg-white rounded-xl border border-slate-100 p-7 pt-7 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-10 relative">
        {/* Back Arrow inside the Card */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-2 left-2 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-[#f26522] hover:bg-orange-50 transition-all cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Go back"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          {/* Avatar Area */}
          {userProfile.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.fullName}
              className="w-24 h-24 rounded-full object-cover border-4 border-orange-50 shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#f26522]/10 text-[#f26522] font-bold text-3xl flex items-center justify-center border-4 border-orange-50 shadow-sm">
              {userInitial}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              {userProfile.fullName}
              {isSelf && (
                <span className="text-[11px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1 flex items-center gap-1.5 justify-center md:justify-start">
              <User size={14} className="text-slate-400" /> Community Member
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-5 mt-4 text-sm font-semibold text-slate-600 justify-center md:justify-start">
              <div className="text-center md:text-left">
                <span className="block text-slate-800 font-extrabold text-lg leading-none">
                  {userProfile.totalDocuments}
                </span>
                <span className="text-xs text-slate-400 font-medium">Documents</span>
              </div>
              <div
                onClick={() => openModal("followers")}
                className="text-center md:text-left cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="block text-slate-800 font-extrabold text-lg leading-none">
                  {userProfile.followersCount}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Users size={12} /> Followers
                </span>
              </div>
              <div
                onClick={() => openModal("following")}
                className="text-center md:text-left cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="block text-slate-800 font-extrabold text-lg leading-none">
                  {userProfile.followingCount}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <User size={12} /> Following
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Follow CTA Button */}
        {!isSelf && (
          <Button
            onClick={handleFollowToggle}
            disabled={isFollowLoading}
            className={`w-full md:w-auto h-11 px-8 rounded-full font-bold transition-all duration-200 cursor-pointer shadow-sm ${
              userProfile.isFollowedByCurrentUser
                ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                : "bg-[#f26522] hover:bg-[#d9581c] text-white shadow-md shadow-orange-500/10"
            }`}
          >
            {userProfile.isFollowedByCurrentUser ? (
              <span className="flex items-center gap-2">
                <UserCheck size={16} /> Bỏ theo dõi
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus size={16} /> Theo dõi
              </span>
            )}
          </Button>
        )}
      </div>

      {/* SECTION 1: Uploaded Documents */}
      <section className="mb-12">
        <div className="flex flex-col mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#f26522]" />
            <span>Uploaded Documents</span>
            <span className="text-sm font-normal text-slate-400">({documents.length})</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Study guides and materials shared by {userProfile.fullName}.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-60 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-3xl border border-slate-100 text-slate-400 font-medium text-sm">
            <FileText size={40} className="mx-auto mb-3 text-slate-300" />
            No uploaded materials yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedDocs.map((doc) => {
                const isFavorited = favoritedIds.includes(doc.id);
                return (
                  <Card
                    key={doc.id}
                    className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
                  >
                    <CardContent className="p-3.5 flex-1 flex flex-col">
                      <div className="relative w-full aspect-[4/3] bg-slate-50 rounded-xl mb-3 -mt-4 border border-slate-200 group-hover:border-[#f26522]/20 transition-colors flex items-center justify-center overflow-hidden">
                        <div className="w-[85%] h-[80%] bg-white rounded-lg shadow-sm border border-slate-100 p-2.5 flex flex-col gap-1 transform rotate-1 group-hover:rotate-0 transition-transform duration-200 select-none overflow-hidden">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100/70">
                            <span className="text-[9px] font-extrabold text-[#f26522] uppercase tracking-wider">
                              {getFileExtension(doc)}
                            </span>
                            <FileText className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                          <p className="text-[9.5px] text-slate-400 font-serif leading-relaxed line-clamp-3 text-left whitespace-normal break-words">
                            {doc.description || doc.title || "No description provided for this document."}
                          </p>
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
                );
              })}
            </div>

            {docTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={docPage === 0}
                  onClick={() => setDocPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Previous
                </Button>
                {Array.from({ length: docTotalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    variant={docPage === idx ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDocPage(idx)}
                    className={`w-9 h-9 rounded-xl font-bold cursor-pointer transition-all ${
                      docPage === idx
                        ? "bg-[#f26522] text-white hover:bg-[#d9581c]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={docPage >= docTotalPages - 1}
                  onClick={() => setDocPage((p) => Math.min(docTotalPages - 1, p + 1))}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* SECTION 2: Published Quizzes */}
      <section className="mb-12">
        <div className="flex flex-col mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <ListChecks className="w-6 h-6 text-[#f26522]" />
            <span>Published Quizzes</span>
            <span className="text-sm font-normal text-slate-400">({quizzes.length})</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Test your knowledge with quizzes created by {userProfile.fullName}.
          </p>
        </div>

        {isQuizzesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-60 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-3xl border border-slate-100 text-slate-400 font-medium text-sm">
            <ListChecks size={40} className="mx-auto mb-3 text-slate-300" />
            No published quizzes yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedQuizzes.map((q) => (
                <Card
                  key={q.id}
                  className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
                >
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="w-full aspect-[4/3] bg-orange-50 rounded-xl mb-3 -mt-4 border border-orange-100 flex items-center justify-center text-[#f26522]">
                      <ListChecks className="w-12 h-12 opacity-50" />
                    </div>
                    <CardTitle
                      className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                      title={q.title}
                    >
                      {q.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#f26522] font-medium mb-3 flex items-center gap-1.5">
                      {q.questions?.length || 0} Questions • {q.courseCode || q.documentCourseCode || "General"}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="-mt-3 px-4 py-3 flex gap-2">
                    <Button
                      asChild
                      className="w-full bg-[#f26522] hover:bg-[#d9581c] text-white font-semibold text-xs rounded-xl h-9 cursor-pointer"
                    >
                      <Link to={`/ai-tools/ai-quiz/${q.id}`}>Take Quiz</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {quizTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={quizPage === 0}
                  onClick={() => setQuizPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Previous
                </Button>
                {Array.from({ length: quizTotalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    variant={quizPage === idx ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuizPage(idx)}
                    className={`w-9 h-9 rounded-xl font-bold cursor-pointer transition-all ${
                      quizPage === idx
                        ? "bg-[#f26522] text-white hover:bg-[#d9581c]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={quizPage >= quizTotalPages - 1}
                  onClick={() => setQuizPage((p) => Math.min(quizTotalPages - 1, p + 1))}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* SECTION 3: Published Flashcards */}
      <section className="mb-12">
        <div className="flex flex-col mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#f26522]" />
            <span>Published Flashcards</span>
            <span className="text-sm font-normal text-slate-400">({flashcards.length})</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review key concepts with flashcard sets created by {userProfile.fullName}.
          </p>
        </div>

        {isFlashcardsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-60 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : flashcards.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-3xl border border-slate-100 text-slate-400 font-medium text-sm">
            <Layers size={40} className="mx-auto mb-3 text-slate-300" />
            No published flashcards yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedFlashcards.map((fc) => (
                <Card
                  key={fc.id}
                  className="shadow-sm border-orange-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
                >
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="w-full aspect-[4/3] bg-orange-50 rounded-xl mb-3 -mt-4 border border-orange-100 flex items-center justify-center text-[#f26522]">
                      <BookOpen className="w-12 h-12 opacity-50" />
                    </div>
                    <CardTitle
                      className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                      title={fc.title}
                    >
                      {fc.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#f26522] font-medium mb-3 flex items-center gap-1.5">
                      {fc.cards || 0} Cards • {fc.courseCode || fc.documentCourseCode || "General"}
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
                      className="flex-1 bg-[#f26522] hover:bg-[#d9581c] text-white font-semibold text-xs rounded-xl h-9 cursor-pointer"
                    >
                      <Link to={fc.userId === currentUserId || fc.ownerId === currentUserId ? `/ai-tools/ai-flashcard?id=${fc.id}&mode=study` : `/flashcard/${fc.id}`}>Study Now</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {flashcardTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={flashcardPage === 0}
                  onClick={() => setFlashcardPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Previous
                </Button>
                {Array.from({ length: flashcardTotalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    variant={flashcardPage === idx ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFlashcardPage(idx)}
                    className={`w-9 h-9 rounded-xl font-bold cursor-pointer transition-all ${
                      flashcardPage === idx
                        ? "bg-[#f26522] text-white hover:bg-[#d9581c]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={flashcardPage >= flashcardTotalPages - 1}
                  onClick={() => setFlashcardPage((p) => Math.min(flashcardTotalPages - 1, p + 1))}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Confirmation Dialog for Adding Flashcard to Favorites */}
      <Dialog open={likeFlashcardConfirmOpen} onOpenChange={setLikeFlashcardConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              Add Flashcard to Favorites
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              Do you want to add <strong>"{flashcardToLike?.title}"</strong> to your library favorites?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setLikeFlashcardConfirmOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLikeFlashcard}
              className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white font-semibold"
            >
              Add to Favorites
            </Button>
          </DialogFooter>
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

      {/* Followers & Following Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200/50 w-full max-w-md max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 capitalize text-lg flex items-center gap-2">
                <Users className="text-[#f26522] h-5 w-5" /> {modalType}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 min-h-[200px]">
              {isModalLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f26522]" />
                </div>
              ) : modalData.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-medium">
                  No users found.
                </div>
              ) : (
                modalData.map((item, idx) => {
                  const isItemSelf = currentUserId === item.id;
                  const itemInitial = item.fullName.charAt(0).toUpperCase();

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors"
                    >
                      <div
                        onClick={() => {
                          setModalType(null);
                          navigate(`/users/${item.id}`);
                        }}
                        className="flex items-center gap-3 cursor-pointer group flex-1"
                      >
                        {item.avatarUrl ? (
                          <img
                            src={item.avatarUrl}
                            alt={item.fullName}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#f26522]/10 text-[#f26522] font-bold text-sm flex items-center justify-center shrink-0">
                            {itemInitial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-[#f26522] transition-colors">
                            {item.fullName}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <FileText size={10} /> {item.documentCount} documents
                          </span>
                        </div>
                      </div>

                      {/* Modal Follow Toggle */}
                      {!isItemSelf && (
                        <Button
                          size="sm"
                          onClick={() => handleModalFollowToggle(item, idx)}
                          className={`h-8 px-4 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 ${
                            item.isFollowedByCurrentUser
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                              : "bg-[#f26522] text-white hover:bg-[#d9581c]"
                          }`}
                        >
                          {item.isFollowedByCurrentUser ? (
                            <span className="flex items-center gap-1">
                              <UserCheck size={12} /> Đang theo dõi
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <UserPlus size={12} /> Theo dõi
                            </span>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer - Pagination */}
            {modalTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-slate-500 bg-slate-50/50 rounded-b-3xl">
                <button
                  disabled={modalPage === 0}
                  onClick={() => handleModalPageChange(modalPage - 1)}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Page {modalPage + 1} of {modalTotalPages}
                </span>
                <button
                  disabled={modalPage === modalTotalPages - 1}
                  onClick={() => handleModalPageChange(modalPage + 1)}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
