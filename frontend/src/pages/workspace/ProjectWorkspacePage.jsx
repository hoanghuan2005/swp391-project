import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Sparkles, CheckSquare } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  getProjectDetail,
  getSharedProject,
  removeDocumentFromProject,
} from "@/api/projectApi";
import { askAi, askSharedAi } from "@/api/aiApi";
import axiosClient from "@/api/axiosClient";
import ChatInterface from "@/components/chat/ChatInterface";
import AISidebar from "@/components/ai-sidebar/sidebar/AISidebar";

const welcomeMessage = {
  id: "initial",
  role: "assistant",
  content:
    "Welcome to your Project Workspace! Select specific sources from the sidebar to talk to, or ask a question right away to synthesize answers across the entire project.",
};

export default function ProjectWorkspacePage() {
  const { projectId, token } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([welcomeMessage]);

  const [isSending, setIsSending] = useState(false);
  const isSharedView = !!token;

  const [searchDocQuery, setSearchDocQuery] = useState("");
  const fileInputRef = useRef(null);

  // --- MULTI-SELECT NOTEBOOKLM LOGIC ---
  const [selectedDocs, setSelectedDocs] = useState([]); // Array instead of a single object!

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const loadConversationMessages = useCallback(async (conversationId) => {
    const response = await axiosClient.get(
      `/api/ai/conversations/${conversationId}/messages`,
    );
    const savedMessages = response.data || [];
    setMessages(savedMessages.length > 0 ? savedMessages : [welcomeMessage]);
  }, []);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      let data = token
        ? await getSharedProject(token)
        : await getProjectDetail(projectId);
      setProject(data);

      if (token) {
        const mainChat = { id: "main", title: data.name };
        setConversations([mainChat]);
        setActiveConversation(mainChat);
        setMessages([welcomeMessage]);
        return;
      }

      const response = await axiosClient.get(
        `/api/ai/conversations?projectId=${data.id}`,
      );
      const savedConversations = response.data || [];
      setConversations(savedConversations);

      if (savedConversations.length > 0) {
        const currentConversation = savedConversations[0];
        setActiveConversation(currentConversation);
        await loadConversationMessages(currentConversation.id);
      } else {
        setActiveConversation(null);
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
      toast.error("Failed to load project workspace");
    } finally {
      setLoading(false);
    }
  }, [projectId, token, loadConversationMessages]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProject();
  }, [fetchProject]);

  const handleSelectConversation = async (conversation) => {
    if (!conversation || conversation.id === activeConversation?.id) {
      return;
    }

    setActiveConversation(conversation);
    try {
      await loadConversationMessages(conversation.id);
    } catch (error) {
      console.error("Failed to load workspace chat:", error);
      toast.error("Failed to load workspace chat history");
    }
  };

  const createWorkspaceConversation = async (title = "New Chat") => {
    const response = await axiosClient.post("/api/ai/conversations", {
      title,
      projectId: project.id,
    });
    const newConversation = response.data;
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversation(newConversation);
    return newConversation;
  };

  const handleCreateNewConversation = async () => {
    if (isSharedView) {
      setActiveConversation({ id: "main", title: project.name });
      setMessages([welcomeMessage]);
      setSelectedDocs([]);
      return;
    }

    try {
      await createWorkspaceConversation();
      setMessages([welcomeMessage]);
      setSelectedDocs([]);
    } catch (error) {
      console.error("Failed to create workspace chat:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleSend = async (messageText) => {
    if (!messageText || isSending) return;

    const pendingDocs =
      selectedDocs.length > 0
        ? selectedDocs.filter((doc) => doc.aiParseStatus === "PENDING")
        : (project.documents || []).filter(
            (doc) => doc.aiParseStatus === "PENDING",
          );

    if (pendingDocs.length > 0) {
      toast.error(
        "Some documents are still being prepared for AI. Please try again shortly.",
      );
      return;
    }

    const userMessage = { id: Date.now(), role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const currentConversation = token
        ? null
        : activeConversation || (await createWorkspaceConversation());
      const documentIdsToSend =
        selectedDocs.length > 0 ? selectedDocs.map((d) => d.id) : null;

      const payload = {
        conversationId: currentConversation?.id || null,
        projectId: project.id,
        shareToken: token || null,
        documentIds: documentIdsToSend,
        message: messageText,
      };

      const response = token
        ? await askSharedAi(payload)
        : await askAi(payload);

      setMessages((prev) => [
        ...prev,
        {
          id: response.assistantMessageId || Date.now() + 1,
          role: "assistant",
          content: response.answer,
          sources: response.sources || [],
        },
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

    if (
      !window.confirm(
        "Are you sure you want to remove this document from the workspace?",
      )
    ) {
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
    <div
      className={`flex overflow-hidden bg-[#fafafa] ${isSharedView ? "h-screen w-full absolute inset-0 z-50" : "h-[calc(102vh-80px)] rounded-xl -mx-8 -my-6"}`}
    >
      <AISidebar
        type="project-workspace"
        histories={conversations}
        documents={project.documents || []}
        selectedItem={activeConversation}
        selectedDocs={selectedDocs} // Pass the array!
        onSelectItem={handleSelectConversation}
        onSelectDocument={handleSelectDocument}
        onDeleteDocument={isSharedView ? null : handleDeleteDocument}
        onCreate={handleCreateNewConversation}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        fileInputRef={fileInputRef}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          title={project.name}
          subtitle={
            selectedDocs.length > 0
              ? `Synthesizing ${selectedDocs.length} selected sources`
              : "Querying entire workspace"
          }
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
                Select specific sources from the sidebar to limit the context,
                or leave them unchecked to have the AI synthesize answers across
                all {project.documents?.length || 0} documents.
              </p>
            </div>
          }
          // The Context Badge now reflects multiple sources
          contextBadgeComponent={
            selectedDocs.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-md text-[10px] text-slate-600 font-semibold w-fit">
                <CheckSquare className="w-3.5 h-3.5 text-[#f26522]" />
                Focused on {selectedDocs.length} source
                {selectedDocs.length > 1 ? "s" : ""}
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
