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
  Check,
  Bot,
  FileText,
} from "lucide-react";
import { useChatbotStore } from "@/store/useChatbotStore";
import { TemplateBuilderUI } from "@/components/template-builder/TemplateBuilderUI";

// Dynamic import with fixed path using @/ alias to avoid path issues
const ChatbotCanvas = dynamic(
  () => import("@/components/chatbot/ChatbotCanvas"),
  { ssr: false, loading: () => <CanvasLoader /> }
);

function CanvasLoader() {
  return (
    <div className="flex-1 bg-slate-950 flex items-center justify-center gap-3 w-full h-full">
      <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
      <span className="text-sm font-medium text-slate-400">Loading canvas…</span>
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
              <Code2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">Flow JSON Export</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Firebase-ready configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 border ${
                copied 
                  ? "bg-green-500/20 border-green-500/40 text-green-400" 
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy JSON"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Code Block */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#0b1121]">
          <pre className="text-[12px] text-green-300/90 rounded-xl overflow-x-auto leading-relaxed font-mono">
            {JSON.stringify(json, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── Main UI Component ────────────────────────────────────────────────────────

export default function ChatbotBuilderPage() {
  const exportFlowAsJSON = useChatbotStore((s) => s.exportFlowAsJSON);
  const resetFlow = useChatbotStore((s) => s.resetFlow);
  const nodes = useChatbotStore((s) => s.nodes);
  const edges = useChatbotStore((s) => s.edges);

  const [activeTab, setActiveTab] = useState<"canvas" | "template">("canvas");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showJson, setShowJson] = useState(false);
  const [jsonData, setJsonData] = useState<object | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    
    if (activeTab === "canvas") {
      const json = exportFlowAsJSON();
      console.log("Saving Canvas Flow to Database:", json);
    } else {
      console.log("Saving Template...");
    }

    await new Promise((r) => setTimeout(r, 900)); // Simulate API delay
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2500);
  }, [exportFlowAsJSON, activeTab]);

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
    document.body.appendChild(a); 
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportFlowAsJSON]);

  const handleReset = useCallback(() => {
    if (window.confirm("Are you sure you want to reset the entire flow? This cannot be undone.")) {
      resetFlow();
    }
  }, [resetFlow]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-sans text-slate-200">
      
      {/* ── Top Bar ── */}
      <header className="relative z-20 flex items-center justify-between px-4 md:px-6 py-3 bg-slate-900 border-b border-slate-800/80 flex-shrink-0 shadow-sm">
        {/* Brand & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20 border border-green-400/20">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <span className="text-sm font-extrabold text-white tracking-tight">
                Base<span className="text-green-400">Key</span>
              </span>
            </div>
          </div>

          <div className="hidden md:block w-px h-6 bg-slate-800" />

          {/* Editable Flow Name */}
          <div className="hidden md:flex items-center gap-2 group">
            <input
              defaultValue="New Chatbot Flow"
              className="bg-transparent text-sm font-medium text-slate-300 focus:outline-none focus:text-white border-b border-transparent focus:border-green-500/50 transition-all min-w-0 w-44 px-1 py-0.5"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </div>
        </div>

        {/* Tab Switcher (Desktop) */}
        <div className="hidden lg:flex bg-slate-950/50 rounded-lg p-1 border border-slate-800/50">
          <button 
            onClick={() => setActiveTab("canvas")}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "canvas" 
                ? "bg-slate-800 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-300"
            }`}>
            <Bot className="w-3.5 h-3.5" /> Visual Flow
          </button>
          <button 
            onClick={() => setActiveTab("template")}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "template" 
                ? "bg-green-500/10 text-green-400 shadow-sm" 
                : "text-slate-500 hover:text-slate-300"
            }`}>
            <FileText className="w-3.5 h-3.5" /> Template Builder
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            
            {/* Show stats only in Canvas mode */}
            {activeTab === "canvas" && (
              <div className="flex items-center gap-4 px-3 py-1.5 bg-slate-950/50 rounded-lg border border-slate-800/50 mr-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-[11px] font-medium text-slate-400">{nodes.length} nodes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-[11px] font-medium text-slate-400">{edges.length} connections</span>
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-all duration-200 border border-transparent hover:border-red-900/30"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-700"
            >
              <Code2 className="w-3.5 h-3.5" />
              View JSON
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className={`
                flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300
                ${
                  saveStatus === "saved"
                    ? "bg-green-500/10 border border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.1)]"
                    : "bg-green-500 hover:bg-green-400 text-slate-950 shadow-lg shadow-green-500/20 border border-transparent"
                }
                disabled:opacity-70 disabled:cursor-not-allowed
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
                : "Save"}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-400 text-slate-950 rounded-lg shadow-lg shadow-green-500/20 transition-all disabled:opacity-60"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveStatus === "saved" ? (
                <CheckCircle className="w-4 h-4 text-green-950" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${
                mobileMenuOpen ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      <div 
        className={`md:hidden absolute top-[57px] left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-2xl z-10 overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col p-3 gap-1.5">
          {/* Mobile Tabs */}
          <div className="flex bg-slate-950/50 rounded-lg p-1 border border-slate-800/50 mb-2">
            <button 
              onClick={() => { setActiveTab("canvas"); setMobileMenuOpen(false); }}
              className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 text-xs font-medium rounded-md ${
                activeTab === "canvas" ? "bg-slate-800 text-white" : "text-slate-500"
              }`}>
              <Bot className="w-4 h-4" /> Flow
            </button>
            <button 
              onClick={() => { setActiveTab("template"); setMobileMenuOpen(false); }}
              className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 text-xs font-medium rounded-md ${
                activeTab === "template" ? "bg-green-500/10 text-green-400" : "text-slate-500"
              }`}>
              <FileText className="w-4 h-4" /> Templates
            </button>
          </div>

          <button
            onClick={() => { handleExport(); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            <Code2 className="w-4 h-4 text-slate-400" /> View JSON Export
          </button>
          <button
            onClick={() => { handleDownload(); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" /> Download .json
          </button>
          <div className="h-px w-full bg-slate-800/80 my-1" />
          <button
            onClick={() => { handleReset(); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/40 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset Entire Flow
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <main className="flex-1 relative overflow-hidden bg-[#0a0f1c]">
        {activeTab === "canvas" ? (
          <ChatbotCanvas />
        ) : (
          <div className="h-full overflow-y-auto w-full bg-slate-950 p-4 md:p-6">
            <TemplateBuilderUI onSave={(data) => console.log("Template Data:", data)} />
          </div>
        )}
      </main>

      {/* ── Status Bar (Footer) ── */}
      <footer className="hidden md:flex items-center justify-between px-5 py-2 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 opacity-80">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-medium text-slate-400">
              WhatsApp Business API · {activeTab === "canvas" ? "Interactive Messages Engine" : "Template Creation Engine"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-950/50 px-2.5 py-1 rounded-full border border-slate-800/50">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Connected</span>
        </div>
      </footer>

      {/* JSON Modal */}
      {showJson && jsonData && (
        <JsonModal json={jsonData} onClose={() => setShowJson(false)} />
      )}
    </div>
  );
}
