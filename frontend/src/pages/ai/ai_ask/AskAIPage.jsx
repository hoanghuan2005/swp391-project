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
import { toast } from "react-hot-toast";
import axiosClient from "@/api/axiosClient";
import useDocuments from "@/hooks/useDocuments";
import ChatInterface from "@/components/chat/ChatInterface"; // <-- Added Import
import AISidebar from "@/components/ai-sidebar/sidebar/AISidebar"; // <-- Added Import

export default function AskAIPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const { documents, refreshDocuments } = useDocuments();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const documentsRef = useRef([]);

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
        const response = await axiosClient.get(
          `/api/ai/conversations/${conv.id}/messages`,
        );
        setMessages(response.data || []);

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
      const response = await axiosClient.get("/api/ai/conversations");
      const chats = response.data || [];
      setConversations(chats);

      // Auto-select first chat if present
      if (chats.length > 0) {
        await handleSelectConversation(chats[0], chats);
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

      const response = await axiosClient.post("/api/ai/conversations", payload);
      const newConv = response.data;

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

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat session?"))
      return;

    try {
      await axiosClient.delete(`/api/ai/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.id !== convId));

      if (activeConversation?.id === convId) {
        setActiveConversation(null);
        setMessages([]);
        setSelectedDoc(null);
      }

      toast.success("Chat deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete chat");
    }
  };

  // Refactored to accept userMessageContent from the ChatInterface component
  const handleSend = async (userMessageContent) => {
    if (!userMessageContent || isLoading) return;

    if (selectedDoc?.aiParseStatus === "PENDING") {
      toast.error(
        "This document is still being prepared for AI. Please try again shortly.",
      );
      return;
    }
    if (["FAILED", "UNSUPPORTED"].includes(selectedDoc?.aiParseStatus)) {
      toast.error("This document is not available for AI context.");
      return;
    }

    setIsLoading(true);

    let currentConv = activeConversation;

    // Create session on the fly if none is active
    if (!currentConv) {
      try {
        const payload = {
          title: selectedDoc
            ? `Chat: ${selectedDoc.title || selectedDoc.name}`
            : "New Chat",
          documentId: selectedDoc ? selectedDoc.id : null,
        };
        const response = await axiosClient.post(
          "/api/ai/conversations",
          payload,
        );
        currentConv = response.data;
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
      const response = await axiosClient.post("/api/ai/ask", {
        conversationId: currentConv.id,
        message: userMessageContent,
        documentId: selectedDoc ? selectedDoc.id : null,
      });

      // Response has assistantMessageId and answer
      const aiMessage = {
        id: response.data.assistantMessageId || Date.now() + 1,
        role: "ASSISTANT",
        content: response.data.answer,
        sources: response.data.sources || [],
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Reload conversations list to update title if updated
      const convListRes = await axiosClient.get("/api/ai/conversations");
      const updatedConversations = convListRes.data || [];
      setConversations(updatedConversations);

      const refreshedConv = updatedConversations.find(
        (c) => c.id === currentConv.id,
      );
      if (refreshedConv) {
        setActiveConversation(refreshedConv);
      }
    } catch (error) {
      console.error("Error asking AI:", error);
      toast.error("AI failed to respond. Please try again.");
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
      setSelectedDoc(null);
      toast.success("Cleared document focus");
    } else {
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
    <div className="h-[calc(102vh-80px)] flex overflow-hidden bg-[#fafafa] rounded-xl -mx-8 -my-6">
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
        contextBadgeComponent={
          selectedDoc && (
            <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-md text-[10px] text-slate-600 font-semibold w-fit">
              <FileText className="w-3.5 h-3.5 text-[#f26522]" />
              Focused on document content.
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-red-500 hover:text-red-700 font-bold ml-1 hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          )
        }
      />
    </div>
  );
}
