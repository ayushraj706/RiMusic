"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Send, Loader2, Plus, Image as ImageIcon, Video, FileText,
  MapPin, X, Camera, Mic, IndianRupee, MessageSquare,
  Link2, LayoutTemplate, Download, Eye, StopCircle, Pause, Play,
  Smile,
} from "lucide-react";

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

  onSendMedia?: (file: File, type: "image" | "video" | "document") => Promise<void>;
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

// ─── Media Bubble Preview (Instagram-style, shown in chat area) ──────────────

interface MediaBubbleProps {
  preview: MediaPreview;
  isSending: boolean;
  onCancel: () => void;
  onSend: () => void;
}

function MediaBubble({ preview, isSending, onCancel, onSend }: MediaBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = preview.url;
    a.download = preview.name;
    a.click();
  };

  return (
    <>
      {/* Lightbox */}
      {lightboxOpen && preview.type === "image" && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 transition"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={preview.url}
            alt={preview.name}
            className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute bottom-6 right-6 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition"
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      )}

      {/* Bubble */}
      <div className="flex justify-end px-4 py-2">
        <div className="relative max-w-[280px] w-full">

          {/* Media content */}
          {preview.type === "image" ? (
            <div className="relative rounded-2xl overflow-hidden shadow-md group cursor-pointer" onClick={() => setLightboxOpen(true)}>
              <img
                src={preview.url}
                alt={preview.name}
                className="w-full object-cover max-h-64 rounded-2xl"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                <button
                  className="bg-white/90 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white transition"
                  onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  className="bg-white/90 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white transition"
                  onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Loading overlay */}
              {isSending && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center gap-2">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                    <span className="text-white text-xs font-semibold">Sending...</span>
                  </div>
                </div>
              )}
            </div>
          ) : preview.type === "video" ? (
            <div className="relative rounded-2xl overflow-hidden shadow-md bg-black">
              <video
                src={preview.url}
                className="w-full max-h-64 rounded-2xl object-contain"
                controls={!isSending}
              />
              {isSending && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            /* Document */
            <div className="bg-white rounded-2xl p-3 shadow-md flex items-center gap-3 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{preview.name}</p>
                <p className="text-xs text-gray-400">{preview.size}</p>
              </div>
              {!isSending && (
                <button onClick={handleDownload} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
              )}
              {isSending && <Loader2 className="w-4 h-4 text-purple-500 animate-spin shrink-0" />}
            </div>
          )}

          {/* Action row below bubble */}
          {!isSending && (
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white/80 border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={onSend}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#00A884] rounded-xl hover:bg-[#008f6f] transition shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Audio Recording UI (WhatsApp Floating Style) ────────────────────────────

interface AudioRecorderProps {
  onStop: (blob: Blob, durationSec: number) => void;
  onCancel: () => void;
}

function AudioRecorder({ onStop, onCancel }: AudioRecorderProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }).catch(() => {
      alert("Microphone access denied.");
      onCancel();
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
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
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onStop(blob, elapsed);
    };
    mr.stop();
    mr.stream.getTracks().forEach((t) => t.stop());
  };

  return (
    <div className="flex items-center gap-3 bg-white border border-red-200 rounded-2xl px-4 py-2.5 shadow-lg animate-in slide-in-from-bottom-2 duration-200">
      {/* Pulsing dot */}
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>

      <span className="text-sm font-bold text-red-500 tabular-nums w-10">{formatDuration(elapsed)}</span>

      {/* Waveform bars (decorative) */}
      <div className="flex items-center gap-0.5 flex-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full bg-[#00A884] transition-all duration-150 ${isPaused ? "opacity-40" : "opacity-100"}`}
            style={{
              width: 2,
              height: isPaused ? 4 : `${Math.random() * 14 + 4}px`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Pause */}
      <button onClick={handlePause} className="p-1.5 hover:bg-gray-100 rounded-full transition">
        {isPaused
          ? <Play className="w-4 h-4 text-gray-600" />
          : <Pause className="w-4 h-4 text-gray-600" />}
      </button>

      {/* Cancel */}
      <button onClick={onCancel} className="p-1.5 hover:bg-red-50 rounded-full transition">
        <X className="w-4 h-4 text-red-400" />
      </button>

      {/* Send (stop + send) */}
      <button
        onClick={handleStop}
        className="w-9 h-9 bg-[#00A884] rounded-full flex items-center justify-center shadow-md hover:bg-[#008f6f] transition"
      >
        <Send className="w-4 h-4 text-white ml-0.5" />
      </button>
    </div>
  );
}

// ─── Main ChatInput ───────────────────────────────────────────────────────────

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
  onSendTemplate,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showInteractiveMenu, setShowInteractiveMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Media preview state (shown as bubble in chat area, above input)
  const [pendingMedia, setPendingMedia] = useState<MediaPreview | null>(null);
  const [isSendingMedia, setIsSendingMedia] = useState(false);

  const toggleMediaMenu = () => {
    setShowMediaMenu((p) => !p);
    setShowInteractiveMenu(false);
  };

  const toggleInteractiveMenu = () => {
    setShowInteractiveMenu((p) => !p);
    setShowMediaMenu(false);
  };

  // Auto-resize textarea
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

  // File picked → show as pending bubble, NOT in input
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video" | "document"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPendingMedia({
      file,
      type,
      url,
      name: file.name,
      size: formatBytes(file.size),
    });
    setShowMediaMenu(false);
    e.target.value = "";
  };

  // Send the pending media bubble
  const handleSendPendingMedia = async () => {
    if (!pendingMedia || !onSendMedia) return;
    setIsSendingMedia(true);
    try {
      await onSendMedia(pendingMedia.file, pendingMedia.type);
    } finally {
      URL.revokeObjectURL(pendingMedia.url);
      setPendingMedia(null);
      setIsSendingMedia(false);
    }
  };

  const handleCancelPendingMedia = () => {
    if (pendingMedia) URL.revokeObjectURL(pendingMedia.url);
    setPendingMedia(null);
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSendLocation?.(pos.coords.latitude, pos.coords.longitude);
        setShowMediaMenu(false);
      },
      () => {
        alert("Location access denied.");
        setShowMediaMenu(false);
      }
    );
  };

  const handleAudioStop = useCallback(
    async (blob: Blob, _duration: number) => {
      setIsRecording(false);
      if (!onSendMedia) return;
      const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
      // Treat audio as document type for sending
      await onSendMedia(file, "document");
    },
    [onSendMedia]
  );

  // Menu options
  const mediaOptions = [
    {
      icon: ImageIcon,
      label: "Photo",
      color: "text-blue-500",
      bg: "bg-blue-50",
      action: () => imageInputRef.current?.click(),
    },
    {
      icon: Camera,
      label: "Camera",
      color: "text-pink-500",
      bg: "bg-pink-50",
      action: () => videoInputRef.current?.click(),
    },
    {
      icon: FileText,
      label: "Document",
      color: "text-purple-500",
      bg: "bg-purple-50",
      action: () => docInputRef.current?.click(),
    },
    {
      icon: MapPin,
      label: "Location",
      color: "text-green-500",
      bg: "bg-green-50",
      action: handleLocationClick,
    },
  ];

  const interactiveOptions = [
    {
      icon: MessageSquare,
      label: "Quick Reply",
      color: "text-blue-600",
      bg: "bg-blue-50",
      action: () => { onSendInteractive?.("quick_reply"); setShowInteractiveMenu(false); },
    },
    {
      icon: Link2,
      label: "URL Button",
      color: "text-teal-600",
      bg: "bg-teal-50",
      action: () => { onSendInteractive?.("url"); setShowInteractiveMenu(false); },
    },
    {
      icon: LayoutTemplate,
      label: "Template",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      action: () => { onSendTemplate?.(); setShowInteractiveMenu(false); },
    },
  ];

  const activeOptions = showMediaMenu ? mediaOptions : interactiveOptions;

  return (
    <div className="bg-[#f6f6f6]/80 backdrop-blur-lg border-t border-gray-200/50 z-20 relative">

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, "image")}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileChange(e, "video")}
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => handleFileChange(e, "document")}
      />

      {/* ── Pending Media Bubble (Instagram-style, shown above input) ── */}
      {pendingMedia && (
        <MediaBubble
          preview={pendingMedia}
          isSending={isSendingMedia}
          onCancel={handleCancelPendingMedia}
          onSend={handleSendPendingMedia}
        />
      )}

      {/* ── Reply Banner ── */}
      {replyingTo && !pendingMedia && (
        <div className="mx-2 mt-2 bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm flex items-stretch border border-gray-200">
          <div className="w-1 bg-[#00A884]" />
          <div className="p-2 px-3 flex-1 flex justify-between items-start">
            <div className="flex flex-col min-w-0">
              <span className="text-[#00A884] font-semibold text-[12px] mb-0.5">
                {replyingTo.sender === "me" ? "You" : activeContactName}
              </span>
              <span className="text-[13px] text-gray-600 line-clamp-2">{replyingTo.text}</span>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-gray-200 rounded-full transition shrink-0 ml-2"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* ── Pop-up Menu (Media or Interactive) ── */}
      {(showMediaMenu || showInteractiveMenu) && (
        <div className="absolute bottom-full left-2 mb-2 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-xl rounded-2xl p-2 flex gap-1 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {activeOptions.map((opt, i) => (
            <button
              key={i}
              onClick={opt.action}
              className="flex flex-col items-center gap-1 p-2 w-[68px] rounded-xl hover:bg-gray-50 active:scale-95 transition"
            >
              <div className={`w-10 h-10 rounded-full ${opt.bg} flex items-center justify-center`}>
                <opt.icon className={`w-[18px] h-[18px] ${opt.color}`} />
              </div>
              <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Main Row ── */}
      <div className="flex items-end gap-2 px-2 py-2 md:px-3">

        {/* Recording UI replaces entire input row */}
        {isRecording ? (
          <div className="flex-1">
            <AudioRecorder
              onStop={handleAudioStop}
              onCancel={() => setIsRecording(false)}
            />
          </div>
        ) : (
          <>
            {/* Plus / Media toggle */}
            <button
              onClick={toggleMediaMenu}
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[#54656F] hover:bg-gray-200 transition pb-1"
            >
              <Plus
                className={`w-6 h-6 transition-transform duration-200 ${showMediaMenu ? "rotate-45 text-[#00A884]" : ""}`}
              />
            </button>

            {/* Input pill */}
            <div className="flex-1 bg-white border border-gray-200 rounded-[22px] flex items-end px-3 py-1.5 min-h-[38px] shadow-sm">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Message"
                className="w-full max-h-[100px] bg-transparent resize-none overflow-y-auto text-[15px] text-gray-900 outline-none placeholder-gray-400 py-1 leading-relaxed"
                rows={1}
                disabled={disabled || isSending || !!pendingMedia}
              />
              <button className="w-6 h-6 text-gray-400 hover:text-[#00A884] mb-1 ml-1 shrink-0 transition hidden sm:block">
                <Smile className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 shrink-0 pb-1">
              {inputText.trim() ? (
                /* Send text */
                <button
                  onClick={onSend}
                  disabled={isSending || disabled}
                  className="w-9 h-9 bg-[#00A884] text-white rounded-full flex items-center justify-center transition active:scale-90 shadow-md disabled:opacity-50 hover:bg-[#008f6f]"
                >
                  {isSending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4 ml-0.5" />}
                </button>
              ) : (
                <>
                  {/* Interactive / Template */}
                  <button
                    onClick={toggleInteractiveMenu}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                      showInteractiveMenu
                        ? "bg-[#00A884]/10 text-[#00A884]"
                        : "text-[#54656F] hover:bg-gray-200"
                    }`}
                    title="Interactive & Templates"
                  >
                    <IndianRupee className="w-[18px] h-[18px]" />
                  </button>

                  {/* Camera shortcut */}
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#54656F] hover:bg-gray-200 transition hidden sm:flex"
                  >
                    <Camera className="w-[18px] h-[18px]" />
                  </button>

                  {/* Mic — hold to record */}
                  <button
                    onClick={() => setIsRecording(true)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#54656F] hover:bg-gray-200 transition"
                  >
                    <Mic className="w-[18px] h-[18px]" />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
