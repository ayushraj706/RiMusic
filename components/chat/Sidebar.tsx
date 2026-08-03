"use client";

import React, { useState, useMemo } from "react";
import { Search, MoreVertical, MessageSquarePlus } from "lucide-react";
import type { Contact } from "../../lib/chatLogic";

interface SidebarProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (contact: Contact) => void;
  className?: string;
}

function timeLabel(ts?: number): string {
  if (!ts) return "";
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

export default function Sidebar({ contacts, activeContactId, onSelectContact, className = "" }: SidebarProps) {
  const [query, setQuery] = useState("");

  // NAYA LOGIC: Plus icon se bina save kiye naya number start karne ke liye
  const handleNewChat = () => {
    const phone = window.prompt("Enter phone number with country code (e.g., 919876543210):");
    if (phone && phone.trim()) {
      // Sirf numbers nikalna, baaki special characters hata dena
      const cleanPhone = phone.replace(/[^0-9]/g, ""); 
      
      if (cleanPhone) {
        // Check karna ki kya ye number pehle se list mein hai
        const existing = contacts.find(
          (c) => c.phoneNumber === cleanPhone || c.id === cleanPhone
        );
        
        if (existing) {
          onSelectContact(existing);
        } else {
          // Agar naya hai, toh ek temporary contact banakar chat open kar dena
          // Jab aap pehla message bhejenge, toh ye Firebase mein auto-save ho jayega
          onSelectContact({
            id: cleanPhone,
            name: cleanPhone, // Naye number ke liye naam me bhi number dikhega
            phoneNumber: cleanPhone,
          });
        }
      }
    }
  };

  const filtered = useMemo(() => {
    // NAYA LOGIC: Contacts ko hamesha latest time (updatedAt) ke hisaab se sort karna
    const sortedContacts = [...contacts].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    if (!query.trim()) return sortedContacts;
    const q = query.trim().toLowerCase();
    
    // NAYA FIX: c.phone ki jagah c.phoneNumber kiya gaya hai
    return sortedContacts.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.phoneNumber?.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="bg-[#008069] text-white px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-bold text-lg">Chats</span>
        <div className="flex items-center gap-1">
          {/* NAYA LOGIC: handleNewChat function attach kar diya */}
          <button onClick={handleNewChat} className="p-2 hover:bg-white/20 rounded-full transition" title="New Chat">
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/20 rounded-full transition">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-white shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full text-[13px] bg-transparent outline-none placeholder-gray-400 text-gray-700"
          />
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-10 px-4">
            {contacts.length === 0 ? "No conversations yet." : `No chats match "${query}".`}
          </div>
        ) : (
          filtered.map((contact) => {
            const isActive = contact.id === activeContactId;
            // NAYA FIX: unreadCount ki jagah 'unread' use kiya hai jo aapke DB format me hai
            const hasUnread = (contact.unread ?? 0) > 0; 
            
            return (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={`w-full flex items-center gap-3 px-3 py-3 border-b border-gray-50 hover:bg-gray-50 transition text-left ${
                  isActive ? "bg-[#F0F2F5]" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  <img
                    src={contact.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`}
                    alt={contact.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[14px] truncate ${hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                      {contact.name}
                    </span>
                    {/* NAYA FIX: lastMessageTime ki jagah updatedAt lagaya */}
                    <span className={`text-[11px] shrink-0 ${hasUnread ? "text-[#00A884] font-bold" : "text-gray-400"}`}>
                      {timeLabel(contact.updatedAt)} 
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className={`text-[12.5px] truncate ${hasUnread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                      {contact.lastMessage || "No messages yet"}
                    </span>
                    {/* NAYA: WhatsApp style unread badge */}
                    {hasUnread && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00A884] text-white text-[10px] font-bold flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
