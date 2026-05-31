"use client";

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Layers,
  Save,
  Download,
  RotateCcw,
  ChevronDown,
  Cpu,
  Wifi,
  CheckCircle,
  Loader2,
  Code2,
  Menu,
  X,
} from "lucide-react";
import { useChatbotStore } from "../../store/useChatbotStore";

// Dynamic import to avoid SSR issues with React Flow
const ChatbotCanvas = dynamic(
  () => import("../../components/chatbot/ChatbotCanvas"),
  { ssr: false, loading: () => <CanvasLoader /> }
);

function CanvasLoader() {
  return (
    <div className="flex-1 bg-slate-950 flex items-center justify-center gap-3">
      <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
      <span className="text-sm text-slate-400">Loading canvas…</span>
    </div>
  );
}

// ─── JSON Preview Modal ───────────────────────────────────────────────────────

function JsonModal({
  json,
  onClose,
}: {
  json: object;
  onClose: () => void;
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-bold text-slate-200">Flow JSON Export</h2>
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
              Firebase-ready
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 rounded-lg transition-colors"
            >
              Copy JSON
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <pre className="text-[11px] text-green-300 bg-slate-950 rounded-xl p-4 overflow-x-auto leading-relaxed font-mono">
            {JSON.stringify(json, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatbotBuilderPage() {
  const exportFlowAsJSON = useChatbotStore((s) => s.exportFlowAsJSON);
  const resetFlow = useChatbotStore((s) => s.resetFlow);
  const nodes = useChatbotStore((s) => s.nodes);
  const edges = useChatbotStore((s) => s.edges);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showJson, setShowJson] = useState(false);
  const [jsonData, setJsonData] = useState<object | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    const json = exportFlowAsJSON();

    // TODO: Replace with actual Firebase Realtime Database save
    // await set(ref(db, `chatbots/${chatbotId}/flow`), json);
    console.log("Saving to Firebase:", json);

    await new Promise((r) => setTimeout(r, 900)); // Simulate API call
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2500);
  }, [exportFlowAsJSON]);

  const handleExport = useCallback(() => {
    const json = exportFlowAsJSON();
    setJsonData(json);
    setShowJson(true);
  }, [exportFlowAsJSON]);

  const handleDownload = useCallback(() => {
    const json = exportFlowAsJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `basekey-flow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportFlowAsJSON]);

  const handleReset = useCallback(() => {
    if (confirm("Reset the entire flow? This cannot be undone.")) {
      resetFlow();
    }
  }, [resetFlow]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-4 md:px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex-shrink-0 gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <span className="text-sm font-bold text-white tracking-tight">
                Base<span className="text-green-400">Key</span>
              </span>
            </div>
          </div>

          <div className="hidden md:block w-px h-5 bg-slate-700" />

          {/* Flow name editable */}
          <div className="hidden md:flex items-center gap-1.5">
            <input
              defaultValue="New Chatbot Flow"
              className="bg-transparent text-sm font-semibold text-slate-300 focus:outline-none focus:text-white border-b border-transparent focus:border-slate-600 transition-colors min-w-0 w-40"
            />
            <ChevronDown className="w-3 h-3 text-slate-600" />
          </div>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[11px] text-slate-500">
              {nodes.length} nodes
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-[11px] text-slate-500">
              {edges.length} connections
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <Code2 className="w-3.5 h-3.5" />
              View JSON
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className={`
                flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all
                ${
                  saveStatus === "saved"
                    ? "bg-green-500/20 border border-green-500/40 text-green-400"
                    : "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/30"
                }
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
            >
              {saveStatus === "saving" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saveStatus === "saved" ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saveStatus === "saving"
                ? "Saving…"
                : saveStatus === "saved"
                ? "Saved!"
                : "Save Flow"}
            </button>
          </div>

          {/* Mobile: just Save and menu */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-400 text-white rounded-lg shadow-lg shadow-green-500/25 transition-all disabled:opacity-60"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saveStatus === "saved" ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saveStatus === "saving" ? "…" : saveStatus === "saved" ? "Saved" : "Save"}
            </button>

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-col gap-2 z-20">
          <button
            onClick={() => { handleExport(); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg"
          >
            <Code2 className="w-4 h-4 text-slate-500" /> View JSON
          </button>
          <button
            onClick={() => { handleDownload(); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export .json
          </button>
          <button
            onClick={() => { handleReset(); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg"
          >
            <RotateCcw className="w-4 h-4" /> Reset Flow
          </button>
        </div>
      )}

      {/* ── Canvas ── */}
      <main className="flex-1 overflow-hidden">
        <ChatbotCanvas />
      </main>

      {/* ── Status bar ── */}
      <footer className="hidden md:flex items-center justify-between px-5 py-1.5 bg-slate-900 border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-slate-600" />
            <span className="text-[10px] text-slate-600">
              WhatsApp Business API · Interactive Messages
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-slate-600">Connected</span>
        </div>
      </footer>

      {/* JSON Modal */}
      {showJson && jsonData && (
        <JsonModal json={jsonData} onClose={() => setShowJson(false)} />
      )}
    </div>
  );
}
