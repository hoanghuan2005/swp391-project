import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft, Sparkles, FileText, CheckSquare } from "lucide-react";
import { toast } from "react-hot-toast";

import { getProjectDetail, getSharedProject, removeDocumentFromProject } from "@/api/projectApi";
import { askAi } from "@/api/aiApi";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/chat/ChatInterface"; 
import AISidebar from "@/components/ai-sidebar/AISidebar";

export default function ProjectWorkspacePage() {
  const { projectId, token } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: "initial",
      role: "assistant",
      content: "Welcome to your Project Workspace! Select specific sources from the sidebar to talk to, or ask a question right away to synthesize answers across the entire project.",
    },
  ]);

  const [isSending, setIsSending] = useState(false);
  const isSharedView = !!token;

  const [searchDocQuery, setSearchDocQuery] = useState("");
  const fileInputRef = useRef(null);

  // --- MULTI-SELECT NOTEBOOKLM LOGIC ---
  const [selectedDocs, setSelectedDocs] = useState([]); // Array instead of a single object!
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      let data = token ? await getSharedProject(token) : await getProjectDetail(projectId);
      setProject(data);
      const mainChat = { id: "main", title: data.name };
      setConversations([mainChat]);
      setActiveConversation(mainChat);
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

    const userMessage = { id: Date.now(), role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const documentIdsToSend = selectedDocs.length > 0 ? selectedDocs.map(d => d.id) : null;

      const response = await askAi({
        projectId: project.id,
        documentIds: documentIdsToSend, 
        message: messageText, 
      });

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: response.answer },
      ]);
    } catch (error) {
      console.error("AI Ask failed:", error);
      toast.error("AI Assistant is currently unavailable");
    } finally {
      setIsSending(false);
    }
  };

  // Toggle selection logic for multiple documents
  const handleSelectDocument = (doc) => {
    setSelectedDocs((prevSelected) => {
      const isAlreadySelected = prevSelected.find((d) => d.id === doc.id);
      if (isAlreadySelected) {
        return prevSelected.filter((d) => d.id !== doc.id); // Remove if already checked
      } else {
        return [...prevSelected, doc]; // Add if unchecked
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedDocs([]);
  };

  const handleDeleteDocument = async (documentId) => {
    if (isSharedView) return;

    if (!window.confirm("Are you sure you want to remove this document from the workspace?")) {
      return;
    }

    try {
      await removeDocumentFromProject(projectId, documentId);
      toast.success("Document removed");

      // Clear from selectedDocs if it was there
      setSelectedDocs((prev) => prev.filter((d) => d.id !== documentId));

      // Refresh project to update sidebar
      fetchProject();
    } catch (error) {
      console.error("Delete document failed:", error);
      toast.error("Failed to remove document");
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f26522]" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className={`flex overflow-hidden bg-[#fafafa] ${isSharedView ? "h-screen w-full absolute inset-0 z-50" : "h-[calc(102vh-80px)] rounded-xl -mx-8 -my-6" }`}>
      
      <AISidebar
        type="project-workspace"
        histories={conversations}
        documents={project.documents || []}
        selectedItem={activeConversation}
        selectedDocs={selectedDocs} // Pass the array!
        onSelectItem={setActiveConversation}
        onSelectDocument={handleSelectDocument}
        onDeleteDocument={handleDeleteDocument}
        onCreate={() => toast("Workspaces use a single unified chat.", { icon: "ℹ️" })}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        fileInputRef={fileInputRef}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface 
          title={project.name}
          subtitle={selectedDocs.length > 0 ? `Synthesizing ${selectedDocs.length} selected sources` : "Querying entire workspace"}
          messages={messages}
          isSending={isSending}
          onSendMessage={handleSend}
          showUploadButton={false} 
          emptyStateComponent={
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-[#f26522]/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-[#f26522]" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Project Workspace Active
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Select specific sources from the sidebar to limit the context, or leave them unchecked to have the AI synthesize answers across all {project.documents?.length || 0} documents.
              </p>
            </div>
          }
          // The Context Badge now reflects multiple sources
          contextBadgeComponent={
            selectedDocs.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-md text-[10px] text-slate-600 font-semibold w-fit">
                <CheckSquare className="w-3.5 h-3.5 text-[#f26522]" />
                Focused on {selectedDocs.length} source{selectedDocs.length > 1 ? 's' : ''}
                <button
                  onClick={handleClearSelection}
                  className="text-red-500 hover:text-red-700 font-bold ml-1 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )
          }
        />
      </div>
    </div>
  );
}