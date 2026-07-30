"use client";

import React, { useState, useEffect } from "react";
// 👇 YAHAN SIDEBAR IMPORT KIYA HAI
import Sidebar from "@/components/Sidebar"; 
import { 
  LayoutDashboard, Users, Megaphone, Send, 
  TrendingUp, ArrowUpRight, Plus, 
  CheckCircle2, Clock, MessageSquare, Sparkles 
} from "lucide-react";
import Link from "next/link";
import { auth, database } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";

export default function DashboardPage() {
  const [userName, setUserName] = useState("User");
  const [totalContacts, setTotalContacts] = useState(0);
  const [googleContactsCount, setGoogleContactsCount] = useState(0);
  const [csvContactsCount, setCsvContactsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch real data counts from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserName(currentUser.displayName || currentUser.email?.split("@")[0] || "User");
        
        const contactsRef = ref(database, `users/${currentUser.uid}/contacts`);
        onValue(contactsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const contactsArray = Object.keys(data).map(key => data[key]);
            setTotalContacts(contactsArray.length);
            setGoogleContactsCount(contactsArray.filter((c: any) => c.source === "google").length);
            setCsvContactsCount(contactsArray.filter((c: any) => c.source === "csv").length);
          } else {
            setTotalContacts(0);
            setGoogleContactsCount(0);
            setCsvContactsCount(0);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

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
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 transition-all duration-300">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-[#00A884]" />
              Dashboard Overview
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome back, <span className="font-semibold text-gray-700 capitalize">{userName}</span>! Here is your BaseKey CRM summary.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/campaigns" className="bg-[#00A884] hover:bg-[#008f6f] text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95">
              <Plus className="w-4 h-4" /> New Campaign
            </Link>
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          
          {/* Banner Card (Hover Animation Added) */}
          <div className="group bg-gradient-to-r from-[#075E54] to-[#00A884] rounded-2xl p-6 text-white shadow-md hover:shadow-lg transition-all duration-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden relative">
            {/* Sparkle background decoration */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="space-y-1 relative z-10">
              <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" /> BaseKey Pro Active
              </span>
              <h2 className="text-xl font-bold mt-2 group-hover:translate-x-1 transition-transform duration-300">Supercharge your WhatsApp Marketing</h2>
              <p className="text-sm text-white/90 max-w-xl group-hover:translate-x-1 transition-transform duration-300 delay-75">Send bulk broadcasts, manage synced Google/CSV contacts, and automate chats effortlessly.</p>
            </div>
            <div className="flex gap-3 relative z-10">
              <Link href="/contacts" className="bg-white text-[#075E54] hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95">
                Manage Contacts
              </Link>
            </div>
          </div>

          {/* ─── Quick Stats Grid ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Contacts */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-green-50 text-[#00A884] rounded-xl flex items-center justify-center group-hover:bg-[#00A884] group-hover:text-white transition-colors duration-300">
                  <Users className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div> Live
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 font-medium group-hover:text-gray-700 transition-colors">Total Audience</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{loading ? "..." : totalContacts}</h3>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                  <span>Google: {googleContactsCount}</span>
                  <span>•</span>
                  <span>CSV: {csvContactsCount}</span>
                </div>
              </div>
            </div>

            {/* Messages Sent */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">30 Days</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 font-medium group-hover:text-gray-700 transition-colors">Messages Sent</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">5,800</h3>
                <p className="text-[11px] text-green-600 font-semibold mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> 12% higher than last month
                </p>
              </div>
            </div>

            {/* Active Campaigns */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                  <Megaphone className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Active</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 font-medium group-hover:text-gray-700 transition-colors">Campaigns Run</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">4</h3>
                <p className="text-[11px] text-gray-400 mt-2">1 Currently running</p>
              </div>
            </div>

            {/* Avg Read Rate */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                  <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">Avg</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 font-medium group-hover:text-gray-700 transition-colors">Read Rate</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">82.5%</h3>
                <p className="text-[11px] text-gray-400 mt-2">Based on delivered msgs</p>
              </div>
            </div>

          </div>

          {/* ─── Quick Shortcuts Section ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/campaigns" className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#00A884] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 text-[#00A884] rounded-xl flex items-center group-hover:bg-[#00A884] group-hover:text-white transition-colors duration-300 justify-center">
                  <Megaphone className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Create Campaign</h4>
                  <p className="text-xs text-gray-500">Send bulk WhatsApp broadcasts</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-[#00A884] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </Link>

            <Link href="/contacts" className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-500 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 justify-center">
                  <Users className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Import Contacts</h4>
                  <p className="text-xs text-gray-500">Sync Google or upload CSV</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </Link>

            <Link href="/chatbot-builder" className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-purple-500 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 justify-center">
                  <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Chatbot Flows</h4>
                  <p className="text-xs text-gray-500">Build automated reply flows</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
