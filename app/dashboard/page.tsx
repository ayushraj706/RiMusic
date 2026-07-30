"use client";

import React, { useState, useEffect } from "react";
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
    <div className="flex flex-col h-full min-h-screen bg-[#F5F7F9] text-gray-800 font-sans">
      
      {/* ─── Header Section ─── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-[#00A884]" />
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, <span className="font-semibold text-gray-700 capitalize">{userName}</span>! Here is your BaseKey CRM summary.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/campaigns" className="bg-[#00A884] hover:bg-[#008f6f] text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" /> New Campaign
          </Link>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        
        {/* Banner Card */}
        <div className="bg-gradient-to-r from-[#075E54] to-[#00A884] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> BaseKey Pro Active
            </span>
            <h2 className="text-xl font-bold mt-2">Supercharge your WhatsApp Marketing</h2>
            <p className="text-sm text-white/80 max-w-xl">Send bulk broadcasts, manage synced Google/CSV contacts, and automate chats effortlessly.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/contacts" className="bg-white text-[#075E54] hover:bg-gray-100 px-4 py-2.5 rounded-xl font-bold text-sm transition shadow">
              Manage Contacts
            </Link>
          </div>
        </div>

        {/* ─── Quick Stats Grid ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Contacts */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-green-50 text-[#00A884] rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Live
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 font-medium">Total Audience</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{loading ? "..." : totalContacts}</h3>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                <span>Google: {googleContactsCount}</span>
                <span>•</span>
                <span>CSV: {csvContactsCount}</span>
              </div>
            </div>
          </div>

          {/* Messages Sent */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">30 Days</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 font-medium">Messages Sent</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">5,800</h3>
              <p className="text-[11px] text-green-600 font-semibold mt-2">↑ 12% higher than last month</p>
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Active</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 font-medium">Campaigns Run</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">4</h3>
              <p className="text-[11px] text-gray-400 mt-2">1 Currently running</p>
            </div>
          </div>

          {/* Avg Read Rate */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">Avg</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 font-medium">Read Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">82.5%</h3>
              <p className="text-[11px] text-gray-400 mt-2">Based on delivered msgs</p>
            </div>
          </div>

        </div>

        {/* ─── Quick Shortcuts Section ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/campaigns" className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#00A884] transition group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 text-[#00A884] rounded-xl flex items-center group-hover:bg-[#00A884] group-hover:text-white transition justify-center">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Create Campaign</h4>
                <p className="text-xs text-gray-500">Send bulk WhatsApp broadcasts</p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-[#00A884]" />
          </Link>

          <Link href="/contacts" className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#00A884] transition group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center group-hover:bg-blue-600 group-hover:text-white transition justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Import Contacts</h4>
                <p className="text-xs text-gray-500">Sync Google or upload CSV</p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
          </Link>

          <Link href="/chatbot-builder" className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#00A884] transition group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center group-hover:bg-purple-600 group-hover:text-white transition justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Chatbot Flows</h4>
                <p className="text-xs text-gray-500">Build automated reply flows</p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
          </Link>
        </div>

      </div>
    </div>
  );
}
