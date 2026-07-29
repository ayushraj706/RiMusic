"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Send, Loader2, Plus, Image as ImageIcon, Video, FileText,
  MapPin, X, Camera, Mic, IndianRupee, MessageSquare,
  Link2, LayoutTemplate, Download, Eye, StopCircle, Pause, Play,
  Smile, Check,
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
  phoneId?: string | null;
  accessToken?: string | null;
  recipientPhone?: string;
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
  if (
    blob.type === "audio/ogg" ||
    blob.type === "audio/opus" ||
    blob.type === "audio/aac" ||
    blob.type === "audio/mp4" ||
    blob.type === "audio/mpeg"
  ) {
    return new File([blob], `voice_${Date.now()}.ogg`, { type: blob.type });
  }
  const buffer = await blob.arrayBuffer();
  const oggBlob = new Blob([buffer], { type: "audio/ogg" });
  return new File([oggBlob], `voice_${Date.now()}.ogg`, { type: "audio/ogg" });
}

// ─── Instagram-style Stacked Multi-Media Preview ────────────────────────────
interface MultiMediaPreview {
  files: { file: File; url: string; name: string; size: string; type: "image" | "video" | "document" }[];
}

interface MultiMediaBubbleProps {
  previews: MultiMediaPreview;
  isSending: boolean;
  onCancel: () => void;
  onSend: () => void;
  onAddMore: () => void;
}

function MultiMediaBubble({ previews, isSending, onCancel, onSend, onAddMore }: MultiMediaBubbleProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sendAnim, setSendAnim] = useState(false);
  const [sent, setSent] = useState(false);

  const items = previews.files;
  const active = items[activeIndex];

  const handleDownloadAll = () => {
    items.forEach((item) => {
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.name;
      a.click();
    });
  };

  const handleSendClick = () => {
    setSendAnim(true);
    setTimeout(() => {
      setSent(true);
      onSend();
    }, 350);
  };

  return (
    <>
      {lightboxOpen && active?.type === "image" && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10" onClick={() => setLightboxOpen(false)}>
            <X className="w-5 h-5" />
          </button>
          <img src={active.url} alt={active.name} className="max-w-full max-h-[88vh] rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button className="absolute bottom-6 right-6 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition" onClick={(e) => { e.stopPropagation(); handleDownloadAll(); }}>
            <Download className="w-4 h-4" /> Download All ({items.length})
          </button>
          {items.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {items.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }} className={`w-2 h-2 rounded-full transition ${i === activeIndex ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end px-4 py-2">
        <div className="relative w-[260px]">
          {items.length >= 3 && <div className="absolute inset-0 rounded-2xl bg-gray-200 transform rotate-[-4deg] scale-[0.97] z-0" />}
          {items.length >= 2 && <div className="absolute inset-0 rounded-2xl bg-gray-300 transform rotate-[-2deg] scale-[0.985] z-[1]" />}
          <div className="relative z-[2]">
            {active?.type === "image" ? (
              <div className="relative rounded-2xl overflow-hidden shadow-xl cursor-pointer group" onClick={() => setLightboxOpen(true)}>
                <img src={active.url} alt={active.name} className="w-full object-cover max-h-64 rounded-2xl" />
                {items.length > 1 && <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">{activeIndex + 1}/{items.length}</div>}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button className="bg-white/90 text-gray-800 p-2.5 rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}><Eye className="w-4 h-4" /></button>
                  <button className="bg-white/90 text-gray-800 p-2.5 rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); handleDownloadAll(); }}><Download className="w-4 h-4" /></button>
                </div>
                {isSending && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center gap-2">
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                      <span className="text-white text-xs font-semibold">Sending {items.length > 1 ? `${items.length} photos` : "photo"}...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : active?.type === "video" ? (
              <div className="relative rounded-2xl overflow-hidden shadow-xl bg-black">
                <video src={active.url} className="w-full max-h-64 rounded-2xl object-contain" controls={!isSending} />
                {isSending && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-3 shadow-md flex items-center gap-3 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-purple-600" /></div>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-800 truncate">{active.name}</p><p className="text-xs text-gray-400">{active.size}</p></div>
                {isSending && <Loader2 className="w-4 h-4 text-purple-500 animate-spin shrink-0" />}
              </div>
            )}
            {items.length > 1 && active.type === "image" && (
              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
                {items.map((item, i) => (
                  <button key={i} onClick={() => setActiveIndex(i)} className={`shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition ${i === activeIndex ? "border-[#00A884]" : "border-transparent opacity-60"}`}>
                    {item.type === "image" ? <img src={item.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><FileText className="w-4 h-4 text-gray-500" /></div>}
                  </button>
                ))}
                {!isSending && <button onClick={onAddMore} className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-200 transition"><Plus className="w-4 h-4 text-gray-400" /></button>}
              </div>
            )}
          </div>
          {!isSending && (
            <div className="flex gap-2 mt-2 justify-end items-center">
              {items.length > 1 && <button onClick={handleDownloadAll} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white/80 border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm flex items-center gap-1"><Download className="w-3 h-3" /> All</button>}
              <button onClick={onCancel} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white/80 border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm">Cancel</button>
              <button onClick={handleSendClick} disabled={sendAnim} className={`px-4 py-1.5 text-xs font-bold text-white rounded-xl transition shadow-sm flex items-center gap-1.5 overflow-hidden ${sent ? "bg-[#00A884]" : "bg-[#00A884] hover:bg-[#008f6f]"}`}>
                {sent ? <Check className="w-3.5 h-3.5" /> : sendAnim ? <><span className="animate-[fly_0.35s_ease-in_forwards] inline-flex"><Send className="w-3.5 h-3.5" /></span><span className="opacity-0">Send</span></> : <><Send className="w-3.5 h-3.5" /> Send{items.length > 1 ? ` (${items.length})` : ""}</>}
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes fly { 0% { transform: translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateX(60px) rotate(-30deg); opacity: 0; } }`}</style>
    </>
  );
}

