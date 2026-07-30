"use client";

import React, { useState } from "react";
// 👇 YAHAN SIDEBAR IMPORT KIYA HAI
import Sidebar from "@/components/Sidebar"; 
import { 
  Plus, Search, Filter, MoreVertical, 
  CheckCircle2, Clock, PlayCircle, Megaphone, 
  Users, BarChart2, FileText, X, ArrowRight, Calendar,
  Sparkles, PauseCircle, Download
} from "lucide-react";

// ─── Dummy Data for UI Preview ─────────────────────────────────────────────
const DUMMY_CAMPAIGNS = [
  {
    id: "camp_001",
    name: "Diwali Mega Sale 2026",
    template: "diwali_offer_01",
    status: "completed",
    audience: 5000,
    sent: 5000,
    delivered: 4950,
    read: 4200,
    date: "28 Jul 2026, 10:00 AM",
  },
  {
    id: "camp_002",
    name: "New Signup Welcome",
    template: "welcome_message",
    status: "running",
    audience: 1200,
    sent: 800,
    delivered: 790,
    read: 300,
    date: "30 Jul 2026, 09:00 AM",
  },
  {
    id: "camp_003",
    name: "August Subscription Renewal",
    template: "payment_reminder",
    status: "scheduled",
    audience: 350,
    sent: 0,
    delivered: 0,
    read: 0,
    date: "01 Aug 2026, 11:30 AM",
  },
  {
    id: "camp_004",
    name: "Inactive Users Reactivation",
    template: "miss_you_discount",
    status: "draft",
    audience: 850,
    sent: 0,
    delivered: 0,
    read: 0,
    date: "-",
  },
];

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to render Status Badges
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold capitalize"><CheckCircle2 className="w-3.5 h-3.5" /> {status}</span>;
      case "running":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold capitalize"><PlayCircle className="w-3.5 h-3.5 animate-pulse" /> {status}</span>;
      case "scheduled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold capitalize"><Clock className="w-3.5 h-3.5" /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold capitalize"> {status}</span>;
    }
  };

  // Filter Logic
  const filteredCampaigns = DUMMY_CAMPAIGNS.filter(camp => {
    const matchesSearch = camp.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || camp.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    // 👇 MAIN WRAPPER (SideBar fix rakhne ke liye)
    <div className="flex h-[100dvh] w-full bg-[#F5F7F9] overflow-hidden pb-[70px] md:pb-0 font-sans text-gray-900 relative">
      
      {/* ─── Sidebar Navigation ─── */}
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      {/* ─── Main Content Area (Scrollable) ─── */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth">
        
        {/* ─── Header Section ─── */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-5 flex items-center justify-between sticky top-0 z-10 transition-all duration-300">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-[#00A884]" />
              Campaigns
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track all your bulk WhatsApp broadcasts.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00A884] hover:bg-[#008f6f] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Create Campaign
          </button>
        </div>

        {/* ─── Main Content ─── */}
        <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          
          {/* ─── Quick Stats Cards (With Animations) ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                  <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Messages Sent (30 Days)</p>
                  <h3 className="text-2xl font-bold text-gray-900">5,800</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <BarChart2 className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg. Read Rate</p>
                  <h3 className="text-2xl font-bold text-gray-900">82.5%</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                  <Clock className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Scheduled Campaigns</p>
                  <h3 className="text-2xl font-bold text-gray-900">1</h3>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Table Section ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Tabs for Filtering */}
            <div className="flex items-center gap-6 px-6 pt-4 border-b border-gray-100 bg-gray-50/50">
              {["all", "running", "scheduled", "completed", "draft"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)} 
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors capitalize ${activeTab === tab ? "border-[#00A884] text-[#00A884]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Table Controls */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="relative w-full max-w-md group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00A884] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search campaigns by name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] bg-gray-50/50 focus:bg-white transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>

            {/* Actual Table */}
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign Info</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Audience</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No campaigns found in this category.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((campaign, index) => {
                      const readPercentage = campaign.sent > 0 ? Math.round((campaign.read / campaign.sent) * 100) : 0;
                      
                      return (
                        <tr key={campaign.id} className="hover:bg-gray-50/80 transition-colors group" style={{ animationDelay: `${index * 100}ms` }}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-gray-900 group-hover:text-[#00A884] transition-colors">{campaign.name}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {campaign.template}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(campaign.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                              <Users className="w-4 h-4 text-gray-400" />
                              {campaign.audience.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {campaign.status === "draft" || campaign.status === "scheduled" ? (
                              <span className="text-sm text-gray-400 italic">No data yet</span>
                            ) : (
                              <div className="w-36">
                                <div className="flex justify-between text-[11px] mb-1.5 font-semibold text-gray-600">
                                  <span>Read Rate</span>
                                  <span className={readPercentage > 50 ? "text-[#00A884]" : "text-gray-500"}>{readPercentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  {/* Progress bar smooth fill animation */}
                                  <div 
                                    className="bg-[#00A884] h-1.5 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${readPercentage}%` }}
                                  ></div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1.5">Delivered: {campaign.delivered.toLocaleString()}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{campaign.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {campaign.status === "running" && (
                                <button title="Pause Campaign" className="p-2 text-orange-400 hover:bg-orange-50 rounded-full transition"><PauseCircle className="w-4 h-4" /></button>
                              )}
                              <button title="Export Report" className="p-2 text-blue-400 hover:bg-blue-50 rounded-full transition"><Download className="w-4 h-4" /></button>
                              <button title="More Options" className="p-2 text-gray-400 hover:text-[#00A884] hover:bg-green-50 rounded-full transition"><MoreVertical className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── CREATE CAMPAIGN MODAL (ENHANCED) ─── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A884] to-blue-500"></div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#00A884]" />
                  Create New Campaign
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <div className="p-6 space-y-6 bg-gray-50/30">
                
                {/* Step 1: Campaign Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Campaign Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Summer Sale 2026" 
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] transition shadow-sm"
                  />
                </div>

                {/* Step 2: Audience & Template Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Audience <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] text-gray-700 appearance-none shadow-sm cursor-pointer hover:border-gray-300 transition">
                        <option value="">Select a segment...</option>
                        <option value="all">All Contacts (5,000)</option>
                        <option value="active">Active Customers (2,100)</option>
                        <option value="leads">New Leads (850)</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDownIcon />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Template <span className="text-red-500">*</span></label>
                    <button className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-left text-gray-500 hover:border-[#00A884] hover:text-[#00A884] transition flex items-center justify-between shadow-sm group">
                      <span>Select approved template...</span>
                      <FileText className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </button>
                  </div>
                </div>

                {/* Step 3: Schedule & Cost Estimation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:border-[#00A884] transition-colors cursor-pointer group">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-1 group-hover:text-[#00A884]">
                      <Calendar className="w-4 h-4" /> Send Now
                    </h4>
                    <p className="text-xs text-gray-500">Broadcast will start immediately after confirmation.</p>
                    <div className="mt-3 flex justify-end">
                      <div className="w-4 h-4 rounded-full border-4 border-[#00A884] bg-white"></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm opacity-60 cursor-not-allowed">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-1">
                      <Clock className="w-4 h-4" /> Schedule (Pro)
                    </h4>
                    <p className="text-xs text-gray-500">Pick a specific date and time to run this campaign automatically.</p>
                    <div className="mt-3 flex justify-end">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white"></div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> Auto-deduplication enabled
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button className="px-6 py-2.5 bg-[#00A884] hover:bg-[#008f6f] text-white text-sm font-bold rounded-xl transition shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                    Preview & Send <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Small helper component for the select dropdown arrow
function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
