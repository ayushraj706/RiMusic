"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar"; 
import { 
  LayoutDashboard, Users, Megaphone, Send, 
  TrendingUp, ArrowUpRight, Plus, 
  CheckCircle2, Clock, MessageSquare, Sparkles, Database, Bot, Activity
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

// --- Colors for Crypto Style Graphs ---
const COLORS = ['#00A884', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function DashboardPage() {
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  // --- Real Data State from Prisma ---
  const [stats, setStats] = useState({
    contacts: { total: 0, activeSessions: 0, google: 0, csv: 0, manual: 0 },
    messages: { total: 0, sent: 0, received: 0, readRate: 0 },
    types: { text: 0, media: 0, template: 0, interactive: 0 },
    sources: { chat: 0, flow: 0, api: 0, campaign: 0 },
    system: { botActive: false, activeFlows: 0, approvedTemplates: 0 },
    chartData: [] // For the Crypto-style Area Chart
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserName(currentUser.displayName || currentUser.email?.split("@")[0] || "User");
        setUid(currentUser.uid);
        
        // Fetch real data from our Prisma Database via API
        try {
          const res = await fetch(`/api/dashboard-stats?uid=${currentUser.uid}`);
          if (res.ok) {
            const data = await res.json();
            setStats(data);
          }
        } catch (error) {
          console.error("Failed to fetch dashboard stats", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Media Breakdown Data for Pie Chart
  const pieData = [
    { name: 'Text', value: stats.types.text },
    { name: 'Media (Img/Vid/Doc)', value: stats.types.media },
    { name: 'Templates', value: stats.types.template },
    { name: 'Interactive', value: stats.types.interactive },
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-[#F0F2F5] overflow-hidden pb-[70px] md:pb-0 font-sans text-gray-900 relative">
      
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth">
        
        {/* --- Header --- */}
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40 transition-all duration-300 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
              <Activity className="w-7 h-7 text-[#00A884]" />
              Command Center
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome back, <span className="font-bold text-gray-800 capitalize">{userName}</span>. Here is your real-time API data.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/campaigns" className="bg-[#00A884] hover:bg-[#008f6f] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 shadow-[0_4px_12px_rgba(0,168,132,0.3)] hover:-translate-y-0.5 active:scale-95">
              <Plus className="w-4 h-4" /> New Campaign
            </Link>
          </div>
        </div>

        {/* --- Main Content --- */}
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6">
          
          {/* Banner: System Status */}
          <div className="group bg-gradient-to-br from-gray-900 via-[#075E54] to-[#00A884] rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden relative border border-white/10">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="space-y-2 relative z-10">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md ${stats.system.botActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                <Bot className="w-4 h-4" /> 
                {stats.system.botActive ? "Gemini AI Engine : ONLINE" : "Gemini AI Engine : OFFLINE"}
              </span>
              <h2 className="text-2xl font-black mt-2 tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                {stats.system.botActive ? "Your AI is actively handling chats." : "Activate AI to automate responses."}
              </h2>
              <div className="flex gap-4 text-sm text-white/80 font-medium">
                <span>⚡ Active Flows: {loading ? "..." : stats.system.activeFlows}</span>
                <span>📋 Approved Templates: {loading ? "..." : stats.system.approvedTemplates}</span>
              </div>
            </div>
            <div className="flex gap-3 relative z-10">
              <Link href="/chatbot-builder" className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-gray-900 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:scale-105 active:scale-95">
                Configure Bot
              </Link>
            </div>
          </div>

          {/* --- Metrics Grid --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Contacts Metric */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-[#e8faf0] text-[#00A884] rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-green-100">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Live
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Total Leads</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{loading ? "..." : stats.contacts.total.toLocaleString()}</h3>
                <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-gray-400 bg-gray-50 p-2 rounded-lg">
                  <span className="text-blue-500">Google: {stats.contacts.google}</span> • 
                  <span className="text-orange-500">CSV: {stats.contacts.csv}</span> • 
                  <span className="text-gray-500">Manual: {stats.contacts.manual}</span>
                </div>
              </div>
            </div>

            {/* Total Messages Sent */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Send className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">Outbound</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Messages Sent</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{loading ? "..." : stats.messages.sent.toLocaleString()}</h3>
                <div className="mt-3 text-[11px] font-bold text-gray-400 bg-gray-50 p-2 rounded-lg flex justify-between">
                  <span>Total Volume: {stats.messages.total}</span>
                  <span className="text-green-500 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> High</span>
                </div>
              </div>
            </div>

            {/* Read Rate */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">Conversion</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Avg Read Rate</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{loading ? "..." : `${stats.messages.readRate}%`}</h3>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.messages.readRate}%` }}></div>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">Real-time</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Active Sessions</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{loading ? "..." : stats.contacts.activeSessions}</h3>
                <p className="text-[12px] font-bold text-orange-500 mt-3 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Chats active right now
                </p>
              </div>
            </div>
          </div>

          {/* --- Charts Section (Crypto Style) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Main Area Chart: Message Volume */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Message Volume Flow</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last 7 Days (Sent vs Received)</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">Loading Engine Data...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        {/* Smooth Gradients just like Binance/Crypto apps */}
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00A884" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00A884" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{fontSize: 12, fontWeight: 600, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fontWeight: 600, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="sent" stroke="#00A884" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                      <Area type="monotone" dataKey="received" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorReceived)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Donut Chart: Message Formats Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
              <div>
                <h3 className="text-lg font-black text-gray-900">Message Content</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Format Breakdown</p>
              </div>
              <div className="flex-1 h-[250px] w-full mt-4 flex items-center justify-center">
                {loading ? (
                  <div className="text-gray-400 font-bold">Processing...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* --- Source Breakdown (Bar Chart) --- */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-10">
            <h3 className="text-lg font-black text-gray-900">Traffic Source Distribution</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Chat vs Bot vs Campaign</p>
            <div className="h-[200px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">Fetching Analytics...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Manual Chat', volume: stats.sources.chat, fill: '#00A884' },
                      { name: 'Flow Builder', volume: stats.sources.flow, fill: '#3B82F6' },
                      { name: 'API Triggers', volume: stats.sources.api, fill: '#8B5CF6' },
                      { name: 'Bulk Campaigns', volume: stats.sources.campaign, fill: '#F59E0B' },
                    ]}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#374151'}} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="volume" radius={[0, 8, 8, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
