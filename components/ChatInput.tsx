"use client";

import React, { useRef, useState } from "react";
import { Send, Loader2, Paperclip, Image as ImageIcon, Video, FileText, MapPin, Smile, X } from "lucide-react";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  disabled?: boolean;
  replyingTo?: { text: string; sender: string } | null;
  onCancelReply?: () => void;
  activeContactName?: string;
  
  // 👇 TypeScript एरर को फिक्स करने के लिए जोड़े गए नए Props
  phoneId?: string | null;
  accessToken?: string | null;
  recipientPhone?: string;
}

export default function ChatInput({
  inputText,
  setInputText,
  onSend,
  isSending,
  disabled = false,
  replyingTo,
  onCancelReply,
  activeContactName = "Contact",
  phoneId,
  accessToken,
  recipientPhone,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const mediaOptions = [
    { icon: ImageIcon, label: "Photos", color: "text-[#007BFC]", bg: "bg-[#007BFC]/10" },
    { icon: Video, label: "Camera", color: "text-[#FF2E74]", bg: "bg-[#FF2E74]/10" },
    { icon: FileText, label: "Document", color: "text-[#7F66FF]", bg: "bg-[#7F66FF]/10" },
    { icon: MapPin, label: "Location", color: "text-[#00C853]", bg: "bg-[#00C853]/10" },
  ];

  return (
    <div className="bg-[#F0F2F5] z-20">
      {/* Reply Banner */}
      {replyingTo && (
        <div className="mx-3 md:mx-4 mb-1.5 bg-white rounded-xl overflow-hidden shadow-sm flex items-stretch border border-gray-100">
          <div className="w-1 bg-[#00A884]"></div>
          <div className="p-2 px-3 flex-1 flex justify-between items-start">
            <div className="flex flex-col min-w-0">
              <span className="text-[#00A884] font-bold text-[12px] mb-0.5">
                {replyingTo.sender === "me" ? "You" : activeContactName}
              </span>
              <span className="text-[13px] text-gray-600 line-clamp-2">{replyingTo.text}</span>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-gray-100 rounded-full transition shrink-0 ml-2"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Media Menu */}
      {showMediaMenu && (
        <div className="mx-3 md:mx-4 mb-2 flex gap-3 animate-in slide-in-from-bottom-2 duration-200">
          {mediaOptions.map((opt, i) => (
            <button
              key={i}
              onClick={() => setShowMediaMenu(false)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl ${opt.bg} hover:opacity-80 transition`}
            >
              <div className={`w-10 h-10 rounded-full ${opt.bg} flex items-center justify-center`}>
                <opt.icon className={`w-5 h-5 ${opt.color}`} />
              </div>
              <span className="text-[10px] font-medium text-gray-600">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="px-2 md:px-3 pb-2 md:pb-3 pt-1 flex items-end gap-1.5 md:gap-2">
        {/* Emoji + Attach Buttons */}
        <div className="flex items-center gap-0.5 shrink-0 pb-1">
          <button
            onClick={() => setShowMediaMenu(!showMediaMenu)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656F] hover:bg-gray-200 transition"
          >
            <Paperclip className={`w-5 h-5 transition-transform duration-200 ${showMediaMenu ? "rotate-45 text-[#00A884]" : ""}`} />
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656F] hover:bg-gray-200 transition hidden sm:flex">
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Textarea */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-end p-1 min-h-[44px]">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="w-full max-h-[120px] bg-transparent resize-none overflow-y-auto px-3 py-2.5 text-[15px] text-[#111B21] outline-none placeholder-[#8696A0] leading-relaxed"
            rows={1}
            disabled={disabled || isSending}
          />
        </div>

        {/* Send Button */}
        <div className="shrink-0 pb-0.5">
          {inputText.trim() ? (
            <button
              onClick={onSend}
              disabled={isSending || disabled}
              className="w-11 h-11 bg-[#00A884] text-white rounded-full hover:bg-[#008f6f] flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </button>
          ) : (
            <button className="w-11 h-11 bg-[#00A884] text-white rounded-full flex items-center justify-center transition shadow-md shrink-0 opacity-40 cursor-default">
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
