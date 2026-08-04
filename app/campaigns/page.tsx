"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar"; 
import { 
  Plus, Search, Filter, MoreVertical, 
  CheckCircle2, Clock, PlayCircle, Megaphone, 
  Users, BarChart2, FileText, X, ArrowRight, Calendar,
  Sparkles, PauseCircle, Download, Loader2
} from "lucide-react";

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [campName, setCampName] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // 1. Fetch Real Data from Database
  const fetchData = async () => {
    try {
      setLoading(true);
      // Backend API (jo hum Step 3 mein banayenge)
      const resCamp = await fetch("/api/campaigns");
      if (resCamp.ok) {
        const data = await resCamp.json();
        setCampaigns(data.campaigns || []);
      }
      
      // Template fetch (WhatsApp API se aayenge)
      const resTemp = await fetch("/api/templates");
      if (resTemp.ok) {
        const temp = await resTemp.json();
        setTemplates(temp.templates || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  // 2. Create New Campaign Logic
  const handleCreateCampaign = async () => {
    if (!campName || !selectedTemplate) {
      alert("Please fill all required fields!");
      return;
    }
    
    setIsCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campName,
          audienceType: targetAudience,
          template: selectedTemplate,
          status: "running"
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setCampName("");
        setSelectedTemplate("");
        fetchData(); // List refresh karo
      } else {
        alert("Failed to create campaign");
      }
    } catch (error) {
      console.error("Creation error:", error);
    } finally {
      setIsCreating(false);
    }
  };

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
  const filteredCampaigns = campaigns.filter(camp => {
    const matchesSearch = camp.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || camp.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex h-[100dvh] w-full bg-[#F5F7F9] overflow-hidden pb-[70px] md:pb-0 font-sans text-gray-900 relative">
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth">
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-5 flex items-center justify-between sticky top-0 z-10 transition-all duration-300">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-[#00A884]" /> Campaigns
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

        <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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

            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="relative w-full max-w-md group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00A884] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search campaigns..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#00A884]"
                />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00A884] mb-3" />
                  <p className="text-sm font-medium">Loading production data...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Campaign Info</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Audience</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Performance</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-400">
                          <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No campaigns found.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCampaigns.map((campaign, index) => {
                        const readPercentage = campaign.sent > 0 ? Math.round((campaign.read / campaign.sent) * 100) : 0;
                        
                        return (
                          <tr key={campaign.id} className="hover:bg-gray-50/80 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-bold text-gray-900 group-hover:text-[#00A884] transition-colors">{campaign.name}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> {campaign.template}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(campaign.status)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                              <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" />{campaign.audience.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-36">
                                <div className="flex justify-between text-[11px] mb-1.5 font-semibold text-gray-600">
                                  <span>Read Rate</span>
                                  <span className={readPercentage > 50 ? "text-[#00A884]" : "text-gray-500"}>{readPercentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-[#00A884] h-1.5 rounded-full transition-all" style={{ width: `${readPercentage}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400">
                              <MoreVertical className="w-4 h-4 ml-auto cursor-pointer hover:text-[#00A884]" />
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Megaphone className="w-5 h-5 text-[#00A884]" /> Create New Campaign</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-6 bg-gray-50/30">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Campaign Name *</label>
                  <input 
                    type="text" 
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    placeholder="e.g. Summer Sale 2026" 
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#00A884]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Audience *</label>
                    <select 
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#00A884]"
                    >
                      <option value="all">All Contacts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Template *</label>
                    <select 
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#00A884]"
                    >
                      <option value="">Select template...</option>
                      {templates.length > 0 ? templates.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      )) : <option value="hello_world">hello_world (Default)</option>}
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end bg-white gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button 
                  onClick={handleCreateCampaign}
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-[#00A884] text-white text-sm font-bold rounded-xl flex items-center gap-2 disabled:opacity-70"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {isCreating ? "Sending..." : "Send Campaign"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
