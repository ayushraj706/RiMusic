"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Send, Loader2, Plus, Image as ImageIcon, Video, FileText,
  MapPin, X, Camera, Mic, MessageSquare,
  Link2, LayoutTemplate, Download, Eye, Pause, Play,
  Smile, Check, AlertCircle
} from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MediaPreview {
  file: File;
  type: "image" | "video" | "document";
  url: string;
  name: string;
  size: string;
}

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  disabled?: boolean;
  replyingTo?: { text: string; sender: string } | null;
  onCancelReply?: () => void;
  activeContactName?: string;
  onSendMedia?: (file: File, type: "image" | "video" | "document" | "audio") => Promise<void>;
  onSendLocation?: (lat: number, lng: number) => void;
  onSendInteractive?: (type: "quick_reply" | "url") => void;
  onSendTemplate?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

async function convertAudioToOgg(blob: Blob): Promise<File> {
  if (blob.type.includes("ogg") || blob.type.includes("opus") || blob.type.includes("mp4")) {
    return new File([blob], `voice_${Date.now()}.ogg`, { type: blob.type });
  }
  const buffer = await blob.arrayBuffer();
  const oggBlob = new Blob([buffer], { type: "audio/ogg" });
  return new File([oggBlob], `voice_${Date.now()}.ogg`, { type: "audio/ogg" });
}

