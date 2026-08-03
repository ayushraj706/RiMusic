"use client";

import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar"; 
import { 
  Users, Send, CheckCircle2, Sparkles, Bot, 
  Activity, ArrowDownToLine, ArrowUpFromLine, Key,
  TrendingUp, TrendingDown // Naye Icons Trend ke liye
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#6366F1', '#14B8A6'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d"); // 24h, 7d, 15d, 30d
  
  // Real Data State (Zero Dummy Data)
  const [data, setData] = useState({
    contacts: { total: 0, google: 0, csv: 0, manual: 0 },
    system: { botActive: false, activeFlows: 0, approvedTemplates: 0, activeApiKeys: 0, activeSessions: 0 },
    outbound: { total: 0, read: 0, delivered: 0, sent: 0, chat: 0, flow: 0, api: 0, campaign: 0 },
    inbound: { total: 0, text: 0, image: 0, video: 0, document: 0, audio: 0, location: 0, sticker: 0, interactive: 0 },
    types: { template: 0, text: 0, media: 0, interactive: 0 },
    readRate: 0,
    chartData: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard-stats?range=${timeRange}`);
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) fetchStats();
      else setLoading(false);
    });
    return () => unsubscribe();
  }, [timeRange]);

  // --- 🚀 CRYPTO STYLE TREND CALCULATOR (Red/Green Logic) ---
  const { isTrendUp, trendColor, trendLight } = useMemo(() => {
    if (data.chartData.length < 2) return { isTrendUp: true, trendColor: '#00A884', trendLight: 'rgba(0,168,132,0.4)' }; // Default Green
    
    const latest = data.chartData[data.chartData.length - 1] as any;
    const previous = data.chartData[data.chartData.length - 2] as any;
    
    const isUp = (latest.sent || 0) >= (previous.sent || 0);
    return {
      isTrendUp: isUp,
      trendColor: isUp ? '#00A884' : '#EF4444', // Upar gaya to Green, Gira to RED
      trendLight: isUp ? 'rgba(0,168,132,0.4)' : 'rgba(239,68,68,0.4)'
    };
  }, [data.chartData]);

  // Chart Formatting Data
  const inboundPieData = [
    { name: 'Text', value: data.inbound.text },
    { name: 'Images', value: data.inbound.image },
    { name: 'Docs', value: data.inbound.document },
    { name: 'Audio/Voice', value: data.inbound.audio },
    { name: 'Location', value: data.inbound.location },
    { name: 'Sticker', value: data.inbound.sticker },
    { name: 'Interactive', value: data.inbound.interactive },
  ].filter(item => item.value > 0);

  const outboundSourceData = [
    { name: 'Manual Chat', volume: data.outbound.chat, fill: '#00A884' },
    { name: 'Flow Builder', volume: data.outbound.flow, fill: '#3B82F6' },
    { name: 'Dev API', volume: data.outbound.api, fill: '#8B5CF6' },
    { name: 'Campaign', volume: data.outbound.campaign, fill: '#F59E0B' },
  ].filter(item => item.volume > 0);

  return (
    <div className="flex h-[100dvh] w-full bg-[#0B0E14] text-white overflow-hidden pb-[70px] md:pb-0 font-sans relative selection:bg-blue-500/30">
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth no-scrollbar">
        
        {/* Header with Time Range Toggle */}
        <div className="bg-[#121824]/90 backdrop-blur-md border-b border-gray-800/60 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#00A884]" /> Command Center
            </h1>
          </div>
          
          <div className="flex bg-[#0B0E14] p-1 rounded-xl border border-gray-800">
            {/* 15 Days filter add kiya gaya hai */}
            {['24h', '7d', '15d', '30d'].map((range) => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  timeRange === range ? 'bg-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6">
          
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Outbound Sent */}
            <div className="bg-[#121824] p-5 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden group hover:border-gray-600 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00A884] opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00A884]/10 text-[#00A884] rounded-lg flex items-center justify-center">
                  <ArrowUpFromLine className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Outbound Volume</p>
                  <h3 className="text-3xl font-black">{loading ? "..." : data.outbound.total}</h3>
                </div>
              </div>
              <div className="mt-5 flex gap-2 text-[10px] font-bold">
                <span className="bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 px-2.5 py-1 rounded-md">Read: {data.outbound.read}</span>
                <span className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 px-2.5 py-1 rounded-md">Delivered: {data.outbound.delivered}</span>
              </div>
            </div>

            {/* Inbound Received */}
            <div className="bg-[#121824] p-5 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden group hover:border-gray-600 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B82F6] opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg flex items-center justify-center">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Inbound Received</p>
                  <h3 className="text-3xl font-black">{loading ? "..." : data.inbound.total}</h3>
                </div>
              </div>
              <div className="mt-5 flex gap-2 text-[10px] font-bold">
                <span className="bg-gray-800 text-gray-300 border border-gray-700 px-2.5 py-1 rounded-md">Text: {data.inbound.text}</span>
                <span className="bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 px-2.5 py-1 rounded-md">Media: {data.inbound.image + data.inbound.video + data.inbound.document}</span>
              </div>
            </div>

            {/* Contacts */}
            <div className="bg-[#121824] p-5 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden group hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EC4899]/10 text-[#EC4899] rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Total CRM Leads</p>
                  <h3 className="text-3xl font-black">{loading ? "..." : data.contacts.total}</h3>
                </div>
              </div>
              <div className="mt-5 flex gap-2 text-[10px] font-bold">
                <span className="bg-gray-800 text-gray-400 border border-gray-700 px-2.5 py-1 rounded-md">API/CSV: {data.contacts.csv}</span>
                <span className="bg-gray-800 text-gray-400 border border-gray-700 px-2.5 py-1 rounded-md">Google: {data.contacts.google}</span>
              </div>
            </div>

            {/* Read Rate */}
            <div className="bg-[#121824] p-5 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden group hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10B981]/10 text-[#10B981] rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Conversion Rate</p>
                  <h3 className="text-3xl font-black">{loading ? "..." : `${data.readRate}%`}</h3>
                </div>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-1.5 mt-6 overflow-hidden">
                <div className="bg-gradient-to-r from-[#10B981] to-[#00A884] h-1.5 rounded-full" style={{ width: `${data.readRate}%` }}></div>
              </div>
            </div>
          </div>

          {/* 📈 CRYPTO STYLE MAIN GRAPH (Green if UP, Red if DOWN) */}
          <div className="bg-[#121824] p-6 rounded-2xl border border-gray-800 shadow-xl relative">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  Message Traffic 
                  {/* Trend Indicator */}
                  {!loading && data.chartData.length >= 2 && (
                    <span className={`flex items-center text-xs px-2 py-1 rounded border ${isTrendUp ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {isTrendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {isTrendUp ? 'Growing' : 'Dropping'}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">Timeline: {timeRange.toUpperCase()}</p>
              </div>
            </div>
            
            <div className="h-[320px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold animate-pulse">Scanning Blocks...</div>
              ) : data.chartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">No activity in this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      {/* DYNAMIC TREND GRADIENT (Red ya Green) */}
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={trendColor} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1E293B', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    {/* DYNAMIC STROKE COLOR FOR OUTBOUND */}
                    <Area type="monotone" dataKey="sent" name="Outbound" stroke={trendColor} strokeWidth={3} fillOpacity={1} fill="url(#trendGradient)" activeDot={{ r: 6, fill: trendColor, stroke: '#0B0E14', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="received" name="Inbound" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#inboundGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Outbound Deep Breakdown (Sources) */}
            <div className="bg-[#121824] p-6 rounded-2xl border border-gray-800 shadow-xl">
              <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest mb-1">Outbound Origins</h3>
              <p className="text-xs text-gray-500 mb-6">Where your messages originated from</p>
              <div className="h-[220px] w-full">
                {!loading && outboundSourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={outboundSourceData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1E293B" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 'bold'}} />
                      <Tooltip cursor={{fill: '#1E293B'}} contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1E293B', borderRadius: '8px', fontWeight: 'bold' }} />
                      <Bar dataKey="volume" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-600 font-bold text-xs uppercase tracking-widest">No outbound data</div>
                )}
              </div>
            </div>

            {/* Inbound Deep Breakdown (Pie) */}
            <div className="bg-[#121824] p-6 rounded-2xl border border-gray-800 shadow-xl">
              <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest mb-1">Inbound Payload</h3>
              <p className="text-xs text-gray-500 mb-2">What users are sending you</p>
              <div className="h-[220px] w-full flex justify-center">
                {!loading && inboundPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={inboundPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                        {inboundPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1E293B', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }} itemStyle={{ fontWeight: 'bold' }}/>
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-600 font-bold text-xs uppercase tracking-widest">No inbound data</div>
                )}
              </div>
            </div>
          </div>

          {/* System Health Status Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-[#121824] p-4 rounded-xl border border-gray-800 flex items-center justify-between hover:bg-[#1E293B] transition-colors cursor-default">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Approved Templates</p>
                <p className="text-lg font-black text-gray-200 mt-0.5">{data.system.approvedTemplates}</p>
              </div>
              <Sparkles className="w-5 h-5 text-yellow-500/50" />
            </div>
            <div className="bg-[#121824] p-4 rounded-xl border border-gray-800 flex items-center justify-between hover:bg-[#1E293B] transition-colors cursor-default">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Dev API Keys</p>
                <p className="text-lg font-black text-gray-200 mt-0.5">{data.system.activeApiKeys}</p>
              </div>
              <Key className="w-5 h-5 text-[#3B82F6]/50" />
            </div>
            <div className="bg-[#121824] p-4 rounded-xl border border-gray-800 flex items-center justify-between hover:bg-[#1E293B] transition-colors cursor-default">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Automated Flows</p>
                <p className="text-lg font-black text-gray-200 mt-0.5">{data.system.activeFlows}</p>
              </div>
              <Activity className="w-5 h-5 text-[#8B5CF6]/50" />
            </div>
            <div className="bg-[#121824] p-4 rounded-xl border border-gray-800 flex items-center justify-between hover:bg-[#1E293B] transition-colors cursor-default">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">AI Engine</p>
                <p className={`text-sm font-black mt-1 ${data.system.botActive ? 'text-green-500' : 'text-red-500'}`}>
                  {data.system.botActive ? 'ONLINE' : 'OFFLINE'}
                </p>
              </div>
              <Bot className="w-5 h-5 text-gray-600" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
