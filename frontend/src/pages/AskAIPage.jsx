import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
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

export default function AskAIPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchDocQuery, setSearchDocQuery] = useState("");

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    fetchDocuments();
    fetchConversations();
  }, []);

  // Scroll to bottom on new messages or loading state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const fetchDocuments = async () => {
    try {
      const response = await axiosClient.get("/api/documents/my-uploads");
      setDocuments(response.data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axiosClient.get("/api/ai/conversations");
      const chats = response.data || [];
      setConversations(chats);
      
      // Auto-select first chat if present
      if (chats.length > 0 && !activeConversation) {
        handleSelectConversation(chats[0], chats);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load chat history");
    }
  };

  const handleSelectConversation = async (conv, currentDocs = documents) => {
    setActiveConversation(conv);
    setIsLoadingMessages(true);
    try {
      const response = await axiosClient.get(`/api/ai/conversations/${conv.id}/messages`);
      setMessages(response.data || []);
      
      // Try to restore associated document
      if (conv.documentId) {
        const doc = currentDocs.find((d) => d.id === conv.documentId);
        if (doc) {
          setSelectedDoc(doc);
        } else {
          setSelectedDoc({ id: conv.documentId, title: "Linked Document", name: "Linked Document" });
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
  };

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
    if (!window.confirm("Are you sure you want to delete this chat session?")) return;
    
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageContent = input.trim();
    setInput("");
    setIsLoading(true);

    let currentConv = activeConversation;

    // Create session on the fly if none is active
    if (!currentConv) {
      try {
        const payload = {
          title: selectedDoc ? `Chat: ${selectedDoc.title || selectedDoc.name}` : "New Chat",
          documentId: selectedDoc ? selectedDoc.id : null,
        };
        const response = await axiosClient.post("/api/ai/conversations", payload);
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
        id: response.data.assistantMessageId || (Date.now() + 1),
        role: "ASSISTANT",
        content: response.data.answer,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Reload conversations list to update title if updated
      const convListRes = await axiosClient.get("/api/ai/conversations");
      const updatedConversations = convListRes.data || [];
      setConversations(updatedConversations);

      const refreshedConv = updatedConversations.find((c) => c.id === currentConv.id);
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

      const response = await axiosClient.post("/api/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(`Uploaded ${file.name} successfully!`, { id: toastId });
      
      // Reload documents and auto start chat with this document
      const docRes = await axiosClient.get("/api/documents/my-uploads");
      const updatedDocs = docRes.data || [];
      setDocuments(updatedDocs);
      
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
        activeConversation.documentId = doc.id;
        // Optionally save to backend or keep in state
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
      <div className="w-[280px] border-r border-slate-200 bg-white flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#f26522]/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#f26522]" />
            </div>

            <div className="leading-tight">
              <h2 className="font-semibold text-slate-800">AI Workspace</h2>
              <p className="text-xs text-slate-500">Ask AI with your documents</p>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => handleCreateNewChat()}
          className="mx-3 mt-3 mb-1 flex items-center justify-center gap-1 py-2 px-4 rounded-xl border border-dashed border-[#f26522]/40 text-[#f26522] hover:bg-[#f26522]/5 hover:border-[#f26522] transition-all text-sm font-semibold cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        {/* CHAT HISTORY SECTION */}
        <div className="flex-[3] flex flex-col min-h-0 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 px-5 mb-2 mt-2 uppercase tracking-wider">
            Chat History
          </p>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No recent chats</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`group w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                    activeConversation?.id === conv.id
                      ? "bg-[#f26522]/10 text-[#f26522]"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                    <MessageSquare className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-[#f26522]" />
                    <span className="text-xs font-semibold truncate">{conv.title}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DOCUMENTS SECTION */}
        <div className="flex-[2] flex flex-col min-h-0 bg-slate-50/50">
          <div className="px-5 py-2.5 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Your Documents
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {/* Search Documents */}
          <div className="px-3 pb-2 shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                className="bg-transparent outline-none text-xs flex-1 text-slate-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
            {isUploading && (
              <div className="flex items-center gap-2 p-2 justify-center text-xs text-[#f26522]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing document...
              </div>
            )}

            {filteredDocuments.length === 0 && !isUploading ? (
              <p className="text-xs text-slate-400 text-center py-6">No documents found</p>
            ) : (
              filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all border text-left cursor-pointer ${
                    selectedDoc?.id === doc.id
                      ? "bg-[#f26522]/10 border-[#f26522]/20"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                    <FileText className="w-4 h-4 text-[#f26522]" />
                  </div>

                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {doc.title || doc.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {doc.courseCode ? doc.courseCode : "General Study"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-slate-50">
        {/* HEADER */}
        <div className="h-[73px] px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-[16px] font-bold text-slate-800">
              {activeConversation ? activeConversation.title : "Ask StudyMate AI"}
            </h1>

            <p className="text-xs text-slate-400">
              {selectedDoc
                ? `Using Document Context: ${selectedDoc.title || selectedDoc.name}`
                : "General AI Assistant mode (Select a document to ask about it)"}
            </p>
          </div>
        </div>

        {/* CHAT BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoadingMessages ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#f26522]" />
              <span className="text-xs font-semibold">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-[#f26522]/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-[#f26522]" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">StudyMate AI Workspace</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Upload or select a course document from the sidebar to ask questions with full document context, or start typing below for a general chat.
              </p>
              {selectedDoc && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-50 border border-orange-100 text-slate-700 text-xs font-semibold">
                  <FileText className="w-4 h-4 text-[#f26522]" />
                  Active Document Context: <span className="text-[#f26522]">{selectedDoc.title || selectedDoc.name}</span>
                </div>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    msg.role === "USER" || msg.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.role === "USER" || msg.role === "user"
                        ? "bg-[#f26522] text-white rounded-br-sm shadow-sm"
                        : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {(msg.role === "ASSISTANT" || msg.role === "assistant") && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[#f26522] text-xs font-bold">
                        <Bot className="w-4 h-4" />
                        StudyMate AI
                      </div>
                    )}

                    <div className="whitespace-pre-wrap leading-relaxed text-[13px] font-medium">
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-[#f26522]" />
                    <span className="text-xs text-slate-500 font-semibold">
                      StudyMate AI is analyzing...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT CONTAINER */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-[#f26522] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#f26522]/10 transition-all">
              {/* Context Attachment Status Icon */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Upload document"
                className="w-9 h-9 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-5 h-5 text-slate-500" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                placeholder={
                  selectedDoc
                    ? `Ask anything about "${selectedDoc.title || selectedDoc.name}"...`
                    : "Ask anything about your study materials..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                disabled={isLoading}
                className="flex-1 bg-transparent outline-none text-slate-700 text-sm placeholder-slate-400 px-2"
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-lg bg-[#f26522] hover:bg-[#e45a1b] disabled:opacity-40 disabled:hover:bg-[#f26522] flex items-center justify-center text-white transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {selectedDoc && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}