// ─── Audio Recording UI ──────────────────────────────────────────────────────
interface AudioRecorderProps { onStop: (blob: Blob, durationSec: number) => void; onCancel: () => void; }

function AudioRecorder({ onStop, onCancel }: AudioRecorderProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mimeType = MediaRecorder.isTypeSupported("audio/ogg;codecs=opus") ? "audio/ogg;codecs=opus" : MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    }).catch(() => {
      alert("Microphone access denied.");
      onCancel();
    });
    return () => { if (timerRef.current) clearInterval(timerRef.current); mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop()); };
  }, []);

  const handlePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (timerRef.current) clearInterval(timerRef.current);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
      onStop(blob, elapsed);
    };
    mr.stop();
    mr.stream.getTracks().forEach((t) => t.stop());
  };

  return (
    <div className="flex items-center gap-3 bg-white border border-red-200 rounded-[22px] px-4 py-2.5 shadow-lg w-full">
      <span className="relative flex h-3 w-3 shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
      <span className="text-sm font-bold text-red-500 tabular-nums w-10">{formatDuration(elapsed)}</span>
      <div className="flex items-center gap-0.5 flex-1">
        {Array.from({ length: 20 }).map((_, i) => <div key={i} className={`rounded-full bg-[#00A884] transition-all duration-150 ${isPaused ? "opacity-40" : "opacity-100"}`} style={{ width: 2, height: isPaused ? 4 : `${Math.random() * 14 + 4}px` }} />)}
      </div>
      <button onClick={handlePause} className="p-1.5 hover:bg-gray-100 rounded-full transition">{isPaused ? <Play className="w-4 h-4 text-gray-600" /> : <Pause className="w-4 h-4 text-gray-600" />}</button>
      <button onClick={onCancel} className="p-1.5 hover:bg-red-50 rounded-full transition"><X className="w-4 h-4 text-red-400" /></button>
      <button onClick={handleStop} className="w-9 h-9 bg-[#00A884] rounded-full flex items-center justify-center shadow-md hover:bg-[#008f6f] transition"><Send className="w-4 h-4 text-white ml-0.5" /></button>
    </div>
  );
}

