import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  Plus,
  FileText,
  Search,
  Sparkles,
  MessageSquare,
  Trash2,
  AlertCircle,
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
import axiosClient from "@/api/axiosClient";
import {
  askAi,
  createAiConversation,
  deleteAiConversation,
  getAiConversationMessages,
  getAiConversations,
} from "@/api/aiApi";
import useDocuments from "@/hooks/useDocuments";
import ChatInterface from "@/components/chat/ChatInterface";
import AISidebar from "@/components/ai-sidebar/sidebar/AISidebar";
import AiUsageBadge from "@/components/ai-usage/AiUsageBadge";
import useAiUsage from "@/hooks/useAiUsage";
import { isAiQuotaExceeded } from "@/api/aiUsageApi";
import useDocumentQuota from "@/hooks/useDocumentQuota";
import { isDocumentQuotaExceeded } from "@/api/documentQuotaApi";
import QuotaExceededDialog from "@/components/quota/QuotaExceededDialog";
import DocumentPreviewModal from "@/components/documents/DocumentPreviewModal";

const LOCAL_STORAGE_KEY = "swp391_ask_ai_last_state";

export default function AskAIPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const { documents, refreshDocuments } = useDocuments();
  const {
    subscriptionTier,
    remainingUsage,
    maxSelectedDocs = 2,
    loading: aiUsageLoading,
    refreshAiUsage,
  } = useAiUsage();
  const { refreshDocumentQuota } = useDocumentQuota();
  const [selectedDocs, setSelectedDocs] = useState([]);
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

  // Custom Confirmation Dialog State
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, name }
  const [isConfirming, setIsConfirming] = useState(false);

  const documentsRef = useRef([]);
  const userSelectedDocumentRef = useRef(false);

  // Removed local 'input' state and 'messagesEndRef' as ChatInterface handles them now
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchDocQuery, setSearchDocQuery] = useState("");

  const fileInputRef = useRef(null);

  const handleSelectConversation = useCallback(
    async (conv, currentDocs = documentsRef.current) => {
      setActiveConversation(conv);
      setIsLoadingMessages(true);
      try {
        const savedMessages = await getAiConversationMessages(conv.id);
        setMessages(savedMessages || []);

        // Try to restore associated document
        if (conv.documentId) {
          const doc = currentDocs.find((d) => d.id === conv.documentId);
          if (doc) {
            setSelectedDocs([doc]);
          } else {
            setSelectedDocs([]);
          }
        } else {
          setSelectedDocs([]);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load message history");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [],
  );

  const fetchConversations = useCallback(async () => {
    try {
      const chats = (await getAiConversations()) || [];
      setConversations(chats);

      // Auto-select first chat if present
      if (chats.length > 0 && !userSelectedDocumentRef.current) {
        await handleSelectConversation(chats[0], documentsRef.current);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load chat history");
    }
  }, [handleSelectConversation]);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  // Fetch initial data
  useEffect(() => {
    Promise.resolve().then(() => {
      refreshDocuments();
      fetchConversations();
    });
  }, [fetchConversations, refreshDocuments]);

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

  const restoredRef = useRef(false);

  // Sync state to URL params and LocalStorage
  useEffect(() => {
    const docIdsParam = selectedDocs.map((d) => d.id).join(",");
    const chatParam = activeConversation?.id || "";

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
  }, [selectedDocs, activeConversation, setSearchParams]);

  // Restore state on initial mount (URL params > LocalStorage fallback)
  useEffect(() => {
    if (restoredRef.current) return;
    if (documents.length === 0 && conversations.length === 0) return;

    restoredRef.current = true;

    const urlDocsParam = searchParams.get("docs");
    const urlChatParam = searchParams.get("chat");

    let docIdsToRestore = [];
    let chatIdToRestore = null;

    if (urlDocsParam || urlChatParam) {
      if (urlDocsParam) {
        docIdsToRestore = urlDocsParam.split(",").filter(Boolean);
      }
      if (urlChatParam) {
        chatIdToRestore = urlChatParam;
      }
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
        setSelectedDocs(matchedDocs.slice(0, maxSelectedDocs));
        userSelectedDocumentRef.current = true;
      }
    }

    if (chatIdToRestore) {
      const matchedConv = conversations.find((c) => c.id === chatIdToRestore);
      if (matchedConv) {
        handleSelectConversation(matchedConv, documents);
      }
    }
  }, [documents, conversations, searchParams, handleSelectConversation]);

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
      const isRealDoc = Boolean(doc && doc.id);
      const targetDoc = isRealDoc ? doc : null;

      const docTitle = targetDoc ? (targetDoc.title || targetDoc.name || "Document") : null;
      const payload = {
        title: targetDoc ? `Chat: ${docTitle}` : "New Chat",
        documentId: targetDoc ? targetDoc.id : null,
      };

      const newConv = await createAiConversation(payload);

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
      setMessages([]);

      const initialDocs = targetDoc ? [targetDoc] : [];
      setSelectedDocs(initialDocs);

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

  // Refactored to accept userMessageContent from the ChatInterface component
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

    const selectedDocIds = selectedDocs
      .filter((d) => d && d.id)
      .map((d) => d.id);

    // Create session on the fly if none is active
    if (!currentConv) {
      try {
        const firstDocTitle = selectedDocs[0]
          ? selectedDocs[0].title || selectedDocs[0].name || "Document"
          : "";
        const payload = {
          title: selectedDocs.length > 0
            ? `Chat: ${firstDocTitle}${selectedDocs.length > 1 ? ` (+${selectedDocs.length - 1})` : ""}`
            : "New Chat",
          documentId: selectedDocIds[0] || null,
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

    // Append local user message immediately
    const userMessage = {
      id: Date.now(),
      role: "USER",
      content: userMessageContent,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await askAi({
        conversationId: currentConv.id,
        message: userMessageContent,
        documentIds: selectedDocIds,
        documentId: selectedDocIds[0] || null,
      });
      await refreshAiUsage();

      // Response has assistantMessageId and answer
      const aiMessage = {
        id: response.assistantMessageId || Date.now() + 1,
        role: "ASSISTANT",
        content: response.answer,
        sources: response.sources || [],
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Reload conversations list to update title if updated
      const updatedConversations = (await getAiConversations()) || [];
      setConversations(updatedConversations);

      const refreshedConv = updatedConversations.find(
        (c) => c.id === currentConv.id,
      );
      if (refreshedConv) {
        setActiveConversation(refreshedConv);
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
      } else if (
        error.response?.data?.code === "DOCUMENT_SELECTION_LIMIT_EXCEEDED" ||
        error.response?.data?.message?.includes("tài liệu")
      ) {
        toast.error(
          error.response?.data?.message ||
            `Gói của bạn chỉ được chọn tối đa ${maxSelectedDocs} tài liệu cùng lúc trong phiên bản Demo.`
        );
      } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        toast.error("Phản hồi AI bị quá giờ (timeout). Vui lòng thử lại!");
      } else {
        toast.error("AI failed to respond. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading(`Uploading & parsing ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("visibility", "PUBLIC");

      const response = await axiosClient.post(
        "/api/documents/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success(`Uploaded ${file.name} successfully!`, { id: toastId });
      await refreshDocumentQuota();

      // Reload documents and auto start chat with this document
      try {
        await refreshDocuments();
      } catch {
        // ignore
      }

      const newUploadedDoc = response.data;
      if (newUploadedDoc) {
        handleCreateNewChat(newUploadedDoc);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      if (isDocumentQuotaExceeded(error)) {
        toast.dismiss(toastId);
        const message = error.response?.data?.message;
        setQuotaDialog({
          open: true,
          type: message?.toLowerCase().includes("file size")
            ? "FILE_SIZE"
            : "DOCUMENT",
          message,
        });
        await refreshDocumentQuota();
        return;
      }
      toast.error("Failed to upload document", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSelectDocument = (doc) => {
    userSelectedDocumentRef.current = true;
    setSelectedDocs((prev) => {
      const isSelected = prev.some((d) => d.id === doc.id);
      if (isSelected) {
        return prev.filter((d) => d.id !== doc.id);
      } else {
        if (prev.length >= maxSelectedDocs) {
          toast.error(
            `Gói của bạn chỉ được chọn tối đa ${maxSelectedDocs} tài liệu cùng lúc trong phiên bản Demo.`
          );
          return prev;
        }
        return [...prev, doc];
      }
    });
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

  return (
    <div className="h-[calc(100vh-73px)] flex overflow-hidden bg-[#fafafa] rounded-b-xl -mx-8 -my-6">
      {/* SIDEBAR */}
      <AISidebar
        type="ask-ai"
        histories={conversations}
        documents={filteredDocuments}
        selectedItem={activeConversation}
        selectedDoc={selectedDocs[0] || null}
        selectedDocs={selectedDocs}
        onSelectItem={handleSelectConversation}
        onDeleteItem={handleDeleteConversation}
        onSelectDocument={handleSelectDocument}
        onCreate={() => handleCreateNewChat(null)}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        fileInputRef={fileInputRef}
        handleUpload={handleUpload}
        isUploading={isUploading}
      />

      {/* CHAT AREA REPLACED WITH REUSABLE COMPONENT */}
      <ChatInterface
        title={
          activeConversation ? activeConversation.title : "Ask StudyMate AI"
        }
        subtitle={
          selectedDocs.length > 0
            ? `Using Multi-Document Context (${selectedDocs.length}/${maxSelectedDocs} documents)`
            : `General AI Assistant mode (Select up to ${maxSelectedDocs} documents to ask about them)`
        }
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        isSending={isLoading}
        onSendMessage={handleSend}
        showUploadButton={true}
        isUploading={isUploading}
        onUploadClick={() => fileInputRef.current?.click()}
        isDisabled={isDocUnsupportedOrFailed}
        alertComponent={documentAlertBoard}
        emptyStateComponent={
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-[#f26522]/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-[#f26522]" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              MinDocu AI Workspace
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Upload or select up to {maxSelectedDocs} course documents from the sidebar to ask
              questions with notebook-style citations, or start typing below for a
              general chat.
            </p>
          </div>
        }
        rightElement={
          <AiUsageBadge
            subscriptionTier={subscriptionTier}
            remainingUsage={remainingUsage}
            loading={aiUsageLoading}
          />
        }
        contextBadgeComponent={
          selectedDocs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-md text-[10px] text-slate-600 font-semibold w-fit">
                <FileText className="w-3.5 h-3.5 text-[#f26522]" />
                <span>
                  Focused on <strong className="text-[#f26522]">{selectedDocs.length} / {maxSelectedDocs}</strong> documents
                </span>
                <button
                  onClick={() => setSelectedDocs([])}
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
        fileSize={quotaDialog.fileSize}
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
