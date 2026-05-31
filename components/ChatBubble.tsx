"use client";

import React, { useRef, useState } from "react";
import { Check, CheckCheck, Reply } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
  status?: "sent" | "delivered" | "read";
  replyTo?: string | null;
}

interface ChatBubbleProps {
  msg: Message;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onReply: (msg: Message) => void;
  contactName?: string;
}

export default function ChatBubble({
  msg,
  selectionMode,
  isSelected,
  onToggleSelect,
  onReply,
  contactName = "Contact",
}: ChatBubbleProps) {
  const [translateX, setTranslateX] = useState(0);
  const touchStartX = useRef(0);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [showActions, setShowActions] = useState(false);

  const isMe = msg.sender === "me";

  const startInteraction = (clientX: number) => {
    if (selectionMode) return;
    touchStartX.current = clientX;
    pressTimer.current = setTimeout(() => {
      onToggleSelect(msg.id);
      if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const moveInteraction = (clientX: number) => {
    if (selectionMode) return;
    const diff = clientX - touchStartX.current;
    if (Math.abs(diff) > 10 && pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    if (diff > 0 && diff < 80) {
      setTranslateX(diff);
    }
  };

  const endInteraction = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (translateX > 50) {
      onReply(msg);
    }
    setTranslateX(0);
  };

  const handleClick = () => {
    if (selectionMode) onToggleSelect(msg.id);
    else setShowActions(!showActions);
  };

  // WhatsApp-style time formatting
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    return timeStr;
  };

  return (
    <div
      className={`flex items-start w-full my-0.5 px-2 md:px-4 relative transition-colors duration-150 ${
        isSelected ? "bg-[#25D366]/15" : ""
      }`}
      onClick={handleClick}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="w-8 flex justify-center shrink-0 mt-2 mr-1">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "bg-[#00A884] border-[#00A884]"
                : "border-gray-400 bg-white"
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
        </div>
      )}

      {/* Reply Icon (Swipe Reveal) */}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-200"
        style={{ opacity: Math.min(translateX / 60, 1) }}
      >
        <div className="w-8 h-8 rounded-full bg-[#00A884]/20 flex items-center justify-center">
          <Reply className="w-4 h-4 text-[#00A884]" />
        </div>
      </div>

      {/* Message Container */}
      <div
        className={`flex flex-col w-full ${isMe ? "items-end" : "items-start"}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        }}
        onTouchStart={(e) => startInteraction(e.touches[0].clientX)}
        onTouchMove={(e) => moveInteraction(e.touches[0].clientX)}
        onTouchEnd={endInteraction}
        onMouseDown={(e) => startInteraction(e.clientX)}
        onMouseMove={(e) => e.buttons === 1 && moveInteraction(e.clientX)}
        onMouseUp={endInteraction}
        onMouseLeave={endInteraction}
      >
        {/* Bubble */}
        <div
          className={`relative max-w-[85%] md:max-w-[60%] rounded-2xl px-3 py-1.5 shadow-sm cursor-pointer select-none
            ${isMe 
              ? "bg-[#D9FDD3] rounded-tr-sm text-[#111B21]" 
              : "bg-white rounded-tl-sm text-[#111B21] border border-gray-100/50"
            }
            ${showActions && !selectionMode ? "ring-2 ring-[#00A884]/30" : ""}
          `}
        >
          {/* Reply Context */}
          {msg.replyTo && (
            <div className="bg-black/[0.06] rounded-lg p-2 mb-1.5 border-l-[3px] border-[#00A884] text-xs">
              <span className="text-[#00A884] font-bold block text-[10px] mb-0.5">
                {msg.sender === "me" ? "You" : contactName}
              </span>
              <span className="text-gray-600 line-clamp-2 text-[12px]">{msg.replyTo}</span>
            </div>
          )}

          {/* Message Text */}
          <p className="text-[14.2px] leading-snug text-[#111B21] whitespace-pre-wrap break-words pr-14">
            {msg.text}
          </p>

          {/* Time & Status - Absolute positioned bottom-right */}
          <div className="absolute bottom-1 right-2 flex items-center gap-1">
            <span className="text-[10.5px] text-[#667781] font-medium">
              {formatTime(msg.time)}
            </span>
            {isMe && (
              <span className="flex items-center">
                {msg.status === "sent" && (
                  <Check className="w-3.5 h-3.5 text-[#8696A0]" strokeWidth={2.5} />
                )}
                {msg.status === "delivered" && (
                  <CheckCheck className="w-3.5 h-3.5 text-[#8696A0]" strokeWidth={2.5} />
                )}
                {msg.status === "read" && (
                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" strokeWidth={2.5} />
                )}
              </span>
            )}
          </div>

          {/* Invisible spacer for time */}
          <div className="h-4"></div>
        </div>

        {/* Action Menu (on click) */}
        {showActions && !selectionMode && (
          <div
            className="mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 px-1 z-30 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onReply(msg);
                setShowActions(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md w-full text-left transition"
            >
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>
            <button
              onClick={() => {
                onToggleSelect(msg.id);
                setShowActions(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md w-full text-left transition"
            >
              <Check className="w-3.5 h-3.5" /> Select
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
