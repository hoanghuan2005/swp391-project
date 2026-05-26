import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Layout,
  ChevronRight,
  Search,
  BookOpen,
  Calendar,
  Layers, 
  ListChecks   
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import axiosClient from "@/api/axiosClient";
import { getMyProjects } from "@/api/projectApi";
import CreateProjectModal from "@/components/projects/CreateProjectModal";

export default function MyLibrary() {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchMyUploads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get("/api/documents/my-uploads");
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching uploads:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  useEffect(() => {
    fetchMyUploads();
    fetchProjects();
  }, [fetchMyUploads, fetchProjects]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Library</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your uploaded materials and study workspaces.</p>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        {/* TAB NAVIGATION LIST */}
        <TabsList className="bg-slate-100/50 p-1 rounded-2xl mb-8 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="projects" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <Layout className="w-4 h-4 mr-2" /> My Workspaces
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <FileText className="w-4 h-4 mr-2" /> My Uploads
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <Layers className="w-4 h-4 mr-2" /> My Flashcards
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            <ListChecks className="w-4 h-4 mr-2" /> My Quizzes
          </TabsTrigger>
        </TabsList>

        {/* WORKSPACES CONTENT */}
        <TabsContent value="projects" className="mt-0">
          {isProjectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
                <Layout className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">No Workspaces Yet</h3>
              <p className="text-slate-500 mb-6 max-w-sm">Create a workspace to group documents and use multi-document AI chat.</p>
              <Button onClick={() => setCreateModalOpen(true)} variant="outline" className="rounded-xl border-slate-200 gap-2">
                <Plus className="w-4 h-4" /> Create first workspace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="rounded-[28px] border-2 border-dashed border-slate-200 hover:border-[#f26522] hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center p-6 h-full min-h-[200px] text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-[#f26522] transition-colors flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-[#f26522] transition-colors">Create New Workspace</span>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Set up a new space for your documents</p>
              </button>

              {projects.map((project) => (
                <Link key={project.id} to={`/workspace/${project.id}`}>
                  <Card className="rounded-[28px] border-slate-100 hover:border-[#f26522]/20 hover:shadow-xl hover:shadow-orange-50 transition-all group overflow-hidden bg-white h-full border-2">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-[#f26522] transition-colors">
                          <Layout className="w-6 h-6 text-[#f26522] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                          <FileText className="w-3 h-3" /> {project.documents?.length || 0} Docs
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#f26522] transition-colors mb-2 truncate">
                        {project.name}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">
                        {project.description || "No description provided."}
                      </p>

                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(project.createdAt).toLocaleDateString("en-GB")}
                        </span>
                        <span className="flex items-center font-bold text-[#f26522] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                          Open Workspace <ChevronRight className="w-4 h-4 ml-0.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* DOCUMENTS CONTENT */}
        <TabsContent value="documents" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[32px]">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">You haven't uploaded any documents yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {documents.map((doc) => (
                <Link key={doc.id} to={`/documents/${doc.id}`}>
                  <Card className="rounded-2xl border-slate-100 hover:shadow-md transition-all h-full bg-white group">
                    <CardContent className="p-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-orange-50">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-[#f26522]" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm truncate">{doc.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {doc.course?.code || "General"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FLASHCARDS CONTENT  */}
        <TabsContent value="flashcards" className="mt-0">
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">Your Flashcard Decks</h3>
            <p className="text-slate-500 mb-6 max-w-sm">Saved AI-generated flashcards will appear here.</p>
          </div>
        </TabsContent>

        {/* QUIZZES CONTENT */}
        <TabsContent value="quizzes" className="mt-0">
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
              <ListChecks className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">Your Quizzes</h3>
            <p className="text-slate-500 mb-6 max-w-sm">Past quiz attempts and saved test sets will show up here.</p>
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