import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Send, MessageSquare, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const REACTION_EMOJIS = {
  LIKE: "👍",
  LOVE: "❤️",
  LAUGH: "😂",
  WOW: "😮",
  SAD: "😢",
  ANGRY: "😡",
};

export default function WorkspaceGroupChat({
  projectId,
  title,
  subtitle,
  rightElement,
  messages = [],
  isChatConnected = false,
  currentUser = null,
  onSendMessage,
  onToggleReaction,
}) {
  const [chatMessage, setChatMessage] = useState("");
  const [replyMessages, setReplyMessages] = useState({});
  const [expandedReplyComments, setExpandedReplyComments] = useState({});
  const [activeReactionPicker, setActiveReactionPicker] = useState(null);
  const messagesEndRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const replyInputRefs = useRef({});

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendRootMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    onSendMessage(chatMessage, null);
    setChatMessage("");
  };

  const handleSendReplyMessage = (e, parentId) => {
    e.preventDefault();
    const content = replyMessages[parentId];
    if (!content || !content.trim()) return;
    onSendMessage(content, parentId);
    setReplyMessages((prev) => ({ ...prev, [parentId]: "" }));
  };

  const handleReplyClick = (msgId) => {
    setExpandedReplyComments((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
    setTimeout(() => {
      replyInputRefs.current[msgId]?.focus();
    }, 100);
  };

  const getUserReaction = (reactions) => {
    if (!reactions || !currentUser) return null;
    const found = reactions.find((r) => r.userId === currentUser.id);
    return found ? found.reactionType : null;
  };

  const getReactionSummary = (reactions) => {
    if (!reactions || reactions.length === 0) return null;
    const summary = {};
    reactions.forEach((r) => {
      summary[r.reactionType] = (summary[r.reactionType] || 0) + 1;
    });
    return {
      types: Object.keys(summary),
      totalCount: reactions.length,
    };
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessageBubble = (msg, isReply = false) => {
    const userReactionType = getUserReaction(msg.reactions);
    const reactionSummary = getReactionSummary(msg.reactions);
    const senderInitial = msg.sender?.fullName?.charAt(0).toUpperCase() || msg.sender?.username?.charAt(0).toUpperCase() || "U";
    const senderName = msg.sender?.fullName || msg.sender?.username || msg.sender?.email || "User";

    return (
      <div
        key={msg.id}
        className={`flex gap-3 items-start ${
          isReply ? "mt-3 pl-3 border-l-2 border-slate-200/60 ml-2" : ""
        }`}
      >
        <Avatar className={`${isReply ? "w-7 h-7" : "w-9 h-9"} rounded-full border shadow-sm shrink-0 mt-0.5`}>
          <AvatarImage src={msg.sender?.avatarUrl} alt={senderName} className="object-cover" />
          <AvatarFallback className="bg-[#f66810] text-white text-xs font-bold uppercase">
            {senderInitial}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="relative inline-block max-w-[90%] bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <span className="block text-xs font-bold text-slate-800 mb-0.5">
              {senderName}
            </span>
            <p className="text-slate-700 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
              {msg.content}
            </p>

            {reactionSummary && (
              <div className="absolute -bottom-2.5 right-3 bg-white border border-slate-100 shadow-sm rounded-full px-2 py-0.5 flex items-center gap-1 text-[11px] select-none z-10">
                <div className="flex -space-x-1">
                  {reactionSummary.types.map((type) => (
                    <span key={type} className="text-xs" title={type}>
                      {REACTION_EMOJIS[type]}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-extrabold text-slate-500 ml-0.5">
                  {reactionSummary.totalCount}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 mt-1 ml-2 text-[10px] text-slate-400 select-none">
            <span className="font-semibold">{formatMessageTime(msg.createdAt)}</span>
            <span>•</span>

            <div
              className="relative inline-block"
              onMouseEnter={() => {
                if (hideTimeoutRef.current) {
                  clearTimeout(hideTimeoutRef.current);
                  hideTimeoutRef.current = null;
                }
                setActiveReactionPicker(msg.id);
              }}
              onMouseLeave={() => {
                hideTimeoutRef.current = setTimeout(() => {
                  setActiveReactionPicker(null);
                }, 300);
              }}
            >
              <button
                onClick={() => {
                  if (userReactionType) {
                    onToggleReaction(msg.id, userReactionType);
                  } else {
                    onToggleReaction(msg.id, "LIKE");
                  }
                }}
                className={`font-bold transition-colors cursor-pointer hover:underline ${
                  userReactionType ? "text-[#f66810]" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {userReactionType ? `${REACTION_EMOJIS[userReactionType]} ${userReactionType.toLowerCase()}` : "Thích"}
              </button>

              {activeReactionPicker === msg.id && (
                <div className="absolute bottom-full left-0 mb-1.5 bg-white border border-slate-200/80 rounded-full shadow-lg px-2 py-1 flex gap-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                    <button
                      key={type}
                      onClick={() => {
                        onToggleReaction(msg.id, type);
                        setActiveReactionPicker(null);
                        if (hideTimeoutRef.current) {
                          clearTimeout(hideTimeoutRef.current);
                          hideTimeoutRef.current = null;
                        }
                      }}
                      className="text-lg hover:scale-130 transition-transform cursor-pointer p-0.5"
                      title={type}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isReply && (
              <>
                <span>•</span>
                <button
                  onClick={() => handleReplyClick(msg.id)}
                  className="font-bold text-slate-500 hover:text-slate-800 transition-colors hover:underline cursor-pointer"
                >
                  Phản hồi
                </button>
              </>
            )}
          </div>

          {!isReply && (
            <div className="mt-3 space-y-3">
              {messages.filter((m) => m.parentId === msg.id).map((reply) =>
                renderMessageBubble(reply, true)
              )}

              {(expandedReplyComments[msg.id] || messages.filter((m) => m.parentId === msg.id).length > 0) && (
                <form
                  onSubmit={(e) => handleSendReplyMessage(e, msg.id)}
                  className="flex items-center gap-2 mt-2.5 pl-3"
                >
                  <Avatar className="w-6.5 h-6.5 rounded-full border shadow-xs shrink-0">
                    <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.fullName || "User"} className="object-cover" />
                    <AvatarFallback className="bg-orange-500 text-white text-[10px] font-bold uppercase">
                      {(currentUser?.fullName || currentUser?.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-1.5 items-center">
                    <Input
                      ref={(el) => (replyInputRefs.current[msg.id] = el)}
                      placeholder="Viết câu trả lời..."
                      value={replyMessages[msg.id] || ""}
                      onChange={(e) =>
                        setReplyMessages((prev) => ({
                          ...prev,
                          [msg.id]: e.target.value,
                        }))
                      }
                      disabled={!isChatConnected}
                      className="flex-1 rounded-full h-8 border-slate-200/80 focus-visible:ring-[#f66810] text-[11px] px-3.5 bg-slate-50/30"
                    />
                    <Button
                      type="submit"
                      disabled={!(replyMessages[msg.id] || "").trim() || !isChatConnected}
                      className="rounded-full bg-[#f66810] hover:bg-[#de5b0b] text-white h-8 w-8 p-0 shrink-0 shadow-xs cursor-pointer flex items-center justify-center"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col relative bg-white h-full min-h-0">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-orange-50 bg-gradient-to-r from-orange-500/10 to-transparent flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#f66810]" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${isChatConnected ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
          <span className="text-xs font-bold text-slate-500">
            {isChatConnected ? "Online" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/30">
        {messages.filter((m) => !m.parentId).length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No conversations yet</p>
            <p className="text-xs text-slate-400 mt-1">Send the first message to start the discussion!</p>
          </div>
        ) : (
          messages.filter((m) => !m.parentId).map((msg) => renderMessageBubble(msg, false))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-5 border-t border-slate-100 bg-white shrink-0">
        {currentUser ? (
          <form onSubmit={handleSendRootMessage} className="flex gap-2">
            <Input
              placeholder="Ask a question or start a new topic..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              disabled={!isChatConnected}
              className="flex-1 rounded-full h-11 border-slate-200/80 focus-visible:ring-[#f66810] text-sm px-5 bg-slate-50/50"
            />
            <Button
              type="submit"
              disabled={!chatMessage.trim() || !isChatConnected}
              className="rounded-full bg-[#f66810] hover:bg-[#de5b0b] text-white h-11 w-11 p-0 shrink-0 shadow-md shadow-orange-500/15 cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4.5 h-4.5" />
            </Button>
          </form>
        ) : (
          <div className="text-center py-2 text-sm font-semibold text-slate-500">
            Vui lòng đăng nhập để tham gia thảo luận.
          </div>
        )}
      </div>
    </div>
  );
}
