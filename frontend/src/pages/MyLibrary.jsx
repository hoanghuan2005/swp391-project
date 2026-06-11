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
  UserCheck2
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
import { forceDownload } from "@/lib/downloadHelper";
import { toast } from "react-hot-toast";

export default function MyLibrary() {
  const { documents, loading: isLoading, refreshDocuments } = useDocuments();
  const [projects, setProjects] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [favoriteDocs, setFavoriteDocs] = useState([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);

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

  const handleDeleteWorkspace = async (e, id, name) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        `Are you sure you want to delete the workspace "${name}"? All associated AI data will be removed.`,
      )
    ) {
      return;
    }

    try {
      await deleteProject(id);
      toast.success("Workspace deleted successfully");
      fetchProjects();
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      toast.error("Failed to delete workspace");
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

  useEffect(() => {
    fetchProjects();
    fetchFavoriteDocuments();
  }, [fetchProjects, fetchFavoriteDocuments]);

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
                                  project.name,
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

                        {/* ĐÃ VÁ LỖI TẠI ĐÂY: Khôi phục lại footer và thẻ đóng đúng chuẩn */}
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 -mb-2">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-4 h-4" />{" "}
                            {new Date(project.createdAt).toLocaleDateString(
                              "en-GB",
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
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[32px]">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                You haven't uploaded any documents yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#f26522]" />
                    </div>
                    <div>
                      <Link to={`/documents/${doc.id}`} className="block">
                        <h4 className="font-bold text-slate-800 text-sm hover:text-[#f26522] transition-colors">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />{" "}
                          {doc.course?.code || "General"}
                        </p>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/documents/${doc.id}/edit`)}
                      className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm("Delete this document?")) return;
                        try {
                          await axiosClient.delete(`/api/documents/${doc.id}`);
                          toast.success("Document deleted");
                          await refreshDocuments();
                        } catch (err) {
                          toast.error("Failed to delete document");
                        }
                      }}
                      className="p-2 rounded-md text-slate-600 hover:text-white hover:bg-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
          ) : favoriteDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-slate-300 fill-slate-100" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                No Favorites Bookmarked
              </h3>
              <p className="text-slate-500 max-w-sm text-sm">
                Tap the heart button on public documents across the system to
                review them instantly here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {favoriteDocs.map((doc) => (
                <Card
                  key={doc.id}
                  className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white border"
                >
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="w-full aspect-[4/3] bg-slate-50 rounded-xl mb-3 border border-slate-200 flex items-center justify-center text-slate-300">
                      <FileText className="w-12 h-12" />
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
                  </CardContent>
                  <CardFooter className="px-4 pb-4 pt-0 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleRemoveFavorite(doc.id)}
                      className="flex-none px-2.5 rounded-xl border-red-100 text-red-500 bg-red-50 hover:bg-red-100 h-9"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                    <Button
                      asChild
                      variant="secondary"
                      className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs rounded-xl h-9"
                    >
                      <Link to={`/documents/${doc.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                      </Link>
                    </Button>
                    <Button
                      onClick={() => handleDownload(doc.id, doc.title)}
                      className="flex-1 bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white font-semibold text-xs rounded-xl h-9"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FLASHCARDS CONTENT */}
        <TabsContent value="flashcards" className="mt-0">
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              Your Flashcard Decks
            </h3>
          </div>
        </TabsContent>

        {/* QUIZZES CONTENT */}
        <TabsContent value="quizzes" className="mt-0">
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
              <ListChecks className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              Your Quizzes
            </h3>
          </div>
        </TabsContent>
      </Tabs>

      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
