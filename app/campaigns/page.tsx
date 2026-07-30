"use client";

import React, { useState } from "react";
import { 
  Plus, Search, Filter, MoreVertical, 
  CheckCircle2, Clock, PlayCircle, Megaphone, 
  Users, BarChart2, FileText, X, ArrowRight, Calendar
} from "lucide-react"; // 🔥 FileText aur Modal ke icons add kiye

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
  // 🔥 Modal State Add kiya
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to render Status Badges
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold capitalize"><CheckCircle2 className="w-3.5 h-3.5" /> {status}</span>;
      case "running":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold capitalize"><PlayCircle className="w-3.5 h-3.5" /> {status}</span>;
      case "scheduled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold capitalize"><Clock className="w-3.5 h-3.5" /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold capitalize"> {status}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F5F7F9] text-gray-800 font-sans relative">
      
      {/* ─── Header Section ─── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#00A884]" />
            Campaigns
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all your bulk WhatsApp broadcasts.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} // 🔥 Button par click function
          className="bg-[#00A884] hover:bg-[#008f6f] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Campaign
        </button>
      </div>

      {/* ─── Main Content Area ─── */}
      <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        
        {/* ─── Quick Stats Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600"><CheckCircle2 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Messages Sent (30 Days)</p>
              <h3 className="text-2xl font-bold text-gray-900">5,800</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><BarChart2 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Avg. Read Rate</p>
              <h3 className="text-2xl font-bold text-gray-900">82.5%</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Scheduled Campaigns</p>
              <h3 className="text-2xl font-bold text-gray-900">1</h3>
            </div>
          </div>
        </div>

        {/* ─── Table Section ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          
          {/* Table Controls */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search campaigns by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] bg-white"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          {/* Actual Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Audience</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DUMMY_CAMPAIGNS.map((campaign) => {
                  const readPercentage = campaign.sent > 0 ? Math.round((campaign.read / campaign.sent) * 100) : 0;
                  
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-900">{campaign.name}</p>
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
                          <div className="w-32">
                            <div className="flex justify-between text-[11px] mb-1 font-semibold text-gray-600">
                              <span>Read</span>
                              <span className={readPercentage > 50 ? "text-[#00A884]" : "text-gray-500"}>{readPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-[#00A884] h-1.5 rounded-full" style={{ width: `${readPercentage}%` }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Delivered: {campaign.delivered}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{campaign.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 text-gray-400 hover:text-[#00A884] hover:bg-green-50 rounded-full transition">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── CREATE CAMPAIGN MODAL (NEW) ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
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
            <div className="p-6 space-y-6">
              
              {/* Step 1: Campaign Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Campaign Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Summer Sale 2026" 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] transition"
                />
              </div>

              {/* Step 2: Audience & Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Audience</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] text-gray-600 appearance-none">
                    <option value="">Select a segment...</option>
                    <option value="all">All Contacts (5,000)</option>
                    <option value="active">Active Customers (2,100)</option>
                    <option value="leads">New Leads (850)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Template</label>
                  <button className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-left text-gray-500 hover:border-[#00A884] transition flex items-center justify-between">
                    <span>Select approved template...</span>
                    <FileText className="w-4 h-4 opacity-50" />
                  </button>
                </div>
              </div>

              {/* Step 3: Schedule */}
              <div className="bg-[#E8F8F5]/50 border border-[#b7e8cc] p-4 rounded-xl">
                <h4 className="text-sm font-bold text-[#075E54] flex items-center gap-1.5 mb-3">
                  <Calendar className="w-4 h-4" /> Send Schedule
                </h4>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input type="radio" name="schedule" defaultChecked className="w-4 h-4 text-[#00A884] focus:ring-[#00A884]" />
                    Send Immediately
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer opacity-50">
                    <input type="radio" name="schedule" disabled className="w-4 h-4 text-[#00A884] focus:ring-[#00A884]" />
                    Schedule for later (Pro)
                  </label>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button className="px-5 py-2.5 bg-[#00A884] hover:bg-[#008f6f] text-white text-sm font-bold rounded-xl transition shadow-sm flex items-center gap-2">
                Continue to Preview <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