// ─── Main ChatInput Component ────────────────────────────────────────────────
export default function ChatInput({
  inputText, setInputText, onSend, isSending, disabled = false,
  replyingTo, onCancelReply, activeContactName = "Contact",
  onSendMedia, onSendLocation, onSendInteractive, onSendTemplate,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const multiImageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showInteractiveMenu, setShowInteractiveMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  const toggleMediaMenu = () => { setShowMediaMenu(!showMediaMenu); setShowInteractiveMenu(false); setShowEmojiPicker(false); };
  const toggleInteractiveMenu = () => { setShowInteractiveMenu(!showInteractiveMenu); setShowMediaMenu(false); setShowEmojiPicker(false); };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported by your browser.");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSendLocation?.(pos.coords.latitude, pos.coords.longitude);
        setIsLocating(false);
        setShowMediaMenu(false);
      },
      (error) => {
        alert("Location access denied or failed. Please check browser permissions.");
        setIsLocating(false);
        setShowMediaMenu(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mediaOptions = [
    { icon: ImageIcon, label: "Photo", color: "text-blue-500", bg: "bg-blue-50", action: () => multiImageInputRef.current?.click() },
    { icon: Camera, label: "Camera", color: "text-pink-500", bg: "bg-pink-50", action: () => videoInputRef.current?.click() },
    { icon: FileText, label: "Document", color: "text-purple-500", bg: "bg-purple-50", action: () => docInputRef.current?.click() },
    { icon: isLocating ? Loader2 : MapPin, label: "Location", color: "text-green-500", bg: "bg-green-50", action: handleLocationClick, spin: isLocating },
  ];

  const interactiveOptions = [
    { icon: MessageSquare, label: "Quick Reply", color: "text-blue-600", bg: "bg-blue-50", action: () => { onSendInteractive?.("quick_reply"); setShowInteractiveMenu(false); } },
    { icon: Link2, label: "URL Button", color: "text-teal-600", bg: "bg-teal-50", action: () => { onSendInteractive?.("url"); setShowInteractiveMenu(false); } },
    { icon: LayoutTemplate, label: "Template", color: "text-indigo-600", bg: "bg-indigo-50", action: () => { onSendTemplate?.(); setShowInteractiveMenu(false); } },
  ];

  const activeOptions = showMediaMenu ? mediaOptions : interactiveOptions;

  return (
    // 🌟 FLOATING CONTAINER WRAPPER
    <div className="absolute bottom-4 left-0 right-0 z-40 px-2 sm:px-4 pointer-events-none flex justify-center">
      
      {/* 🌟 ACTUAL FLOATING PILL */}
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-xl border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[32px] pointer-events-auto p-1.5 flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in">
        
        {/* Hidden Inputs */}
        <input type="file" ref={multiImageInputRef} accept="image/*,video/*" multiple className="hidden" />
        <input type="file" ref={videoInputRef} accept="image/*,video/*" capture="environment" className="hidden" />
        <input type="file" ref={docInputRef} accept=".pdf,.doc,.docx,.txt" className="hidden" />

        {/* Reply Banner */}
        {replyingTo && (
          <div className="mx-2 mt-1 mb-2 bg-gray-50/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm flex items-stretch border border-gray-100 animate-in slide-in-from-bottom-2">
            <div className="w-1.5 bg-[#00A884]" />
            <div className="p-2 px-3 flex-1 flex justify-between items-start">
              <div className="flex flex-col min-w-0">
                <span className="text-[#00A884] font-bold text-[12px] mb-0.5">{replyingTo.sender === "me" ? "You" : activeContactName}</span>
                <span className="text-[13px] text-gray-600 line-clamp-1">{replyingTo.text}</span>
              </div>
              <button onClick={onCancelReply} className="p-1 hover:bg-gray-200 rounded-full transition"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
          </div>
        )}

        {/* Pop-up Menus (Media/Interactive) */}
        {(showMediaMenu || showInteractiveMenu) && (
          <div className="absolute bottom-full left-4 mb-3 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-2xl p-2.5 flex gap-2 z-50 animate-in slide-in-from-bottom-3 fade-in duration-200">
            {activeOptions.map((opt, i) => (
              <button key={i} onClick={opt.action} className="flex flex-col items-center gap-1.5 p-2 w-[72px] rounded-xl hover:bg-gray-50 active:scale-95 transition">
                <div className={`w-12 h-12 rounded-full ${opt.bg} flex items-center justify-center shadow-sm`}>
                  <opt.icon className={`w-5 h-5 ${opt.color} ${opt.spin ? "animate-spin" : ""}`} />
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-center">{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-full left-4 mb-3 z-50 shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-200 border border-gray-100">
            <EmojiPicker onEmojiClick={(e) => setInputText(inputText + e.emoji)} theme={Theme.LIGHT} />
          </div>
        )}

        {/* Main Input Row */}
        <div className="flex items-end gap-1.5 px-1 py-1">
          <button onClick={toggleMediaMenu} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
            <Plus className={`w-6 h-6 transition-transform duration-300 ${showMediaMenu ? "rotate-45 text-[#00A884]" : ""}`} />
          </button>

          <div className="flex-1 bg-gray-100/50 border border-transparent focus-within:border-gray-200 focus-within:bg-white rounded-[24px] flex items-end px-3 py-1.5 transition-all">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`w-7 h-7 mb-1 shrink-0 transition rounded-full flex items-center justify-center ${showEmojiPicker ? "text-[#00A884]" : "text-gray-400 hover:text-[#00A884]"}`}>
              <Smile className="w-5 h-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (inputText.trim()) onSend(); } }}
              placeholder="Message..."
              className="w-full max-h-[100px] bg-transparent resize-none overflow-y-auto text-[15px] text-gray-800 outline-none placeholder-gray-400 py-1.5 px-2 font-medium"
              rows={1}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            {inputText.trim() ? (
              <button onClick={onSend} disabled={isSending} className="w-10 h-10 bg-[#00A884] text-white rounded-full flex items-center justify-center transition hover:scale-105 active:scale-95 shadow-md">
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            ) : (
              <>
                <button onClick={toggleInteractiveMenu} className={`w-10 h-10 rounded-full flex items-center justify-center transition ${showInteractiveMenu ? "bg-[#00A884]/10 text-[#00A884]" : "text-gray-500 hover:bg-gray-100"}`}>
                  <LayoutTemplate className="w-5 h-5" />
                </button>
                <button onClick={() => setIsRecording(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
                  <Mic className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
