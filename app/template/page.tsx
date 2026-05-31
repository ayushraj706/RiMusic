"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TemplateBuilderUI from "@/components/template-builder/TemplateBuilderUI";
import { 
  FileText, 
  Megaphone, 
  Bell, 
  Key, 
  Plus, 
  ArrowLeft, 
  Eye, 
  CheckCircle2, 
  Clock 
} from "lucide-react";

// ─── Dummy Data (Baad mein Firebase se aayega) ───
const DUMMY_TEMPLATES = [
  { id: "1", name: "order_confirmation", category: "UTILITY", language: "en_US", status: "APPROVED", date: "12 May 2026" },
  { id: "2", name: "diwali_mega_sale", category: "MARKETING", language: "hi", status: "APPROVED", date: "15 May 2026" },
  { id: "3", name: "otp_verification", category: "AUTHENTICATION", language: "en_US", status: "PENDING", date: "20 May 2026" },
  { id: "4", name: "welcome_message", category: "MARKETING", language: "en_US", status: "REJECTED", date: "25 May 2026" },
];

export default function TemplatePage() {
  // State for current view and data
  const [activeView, setActiveView] = useState<"list" | "create" | "detail">("list");
  const [templates, setTemplates] = useState(DUMMY_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // ─── Android Back Button Logic (Hash History) ───
  useEffect(() => {
    // URL Hash padh kar state set karega
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'create') {
        setActiveView('create');
      } else if (hash === 'detail') {
        setActiveView('detail');
      } else {
        setActiveView('list');
      }
    };

    // First load par check karo
    handleHashChange();

    // Event listener lagao back button ke liye
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ─── Navigation Handlers ───
  const goToList = () => {
    window.location.hash = ''; // Clear hash (Goes back to list)
  };

  const goToCreate = () => {
    window.location.hash = 'create'; // Adds to browser history
  };

  const goToDetail = (tpl: any) => {
    setSelectedTemplate(tpl);
    window.location.hash = 'detail'; // Adds to browser history
  };

  // ─── Analytics ───
  const totalTemplates = templates.length;
  const marketingCount = templates.filter(t => t.category === "MARKETING").length;
  const utilityCount = templates.filter(t => t.category === "UTILITY").length;
  const authCount = templates.filter(t => t.category === "AUTHENTICATION").length;

  const handleSaveNewTemplate = (payload: any) => {
    const newTemplate = {
      id: Math.random().toString(),
      name: payload.name,
      category: payload.category,
      language: payload.language,
      status: "PENDING", 
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    
    setTemplates([newTemplate, ...templates]);
    goToList();
    alert("Template Saved & Submitted to Meta!");
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F6] overflow-hidden pb-[70px] md:pb-0 font-sans text-gray-900">
      
      {/* Sidebar Navigation */}
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        
        {/* ═══════════════════════════════════════════════════════════════
            VIEW 1: LIST DASHBOARD
        ════════════════════════════════════════════════════════════════ */}
        {activeView === "list" && (
          <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div>
                <h1 className="text-2xl font-black text-[#111B21]">Message Templates</h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">Manage and create official WhatsApp templates.</p>
              </div>
              <button 
                onClick={goToCreate}
                className="flex items-center gap-2 bg-[#00A884] hover:bg-[#008f6f] text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-[#00A884]/20 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" /> Create Template
              </button>
            </div>

            {/* Category Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F0F2F5] text-gray-600 flex items-center justify-center"><FileText className="w-5 h-5"/></div>
                <div><p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Total</p><p className="text-xl font-black text-gray-800">{totalTemplates}</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Megaphone className="w-5 h-5"/></div>
                <div><p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Marketing</p><p className="text-xl font-black text-gray-800">{marketingCount}</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center"><Bell className="w-5 h-5"/></div>
                <div><p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Utility</p><p className="text-xl font-black text-gray-800">{utilityCount}</p></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Key className="w-5 h-5"/></div>
                <div><p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Auth</p><p className="text-xl font-black text-gray-800">{authCount}</p></div>
              </div>
            </div>

            {/* Template List Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F0F2F5] text-[#54656F] text-[11px] font-extrabold uppercase tracking-widest">
                      <th className="p-4">Template Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Language</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {templates.map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-900 text-[14px]">{tpl.name}</p>
                          <p className="text-xs text-gray-400 mt-1 font-medium">Created on {tpl.date}</p>
                        </td>
                        <td className="p-4">
                          <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-gray-200">
                            {tpl.category}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold text-gray-600">{tpl.language}</td>
                        <td className="p-4">
                          {tpl.status === "APPROVED" && <span className="flex items-center gap-1.5 text-[#00A884] bg-[#00A884]/10 px-3 py-1.5 rounded-full text-[11px] font-bold w-fit"><CheckCircle2 className="w-3.5 h-3.5"/> Approved</span>}
                          {tpl.status === "PENDING" && <span className="flex items-center gap-1.5 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full text-[11px] font-bold w-fit border border-yellow-100"><Clock className="w-3.5 h-3.5"/> Pending</span>}
                          {tpl.status === "REJECTED" && <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-full text-[11px] font-bold w-fit border border-red-100"><Clock className="w-3.5 h-3.5"/> Rejected</span>}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => goToDetail(tpl)}
                            className="text-[#00A884] hover:bg-[#00A884]/10 p-2 rounded-lg transition-colors font-bold text-sm flex items-center gap-1.5 ml-auto"
                          >
                            <Eye className="w-4 h-4"/> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            VIEW 2: CREATE TEMPLATE FORM
        ════════════════════════════════════════════════════════════════ */}
        {activeView === "create" && (
          <div className="flex flex-col h-full w-full bg-white relative z-10">
            {/* Manual UI Back Button */}
            <div className="absolute top-3 md:top-4 left-4 md:left-[350px] lg:left-[450px] xl:left-[500px] z-50">
              <button 
                onClick={goToList}
                className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 font-bold text-[13px] active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-[#00A884]" /> Back
              </button>
            </div>
            
            <div className="flex-1 w-full">
              <TemplateBuilderUI onSave={handleSaveNewTemplate} />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            VIEW 3: DETAIL VIEW
        ════════════════════════════════════════════════════════════════ */}
        {activeView === "detail" && selectedTemplate && (
          <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
            <button 
              onClick={goToList}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-6 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm w-fit"
            >
              <ArrowLeft className="w-4 h-4 text-[#00A884]" /> Back to Templates
            </button>
            
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-100 pb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedTemplate.name}</h2>
                  <p className="text-gray-400 text-sm mt-1 font-medium">Submitted on {selectedTemplate.date}</p>
                </div>
                <div>
                  <span className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border ${
                    selectedTemplate.status === "APPROVED" ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]" :
                    selectedTemplate.status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {selectedTemplate.status === "APPROVED" && <CheckCircle2 className="w-4 h-4"/>}
                    {selectedTemplate.status}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Category</label>
                  <p className="text-gray-800 font-black mt-1 text-[15px]">{selectedTemplate.category}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Language</label>
                  <p className="text-gray-800 font-black mt-1 text-[15px]">{selectedTemplate.language}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <label className="text-[11px] font-extrabold text-blue-400 uppercase tracking-widest block mb-2">Meta API Notice</label>
                <p className="text-[13px] text-blue-800 font-medium leading-relaxed">
                  Yeh template successfully Meta WhatsApp API ke through process ho chuka hai. 
                  Approved templates ko edit nahi kiya ja sakta, kisi change ke liye naya template banayein.
                </p>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
