import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Loader2,
  Plus,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AskAIPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! Upload a document or ask me anything about your study materials.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [documents] = useState([
    {
      id: 1,
      name: "Software Architecture.pdf",
    },
    {
      id: 2,
      name: "Database Design Notes.docx",
    },
    {
      id: 3,
      name: "Java Servlet Guide.pdf",
    },
  ]);

  const [selectedDoc, setSelectedDoc] = useState(null);

  const fileInputRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "This is a sample AI response based on your selected document.",
        },
      ]);

      setIsLoading(false);
    }, 1500);
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    toast.success(`Uploaded ${file.name}`);
  };

  return (
    <div className="h-[calc(102vh-80px)] flex overflow-hidden bg-[#fafafa] rounded-xl -mx-8 -my-6">
      {/* SIDEBAR */}
      <div className="w-[300px] border-r border-slate-200 bg-white flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 ">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#f26522]/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#f26522]" />
            </div>

            <div className="leading-tight">
              <h2 className="font-semibold text-slate-800">
                AI Workspace
              </h2>

              <p className="text-xs text-slate-500">
                Ask AI with your documents
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400" />

            <input
              type="text"
              placeholder="Search documents..."
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
        </div>

        {/* Docs */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="text-xs font-semibold text-slate-400 px-2 mb-3 uppercase tracking-wide">
            Your Documents
          </p>

          <div className="space-y-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all border text-left ${
                  selectedDoc?.id === doc.id
                    ? "bg-[#f26522]/10 border-[#f26522]/20"
                    : "bg-white border-transparent hover:bg-slate-50"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#f26522]" />
                </div>

                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {doc.name}
                  </p>

                  <p className="text-xs text-slate-400">
                    Uploaded recently
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative">
        {/* HEADER */}
        <div className="h-[73px] px-5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-slate-800">
              Ask AI
            </h1>

            <p className="text-sm text-slate-500">
              {selectedDoc
                ? `Using: ${selectedDoc.name}`
                : "No document selected"}
            </p>
          </div>
        </div>

        {/* CHAT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-3xl ${
                    msg.role === "user"
                      ? "bg-[#f26522] text-white rounded-br-md"
                      : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1 text-[#f26522] text-sm font-semibold">
                      <Bot className="w-5 h-5" />
                      AI Assistant
                    </div>
                  )}

                  <div className="whitespace-pre-wrap leading-relaxed text-[14px]">
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
                <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-md px-4 py-3 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[#f26522]" />

                  <span className="text-sm text-slate-500">
                    AI is thinking...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* INPUT */}
        <div className="p-5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 p-2 rounded-full border border-slate-200 bg-[#fafafa] focus-within:border-[#f26522] transition-all mb-2">
              {/* Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-5 h-5 text-slate-600" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
              />

              {/* Input */}
              <input
                type="text"
                placeholder="Ask anything about your document..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSend()
                }
                className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400"
              />

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-[#f26522] hover:bg-[#e45a1b] disabled:opacity-50 flex items-center justify-center text-white transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}