import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Plus,
  FileText,
  Search,
  Sparkles,
  MessageSquare,
  Trash2,
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
import ChatInterface from "@/components/chat/ChatInterface"; // <-- Added Import
import AISidebar from "@/components/ai-sidebar/sidebar/AISidebar"; // <-- Added Import
import AiUsageBadge from "@/components/ai-usage/AiUsageBadge";
import useAiUsage from "@/hooks/useAiUsage";
import { isAiQuotaExceeded } from "@/api/aiUsageApi";
import useDocumentQuota from "@/hooks/useDocumentQuota";
import { isDocumentQuotaExceeded } from "@/api/documentQuotaApi";
import QuotaExceededDialog from "@/components/quota/QuotaExceededDialog";

export default function AskAIPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const { documents, refreshDocuments } = useDocuments();
  const {
    subscriptionTier,
    remainingUsage,
    loading: aiUsageLoading,
    refreshAiUsage,
  } = useAiUsage();
  const { refreshDocumentQuota } = useDocumentQuota();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [quotaDialog, setQuotaDialog] = useState({
    open: false,
    type: "AI",
    message: "",
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
            setSelectedDoc(doc);
          } else {
            setSelectedDoc({
              id: conv.documentId,
              title: "Linked Document",
              name: "Linked Document",
            });
          }
        } else {
          setSelectedDoc(null);
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

  const handleCreateNewChat = async (doc = null) => {
    try {
      const payload = {
        title: doc ? `Chat: ${doc.title || doc.name}` : "New Chat",
        documentId: doc ? doc.id : null,
      };

      const newConv = await createAiConversation(payload);

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
      setMessages([]);

      if (doc) {
        setSelectedDoc(doc);
      } else {
        setSelectedDoc(null);
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
        setSelectedDoc(null);
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

    const selectedDocument = selectedDoc;
    const selectedDocumentId = selectedDocument?.id ?? null;

    if (selectedDocument?.aiParseStatus === "PENDING") {
      toast.error(
        "This document is still being prepared for AI. Please try again shortly.",
      );
      return;
    }
    if (["FAILED", "UNSUPPORTED"].includes(selectedDocument?.aiParseStatus)) {
      toast.error("This document is not available for AI context.");
      return;
    }

    setIsLoading(true);

    let currentConv = activeConversation;

    // Create session on the fly if none is active
    if (!currentConv) {
      try {
        const payload = {
          title: selectedDocument
            ? `Chat: ${selectedDocument.title || selectedDocument.name}`
            : "New Chat",
          documentId: selectedDocumentId,
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
        documentId: selectedDocumentId,
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
    if (selectedDoc?.id === doc.id) {
      userSelectedDocumentRef.current = false;
      setSelectedDoc(null);
      toast.success("Cleared document focus");
    } else {
      userSelectedDocumentRef.current = true;
      setSelectedDoc(doc);
      toast.success(`Focused on: ${doc.title || doc.name}`);

      // If we have an active chat, let's bind it
      if (activeConversation && activeConversation.documentId !== doc.id) {
        setActiveConversation((prev) =>
          prev && prev.id === activeConversation.id
            ? { ...prev, documentId: doc.id }
            : prev,
        );
      }
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const title = (doc.title || doc.name || "").toLowerCase();
    const query = searchDocQuery.toLowerCase();
    return title.includes(query);
  });

  return (
    <div className="h-[calc(100vh-68px)] flex overflow-hidden bg-[#fafafa] rounded-xl -mx-8 -my-6">
      {/* SIDEBAR */}
      <AISidebar
        type="ask-ai"
        histories={conversations}
        documents={filteredDocuments}
        selectedItem={activeConversation}
        selectedDoc={selectedDoc}
        onSelectItem={handleSelectConversation}
        onDeleteItem={handleDeleteConversation}
        onSelectDocument={handleSelectDocument}
        onCreate={handleCreateNewChat}
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
          selectedDoc
            ? `Using Document Context: ${selectedDoc.title || selectedDoc.name}`
            : "General AI Assistant mode (Select a document to ask about it)"
        }
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        isSending={isLoading}
        onSendMessage={handleSend}
        showUploadButton={true}
        isUploading={isUploading}
        onUploadClick={() => fileInputRef.current?.click()}
        emptyStateComponent={
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-[#f26522]/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-[#f26522]" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              StudyMate AI Workspace
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Upload or select a course document from the sidebar to ask
              questions with full document context, or start typing below for a
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
          selectedDoc && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-md text-[10px] text-slate-600 font-semibold w-fit">
                <FileText className="w-3.5 h-3.5 text-[#f26522]" />
                Focused on document content.
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-red-500 hover:text-red-700 font-bold ml-1 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )
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
              Xác nhận xóa
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-2">
              Bạn có chắc chắn muốn xóa phiên trò chuyện "{confirmTarget?.name}"? Hành động này không thể hoàn tác.
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
              onClick={handleConfirmDeleteConversation}
              className="bg-red-50 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer border-none"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
