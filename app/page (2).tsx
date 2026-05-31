"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, database } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, push, set, remove } from "firebase/database";
import {
  Search, MoreVertical, Plus, X, Trash2, ArrowLeft,
  Phone, Video, Info, Download, Eye, FileText, Image as ImageIcon,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ChatInput from "../components/ChatInput";
import ChatBubble from "../components/ChatBubble";
import ThemeSelector, { ChatTheme } from "../components/ThemeSelector";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
  status?: "sent" | "delivered" | "read";
  replyTo?: string | null;
  timestamp?: number;
  // Media fields
  mediaType?: "image" | "video" | "document" | "audio";
  mediaUrl?: string;
  mediaName?: string;
  mediaId?: string;
}

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  lastMessage: string;
  time: string;
  unread: number;
  updatedAt?: number;
}

// ─── Media Bubble Component (Instagram-style, shown inside chat list) ─────────

interface MediaMsgBubbleProps {
  msg: Message;
}

function MediaMsgBubble({ msg }: MediaMsgBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMe = msg.sender === "me";

  const handleDownload = () => {
    if (!msg.mediaUrl) return;
    const a = document.createElement("a");
    a.href = msg.mediaUrl;
    a.download = msg.mediaName || "file";
    a.target = "_blank";
    a.click();
    setMenuOpen(false);
  };

  return (
    <>
      {/* Lightbox for image full-screen */}
      {lightboxOpen && msg.mediaType === "image" && (
        <div
          className="fixed inset-0 z-[200] bg-black/92 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 transition"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={msg.mediaUrl}
            alt={msg.mediaName || "media"}
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute bottom-6 right-6 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      )}

      <div className={`flex ${isMe ? "justify-end" : "justify-start"} px-2 py-0.5`}>
        <div className="relative max-w-[260px]">

          {/* ── IMAGE ── */}
          {msg.mediaType === "image" && msg.mediaUrl && (
            <div className="relative group rounded-2xl overflow-hidden shadow-md cursor-pointer"
              onClick={() => setMenuOpen((p) => !p)}
            >
              <img
                src={msg.mediaUrl}
                alt={msg.mediaName || "image"}
                className="w-full object-cover max-h-64 rounded-2xl"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-150 rounded-2xl" />

              {menuOpen && (
                <div
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 rounded-2xl animate-in fade-in duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="flex items-center gap-2 bg-white/90 text-gray-800 font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg hover:bg-white transition w-36 justify-center"
                    onClick={() => { setLightboxOpen(true); setMenuOpen(false); }}
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <button
                    className="flex items-center gap-2 bg-white/90 text-gray-800 font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg hover:bg-white transition w-36 justify-center"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    className="text-white/70 text-xs mt-1 hover:text-white transition"
                    onClick={() => setMenuOpen(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── VIDEO ── */}
          {msg.mediaType === "video" && msg.mediaUrl && (
            <div className="rounded-2xl overflow-hidden shadow-md bg-black">
              <video
                src={msg.mediaUrl}
                className="w-full max-h-64 rounded-2xl object-contain"
                controls
              />
            </div>
          )}

          {/* ── DOCUMENT / AUDIO ── */}
          {(msg.mediaType === "document" || msg.mediaType === "audio") && (
            <div
              className={`flex items-center gap-3 rounded-2xl p-3 shadow-md border cursor-pointer hover:opacity-90 transition ${
                isMe ? "bg-[#D9FDD3] border-green-100" : "bg-white border-gray-100"
              }`}
              onClick={handleDownload}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                msg.mediaType === "audio" ? "bg-[#00A884]/10" : "bg-purple-100"
              }`}>
                {msg.mediaType === "audio"
                  ? <Phone className="w-5 h-5 text-[#00A884]" />
                  : <FileText className="w-5 h-5 text-purple-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {msg.mediaName || (msg.mediaType === "audio" ? "Voice message" : "Document")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Tap to download</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          )}

          {/* Timestamp */}
          <div className={`flex mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
            <span className="text-[10px] text-gray-500">{msg.time}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function ChatDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [phoneId, setPhoneId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputText, setInputText] = useState("");

  const [showNewChat, setShowNewChat] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newChatName, setNewChatName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showContactInfo, setShowContactInfo] = useState(false);

  const [chatTheme, setChatTheme] = useState<ChatTheme>({
    id: "whatsapp-default",
    name: "WhatsApp Default",
    bgImage: "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Android Back Button (popstate) ───
  useEffect(() => {
    const handlePopState = () => {
      if (activeContact) {
        setActiveContact(null);
        setReplyingTo(null);
        setSelectedMessages(new Set());
        setShowContactInfo(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeContact]);

  // ─── Auth & Config ───
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const configRef = ref(database, `users/${currentUser.uid}/config`);
        onValue(configRef, (snapshot) => {
          if (snapshot.exists() && snapshot.val().isMatched) {
            setPhoneId(snapshot.val().phoneId || snapshot.val().phoneNumberId);
            setAccessToken(snapshot.val().accessToken || snapshot.val().metaAccessToken);
          } else {
            setPhoneId(null);
            setAccessToken(null);
          }
          setIsLoadingAuth(false);
        });
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ─── Fetch Contacts ───
  useEffect(() => {
    if (!phoneId) return;
    const chatsRef = ref(database, `chats/${phoneId}`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const contactList = Object.entries(data)
          .map(([phone, val]: any) => ({
            id: phone,
            name: val.info?.name || phone,
            phoneNumber: phone,
            lastMessage: val.info?.lastMessage || "",
            time: val.info?.updatedAt
              ? new Date(val.info.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "",
            unread: val.info?.unread || 0,
            updatedAt: val.info?.updatedAt || 0,
          }))
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setContacts(contactList);
      } else {
        setContacts([]);
      }
    });
    return () => unsubscribe();
  }, [phoneId]);

  // ─── Fetch Messages for Active Contact ───
  useEffect(() => {
    if (!activeContact || !phoneId) return;
    const msgRef = ref(database, `chats/${phoneId}/${activeContact.phoneNumber}/messages`);
    const unsubscribe = onValue(msgRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.entries(data)
          .map(([key, val]: any) => ({ id: key, ...val }))
          .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages((prev) => ({ ...prev, [activeContact.id]: msgs }));
      } else {
        setMessages((prev) => ({ ...prev, [activeContact.id]: [] }));
      }
    });
    return () => unsubscribe();
  }, [activeContact, phoneId]);

  // ─── Scroll to Bottom ───
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContact]);

  // ─── Play Send Sound ───
  const playSendSound = useCallback(() => {
    try {
      const audio = new Audio("https://www.soundjay.com/buttons/sounds/button-09.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  // ─── Open Chat ───
  const handleOpenChat = (contact: Contact) => {
    setActiveContact(contact);
    setReplyingTo(null);
    setSelectedMessages(new Set());
    setShowContactInfo(false);
    window.history.pushState({ chatOpen: true, contactId: contact.id }, "");
    if (contact.unread > 0 && phoneId) {
      const infoRef = ref(database, `chats/${phoneId}/${contact.phoneNumber}/info/unread`);
      set(infoRef, 0);
    }
  };

  // ─── Close Chat ───
  const handleCloseChat = () => {
    setActiveContact(null);
    setReplyingTo(null);
    setSelectedMessages(new Set());
    setShowContactInfo(false);
  };

  // ─── Start New Chat ───
  const handleStartNewChat = () => {
    if (!newPhoneNumber) return alert("Please enter a phone number!");
    const cleanPhone = newPhoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) return alert("Invalid phone number!");

    const newContact: Contact = {
      id: cleanPhone,
      name: newChatName || cleanPhone,
      phoneNumber: cleanPhone,
      lastMessage: "Started a new conversation",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      unread: 0,
      updatedAt: Date.now(),
    };

    if (phoneId) {
      const infoRef = ref(database, `chats/${phoneId}/${cleanPhone}/info`);
      set(infoRef, {
        name: newContact.name,
        phoneNumber: cleanPhone,
        lastMessage: "Started a new conversation",
        updatedAt: Date.now(),
        unread: 0,
      });
    }

    setActiveContact(newContact);
    setShowNewChat(false);
    setNewPhoneNumber("");
    setNewChatName("");
  };

  // ─── Send Text Message ───
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeContact || !phoneId || !accessToken) return;

    setIsSending(true);
    const messageText = inputText;
    const recipientPhone = activeContact.phoneNumber;
    const tempId = `temp_${Date.now()}`;
    const now = Date.now();

    const optimisticMsg: Message = {
      id: tempId,
      text: messageText,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: now,
      status: "sent",
      replyTo: replyingTo?.text || null,
    };

    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), optimisticMsg],
    }));
    setInputText("");
    setReplyingTo(null);

    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "text",
          text: { preview_url: false, body: messageText },
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Message Failed: ${data.error.message}`);
        setMessages((prev) => ({
          ...prev,
          [activeContact.id]: prev[activeContact.id]?.filter((m) => m.id !== tempId) || [],
        }));
        setIsSending(false);
        return;
      }

      playSendSound();

      const msgRef = ref(database, `chats/${phoneId}/${recipientPhone}/messages`);
      const newMsgRef = push(msgRef);
      await set(newMsgRef, {
        text: messageText,
        sender: "me",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: now,
        status: "sent",
        replyTo: replyingTo?.text || null,
        metaId: data.messages?.[0]?.id || null,
      });

      const infoRef = ref(database, `chats/${phoneId}/${recipientPhone}/info`);
      await set(infoRef, {
        name: activeContact.name,
        phoneNumber: recipientPhone,
        lastMessage: messageText,
        updatedAt: now,
        unread: 0,
      });
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // ─── Send Media Message (UPDATED — audio type supported, ogg compatible) ─────
  const handleSendMedia = async (
    file: File,
    type: "image" | "video" | "document" | "audio"
  ): Promise<void> => {
    if (!activeContact || !phoneId || !accessToken) return;

    const recipientPhone = activeContact.phoneNumber;
    const now = Date.now();
    const localUrl = URL.createObjectURL(file);

    // WhatsApp media type — audio pehle check karo
    const waType =
      type === "audio" ? "audio"
      : type === "image" ? "image"
      : type === "video" ? "video"
      : file.type.startsWith("audio") ? "audio"
      : "document";

    const tempId = `temp_media_${now}`;
    const optimisticMsg: Message = {
      id: tempId,
      text: "",
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: now,
      status: "sent",
      mediaType: waType as Message["mediaType"],
      mediaUrl: localUrl,
      mediaName: file.name,
    };

    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), optimisticMsg],
    }));

    try {
      // ── 1. Upload to WhatsApp ──
      const formData = new FormData();
      formData.append("messaging_product", "whatsapp");
      formData.append("file", file);
      formData.append("type", file.type); // "audio/ogg", "image/jpeg" etc.

      const uploadRes = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/media`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        }
      );
      const uploadData = await uploadRes.json();

      if (uploadData.error) throw new Error(uploadData.error.message);

      const mediaId: string = uploadData.id;

      // ── 2. Send via WhatsApp API ──
      const msgPayload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: waType,
        [waType]: { id: mediaId },
      };

      const sendRes = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(msgPayload),
        }
      );
      const sendData = await sendRes.json();
      if (sendData.error) throw new Error(sendData.error.message);

      playSendSound();

      // ── 3. Save to Firebase ──
      const msgRef = ref(database, `chats/${phoneId}/${recipientPhone}/messages`);
      const newMsgRef = push(msgRef);
      await set(newMsgRef, {
        text: "",
        sender: "me",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: now,
        status: "sent",
        mediaType: waType,
        mediaUrl: localUrl,
        mediaName: file.name,
        mediaId,
        metaId: sendData.messages?.[0]?.id || null,
      });

      // ── 4. Update contact info ──
      const lastMsg =
        waType === "image" ? "Photo"
        : waType === "video" ? "Video"
        : waType === "audio" ? "Voice message"
        : file.name;

      const infoRef = ref(database, `chats/${phoneId}/${recipientPhone}/info`);
      await set(infoRef, {
        name: activeContact.name,
        phoneNumber: recipientPhone,
        lastMessage: lastMsg,
        updatedAt: now,
        unread: 0,
      });

      // ── 5. Replace optimistic bubble ──
      setMessages((prev) => ({
        ...prev,
        [activeContact.id]: (prev[activeContact.id] || []).map((m) =>
          m.id === tempId ? { ...m, mediaId, status: "sent" } : m
        ),
      }));
    } catch (err: any) {
      alert(`Media send failed: ${err.message}`);
      setMessages((prev) => ({
        ...prev,
        [activeContact.id]: (prev[activeContact.id] || []).filter((m) => m.id !== tempId),
      }));
      URL.revokeObjectURL(localUrl);
    }
  };

  // ─── Toggle Selection ───
  const toggleSelection = (msgId: string) => {
    const newSet = new Set(selectedMessages);
    if (newSet.has(msgId)) newSet.delete(msgId);
    else newSet.add(msgId);
    setSelectedMessages(newSet);
  };

  // ─── Delete Selected ───
  const handleDeleteSelected = async () => {
    if (!activeContact || !phoneId) return;
    if (!window.confirm(`Delete ${selectedMessages.size} message(s)?`)) return;
    for (const msgId of Array.from(selectedMessages)) {
      const msgRef = ref(
        database,
        `chats/${phoneId}/${activeContact.phoneNumber}/messages/${msgId}`
      );
      await remove(msgRef);
    }
    setSelectedMessages(new Set());
  };

  // ─── Filtered Contacts ───
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery)
  );

  // ─── Loading ───
  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F0F2F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00A884] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───
  return (
    <div className="flex h-[100dvh] w-full bg-white overflow-hidden">

      {/* ── New Chat Modal ── */}
      {showNewChat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">New Chat</h3>
              <button onClick={() => setShowNewChat(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 919876543210"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20 transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Contact name"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20 transition"
                />
              </div>
              <button
                onClick={handleStartNewChat}
                className="w-full bg-[#00A884] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#008f6f] transition shadow-md active:scale-[0.98]"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <Sidebar />

      <div className="flex w-full h-full relative">

        {/* ── Contact List ── */}
        <div className={`
          ${activeContact ? "hidden md:flex" : "flex"}
          w-full md:w-[360px] lg:w-[400px] h-full border-r border-gray-200 flex-col bg-white shrink-0
        `}>
          <div className="px-4 py-3 flex items-center justify-between bg-[#F0F2F5] border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                <img
                  src={user?.photoURL || "https://ui-avatars.com/api/?name=User&background=random"}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-[17px] font-bold text-[#111B21]">Chats</h1>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewChat(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656F] hover:bg-gray-200 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656F] hover:bg-gray-200 transition">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 bg-white border-b border-gray-100">
            <div className="flex items-center bg-[#F0F2F5] rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-[#8696A0] shrink-0" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none ml-3 text-[14px] text-gray-800 placeholder-[#8696A0]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {!phoneId ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Phone className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm font-medium">API Not Connected</p>
                <p className="text-gray-400 text-xs mt-1">Link your Meta API in Settings</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Search className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm font-medium">
                  {searchQuery ? "No results found" : "No chats yet"}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {searchQuery ? "Try a different search" : "Click + to start a new chat"}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleOpenChat(contact)}
                  className={`flex items-center px-3 py-2.5 cursor-pointer transition-colors hover:bg-[#F5F6F6] ${
                    activeContact?.id === contact.id ? "bg-[#F0F2F5]" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random&color=fff`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-3 flex-1 min-w-0 border-b border-gray-100 pb-2.5 pt-0.5">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-semibold text-[#111B21] text-[16px] truncate pr-2">{contact.name}</h3>
                      <span className={`text-[12px] shrink-0 ${contact.unread > 0 ? "text-[#00A884] font-bold" : "text-[#667781]"}`}>
                        {contact.time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-[13px] truncate pr-2 ${contact.unread > 0 ? "text-[#111B21] font-medium" : "text-[#667781]"}`}>
                        {contact.lastMessage}
                      </p>
                      {contact.unread > 0 && (
                        <span className="w-5 h-5 bg-[#00A884] text-white text-[11px] font-bold flex items-center justify-center rounded-full shrink-0">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className={`
          ${!activeContact ? "hidden md:flex" : "flex"}
          flex-1 h-full flex-col relative bg-[#E5DDD5]
        `}>
          {/* Chat Background */}
          <div
            className="absolute inset-0 z-0 opacity-60"
            style={{
              backgroundColor: chatTheme.bgColor || "#E5DDD5",
              backgroundImage: chatTheme.pattern
                ? `${chatTheme.pattern}, ${chatTheme.bgImage ? `url(${chatTheme.bgImage})` : "none"}`
                : chatTheme.bgImage
                ? `url(${chatTheme.bgImage})`
                : "none",
              backgroundSize: chatTheme.pattern ? "20px 20px, auto" : "auto",
              backgroundRepeat: "repeat",
            }}
          />

          {activeContact ? (
            <div id="mobile-chat-view" className="flex flex-col h-full z-10 w-full relative">

              {/* ── Header ── */}
              {selectedMessages.size > 0 ? (
                <div className="px-4 py-2.5 flex items-center justify-between bg-[#F0F2F5] shadow-sm shrink-0">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedMessages(new Set())} className="p-1.5 hover:bg-gray-200 rounded-full transition">
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="text-[#111B21] font-semibold text-base">{selectedMessages.size} selected</span>
                  </div>
                  <button onClick={handleDeleteSelected} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="px-3 md:px-4 py-2 flex items-center justify-between bg-[#F0F2F5] shadow-sm shrink-0">
                  <div className="flex items-center min-w-0">
                    <button onClick={handleCloseChat} className="p-1.5 -ml-1 mr-1 hover:bg-gray-200 rounded-full transition md:hidden">
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-300">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeContact.name)}&background=random&color=fff`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-3 min-w-0 cursor-pointer" onClick={() => setShowContactInfo(!showContactInfo)}>
                      <h2 className="font-semibold text-[#111B21] text-[16px] truncate">{activeContact.name}</h2>
                      <p className="text-[12px] text-[#667781] leading-tight truncate">{activeContact.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <ThemeSelector currentTheme={chatTheme} onChange={setChatTheme} />
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656F] hover:bg-gray-200 transition">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656F] hover:bg-gray-200 transition">
                      <Video className="w-5 h-5" />
                    </button>
                    <button onClick={() => setShowContactInfo(!showContactInfo)} className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656F] hover:bg-gray-200 transition">
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Contact Info Slide-in ── */}
              {showContactInfo && (
                <div className="absolute right-0 top-[56px] bottom-0 w-80 bg-white shadow-2xl z-30 border-l border-gray-200 animate-in slide-in-from-right duration-200 overflow-y-auto">
                  <div className="p-6 text-center border-b border-gray-100">
                    <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-3 overflow-hidden">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeContact.name)}&background=random&color=fff&size=128`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{activeContact.name}</h3>
                    <p className="text-sm text-gray-500">{activeContact.phoneNumber}</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-[#00A884] uppercase tracking-wide mb-1">About</p>
                      <p className="text-sm text-gray-600">Hey there! I am using BaseKey.</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#00A884] uppercase tracking-wide mb-1">Phone</p>
                      <p className="text-sm text-gray-800 font-medium">+{activeContact.phoneNumber}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowContactInfo(false)} className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full transition">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}

              {/* ── Messages List ── */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-0.5">
                <div className="text-center mb-4">
                  <span className="inline-block bg-[#FFEECD] text-[#54656F] text-[11.5px] py-1.5 px-4 rounded-lg shadow-sm font-medium">
                    Messages are end-to-end encrypted
                  </span>
                </div>

                <div className="flex items-center justify-center my-3">
                  <span className="bg-[#E1F2FB] text-[#54656F] text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm">
                    Today
                  </span>
                </div>

                {messages[activeContact.id]?.map((msg) =>
                  msg.mediaType ? (
                    <MediaMsgBubble key={msg.id} msg={msg} />
                  ) : (
                    <ChatBubble
                      key={msg.id}
                      msg={msg}
                      selectionMode={selectedMessages.size > 0}
                      isSelected={selectedMessages.has(msg.id)}
                      onToggleSelect={toggleSelection}
                      onReply={(m) => setReplyingTo(m)}
                      contactName={activeContact.name}
                    />
                  )
                )}
                <div ref={chatEndRef} />
              </div>

              {/* ── Chat Input ── */}
              <ChatInput
                inputText={inputText}
                setInputText={setInputText}
                onSend={handleSendMessage}
                isSending={isSending}
                disabled={selectedMessages.size > 0}
                replyingTo={replyingTo ? { text: replyingTo.text, sender: replyingTo.sender } : null}
                onCancelReply={() => setReplyingTo(null)}
                activeContactName={activeContact.name}
                phoneId={phoneId}
                accessToken={accessToken}
                recipientPhone={activeContact.phoneNumber}
                onSendMedia={handleSendMedia}
                onSendLocation={(lat, lng) => {
                  console.log("Location:", lat, lng);
                }}
                onSendInteractive={(type) => {
                  console.log("Interactive:", type);
                }}
                onSendTemplate={() => {
                  console.log("Template");
                }}
              />
            </div>
          ) : (
            /* ── Empty State ── */
            <div className="hidden md:flex flex-1 flex-col items-center justify-center z-10 text-center px-10">
              <div className="mb-8">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                  alt="WhatsApp"
                  className="w-28 h-28 opacity-20 grayscale"
                />
              </div>
              <h1 className="text-[32px] font-light text-[#41525D] mb-3">BaseKey for Web</h1>
              <p className="text-[#8696A0] text-[14px] max-w-md leading-relaxed">
                Send and receive messages seamlessly.<br />
                Select a chat or start a new conversation to connect.
              </p>
              <div className="mt-8 flex items-center gap-2 text-[12px] text-[#8696A0]">
                End-to-end encrypted
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
