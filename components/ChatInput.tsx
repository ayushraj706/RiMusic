"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  Send, Loader2, Plus, Image as ImageIcon, Video, FileText, 
  MapPin, Smile, X, Camera, Mic, IndianRupee, MessageSquare, 
  Link2, LayoutTemplate 
} from "lucide-react";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  disabled?: boolean;
  replyingTo?: { text: string; sender: string } | null;
  onCancelReply?: () => void;
  activeContactName?: string;
  
  phoneId?: string | null;
  accessToken?: string | null;
  recipientPhone?: string;

  // Media & Location
  onSendMedia?: (file: File, type: "image" | "video" | "document") => void;
  onSendLocation?: (lat: number, lng: number) => void;
  
  // 👇 2 नए Props जो ₹ (Interactive) और Templates को हैंडल करेंगे
  onSendInteractive?: (type: "quick_reply" | "url") => void;
  onSendTemplate?: () => void;
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
  onSendMedia,
  onSendLocation,
  onSendInteractive,
  onSendTemplate
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Hidden inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showInteractiveMenu, setShowInteractiveMenu] = useState(false);

  // Toggles
  const toggleMediaMenu = () => {
    setShowMediaMenu(!showMediaMenu);
    setShowInteractiveMenu(false);
  };

  const toggleInteractiveMenu = () => {
    setShowInteractiveMenu(!showInteractiveMenu);
    setShowMediaMenu(false);
  };

  // Textarea auto-resize
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) onSend();
    }
  };

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "document") => {
    const file = e.target.files?.[0];
    if (file && onSendMedia) onSendMedia(file, type);
    setShowMediaMenu(false);
    e.target.value = ''; 
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      alert("Getting location...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (onSendLocation) onSendLocation(pos.coords.latitude, pos.coords.longitude);
          setShowMediaMenu(false);
        },
        (err) => {
          alert("Location error. Check permissions.");
          setShowMediaMenu(false);
        }
      );
    }
  };

  // Menus Data
  const mediaOptions = [
    { icon: ImageIcon, label: "Photos", color: "text-blue-500", action: () => imageInputRef.current?.click() },
    { icon: Video, label: "Camera", color: "text-pink-500", action: () => videoInputRef.current?.click() },
    { icon: FileText, label: "Document", color: "text-purple-500", action: () => docInputRef.current?.click() },
    { icon: MapPin, label: "Location", color: "text-green-500", action: handleLocationClick },
  ];

  const interactiveOptions = [
    { icon: MessageSquare, label: "Quick Reply", color: "text-blue-600", action: () => { onSendInteractive?.("quick_reply"); setShowInteractiveMenu(false); } },
    { icon: Link2, label: "URL Button", color: "text-teal-600", action: () => { onSendInteractive?.("url"); setShowInteractiveMenu(false); } },
    { icon: LayoutTemplate, label: "Template", color: "text-indigo-600", action: () => { onSendTemplate?.(); setShowInteractiveMenu(false); } },
  ];

  return (
    // iOS Style Floating / Blur Background
    <div className="bg-[#f6f6f6]/80 backdrop-blur-lg border-t border-gray-200/50 z-20 relative px-2 py-2 md:px-4">
      
      {/* Hidden File Inputs */}
      <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "image")} />
      <input type="file" ref={videoInputRef} accept="image/*,video/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, "video")} />
      <input type="file" ref={docInputRef} accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleFileChange(e, "document")} />

      {/* Reply Banner */}
      {replyingTo && (
        <div className="mb-2 bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm flex items-stretch border border-gray-200 mx-1">
          <div className="w-1.5 bg-blue-500"></div>
          <div className="p-2 px-3 flex-1 flex justify-between items-start">
            <div className="flex flex-col min-w-0">
              <span className="text-blue-500 font-semibold text-[13px] mb-0.5">
                {replyingTo.sender === "me" ? "You" : activeContactName}
              </span>
              <span className="text-[14px] text-gray-600 line-clamp-2">{replyingTo.text}</span>
            </div>
            <button onClick={onCancelReply} className="p-1 hover:bg-gray-200 rounded-full transition shrink-0 ml-2">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Action Menus (Media or Interactive) */}
      {(showMediaMenu || showInteractiveMenu) && (
        <div className="absolute bottom-full left-2 mb-2 bg-white/90 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl p-2 flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {(showMediaMenu ? mediaOptions : interactiveOptions).map((opt, i) => (
            <button
              key={i}
              onClick={opt.action}
              className="flex flex-col items-center gap-1.5 p-2.5 w-[72px] rounded-xl hover:bg-gray-100 transition"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
                <opt.icon className={`w-5 h-5 ${opt.color}`} />
              </div>
              <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Input Row (iPhone Style) */}
      <div className="flex items-end gap-2">
        
        {/* iOS Plus Icon */}
        <button
          onClick={toggleMediaMenu}
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 transition pb-1.5"
        >
          <Plus className={`w-6 h-6 transition-transform duration-300 ${showMediaMenu ? "rotate-45" : ""}`} />
        </button>

        {/* Pill-Shaped Input Area */}
        <div className="flex-1 bg-white border border-gray-300 rounded-[20px] flex items-end px-3 py-1.5 min-h-[38px] shadow-sm">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            className="w-full max-h-[100px] bg-transparent resize-none overflow-y-auto text-[16px] text-black outline-none placeholder-gray-400 py-1"
            rows={1}
            disabled={disabled || isSending}
          />
          {/* iOS Sticker/Emoji Icon inside the input pill */}
          <button className="w-6 h-6 text-gray-400 hover:text-blue-500 mb-1 ml-1 shrink-0 transition hidden sm:block">
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Right Actions: ₹, Camera, Mic, OR Send */}
        <div className="flex items-center gap-1 shrink-0 pb-1.5">
          {inputText.trim() ? (
            // SEND BUTTON (Appears when typing)
            <button
              onClick={onSend}
              disabled={isSending || disabled}
              className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-sm disabled:opacity-50"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          ) : (
            // IDLE BUTTONS (₹, Camera, Mic)
            <>
              {/* ₹ Interactive Message Button */}
              <button 
                onClick={toggleInteractiveMenu}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition ${showInteractiveMenu ? "bg-gray-200 text-black" : "text-gray-500 hover:text-black hover:bg-gray-100"}`}
                title="Interactive & Templates"
              >
                <IndianRupee className="w-5 h-5" />
              </button>

              {/* iOS Camera Button */}
              <button 
                onClick={() => imageInputRef.current?.click()}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition hidden sm:flex"
              >
                <Camera className="w-5 h-5" />
              </button>

              {/* iOS Mic Button */}
              <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition">
                <Mic className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
