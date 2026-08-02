"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar"; 
import { Code2, Key, Webhook, Copy, Check, Terminal, Eye, EyeOff, Plus, FileText, Database } from "lucide-react";

// API का टाइप डिफ़ाइन कर रहे हैं
interface SavedAPI {
  id: string;
  templateName: string;
  apiKey: string;
  createdAt: Date;
}

export default function DevelopersPage() {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>({});
  
  // डमी टेम्प्लेट्स (इसे तुम बाद में Firebase से फैच कर सकते हो)
  const availableTemplates = ["hello_world", "apk_build_status", "order_confirmation", "otp_verification"];
  
  const [selectedTemplate, setSelectedTemplate] = useState(availableTemplates[0]);
  const [savedApis, setSavedApis] = useState<SavedAPI[]>([]);

  const webhookUrl = "https://superkey-app.vercel.app/api/webhook/whatsapp";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generateNewApi = () => {
    if (!selectedTemplate) return;
    
    // नया रैंडम API Key जनरेट कर रहे हैं
    const newKey = "bk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const newApi: SavedAPI = {
      id: Math.random().toString(36).substring(2, 9),
      templateName: selectedTemplate,
      apiKey: newKey,
      createdAt: new Date(),
    };

    // नए API को लिस्ट में सबसे ऊपर जोड़ रहे हैं
    setSavedApis([newApi, ...savedApis]);
    
    // TODO: यहाँ तुम Firebase में भी इसे सेव कर सकते हो
    // set(ref(database, `users/{uid}/apiKeys/{newApi.id}`), newApi);
  };

  const deleteApi = (id: string) => {
    setSavedApis(savedApis.filter(api => api.id !== id));
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#F5F7F9] overflow-hidden pb-[70px] md:pb-0 font-sans text-gray-900 relative">
      
      {/* ─── Sidebar Navigation ─── */}
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Code2 className="w-6 h-6 text-[#00A884]" />
              Developers & API
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage API keys, webhooks, and trigger templates.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6">
          
          {/* Webhook Configuration (Global) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
              <Webhook className="w-5 h-5 text-[#00A884]" /> Global Webhook URL
            </h2>
            <p className="text-sm text-gray-500 mb-4">Configure this in Meta Dashboard to receive real-time messages.</p>
            
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input type="text" readOnly value={webhookUrl} className="bg-transparent font-mono text-sm flex-1 text-gray-700 outline-none" />
              <button onClick={() => handleCopy(webhookUrl, "webhook")} className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                {copiedStates["webhook"] ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copiedStates["webhook"] ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Generate New Template API */}
          <div className="bg-[#00A884]/5 rounded-2xl border border-[#00A884]/20 p-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#00A884]" /> Select Template to Generate API
              </label>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#00A884]/20 focus:border-[#00A884] shadow-sm"
              >
                {availableTemplates.map(tpl => (
                  <option key={tpl} value={tpl}>{tpl}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={generateNewApi}
              className="w-full md:w-auto bg-[#00A884] hover:bg-[#009172] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" /> Generate API Key
            </button>
          </div>

          {/* Saved APIs List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#00A884]" /> Active API Keys
            </h2>
            
            {savedApis.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-500">
                Generate an API key above to see it here.
              </div>
            ) : (
              savedApis.map((api) => (
                <div key={api.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Target Template</p>
                      <p className="font-bold text-gray-900">{api.templateName}</p>
                    </div>
                    <button onClick={() => deleteApi(api.id)} className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg font-semibold transition">
                      Revoke API
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* API Key Field with Masking */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">API Key (Keep Secret)</label>
                      <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                        <Key className="w-4 h-4 text-gray-400 ml-1" />
                        <input 
                          type={visibleKeys[api.id] ? "text" : "password"} 
                          readOnly 
                          value={api.apiKey} 
                          className="bg-transparent font-mono text-sm flex-1 text-gray-800 outline-none select-all"
                        />
                        <button onClick={() => toggleKeyVisibility(api.id)} className="p-1.5 text-gray-400 hover:text-gray-700 transition">
                          {visibleKeys[api.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleCopy(api.apiKey, `key-${api.id}`)} className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                          {copiedStates[`key-${api.id}`] ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          {copiedStates[`key-${api.id}`] ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* cURL Example */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Terminal className="w-4 h-4" /> Example cURL Request
                      </label>
                      <div className="relative group">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`curl -X POST https://superkey-app.vercel.app/api/v1/trigger \\
  -H "Authorization: Bearer ${visibleKeys[api.id] ? api.apiKey : "bk_live_************************"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template": "${api.templateName}",
    "phone": "919876543210",
    "variables": ["var1", "var2"]
  }'`}
                        </pre>
                        <button 
                          onClick={() => handleCopy(`curl -X POST https://superkey-app.vercel.app/api/v1/trigger -H "Authorization: Bearer ${api.apiKey}" -H "Content-Type: application/json" -d '{"template": "${api.templateName}", "phone": "919876543210", "variables": []}'`, `curl-${api.id}`)}
                          className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm transition"
                        >
                          {copiedStates[`curl-${api.id}`] ? "Copied!" : "Copy Code"}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