// ─── Main ChatInput ───────────────────────────────────────────────────────────
export default function ChatInput({
  inputText, setInputText, onSend, isSending, disabled = false, replyingTo, onCancelReply, activeContactName = "Contact", onSendMedia, onSendLocation, onSendInteractive, onSendTemplate,
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
  const [pendingMedias, setPendingMedias] = useState<MultiMediaPreview | null>(null);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) { setShowEmojiPicker(false); } };
    if (showEmojiPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  const toggleMediaMenu = () => { setShowMediaMenu((p) => !p); setShowInteractiveMenu(false); setShowEmojiPicker(false); };
  const toggleInteractiveMenu = () => { setShowInteractiveMenu((p) => !p); setShowMediaMenu(false); setShowEmojiPicker(false); };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`; }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (inputText.trim()) onSend(); }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputText(inputText + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "document") => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newItems = files.map((file) => ({ file, type, url: URL.createObjectURL(file), name: file.name, size: formatBytes(file.size) }));
    setPendingMedias((prev) => prev ? { files: [...prev.files, ...newItems] } : { files: newItems });
    setShowMediaMenu(false);
    e.target.value = "";
  };

  const handleSendPendingMedias = async () => {
    if (!pendingMedias || !onSendMedia) return;
    setIsSendingMedia(true);
    try { for (const item of pendingMedias.files) { await onSendMedia(item.file, item.type); } } 
    finally { pendingMedias.files.forEach((i) => URL.revokeObjectURL(i.url)); setPendingMedias(null); setIsSendingMedia(false); }
  };

  const handleCancelPendingMedias = () => {
    if (pendingMedias) pendingMedias.files.forEach((i) => URL.revokeObjectURL(i.url));
    setPendingMedias(null);
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { onSendLocation?.(pos.coords.latitude, pos.coords.longitude); setIsLocating(false); setShowMediaMenu(false); },
      () => { alert("Location access denied."); setIsLocating(false); setShowMediaMenu(false); }
    );
  };

  const handleAudioStop = useCallback(async (blob: Blob, _duration: number) => {
    setIsRecording(false);
    if (!onSendMedia) return;
    const file = await convertAudioToOgg(blob);
    await onSendMedia(file, "audio");
  }, [onSendMedia]);

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
    // 🌟 YAHI WOH MAIN WRAPPER HAI JO FLOATING EFFECT DEGA
    <div className="absolute bottom-4 left-0 right-0 z-40 px-2 sm:px-4 pointer-events-none flex justify-center">
      
      {/* 🌟 YAHI FLOATING PILL (MAIN BOX) HAI */}
      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[32px] pointer-events-auto p-1.5 flex flex-col transition-all duration-300">
        
        <input type="file" ref={multiImageInputRef} accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleFileChange(e, "image")} />
        <input type="file" ref={videoInputRef} accept="image/*,video/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, "video")} />
        <input type="file" ref={docInputRef} accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleFileChange(e, "document")} />

        {pendingMedias && (
          <MultiMediaBubble previews={pendingMedias} isSending={isSendingMedia} onCancel={handleCancelPendingMedias} onSend={handleSendPendingMedias} onAddMore={() => multiImageInputRef.current?.click()} />
        )}

        {replyingTo && !pendingMedias && (
          <div className="mx-2 mt-1 mb-2 bg-gray-50/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm flex items-stretch border border-gray-100">
            <div className="w-1.5 bg-[#00A884]" />
            <div className="p-2 px-3 flex-1 flex justify-between items-start">
              <div className="flex flex-col min-w-0">
                <span className="text-[#00A884] font-bold text-[12px] mb-0.5">{replyingTo.sender === "me" ? "You" : activeContactName}</span>
                <span className="text-[13px] text-gray-600 line-clamp-1">{replyingTo.text}</span>
              </div>
              <button onClick={onCancelReply} className="p-1 hover:bg-gray-200 rounded-full transition shrink-0 ml-2"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
          </div>
        )}

        {(showMediaMenu || showInteractiveMenu) && (
          <div className="absolute bottom-full left-4 mb-3 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-2xl p-2.5 flex gap-2 z-50">
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

        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-full left-4 mb-3 z-50 shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
            <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.LIGHT} />
          </div>
        )}

        <div className="flex items-end gap-1.5 px-1 py-1">
          {isRecording ? (
            <div className="flex-1 w-full"><AudioRecorder onStop={handleAudioStop} onCancel={() => setIsRecording(false)} /></div>
          ) : (
            <>
              <button onClick={toggleMediaMenu} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
                <Plus className={`w-6 h-6 transition-transform duration-300 ${showMediaMenu ? "rotate-45 text-[#00A884]" : ""}`} />
              </button>

              <div className="flex-1 bg-gray-100/50 border border-transparent focus-within:border-gray-200 focus-within:bg-white rounded-[24px] flex items-end px-3 py-1.5 transition-all">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`w-7 h-7 mb-1.5 shrink-0 transition rounded-full flex items-center justify-center ${showEmojiPicker ? "text-[#00A884]" : "text-gray-400 hover:text-[#00A884]"}`}>
                  <Smile className="w-5 h-5" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Message..."
                  className="w-full max-h-[100px] bg-transparent resize-none overflow-y-auto text-[15px] text-gray-800 outline-none placeholder-gray-400 py-1.5 px-2 font-medium"
                  rows={1}
                  disabled={disabled || isSending || !!pendingMedias}
                />
              </div>

              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                {inputText.trim() ? (
                  <button onClick={onSend} disabled={isSending || disabled} className="w-10 h-10 bg-[#00A884] text-white rounded-full flex items-center justify-center transition hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 hover:bg-[#008f6f]">
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                  </button>
                ) : (
                  <>
                    <button onClick={toggleInteractiveMenu} className={`w-10 h-10 rounded-full flex items-center justify-center transition ${showInteractiveMenu ? "bg-[#00A884]/10 text-[#00A884]" : "text-gray-500 hover:bg-gray-100"}`} title="Templates">
                      <LayoutTemplate className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsRecording(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
                      <Mic className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
