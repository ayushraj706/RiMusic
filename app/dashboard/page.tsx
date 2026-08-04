"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
// 🔥 NAYA: Firebase hata kar NextAuth import kiya
import { useSession } from "next-auth/react"; 
import Sidebar from "@/components/Sidebar"; 
import { 
  Users, Send, CheckCircle2, Sparkles, Bot, 
  Activity, ArrowDownToLine, ArrowUpFromLine, Key,
  TrendingUp, TrendingDown, RefreshCw, FileText, MapPin, 
  Image as ImageIcon, Mic, MessageSquare, Video, Sticker, Globe
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// Premium Light Mode Colors
const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export default function DashboardPage() {
  const { data: session, status } = useSession(); // NextAuth se session liya
  
  const [userName, setUserName] = useState("Ayush");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("7d"); // 24h, 7d, 15d, 30d
  
  // 100% Real Data State (Zero Dummy)
  const [data, setData] = useState<any>({
    contacts: { total: 0, google: 0, csv: 0, manual: 0 },
    system: { botActive: false, activeFlows: 0, approvedTemplates: 0, activeApiKeys: 0, activeSessions: 0 },
    outbound: { total: 0, read: 0, delivered: 0, sent: 0, chat: 0, flow: 0, api: 0, campaign: 0 },
    inbound: { total: 0, text: 0, image: 0, video: 0, document: 0, audio: 0, location: 0, sticker: 0, interactive: 0 },
    types: { template: 0, text: 0, media: 0, interactive: 0 },
    readRate: 0,
    chartData: []
  });

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await fetch(`/api/dashboard-stats?range=${timeRange}`);
      if (res.ok) {
        const stats = await res.json();
        setData((prev: any) => ({ ...prev, ...stats }));
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  // 🔥 NAYA: Auth Status check (NextAuth based)
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Name set karega (Google name ya email ka pehla hissa)
      setUserName(session.user.name || session.user.email?.split("@")[0] || "Ayush");
      fetchStats();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session, fetchStats]);

  // --- 🚀 TREND CALCULATOR ---
  const { isTrendUp, trendColor } = useMemo(() => {
    if (!data?.chartData || data.chartData.length < 2) return { isTrendUp: true, trendColor: '#00A884' }; 
    const latest = data.chartData[data.chartData.length - 1] || {};
    const previous = data.chartData[data.chartData.length - 2] || {};
    const isUp = (latest.sent || 0) >= (previous.sent || 0);
    return {
      isTrendUp: isUp,
      trendColor: isUp ? '#00A884' : '#EF4444' 
    };
  }, [data?.chartData]);

  // Chart Formatting Data
  const inboundPieData = [
    { name: 'Text', value: data?.inbound?.text || 0, icon: <MessageSquare className="w-3 h-3"/> },
    { name: 'Images', value: data?.inbound?.image || 0, icon: <ImageIcon className="w-3 h-3"/> },
    { name: 'Videos', value: data?.inbound?.video || 0, icon: <Video className="w-3 h-3"/> },
    { name: 'Documents', value: data?.inbound?.document || 0, icon: <FileText className="w-3 h-3"/> },
    { name: 'Audio', value: data?.inbound?.audio || 0, icon: <Mic className="w-3 h-3"/> },
    { name: 'Location', value: data?.inbound?.location || 0, icon: <MapPin className="w-3 h-3"/> },
    { name: 'Stickers', value: data?.inbound?.sticker || 0, icon: <Sticker className="w-3 h-3"/> },
    { name: 'Interactive', value: data?.inbound?.interactive || 0, icon: <Globe className="w-3 h-3"/> },
  ].filter(item => item.value > 0);

  const outboundSourceData = [
    { name: 'Manual Chat', volume: data?.outbound?.chat || 0, fill: '#00A884' },
    { name: 'Flow Builder', volume: data?.outbound?.flow || 0, fill: '#3B82F6' },
    { name: 'API Triggers', volume: data?.outbound?.api || 0, fill: '#8B5CF6' },
    { name: 'Campaigns', volume: data?.outbound?.campaign || 0, fill: '#F59E0B' },
  ].filter(item => item.volume > 0);

  return (
    <div className="flex h-[100dvh] w-full bg-[#F3F4F6] text-gray-900 overflow-hidden pb-[70px] md:pb-0 font-sans relative selection:bg-green-100">
      
      {/* Sidebar */}
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth no-scrollbar">
        
        {/* --- 🌟 HEADER WITH REFRESH & FILTERS --- */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 text-gray-800 tracking-tight">
              <Activity className="w-7 h-7 text-[#00A884]" /> Command Center
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, <span className="font-bold text-gray-700">{userName}</span>. Here is your highly detailed WhatsApp API report.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchStats(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all shadow-sm border border-gray-200 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00A884]' : ''}`} />
              {refreshing ? 'Syncing...' : 'Refresh'}
            </button>

            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
              {['24h', '7d', '15d', '30d'].map((range) => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-black transition-all ${
                    timeRange === range 
                      ? 'bg-white text-[#00A884] shadow-sm border border-gray-200' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6">
          
          {/* --- 📊 TOP KPI CARDS --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* 1. Outbound */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00A884] opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 text-[#00A884] rounded-xl flex items-center justify-center border border-green-100">
                  <ArrowUpFromLine className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">Outbound</span>
              </div>
              <div>
                <h3 className="text-4xl font-black text-gray-800">{loading ? "..." : (data?.outbound?.total || 0)}</h3>
                <p className="text-sm font-bold text-gray-500 mt-1">Total Messages Sent</p>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                <div className="bg-gray-50 py-1.5 rounded-lg border border-gray-100">
                  <span className="text-gray-400 block text-[9px] uppercase">Sent</span>
                  <span className="text-gray-700">{data?.outbound?.sent || 0}</span>
                </div>
                <div className="bg-blue-50 py-1.5 rounded-lg border border-blue-100">
                  <span className="text-blue-400 block text-[9px] uppercase">Delivered</span>
                  <span className="text-blue-600">{data?.outbound?.delivered || 0}</span>
                </div>
                <div className="bg-purple-50 py-1.5 rounded-lg border border-purple-100">
                  <span className="text-purple-400 block text-[9px] uppercase">Read</span>
                  <span className="text-purple-600">{data?.outbound?.read || 0}</span>
                </div>
              </div>
            </div>

            {/* 2. Inbound */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#3B82F6] opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 text-[#3B82F6] rounded-xl flex items-center justify-center border border-blue-100">
                  <ArrowDownToLine className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">Inbound</span>
              </div>
              <div>
                <h3 className="text-4xl font-black text-gray-800">{loading ? "..." : (data?.inbound?.total || 0)}</h3>
                <p className="text-sm font-bold text-gray-500 mt-1">Total Messages Received</p>
              </div>
              <div className="mt-5 flex gap-2 text-[11px] font-bold">
                <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg flex-1 text-center border border-gray-200">
                  Text: {data?.inbound?.text || 0}
                </span>
                <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg flex-1 text-center border border-orange-200">
                  Media: {(data?.inbound?.image || 0) + (data?.inbound?.video || 0) + (data?.inbound?.document || 0) + (data?.inbound?.audio || 0)}
                </span>
              </div>
            </div>

            {/* 3. Contacts */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-pink-50 text-[#EC4899] rounded-xl flex items-center justify-center border border-pink-100">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Live
                </span>
              </div>
              <div>
                <h3 className="text-4xl font-black text-gray-800">{loading ? "..." : (data?.contacts?.total || 0)}</h3>
                <p className="text-sm font-bold text-gray-500 mt-1">Total Unique Contacts</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 text-center text-[11px] font-bold">
                <div className="bg-gray-50 py-1.5 rounded-lg border border-gray-100">
                  <span className="text-gray-400 block text-[9px] uppercase">Google Sync</span>
                  <span className="text-gray-700">{data?.contacts?.google || 0}</span>
                </div>
                <div className="bg-gray-50 py-1.5 rounded-lg border border-gray-100">
                  <span className="text-gray-400 block text-[9px] uppercase">CSV / API</span>
                  <span className="text-gray-700">{data?.contacts?.csv || 0}</span>
                </div>
              </div>
            </div>

            {/* 4. Read Rate */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-50 text-[#10B981] rounded-xl flex items-center justify-center border border-green-100">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-4xl font-black text-gray-800">{loading ? "..." : `${data?.readRate || 0}%`}</h3>
                <p className="text-sm font-bold text-gray-500 mt-1">Average Read Rate</p>
              </div>
              <div className="mt-5">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                  <span>0%</span>
                  <span>Based on Delivered</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
                  <div className="bg-gradient-to-r from-[#10B981] to-[#00A884] h-full rounded-full transition-all duration-1000" style={{ width: `${data?.readRate || 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* --- 📈 MAIN GRAPH --- */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                  Message Traffic Over Time
                  {!loading && data?.chartData?.length >= 2 && (
                    <span className={`flex items-center text-xs px-2.5 py-1 rounded-full border font-bold ${isTrendUp ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {isTrendUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                      {isTrendUp ? 'Upward Trend' : 'Downward Trend'}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1 tracking-widest">Selected Timeline: {timeRange.toUpperCase()}</p>
              </div>
            </div>
            
            <div className="h-[350px] w-full mt-4">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold animate-pulse">Extracting Data...</div>
              ) : !data?.chartData || data.chartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">No activity in this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={trendColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{fontSize: 11, fill: '#6B7280', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 11, fill: '#6B7280', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#1F2937', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} 
                      itemStyle={{ fontWeight: 'black' }}
                    />
                    <Area type="monotone" dataKey="sent" name="Outbound" stroke={trendColor} strokeWidth={3} fillOpacity={1} fill="url(#trendGradient)" activeDot={{ r: 6, fill: trendColor, stroke: '#fff', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="received" name="Inbound" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#inboundGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* --- 🧩 DEEP DIVE --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Outbound Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#00A884]" /> Outbound Analytics
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 mb-6">Source & Type Breakdown</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-center items-center">
                    <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-1">Total Templates Sent</p>
                    <h4 className="text-3xl font-black text-green-700">{data?.types?.template || 0}</h4>
                    <p className="text-[9px] text-green-600/70 font-bold mt-1">(Includes API & Campaigns)</p>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-center items-center">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Free Text Replies</p>
                    <h4 className="text-3xl font-black text-gray-700">{data?.types?.text || 0}</h4>
                    <p className="text-[9px] text-gray-400 font-bold mt-1">(Manual Chat & Flow Text)</p>
                 </div>
              </div>

              <div className="flex-1 h-[200px] w-full">
                {!loading && outboundSourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={outboundSourceData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#4B5563', fontWeight: 'bold'}} />
                      <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontWeight: 'bold' }} />
                      <Bar dataKey="volume" radius={[0, 6, 6, 0]} barSize={22}>
                         {outboundSourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 font-bold text-xs uppercase tracking-widest">No outbound data</div>
                )}
              </div>
            </div>

            {/* 2. Inbound Format */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-[#3B82F6]" /> Inbound Formats
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 mb-2">Exact payload received from users</p>
              
              <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
                <div className="h-[220px] w-full md:w-1/2 flex justify-center mt-4">
                  {!loading && inboundPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={inboundPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                          {inboundPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#1F2937', fontWeight: 'bold' }} itemStyle={{ fontWeight: 'bold' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400 font-bold text-xs uppercase tracking-widest">No inbound data</div>
                  )}
                </div>

                <div className="w-full md:w-1/2 flex flex-col gap-2 justify-center">
                  {inboundPieData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                        {item.icon} {item.name}
                      </div>
                      <span className="font-black text-gray-900">{item.value}</span>
                    </div>
                  ))}
                  {inboundPieData.length === 0 && !loading && (
                    <p className="text-center text-xs text-gray-400 font-bold uppercase">No records found</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- ⚙️ SYSTEM HEALTH --- */}
          <h3 className="text-lg font-black text-gray-800 mt-4 px-2">System & Bot Infrastructure</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-[#00A884] transition-colors group cursor-default">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Approved Templates</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{data?.system?.approvedTemplates || 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-[#00A884]" />
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-blue-500 transition-colors group cursor-default">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Active API Keys</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{data?.system?.activeApiKeys || 0}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Key className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-purple-500 transition-colors group cursor-default">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Automated Flows</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{data?.system?.activeFlows || 0}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-orange-500 transition-colors group cursor-default">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Gemini AI Status</p>
                <p className={`text-lg font-black mt-1 ${data?.system?.botActive ? 'text-green-600' : 'text-red-500'}`}>
                  {data?.system?.botActive ? 'ONLINE' : 'OFFLINE'}
                </p>
              </div>
              <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${data?.system?.botActive ? 'bg-green-50' : 'bg-red-50'}`}>
                <Bot className={`w-6 h-6 ${data?.system?.botActive ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
