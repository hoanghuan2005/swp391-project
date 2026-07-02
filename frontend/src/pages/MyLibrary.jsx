import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  LayoutDashboard,
  ChevronRight,
  BookOpen,
  Calendar,
  Layers,
  ListChecks,
  Edit2,
  Trash2,
  Heart,
  Download,
  Eye,
  UserCheck2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useDocuments from "@/hooks/useDocuments";
import axiosClient from "@/api/axiosClient";
import { getMyProjects, deleteProject } from "@/api/projectApi";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import EditDocumentDialog from "@/components/documents/EditDocumentDialog";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { forceDownload } from "@/lib/downloadHelper";
import { getFileExtension } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function MyLibrary() {
  const { documents, loading: isLoading, refreshDocuments } = useDocuments();
  const [projects, setProjects] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEditDoc, setSelectedEditDoc] = useState(null);

  const [deleteDoc, setDeleteDoc] = useState(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  const [deleteWorkspace, setDeleteWorkspace] = useState(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

  const [unfollowUser, setUnfollowUser] = useState(null);
  const [isUnfollowingUser, setIsUnfollowingUser] = useState(false);

  const [favoriteDocs, setFavoriteDocs] = useState([]);
  const [favoriteFlashcards, setFavoriteFlashcards] = useState([]); // State mới cho Flashcard Yêu thích
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);

  const [followedUsers, setFollowedUsers] = useState([]);
  const [isFollowedLoading, setIsFollowedLoading] = useState(false);

  const [myFlashcardSets, setMyFlashcardSets] = useState([]);
  const [isFlashcardsLoading, setIsFlashcardsLoading] = useState(false);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [isQuizzesLoading, setIsQuizzesLoading] = useState(false);

  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    try {
      setIsProjectsLoading(true);
      const data = await getMyProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsProjectsLoading(false);
    }
  }, []);

  const fetchFavoriteDocuments = useCallback(async () => {
    try {
      setIsFavoritesLoading(true);
      const response = await axiosClient.get("/api/documents/favorites");
      setFavoriteDocs(response.data || []);
    } catch (error) {
      console.error("Error fetching favorite documents:", error);
    } finally {
      setIsFavoritesLoading(false);
    }
  }, []);

  // Hàm gọi API lấy flashcard yêu thích
  const fetchFavoriteFlashcards = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/ai_flashcard/favorites");
      setFavoriteFlashcards(response.data || []);
    } catch (error) {
      console.error("Error fetching favorite flashcards:", error);
    }
  }, []);

  const fetchFollowedUsers = useCallback(async () => {
    try {
      setIsFollowedLoading(true);
      let currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
        const profileRes = await axiosClient.get("/api/profile");
        currentUserId = profileRes.data?.id;
        if (currentUserId) {
          localStorage.setItem("userId", currentUserId);
        }
      }
      if (currentUserId) {
        const res = await axiosClient.get(`/api/follows/following/${currentUserId}?page=0&size=50`);
        setFollowedUsers(res.data.content || []);
      }
    } catch (error) {
      console.error("Error fetching followed users:", error);
    } finally {
      setIsFollowedLoading(false);
    }
  }, []);

  const fetchMyFlashcards = useCallback(async () => {
    try {
      setIsFlashcardsLoading(true);
      const res = await axiosClient.get("/api/ai_flashcard/sets");
      setMyFlashcardSets(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching my flashcards:", error);
    } finally {
      setIsFlashcardsLoading(false);
    }
  }, []);

  const fetchMyQuizzes = useCallback(async () => {
    try {
      setIsQuizzesLoading(true);
      const res = await axiosClient.get("/api/quizzes/my-quizzes");
      setMyQuizzes(res.data || []);
    } catch (error) {
      console.error("Error fetching my quizzes:", error);
    } finally {
      setIsQuizzesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchFavoriteDocuments();
    fetchFavoriteFlashcards();
    fetchFollowedUsers();
    fetchMyFlashcards();
    fetchMyQuizzes();
  }, [fetchProjects, fetchFavoriteDocuments, fetchFavoriteFlashcards, fetchFollowedUsers, fetchMyFlashcards, fetchMyQuizzes]);

  const handleUnfollowUser = (userId, fullName) => {
    setUnfollowUser({ id: userId, fullName });
  };

  const handleUnfollowUserConfirm = async () => {
    if (!unfollowUser) return;
    try {
      setIsUnfollowingUser(true);
      await axiosClient.delete(`/api/follows/${unfollowUser.id}`);
      toast.success(`Đã bỏ theo dõi ${unfollowUser.fullName}`);
      setFollowedUsers((prev) => prev.filter((user) => user.id !== unfollowUser.id));
      setUnfollowUser(null);
    } catch (error) {
      console.error("Failed to unfollow user:", error);
      toast.error("Không thể bỏ theo dõi");
    } finally {
      setIsUnfollowingUser(false);
    }
  };

  const handleDeleteWorkspace = (e, id, name) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteWorkspace({ id, name });
  };

  const handleDeleteWorkspaceConfirm = async () => {
    if (!deleteWorkspace) return;
    try {
      setIsDeletingWorkspace(true);
      await deleteProject(deleteWorkspace.id);
      toast.success("Workspace deleted successfully");
      fetchProjects();
      setDeleteWorkspace(null);
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      toast.error("Failed to delete workspace");
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!deleteDoc) return;
    try {
      setIsDeletingDoc(true);
      await axiosClient.delete(`/api/documents/${deleteDoc.id}`);
      toast.success("Document deleted successfully");
      await refreshDocuments();
      setDeleteDoc(null);
    } catch (err) {
      toast.error("Failed to delete document");
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const handleRemoveFavorite = async (id) => {
    try {
      await axiosClient.post(`/api/documents/${id}/favorite`);
      toast.success("Removed from favorites");
      setFavoriteDocs((prev) => prev.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      toast.error("Something went wrong");
    }
  };

  // Hàm xử lý xóa Flashcard khỏi Favorites
  const handleRemoveFavoriteFlashcard = async (id) => {
    try {
      await axiosClient.post(`/api/ai_flashcard/${id}/favorite`);
      toast.success("Removed flashcard from favorites");
      setFavoriteFlashcards((prev) => prev.filter((fc) => fc.id !== id));
    } catch (error) {
      console.error("Failed to remove favorite flashcard:", error);
      toast.error("Something went wrong");
    }
  };

  const handleDownload = async (id, title) => {
    try {
      const res = await axiosClient.get(`/api/documents/${id}/download`);
      const url = res.data.downloadUrl;
      if (url) await forceDownload(url, title || "document");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Error downloading document!");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          My Library
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your uploaded materials, study workspaces, and saved favorites.
        </p>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        {/* Layout của TabsList chống vỡ hàng */}
        <div className="w-full overflow-x-auto scrollbar-none bg-slate-100/70 p-1 rounded-2xl mb-8">
          <TabsList className="bg-transparent p-0 h-11 flex w-max gap-1">
            <TabsTrigger
              value="documents"
              className="rounded-xl px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-slate-600 data-[state=active]:text-slate-900 text-sm transition-all whitespace-nowrap"
            >
              <FileText className="w-4 h-4 mr-2 text-[#f26522] inline-block" />{" "}
              My Uploads
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="rounded-xl px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-slate-600 data-[state=active]:text-slate-900 text-sm transition-all whitespace-nowrap"
            >
              <LayoutDashboard className="w-4 h-4 mr-2 text-[#f26522] inline-block" />{" "}
              My Workspaces
            </TabsTrigger>

            <TabsTrigger
              value="favorites"
              className="rounded-xl px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-slate-600 data-[state=active]:text-slate-900 text-sm transition-all whitespace-nowrap"
            >
              <Heart className="w-4 h-4 mr-2 text-red-500 fill-red-500 inline-block" />{" "}
              My Favorites
            </TabsTrigger>
            <TabsTrigger
              value="flashcards"
              className="rounded-xl px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-slate-600 data-[state=active]:text-slate-900 text-sm transition-all whitespace-nowrap"
            >
              <Layers className="w-4 h-4 mr-2 text-[#f26522] inline-block" /> My
              Flashcards
            </TabsTrigger>
            <TabsTrigger
              value="quizzes"
              className="rounded-xl px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-slate-600 data-[state=active]:text-slate-900 text-sm transition-all whitespace-nowrap"
            >
              <ListChecks className="w-4 h-4 mr-2 text-[#f26522] inline-block" />{" "}
              My Quizzes
            </TabsTrigger>
            <TabsTrigger
              value="followed"
              className="rounded-xl px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-slate-600 data-[state=active]:text-slate-900 text-sm transition-all whitespace-nowrap"
            >
              <UserCheck2 className="w-4 h-4 mr-2 text-[#f26522] inline-block" />{" "}
              My Followed
            </TabsTrigger>
          </TabsList>
        </div>

        {/* WORKSPACES CONTENT */}
        <TabsContent value="projects" className="mt-0">
          {isProjectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-3xl" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
                <LayoutDashboard className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                No Workspaces Yet
              </h3>
              <p className="text-slate-500 mb-6 max-w-sm">
                Create a workspace to group documents and use multi-document AI
                chat.
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                variant="outline"
                className="rounded-xl border-slate-200 gap-2"
              >
                <Plus className="w-4 h-4" /> Create first workspace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="rounded-[28px] border-2 border-dashed border-slate-200 hover:border-[#f26522] hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center p-5 h-full min-h-[180px] text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-[#f26522] transition-colors flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-[#f26522] transition-colors">
                  Create New Workspace
                </span>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Set up a new space for your documents
                </p>
              </button>

              {projects.map((project) => (
                <div key={project.id} className="relative group">
                  <Link to={`/workspace/${project.id}`}>
                    <Card className="rounded-3xl border-slate-50 hover:border-[#f26522]/20 hover:shadow-md transition-all group overflow-hidden bg-white h-full border-1">
                      <CardContent className="py-4 px-6 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-[#f26522] transition-colors">
                            <LayoutDashboard className="w-6 h-6 text-[#f26522] group-hover:text-white transition-colors" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) =>
                                handleDeleteWorkspace(
                                  e,
                                  project.id,
                                  project.name
                                )
                              }
                              className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                              <FileText className="w-3 h-3" />{" "}
                              {project.documents?.length || 0} Docs
                            </div>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#f26522] transition-colors mb-2 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-5 flex-1">
                          {project.description || "No description provided."}
                        </p>

                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 -mb-2">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-4 h-4" />{" "}
                            {new Date(project.createdAt).toLocaleDateString(
                              "en-GB"
                            )}
                          </span>
                          <span className="flex items-center font-bold text-[#f26522] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                            Open Workspace{" "}
                            <ChevronRight className="w-4 h-4 ml-0.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* DOCUMENTS CONTENT */}
        <TabsContent value="documents" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-3xl" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                You haven't uploaded any documents yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <Card key={doc.id} className="rounded-3xl border-slate-100 hover:border-[#f26522]/20 hover:shadow-md transition-all group overflow-hidden bg-white border border-1">
                  <CardContent className="py-4 px-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-[#f26522] transition-colors">
                        <FileText className="w-6 h-6 text-[#f26522] group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEditDoc(doc)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-[#f26522] hover:bg-orange-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDoc(doc);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                          {doc.course?.code || "General"}
                        </div>
                      </div>
                    </div>
                    <Link to={`/documents/${doc.id}`}>
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#f26522] transition-colors mb-2 truncate">
                        {doc.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-5 flex-1">
                      {doc.description || "No description provided."}
                    </p>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 -mb-2">
                      <Button
                        asChild
                        variant="secondary"
                        className="bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white font-semibold text-xs rounded-xl h-8 w-full"
                      >
                        <Link to={`/documents/${doc.id}`}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View Document
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FAVORITES CONTENT */}
        <TabsContent value="favorites" className="mt-0">
          {isFavoritesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-72 w-full rounded-[20px]" />
              ))}
            </div>
          ) : favoriteDocs.length === 0 && favoriteFlashcards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-slate-300 fill-slate-100" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                No Favorites Bookmarked
              </h3>
              <p className="text-slate-500 max-w-sm text-sm">
                Tap the heart button on public documents or flashcards to
                review them instantly here.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* KHU VỰC HIỂN THỊ DOCUMENTS YÊU THÍCH */}
              {favoriteDocs.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" /> Favorite Documents
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {favoriteDocs.map((doc) => (
                      <Card
                        key={doc.id}
                        className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white border border-1"
                      >
                        <CardContent className="p-3.5 flex-1 flex flex-col">
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
                                handleRemoveFavorite(doc.id);
                              }}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90 hover:scale-105 z-10 bg-red-50 text-red-500 border-red-100"
                            >
                              <Heart className="w-4 h-4 fill-current" />
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
                    ))}
                  </div>
                </div>
              )}

              {/* KHU VỰC HIỂN THỊ FLASHCARDS YÊU THÍCH */}
              {favoriteFlashcards.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#f26522]" /> Favorite Flashcards
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {favoriteFlashcards.map((fc) => (
                      <Card
                        key={fc.id}
                        className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white border border-1"
                      >
                        <CardContent className="p-4 flex-1 flex flex-col">
                          <div className="relative w-full aspect-[4/3] bg-orange-50 rounded-xl mb-3 -mt-4 border border-orange-100 group-hover:border-[#f26522]/20 flex items-center justify-center text-orange-300">
                            <Layers className="w-12 h-12 text-[#f26522] opacity-50" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveFavoriteFlashcard(fc.id);
                              }}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90 hover:scale-105 z-10 bg-red-50 text-red-500 border-red-100"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                          </div>
                          <CardTitle
                            className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                            title={fc.title}
                          >
                            {fc.title || "Untitled Flashcard"}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500 font-medium mb-3">
                            {fc.cards || 0} Terms
                          </CardDescription>
                          <div className="text-[11px] text-slate-400 mt-auto flex justify-between items-center">
                            <span>
                              {new Date(fc.createdAt).toLocaleDateString("en-GB")}
                            </span>
                            <span>Flashcard Set</span>
                          </div>
                        </CardContent>
                        <CardFooter className="-mt-3 px-4 py-3 flex gap-2">
                          <Button
                            asChild
                            variant="secondary"
                            className="w-full bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white font-bold text-xs rounded-xl h-9"
                          >
                            <Link to={`/ai-tools/ai-flashcard?id=${fc.id}`}>
                              <Eye className="w-3.5 h-3.5 mr-1.5" /> Study
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* FLASHCARDS CONTENT */}
        <TabsContent value="flashcards" className="mt-0">
          {isFlashcardsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-3xl" />
              ))}
            </div>
          ) : myFlashcardSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                No Flashcard Decks Saved
              </h3>
              <p className="text-slate-500 mb-6 max-w-sm text-sm">
                Generate flashcards from documents and save them to your library to study.
              </p>
              <Button
                onClick={() => navigate("/ai-tools/ai-flashcard")}
                variant="outline"
                className="rounded-xl border-slate-200 gap-2"
              >
                <Plus className="w-4 h-4" /> Generate Flashcards
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myFlashcardSets.map((set) => (
                <Card key={set.id} className="rounded-3xl border-slate-100 hover:border-[#f26522]/20 hover:shadow-md transition-all group overflow-hidden bg-white">
                  <CardContent className="py-4 px-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-[#f26522] transition-colors">
                        <Layers className="w-6 h-6 text-[#f26522] group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm("Delete this flashcard set?")) return;
                            try {
                              await axiosClient.delete(`/api/ai_flashcard/sets/${set.id}`);
                              toast.success("Flashcard set deleted");
                              fetchMyFlashcards();
                            } catch (err) {
                              toast.error("Failed to delete flashcard set");
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                          {set.cards || 0} Cards
                        </div>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#f26522] transition-colors mb-2 truncate">
                      {set.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-5 flex-1">
                      Start studying these terms to test your knowledge.
                    </p>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 -mb-2">
                      <Button
                        asChild
                        variant="secondary"
                        className="bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white font-semibold text-xs rounded-xl h-8 w-full"
                      >
                        <Link to={`/ai-tools/ai-flashcard?id=${set.id}`}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Start Study
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* QUIZZES CONTENT */}
        <TabsContent value="quizzes" className="mt-0">
          {isQuizzesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-3xl" />
              ))}
            </div>
          ) : myQuizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
                <ListChecks className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                No Quizzes Saved
              </h3>
              <p className="text-slate-500 mb-6 max-w-sm text-sm">
                Generate quizzes from documents and save them to your library to test yourself.
              </p>
              <Button
                onClick={() => navigate("/ai-tools/ai-quiz")}
                variant="outline"
                className="rounded-xl border-slate-200 gap-2"
              >
                <Plus className="w-4 h-4" /> Generate Quiz
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myQuizzes.map((quiz) => (
                <Card key={quiz.id} className="rounded-3xl border-slate-100 hover:border-[#f26522]/20 hover:shadow-md transition-all group overflow-hidden bg-white">
                  <CardContent className="py-4 px-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-[#f26522] transition-colors">
                        <ListChecks className="w-6 h-6 text-[#f26522] group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm("Delete this quiz?")) return;
                            try {
                              await axiosClient.delete(`/api/quizzes/${quiz.id}`);
                              toast.success("Quiz deleted");
                              fetchMyQuizzes();
                            } catch (err) {
                              toast.error("Failed to delete quiz");
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                          {quiz.questions?.length || 0} Questions
                        </div>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#f26522] transition-colors mb-2 truncate">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-5 flex-1">
                      Test your understanding of the material.
                    </p>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 -mb-2">
                      <Button
                        asChild
                        variant="secondary"
                        className="bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white font-semibold text-xs rounded-xl h-8 w-full"
                      >
                        <Link to={`/quiz/${quiz.id}`}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Start Quiz
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FOLLOWED CREATORS CONTENT */}
        <TabsContent value="followed" className="mt-0">
          {isFollowedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-60 w-full rounded-3xl" />
              ))}
            </div>
          ) : followedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
                <UserCheck2 className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                Chưa theo dõi ai
              </h3>
              <p className="text-slate-500 max-w-sm text-sm">
                Theo dõi các nhà sáng tạo tài liệu hữu ích để nhận được thông báo mới nhất khi họ đăng tải tài liệu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {followedUsers.map((user) => {
                const userInitial = user.fullName?.charAt(0).toUpperCase() || "U";
                return (
                  <div
                    key={user.id}
                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center group"
                  >
                    {/* User Avatar */}
                    <Link to={`/users/${user.id}`} className="block">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-20 h-20 rounded-full object-cover border-4 border-orange-50 shadow-sm group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-orange-100/50 text-[#f26522] font-bold text-2xl flex items-center justify-center border-4 border-orange-50 shadow-sm group-hover:scale-105 transition-transform">
                          {userInitial}
                        </div>
                      )}
                    </Link>

                    {/* Full Name */}
                    <Link to={`/users/${user.id}`} className="block mt-4 flex-1">
                      <h4 className="font-extrabold text-slate-800 text-base line-clamp-1 group-hover:text-[#f26522] transition-colors">
                        {user.fullName}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-1 mb-4 flex items-center gap-1.5 justify-center">
                        <BookOpen className="w-3.5 h-3.5" /> {user.documentCount || 0} tài liệu
                      </p>
                    </Link>

                    {/* Unfollow Button */}
                    <Button
                      variant="outline"
                      onClick={() => handleUnfollowUser(user.id, user.fullName)}
                      className="w-full rounded-xl border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-500 hover:border-red-100 font-semibold text-xs h-9 transition-all"
                    >
                      Bỏ theo dõi
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchProjects}
      />

      <EditDocumentDialog
        open={!!selectedEditDoc}
        onOpenChange={(open) => !open && setSelectedEditDoc(null)}
        doc={selectedEditDoc}
        onUpdateSuccess={refreshDocuments}
      />

      <ConfirmationModal
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDeleteDoc}
        title="Xóa tài liệu"
        message={`Bạn có chắc chắn muốn xóa tài liệu "${deleteDoc?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa tài liệu"
        cancelText="Hủy"
        variant="danger"
        loading={isDeletingDoc}
      />

      <ConfirmationModal
        isOpen={!!deleteWorkspace}
        onClose={() => setDeleteWorkspace(null)}
        onConfirm={handleDeleteWorkspaceConfirm}
        title="Xóa Workspace"
        message={`Bạn có chắc chắn muốn xóa workspace "${deleteWorkspace?.name}"? Toàn bộ tài liệu và dữ liệu AI liên quan sẽ bị xóa.`}
        confirmText="Xóa Workspace"
        cancelText="Hủy"
        variant="danger"
        loading={isDeletingWorkspace}
      />

      <ConfirmationModal
        isOpen={!!unfollowUser}
        onClose={() => setUnfollowUser(null)}
        onConfirm={handleUnfollowUserConfirm}
        title="Bỏ theo dõi"
        message={`Bạn có chắc chắn muốn bỏ theo dõi ${unfollowUser?.fullName}?`}
        confirmText="Bỏ theo dõi"
        cancelText="Hủy"
        variant="warning"
        loading={isUnfollowingUser}
      />
    </div>
  );
}