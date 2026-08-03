"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, MoreVertical, Trash2, X, Phone, Video as VideoIcon } from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";

// Components
import Sidebar from "../components/Sidebar";
import ChatBubble from "../components/ChatBubble";
import ChatInput from "../components/ChatInput";
import ThemeSelector, { ChatTheme } from "../components/ThemeSelector";
import ContactSidebar from "../components/chat/Sidebar"; // यह आपकी Contact List वाली Sidebar है

// Logic
import {
  Contact, ChatMessage, UserConfig, MetaTemplate,
  listenToContacts, listenToChat, getUserConfig,
  markContactRead, setContactWallpaper, deleteMessageFromFirebase,
  deleteMessagesFromFirebase, clearChatInFirebase, sendTextMessage,
  sendMediaMessage, sendLocationMessage, sendTemplateMessage,
} from "../lib/chatLogic";

const DEFAULT_WALLPAPER: ChatTheme = {
  id: "default",
  name: "Default",
  bgUrl: "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  thumbUrl: "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  accent: "#00A884",
};

export default function ChatDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [config, setConfig] = useState<UserConfig | null>(null);

  // Contacts & Chat State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ text: string; sender: string; id: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserConfig(user.uid).then(setConfig).catch(() => setConfig(null));
    const unsub = listenToContacts(user.uid, setContacts);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !activeContact) return;
    const unsub = listenToChat(user.uid, activeContact.id, setMessages);
    markContactRead(user.uid, activeContact.id).catch(() => {});
    return () => unsub();
  }, [user, activeContact?.id]);

  const activeWallpaper = activeContact?.wallpaperId 
    ? { ...DEFAULT_WALLPAPER, id: activeContact.wallpaperId, bgUrl: `https://picsum.photos/id/${activeContact.wallpaperId}/800/1400` } 
    : DEFAULT_WALLPAPER;

  const handleThemeChange = async (theme: ChatTheme) => {
    if (!user || !activeContact) return;
    await setContactWallpaper(user.uid, activeContact.id, theme.id);
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* 1. Global Navigation (Sidebar) */}
      <Sidebar />

      {/* 2. Contact List (Inbox) */}
      <div className={`w-full sm:w-[350px] shrink-0 border-r ${activeContact ? "hidden sm:flex" : "flex"}`}>
        <ContactSidebar 
            contacts={contacts} 
            activeContactId={activeContact?.id || null} 
            onSelectContact={(c) => setActiveContact(c)} 
        />
      </div>

      {/* 3. Main Chat Window */}
      <div className={`flex-1 flex flex-col h-full bg-[#E5DDD5] ${activeContact ? "flex" : "hidden sm:flex"}`}>
        {activeContact ? (
          <>
            <header className="bg-[#008069] text-white p-3 flex items-center justify-between">
                <span className="font-bold">{activeContact.name}</span>
                <ThemeSelector currentTheme={activeWallpaper} onChange={handleThemeChange} />
            </header>
            
            <div className="flex-1 overflow-y-auto p-4" style={{ backgroundImage: `url('${activeWallpaper.bgUrl}')` }}>
                {messages.map(m => (
                    <ChatBubble key={m.id} msg={m as any} selectionMode={false} isSelected={false} onToggleSelect={()=>{}} onReply={(m) => setReplyingTo({text: m.text, sender: m.sender, id: m.id})} />
                ))}
            </div>

            <ChatInput 
                inputText={inputText} setInputText={setInputText} onSend={handleSendText} 
                isSending={isSending} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">Select a chat to start</div>
        )}
      </div>
    </div>
  );
}
