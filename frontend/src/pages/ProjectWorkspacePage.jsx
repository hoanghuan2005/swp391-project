import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FolderKanban, 
  FileText, 
  Share2, 
  Send, 
  Loader2, 
  Bot, 
  Sparkles,
  ChevronLeft,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

import { getProjectDetail, getSharedProject } from "@/api/projectApi";
import { askAi } from "@/api/aiApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef(null);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsSending(true);

    try {
      const response = await askAi({
        projectId: project.id,
        question: currentInput,
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
    <div className="h-[calc(102vh-80px)] flex overflow-hidden bg-[#fafafa] rounded-xl -mx-8 -my-6">
      {/* LEFT SIDEBAR: Project Info & Documents */}
      <aside className="w-[320px] border-r border-slate-200 bg-white flex flex-col">
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

      {/* RIGHT MAIN AREA: AI Chat */}
      <main className="flex-1 flex flex-col relative bg-white">
        <header className="h-[73px] px-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f26522]/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-[#f26522]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">AI Study Partner</h1>
              <p className="text-xs text-slate-400 mt-1">Multi-document Context Active</p>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-5 py-3.5 rounded-[24px] ${
                      msg.role === "user"
                        ? "bg-[#f26522] text-white rounded-br-none shadow-lg shadow-orange-200"
                        : "bg-slate-50 border border-slate-100 text-slate-800 rounded-bl-none"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2 text-[#f26522] text-xs font-bold uppercase tracking-wider">
                        <Bot className="w-4 h-4" />
                        Gemini AI
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isSending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-50 border border-slate-100 rounded-[24px] rounded-bl-none px-5 py-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-[#f26522]" />
                    <span className="text-sm font-medium text-slate-500">
                      Analyzing documents...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* INPUT BAR */}
        <div className="p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <div className="relative flex items-center rounded-3xl border-2 border-slate-100 bg-white p-1.5 pr-2 shadow-sm focus-within:border-[#f26522] focus-within:ring-4 focus-within:ring-orange-50 transition-all duration-300">
              <Input
                placeholder="Ask about anything in this project..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 border-none shadow-none focus-visible:ring-0 text-slate-700 h-11 px-4 placeholder:text-slate-400"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                size="icon"
                className="rounded-2xl bg-[#f26522] hover:bg-[#d95316] h-11 w-11 shrink-0 shadow-md shadow-orange-100 transition-all duration-200"
              >
                {isSending ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
