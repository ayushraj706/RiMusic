"use client";

import React, { useState } from "react";
// 👇 YAHAN SIDEBAR IMPORT KIYA HAI
import Sidebar from "@/components/Sidebar"; 
import { Code2, Key, Webhook, Copy, Check, Terminal, ExternalLink } from "lucide-react";

export default function DevelopersPage() {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const dummyApiKey = "bk_live_998877665544332211abcdef";
  const webhookUrl = "https://superkey-app.vercel.app/api/webhook/whatsapp";

  const handleCopy = (text: string, type: "key" | "url") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    // 👇 MAIN WRAPPER (SideBar fix rakhne ke liye)
    <div className="flex h-[100dvh] w-full bg-[#F5F7F9] overflow-hidden pb-[70px] md:pb-0 font-sans text-gray-900 relative">
      
      {/* ─── Sidebar Navigation ─── */}
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      {/* ─── Main Content Area (Scrollable) ─── */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-[#00A884]" />
            Developers & API
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your API keys, webhooks, and developer integrations.</p>
        </div>

        {/* Main Content */}
        <div className="p-6 max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6">
          
          {/* API Credentials Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-[#00A884]" /> API Credentials
            </h2>
            <p className="text-sm text-gray-500">Use this API key to authenticate your requests to BaseKey backend services.</p>
            
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input 
                type="password" 
                readOnly 
                value={dummyApiKey} 
                className="bg-transparent font-mono text-sm flex-1 text-gray-700 outline-none"
              />
              <button 
                onClick={() => handleCopy(dummyApiKey, "key")}
                className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedKey ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copiedKey ? "Copied!" : "Copy Key"}
              </button>
            </div>
          </div>

          {/* Webhook Configuration */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Webhook className="w-5 h-5 text-[#00A884]" /> Webhook URL
            </h2>
            <p className="text-sm text-gray-500">Configure this URL in your Meta WhatsApp Developer Dashboard to receive real-time incoming messages.</p>
            
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input 
                type="text" 
                readOnly 
                value={webhookUrl} 
                className="bg-transparent font-mono text-sm flex-1 text-gray-700 outline-none"
              />
              <button 
                onClick={() => handleCopy(webhookUrl, "url")}
                className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copiedUrl ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </div>

          {/* API Example Code */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#00A884]" /> Quick Send Message API (cURL)
            </h2>
            <p className="text-sm text-gray-500">Send a quick text message programmatically using our REST endpoint.</p>
            
            <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`curl -X POST https://superkey-app.vercel.app/api/v1/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "919876543210", "message": "Hello from BaseKey API!"}'`}
            </pre>
          </div>

        </div>
      </div>
    </div>
  );
}
