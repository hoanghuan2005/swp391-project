import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, Plus, Sparkles, FileText } from "lucide-react";

const MotionDiv = motion.div;

export default function ChatInterface({
  title,
  subtitle,
  messages = [],
  isLoadingMessages = false,
  isSending = false,
  onSendMessage,
  emptyStateComponent,
  showUploadButton = false,
  isUploading = false,
  onUploadClick,
  contextBadgeComponent
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col relative bg-slate-50 h-full">
      {/* HEADER */}
      <div className="h-[73px] px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#f26522]/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-[#f26522]" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-slate-800">{title}</h1>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoadingMessages ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#f26522]" />
            <span className="text-xs font-semibold">Loading messages...</span>
          </div>
        ) : messages.length === 0 && emptyStateComponent ? (
          emptyStateComponent
        ) : (
          <AnimatePresence>
            {messages.map((msg) => {
              const isUser = msg.role.toLowerCase() === "user";
              const sources = Array.isArray(msg.sources) ? msg.sources : [];
              const shouldShowSources = !isUser && sources.length > 0;

              return (
                <MotionDiv
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      isUser
                        ? "bg-[#f26522] text-white rounded-br-sm shadow-sm"
                        : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[#f26522] text-xs font-bold uppercase tracking-wider">
                        <Bot className="w-4 h-4" />
                        StudyMate AI
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed text-[13px] font-medium">
                      {msg.content}
                    </div>
                    {shouldShowSources ? (
                      <div className="mt-3 border-t border-slate-100 pt-2">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Sources
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sources.map((source) => (
                            <Link
                              key={source.documentId}
                              to={`/documents/${source.documentId}`}
                              className="inline-flex max-w-full items-center gap-1 rounded-lg border border-orange-100 bg-orange-50 px-2 py-1 text-[11px] font-semibold text-[#f26522] hover:border-[#f26522]/30 hover:bg-orange-100"
                            >
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {source.title || "Document"}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </MotionDiv>
              );
            })}

            {isSending && (
              <MotionDiv
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
              </MotionDiv>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT CONTAINER */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-[#f26522] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#f26522]/10 transition-all">
            
            {showUploadButton && (
              <button
                onClick={onUploadClick}
                disabled={isUploading}
                title="Upload document"
                className="w-9 h-9 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-5 h-5 text-slate-500" />
              </button>
            )}

            <input
              type="text"
              placeholder="Ask anything about your study materials..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isSending}
              className="flex-1 bg-transparent outline-none text-slate-700 text-sm placeholder-slate-400 px-2"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="w-9 h-9 rounded-lg bg-[#f26522] hover:bg-[#e45a1b] disabled:opacity-40 disabled:hover:bg-[#f26522] flex items-center justify-center text-white transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          {contextBadgeComponent}
        </div>
      </div>
    </div>
  );
}
