import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, Plus, Sparkles, FileText, Info, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import CitationModal from "@/components/citation/CitationModal";
import { sanitizeTitle } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MotionDiv = motion.div;

const preprocessCitations = (content) => {
  if (!content) return "";
  const citationRegex = /(?:\[|\()(?:\s*Source\s*|\s*doc\s*)?(\d+)(?:\]|\))/gi;
  return content.replace(citationRegex, '[$1](citation-$1)');
};

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
  contextBadgeComponent,
  rightElement,
  isDisabled = false,
  alertComponent = null,
  onPreviewDocument = null,
  onToggleSidebar = null,
  isSidebarCollapsed = false,
}) {
  const [input, setInput] = useState("");
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = () => {
    if (!input.trim() || isSending || isDisabled) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleCitationClick = (source) => {
    setSelectedCitation(source);
    setCitationModalOpen(true);
  };

  const cleanTitle = sanitizeTitle(title);

  return (
    <div className="flex-1 flex flex-col relative bg-slate-50 h-full min-w-0">
      {/* HEADER */}
      <div className="h-[79px] px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-10 gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onToggleSidebar && isSidebarCollapsed && (
            <button
              onClick={onToggleSidebar}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer border-none bg-transparent shadow-none"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-[#f26522]" />
            </button>
          )}
          <div className="p-2 bg-[#f26522]/10 rounded-lg shrink-0">
            <Sparkles className="w-5 h-5 text-[#f26522]" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[16px] font-bold text-slate-800 truncate">{cleanTitle}</h1>
            <p className="text-xs text-slate-400 truncate">{subtitle}</p>
          </div>
        </div>
        {rightElement && (
          <div className="shrink-0">
            {rightElement}
          </div>
        )}
      </div>

      {/* ALERT/WARNING BOARD */}
      {alertComponent && (
        <div className="px-6 py-3 border-b border-slate-200 bg-white shrink-0">
          {alertComponent}
        </div>
      )}

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
                        MinDocu AI
                      </div>
                    )}
                    <div className="ai-message-content whitespace-pre-wrap leading-relaxed text-[13px] font-medium prose prose-sm max-w-none dark:prose-invert">
                      {isUser
                        ? msg.content
                        : <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({node, href, children}) => {
                                if (href && href.startsWith('citation-')) {
                                  const sourceNum = parseInt(href.replace('citation-', ''), 10);
                                  const source = sources?.find(
                                    (s) => s.index === sourceNum || s.index === Number(sourceNum),
                                  ) || (sources && sources[sourceNum - 1]);
                                  
                                  if (source) {
                                    return (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleCitationClick(source);
                                        }}
                                        title={`Click to view source [${sourceNum}]: ${source.title || "Document"}`}
                                        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 mx-0.5 text-[10px] font-extrabold text-[#f26522] bg-orange-100/90 border border-orange-200 rounded-md hover:bg-[#f26522] hover:text-white transition-all cursor-pointer shadow-2xs align-middle"
                                      >
                                        {sourceNum}
                                      </button>
                                    );
                                  }
                                }
                                return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                              }
                            }}
                          >
                            {preprocessCitations(msg.content)}
                          </ReactMarkdown>
                      }
                    </div>
                    {shouldShowSources ? (
                      <div className="mt-3 border-t border-slate-100 pt-2">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Sources & Excerpts
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sources.map((source, idx) => (
                            <button
                              key={source.documentId ? `${source.documentId}-${idx}` : idx}
                              onClick={() => handleCitationClick(source)}
                              className="inline-flex max-w-full items-center gap-1 rounded-lg border border-orange-100 bg-orange-50 px-2 py-1 text-[11px] font-semibold text-[#f26522] hover:border-[#f26522]/30 hover:bg-orange-100 transition-all cursor-pointer"
                            >
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {source.index ? `[${source.index}] ` : ""}
                                {source.title || "Document"}
                              </span>
                              <Info className="h-3 w-3 shrink-0 opacity-60 ml-0.5" />
                            </button>
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
                    MinDocu AI is analyzing...
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
              placeholder={isDisabled ? "AI Q&A is disabled for this document" : "Ask anything about your study materials..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isSending || isDisabled}
              className="flex-1 bg-transparent outline-none text-slate-700 text-sm placeholder-slate-400 px-2"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending || isDisabled}
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

      {/* CITATION VERIFICATION MODAL */}
      <CitationModal
        citation={selectedCitation}
        open={citationModalOpen}
        onOpenChange={setCitationModalOpen}
        onPreviewDocument={onPreviewDocument}
      />
    </div>
  );
}
