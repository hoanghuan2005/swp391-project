import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  Sparkles,
  FileText,
  Trash2,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
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
  askAi,
  askSharedAi,
  createAiConversation,
  deleteAiConversation,
  getAiConversationMessages,
  getAiConversations,
} from "@/api/aiApi";
import ChatInterface from "@/components/chat/ChatInterface";
import AISidebar from "@/components/ai-sidebar/sidebar/AISidebar";
import useAiUsage from "@/hooks/useAiUsage";
import { isAiQuotaExceeded } from "@/api/aiUsageApi";
import QuotaExceededDialog from "@/components/quota/QuotaExceededDialog";
import DocumentPreviewModal from "@/components/documents/DocumentPreviewModal";

export default function UnifiedAIChat({
  mode = "PERSONAL", // "PERSONAL" | "WORKSPACE"
  workspaceId = null,
  shareToken = null,
  documents = [],
  onRefreshDocuments = null,
  onDeleteDocument = null,
  showUploadButton = false,
  fileInputRef = null,
  handleUpload = null,
  isUploading = false,
  rightElement = null,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchDocQuery, setSearchDocQuery] = useState("");

  const [quotaDialog, setQuotaDialog] = useState({
    open: false,
    type: "AI",
    message: "",
  });
  const [previewModalState, setPreviewModalState] = useState({
    open: false,
    documentId: null,
    title: "",
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const { refreshAiUsage } = useAiUsage();
  const documentsRef = useRef([]);
  const userSelectedDocumentRef = useRef(false);
  const restoredRef = useRef(false);

  const isSharedView = Boolean(shareToken);
  const isWorkspace = mode === "WORKSPACE";

  const LOCAL_STORAGE_KEY = isWorkspace
    ? `swp391_workspace_ai_state_${workspaceId || shareToken || "default"}`
    : "swp391_ask_ai_last_state";

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  // Handle switching conversation: ALWAYS clear selectedDocs first to avoid state leaks
  const handleSelectConversation = useCallback(
    async (conv, currentDocs = documentsRef.current) => {
      setActiveConversation(conv);
      setIsLoadingMessages(true);

      // Reset selectedDocs on conversation switch
      setSelectedDocs([]);

      try {
        if (conv && conv.id !== "main") {
          const savedMessages = await getAiConversationMessages(conv.id);
          setMessages(savedMessages || []);

          // In Personal mode, restore doc if conversation is bound to a documentId
          if (!isWorkspace && conv.documentId) {
            const doc = currentDocs.find((d) => d.id === conv.documentId);
            if (doc) {
              setSelectedDocs([doc]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching conversation messages:", error);
        toast.error("Failed to load message history");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [isWorkspace],
  );

  const fetchConversations = useCallback(async () => {
    try {
      if (isSharedView) {
        const mainChat = { id: "main", title: "Project Workspace" };
        setConversations([mainChat]);
        setActiveConversation(mainChat);
        setMessages([]);
        return;
      }

      const params = isWorkspace && workspaceId ? { projectId: workspaceId } : {};
      const chats = (await getAiConversations(params)) || [];
      setConversations(chats);

      if (chats.length > 0 && !userSelectedDocumentRef.current && !activeConversation) {
        await handleSelectConversation(chats[0], documentsRef.current);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load chat history");
    }
  }, [isSharedView, isWorkspace, workspaceId, handleSelectConversation, activeConversation]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Prevent parent container overflow
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

  // Sync selectedDocs and activeConversation to URL & LocalStorage
  useEffect(() => {
    const docIdsParam = selectedDocs.map((d) => d.id).join(",");
    const chatParam = activeConversation?.id && activeConversation.id !== "main" ? activeConversation.id : "";

    const newParams = {};
    if (docIdsParam) newParams.docs = docIdsParam;
    if (chatParam) newParams.chat = chatParam;

    setSearchParams(newParams, { replace: true });

    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          docIds: selectedDocs.map((d) => d.id),
          chatId: activeConversation?.id || null,
        }),
      );
    } catch (e) {
      console.warn("Failed to write to localStorage:", e);
    }
  }, [selectedDocs, activeConversation, setSearchParams, LOCAL_STORAGE_KEY]);

  // Restore state on mount
  useEffect(() => {
    if (restoredRef.current) return;
    if (documents.length === 0 && conversations.length === 0) return;

    restoredRef.current = true;

    const urlDocsParam = searchParams.get("docs");
    const urlChatParam = searchParams.get("chat");

    let docIdsToRestore = [];
    let chatIdToRestore = null;

    if (urlDocsParam || urlChatParam) {
      if (urlDocsParam) docIdsToRestore = urlDocsParam.split(",").filter(Boolean);
      if (urlChatParam) chatIdToRestore = urlChatParam;
    } else {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.docIds)) docIdsToRestore = parsed.docIds;
          if (parsed.chatId) chatIdToRestore = parsed.chatId;
        }
      } catch (e) {
        console.warn("Failed to read localStorage state:", e);
      }
    }

    if (docIdsToRestore.length > 0) {
      const matchedDocs = documents.filter((d) => docIdsToRestore.includes(d.id));
      if (matchedDocs.length > 0) {
        setSelectedDocs(matchedDocs.slice(0, 5));
        userSelectedDocumentRef.current = true;
      }
    }

    if (chatIdToRestore && conversations.length > 0) {
      const matchedConv = conversations.find((c) => c.id === chatIdToRestore);
      if (matchedConv) {
        handleSelectConversation(matchedConv, documents);
      }
    }
  }, [documents, conversations, searchParams, handleSelectConversation, LOCAL_STORAGE_KEY]);

  const handlePreviewDocument = (documentId, title) => {
    setPreviewModalState({
      open: true,
      documentId,
      title: title || "Document Preview",
    });
  };

  const handleCreateNewChat = async (doc = null) => {
    try {
      userSelectedDocumentRef.current = true;
      const targetDoc = doc && doc.id ? doc : null;
      const docTitle = targetDoc ? targetDoc.title || targetDoc.name || "Document" : null;

      const payload = {
        title: targetDoc ? `Chat: ${docTitle}` : "New Chat",
        documentId: targetDoc ? targetDoc.id : null,
        projectId: isWorkspace && workspaceId ? workspaceId : null,
      };

      if (isSharedView) {
        setActiveConversation({ id: "main", title: "Project Workspace" });
        setMessages([]);
        setSelectedDocs([]);
        return;
      }

      const newConv = await createAiConversation(payload);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
      setMessages([]);
      setSelectedDocs(targetDoc ? [targetDoc] : []);

      const newParams = { chat: newConv.id };
      if (targetDoc?.id) newParams.docs = targetDoc.id;
      setSearchParams(newParams, { replace: true });

      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            docIds: targetDoc?.id ? [targetDoc.id] : [],
            chatId: newConv.id,
          }),
        );
      } catch (e) {
        console.warn("Failed to write to localStorage:", e);
      }

      toast.success("Created new chat session");
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleDeleteConversation = (e, convId) => {
    e.stopPropagation();
    const conv = conversations.find((c) => c.id === convId);
    setConfirmTarget({
      id: convId,
      name: conv?.title || "phiên trò chuyện",
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirmDeleteConversation = async () => {
    if (!confirmTarget) return;
    setIsConfirming(true);
    try {
      await deleteAiConversation(confirmTarget.id);
      setConversations((prev) => prev.filter((c) => c.id !== confirmTarget.id));

      if (activeConversation?.id === confirmTarget.id) {
        setActiveConversation(null);
        setMessages([]);
        setSelectedDocs([]);
      }

      toast.success("Chat deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete chat");
    } finally {
      setIsConfirming(false);
      setConfirmDialogOpen(false);
      setConfirmTarget(null);
    }
  };

  const handleSend = async (userMessageContent) => {
    if (!userMessageContent || isLoading) return;

    const pendingDoc = selectedDocs.find((d) => d.aiParseStatus === "PENDING");
    if (pendingDoc) {
      const docTitle = pendingDoc.title || pendingDoc.name || "Document";
      toast.error(
        `"${docTitle}" is still being prepared for AI. Please try again shortly.`,
      );
      return;
    }
    const failedDoc = selectedDocs.find((d) =>
      ["FAILED", "UNSUPPORTED"].includes(d.aiParseStatus),
    );
    if (failedDoc) {
      const docTitle = failedDoc.title || failedDoc.name || "Document";
      toast.error(`"${docTitle}" is not available for AI context.`);
      return;
    }

    setIsLoading(true);

    let currentConv = activeConversation;
    const selectedDocIds = selectedDocs.filter((d) => d && d.id).map((d) => d.id);

    // Create conversation on the fly if none active (non-shared view)
    if (!currentConv && !isSharedView) {
      try {
        const firstDocTitle = selectedDocs[0]
          ? selectedDocs[0].title || selectedDocs[0].name || "Document"
          : "";
        const payload = {
          title: selectedDocs.length > 0
            ? `Chat: ${firstDocTitle}${selectedDocs.length > 1 ? ` (+${selectedDocs.length - 1})` : ""}`
            : "New Chat",
          documentId: selectedDocIds[0] || null,
          projectId: isWorkspace && workspaceId ? workspaceId : null,
        };
        currentConv = await createAiConversation(payload);
        setConversations((prev) => [currentConv, ...prev]);
        setActiveConversation(currentConv);
      } catch (error) {
        console.error("Failed to start chat session:", error);
        toast.error("Could not initialize chat session");
        setIsLoading(false);
        return;
      }
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: userMessageContent,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const payload = {
        conversationId: currentConv && currentConv.id !== "main" ? currentConv.id : null,
        message: userMessageContent,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : null,
        documentId: selectedDocIds[0] || null,
        projectId: isWorkspace && workspaceId ? workspaceId : null,
        shareToken: shareToken || null,
      };

      const response = shareToken
        ? await askSharedAi(payload)
        : await askAi(payload);

      await refreshAiUsage();

      const aiMessage = {
        id: response.assistantMessageId || Date.now() + 1,
        role: "assistant",
        content: response.answer,
        sources: response.sources || [],
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Reload conversations list to update auto-named title if changed
      if (!isSharedView) {
        const params = isWorkspace && workspaceId ? { projectId: workspaceId } : {};
        const updatedConversations = (await getAiConversations(params)) || [];
        setConversations(updatedConversations);

        if (currentConv) {
          const refreshedConv = updatedConversations.find(
            (c) => c.id === currentConv.id,
          );
          if (refreshedConv) {
            setActiveConversation(refreshedConv);
          }
        }
      }
    } catch (error) {
      console.error("Error asking AI:", error);
      if (isAiQuotaExceeded(error)) {
        setQuotaDialog({
          open: true,
          type: "AI",
          message: error.response?.data?.message,
        });
        await refreshAiUsage();
      } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        toast.error("Phản hồi AI bị quá giờ (timeout). Vui lòng thử lại!");
      } else {
        toast.error("AI failed to respond. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDocument = (doc) => {
    userSelectedDocumentRef.current = true;
    setSelectedDocs((prev) => {
      const isSelected = prev.some((d) => d.id === doc.id);
      if (isSelected) {
        return prev.filter((d) => d.id !== doc.id);
      } else {
        if (prev.length >= 5) {
          toast.error(
            "Maximum 5 documents allowed.",
          );
          return prev;
        }
        return [...prev, doc];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedDocs([]);
  };

  const filteredDocuments = documents.filter((doc) => {
    const title = (doc.title || doc.name || "").toLowerCase();
    const query = searchDocQuery.toLowerCase();
    return title.includes(query);
  });

  const isDocUnsupportedOrFailed = selectedDocs.some((d) =>
    ["FAILED", "UNSUPPORTED"].includes(d.aiParseStatus),
  );

  const documentAlertBoard = isDocUnsupportedOrFailed ? (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 w-full">
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-bold text-sm">AI Q&A Warning</h4>
        <p className="text-xs text-red-700 mt-1">
          One or more selected documents failed to parse or are unsupported. Please deselect them.
        </p>
      </div>
    </div>
  ) : null;

  const sidebarType = isWorkspace ? "project-workspace" : "ask-ai";

  return (
    <div className="h-full w-full flex overflow-hidden bg-[#fafafa]">
      {/* SIDEBAR */}
      <AISidebar
        type={sidebarType}
        histories={conversations}
        documents={filteredDocuments}
        selectedItem={activeConversation}
        selectedDoc={selectedDocs[0] || null}
        selectedDocs={selectedDocs}
        onSelectItem={handleSelectConversation}
        onDeleteItem={handleDeleteConversation}
        onSelectDocument={handleSelectDocument}
        onDeleteDocument={onDeleteDocument}
        onCreate={() => handleCreateNewChat(null)}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        fileInputRef={fileInputRef}
        handleUpload={handleUpload}
        isUploading={isUploading}
      />

      {/* CHAT AREA */}
      <ChatInterface
        title={
          activeConversation
            ? activeConversation.title
            : isWorkspace
              ? "Project Workspace AI"
              : "Ask StudyMate AI"
        }
        subtitle={
          selectedDocs.length > 0
            ? `Focused on ${selectedDocs.length} document${selectedDocs.length > 1 ? "s" : ""} (${selectedDocs.length}/5)`
            : isWorkspace
              ? "Workspace General Knowledge mode (Select up to 5 documents to filter context)"
              : "General AI Assistant mode (Select up to 5 documents to ask about them)"
        }
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        isSending={isLoading}
        onSendMessage={handleSend}
        showUploadButton={showUploadButton}
        isUploading={isUploading}
        onUploadClick={() => fileInputRef?.current?.click()}
        isDisabled={isDocUnsupportedOrFailed}
        alertComponent={documentAlertBoard}
        emptyStateComponent={
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-[#f26522]/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-[#f26522]" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {isWorkspace ? "Project AI Assistant" : "MinDocu AI Workspace"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              {isWorkspace
                ? "Select specific project documents from the sidebar to query them with citations, or ask general questions directly using AI General Knowledge."
                : "Upload or select up to 5 course documents from the sidebar to ask questions with notebook-style citations, or start typing below for a general chat."}
            </p>
          </div>
        }
        rightElement={rightElement}
        contextBadgeComponent={
          selectedDocs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-md text-[10px] text-slate-600 font-semibold w-fit">
                <CheckSquare className="w-3.5 h-3.5 text-[#f26522]" />
                <span>
                  Focused on <strong className="text-[#f26522]">{selectedDocs.length} / 5</strong> documents
                </span>
                <button
                  onClick={handleClearSelection}
                  className="text-red-500 hover:text-red-700 font-bold ml-1 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          )
        }
        onPreviewDocument={handlePreviewDocument}
      />

      <DocumentPreviewModal
        documentId={previewModalState.documentId}
        open={previewModalState.open}
        onOpenChange={(open) =>
          setPreviewModalState((current) => ({ ...current, open }))
        }
      />

      <QuotaExceededDialog
        open={quotaDialog.open}
        onOpenChange={(open) =>
          setQuotaDialog((current) => ({ ...current, open }))
        }
        type={quotaDialog.type}
        message={quotaDialog.message}
      />

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl bg-white border border-slate-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                <Trash2 className="w-5 h-5" />
              </span>
              Confirm Delete
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete chat session "{confirmTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              disabled={isConfirming}
              onClick={() => setConfirmDialogOpen(false)}
              className="rounded-xl border-slate-200 font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={isConfirming}
              onClick={handleConfirmDeleteConversation}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer border-none"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
