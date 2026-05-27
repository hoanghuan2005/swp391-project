import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FolderKanban, 
  FileText, 
  Share2, 
  Loader2, 
  ChevronLeft,
  Check
} from "lucide-react";
import { toast } from "react-hot-toast";

import { getProjectDetail, getSharedProject } from "@/api/projectApi";
import { askAi } from "@/api/aiApi";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInterface from "@/components/chat/ChatInterface"; 

export default function ProjectWorkspacePage() {
  const { projectId, token } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: "initial",
      role: "assistant",
      content: "Welcome to your Project Workspace! I can answer questions based on all documents in this project. What would you like to know?",
    },
  ]);
  
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // NEW: Determine if this is the standalone shared view or the layout view
  const isSharedView = !!token;

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      if (token) {
        data = await getSharedProject(token);
      } else {
        data = await getProjectDetail(projectId);
      }
      setProject(data);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      toast.error("Failed to load project workspace");
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleSend = async (messageText) => {
    if (!messageText || isSending) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await askAi({
        projectId: project.id,
        question: messageText,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: response.answer,
        },
      ]);
    } catch (error) {
      console.error("AI Ask failed:", error);
      toast.error("AI Assistant is currently unavailable");
    } finally {
      setIsSending(false);
    }
  };

  const copyShareLink = () => {
    if (!project?.shareToken) return;
    const link = `${window.location.origin}/workspace/shared/${project.shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f26522]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Project Not Found</h2>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/home"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    // NEW: Conditional styling wrapper
    <div 
      className={`flex overflow-hidden bg-[#fafafa] ${
        isSharedView 
          ? "h-screen w-full absolute inset-0 z-50" // Standalone mode: Force full screen and sit on top of everything
          : "h-[calc(102vh-80px)] rounded-xl -mx-8 -my-6" // Nested layout mode: Use negative margins
      }`}
    >
      {/* LEFT SIDEBAR: Project Info & Documents */}
      <aside className="w-[320px] border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#f26522]/10 flex items-center justify-center shrink-0">
              <FolderKanban className="w-6 h-6 text-[#f26522]" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-slate-800 truncate" title={project.name}>
                {project.name}
              </h2>
              <p className="text-xs text-slate-500 truncate">Project Workspace</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 line-clamp-3 mb-4">
            {project.description || "No description provided."}
          </p>

          <Button 
            onClick={copyShareLink}
            variant="outline" 
            className="w-full justify-start gap-2 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4 text-[#f26522]" />}
            {copied ? "Copied!" : "Copy Share Link"}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Documents ({project.documents?.length || 0})
            </h3>
            
            <div className="space-y-2">
              {project.documents?.map((doc) => (
                <Link 
                  key={doc.id} 
                  to={`/documents/${doc.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-orange-50 transition-colors">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-[#f26522]" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-[#f26522] transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                      {doc.fileType || "PDF"}
                    </p>
                  </div>
                </Link>
              ))}
              
              {(!project.documents || project.documents.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">No documents added yet.</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* RIGHT SIDE: AI Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface 
          title="AI Study Partner"
          subtitle="Multi-document Context Active"
          messages={messages}
          isSending={isSending}
          onSendMessage={handleSend}
          showUploadButton={false} 
        />
      </div>
    </div>
  );
}