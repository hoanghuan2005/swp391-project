import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Sparkles, CheckSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  getProjectDetail,
  getSharedProject,
  removeDocumentFromProject,
} from "@/api/projectApi";
import {
  askAi,
  askSharedAi,
  createAiConversation,
  getAiConversationMessages,
  getAiConversations,
} from "@/api/aiApi";
import ChatInterface from "@/components/chat/ChatInterface";
import AISidebar from "@/components/ai-sidebar/sidebar/AISidebar";
import WorkspaceGroupChat from "@/components/chat/WorkspaceGroupChat";
import axiosClient, { backendBaseUrl } from "@/api/axiosClient";

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

  // Group Chat States
  const [chatMode, setChatMode] = useState("ai"); // "ai" or "group"
  const [groupMessages, setGroupMessages] = useState([]);
  const [isGroupChatConnected, setIsGroupChatConnected] = useState(false);
  const [groupSocket, setGroupSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [searchDocQuery, setSearchDocQuery] = useState("");
  const fileInputRef = useRef(null);

  // Custom Confirmation Dialog State
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, name }
  const [isConfirming, setIsConfirming] = useState(false);

  // --- MULTI-SELECT NOTEBOOKLM LOGIC ---
  const [selectedDocs, setSelectedDocs] = useState([]); // Array instead of a single object!

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const loadConversationMessages = useCallback(async (conversationId) => {
    const savedMessages = (await getAiConversationMessages(conversationId)) || [];
    setMessages(savedMessages.length > 0 ? savedMessages : [welcomeMessage]);
  }, []);

  const fetchProject = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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

      const savedConversations =
        (await getAiConversations({ projectId: data.id })) || [];
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
      if (!silent) setLoading(false);
    }
  }, [projectId, token, loadConversationMessages]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProject();
  }, [fetchProject]);

  // Prevent parent container from scrolling while workspace is mounted
  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (mainElement) {
      const originalOverflow = mainElement.style.overflow;
      mainElement.style.overflow = "hidden";
      return () => {
        mainElement.style.overflow = originalOverflow;
      };
    }
  }, []);

  // Set up background polling every 15 seconds to sync AI workspace documents/conversations when tab is focused
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchProject(true);
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchProject]);

  // Fetch current user details for the group chat bubbles
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get("/api/profile");
        setCurrentUser(res.data);
      } catch (e) {
        console.error("Failed to fetch user profile", e);
      }
    };
    fetchProfile();
  }, []);

  // Fetch group chat history
  useEffect(() => {
    if (chatMode !== "group" || !projectId) return;

    const fetchGroupChatHistory = async () => {
      try {
        const res = await axiosClient.get(`/api/projects/${projectId}/messages`);
        if (Array.isArray(res.data)) {
          setGroupMessages(res.data);
        }
      } catch (e) {
        console.error("Failed to load workspace group chat history", e);
      }
    };

    fetchGroupChatHistory();
  }, [chatMode, projectId]);

  // Connect to Group Chat WebSocket
  useEffect(() => {
    if (chatMode !== "group" || !projectId) return;

    const tokenVal = localStorage.getItem("token");
    if (!tokenVal) return;

    const wsBaseUrl = backendBaseUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");

    const cleanWsBaseUrl = wsBaseUrl.endsWith("/") ? wsBaseUrl.slice(0, -1) : wsBaseUrl;
    const wsUrl = `${cleanWsBaseUrl}/project-chat-ws/${projectId}?token=${tokenVal}`;
    console.log("Connecting to workspace chat WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connection established successfully for workspace chat.");
      setIsGroupChatConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event === "NEW_COMMENT") {
          setGroupMessages((prev) => [...prev, parsed.data]);
        } else if (parsed.event === "REACTION_UPDATE") {
          setGroupMessages((prev) =>
            prev.map((msg) => (msg.id === parsed.data.id ? parsed.data : msg))
          );
        }
      } catch (err) {
        console.error("Failed to parse message", err);
      }
    };

    ws.onclose = () => {
      setIsGroupChatConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    setGroupSocket(ws);

    return () => {
      ws.close();
      setIsGroupChatConnected(false);
    };
  }, [chatMode, projectId]);

  const handleSendGroupMessage = (content, parentId = null) => {
    if (!content.trim() || !groupSocket || groupSocket.readyState !== WebSocket.OPEN) return;

    const payload = JSON.stringify({
      type: "COMMENT",
      content: content.trim(),
      parentId: parentId,
    });

    groupSocket.send(payload);
  };

  const handleToggleGroupReaction = (messageId, reactionType) => {
    if (!groupSocket || groupSocket.readyState !== WebSocket.OPEN) return;

    const payload = JSON.stringify({
      type: "REACTION",
      messageId: messageId,
      reactionType: reactionType,
    });

    groupSocket.send(payload);
  };

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
    const newConversation = await createAiConversation({
      title,
      projectId: project.id,
    });
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

    if (hasFailedOrUnsupportedSelected) {
      toast.error("Some selected documents failed to parse or are unsupported.");
      return;
    }

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

  const handleDeleteDocument = (documentId) => {
    if (isSharedView) return;
    const doc = project.documents?.find((d) => d.id === documentId);
    setConfirmTarget({
      id: documentId,
      name: doc?.title || doc?.name || "tài liệu này",
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    setIsConfirming(true);
    try {
      await removeDocumentFromProject(projectId, confirmTarget.id);
      toast.success("Document removed");

      // Clear from selectedDocs if it was there
      setSelectedDocs((prev) => prev.filter((d) => d.id !== confirmTarget.id));

      // Refresh project to update sidebar
      fetchProject(true);
    } catch (error) {
      console.error("Delete document failed:", error);
      toast.error("Failed to remove document");
    } finally {
      setIsConfirming(false);
      setConfirmDialogOpen(false);
      setConfirmTarget(null);
    }
  };

  const hasFailedOrUnsupportedSelected = selectedDocs.some(
    (doc) => doc.aiParseStatus === "FAILED" || doc.aiParseStatus === "UNSUPPORTED"
  );

  const documentAlertBoard = hasFailedOrUnsupportedSelected ? (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 w-full">
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-bold text-sm">AI Q&A Disabled</h4>
        <p className="text-xs text-red-700 mt-1">
          Some of the selected documents failed to parse or are unsupported. You cannot ask AI questions about them.
        </p>
      </div>
    </div>
  ) : null;

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
      className={`flex overflow-hidden bg-[#fafafa] ${isSharedView ? "h-screen w-full absolute inset-0 z-50" : "h-[calc(100vh-73px)] rounded-b-xl -mx-8 -my-6"}`}
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
        {chatMode === "ai" ? (
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
            isDisabled={hasFailedOrUnsupportedSelected}
            alertComponent={documentAlertBoard}
            rightElement={
              <div className="flex bg-slate-100 p-0.5 rounded-full select-none shrink-0 border border-slate-200/50">
                <button
                  onClick={() => setChatMode("ai")}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer border-none ${
                    chatMode === "ai"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  AI Assistant
                </button>
                <button
                  onClick={() => setChatMode("group")}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer border-none ${
                    chatMode === "group"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  Group Chat
                </button>
              </div>
            }
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
        ) : (
          <WorkspaceGroupChat
            projectId={project.id}
            title={project.name}
            subtitle="Phòng thảo luận Workspace"
            messages={groupMessages}
            isChatConnected={isGroupChatConnected}
            currentUser={currentUser}
            onSendMessage={handleSendGroupMessage}
            onToggleReaction={handleToggleGroupReaction}
            rightElement={
              <div className="flex bg-slate-100 p-0.5 rounded-full select-none shrink-0 border border-slate-200/50">
                <button
                  onClick={() => setChatMode("ai")}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer border-none ${
                    chatMode === "ai"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  AI Assistant
                </button>
                <button
                  onClick={() => setChatMode("group")}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer border-none ${
                    chatMode === "group"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  Group Chat
                </button>
              </div>
            }
          />
        )}
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl bg-white border border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                <Trash2 className="w-5 h-5" />
              </span>
              Xác nhận gỡ bỏ
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-2">
              Bạn có chắc chắn muốn gỡ bỏ tài liệu "{confirmTarget?.name}" khỏi workspace này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              disabled={isConfirming}
              onClick={() => setConfirmDialogOpen(false)}
              className="rounded-xl border-slate-200 font-semibold cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              disabled={isConfirming}
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer border-none"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gỡ...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
