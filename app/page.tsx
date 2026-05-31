"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, database } from "../lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, push, set, remove } from "firebase/database"; 
import { Search, MoreVertical, MessageSquare, Loader2, Plus, Send, X, Check, CheckCheck, Reply, Trash2, ArrowLeft } from "lucide-react";
import Sidebar from "../components/Sidebar"; 

interface Message {
  id: string; 
  text: string;
  sender: "me" | "them";
  time: string;
  status?: "sent" | "delivered" | "read";
  replyTo?: string | null;
}

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  lastMessage: string;
  time: string;
  unread: number;
}

// ─── Sub-Component for WhatsApp style Bubble (Swipe to Reply & Long Press) ───
const MessageBubble = ({ 
  msg, 
  selectionMode, 
  isSelected, 
  onToggleSelect, 
  onReply 
}: { 
  msg: Message, 
  selectionMode: boolean, 
  isSelected: boolean, 
  onToggleSelect: (id: string) => void, 
  onReply: (msg: Message) => void 
}) => {
  const [translateX, setTranslateX] = useState(0);
  const touchStartX = useRef(0);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // Swipe & Long Press Logic (Mobile Touch + Mouse)
  const startInteraction = (clientX: number) => {
    if (selectionMode) return;
    touchStartX.current = clientX;
    pressTimer.current = setTimeout(() => {
      // Trigger Long Press
      onToggleSelect(msg.id);
      if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms for long press
  };

  const moveInteraction = (clientX: number) => {
    if (selectionMode) return;
    const diff = clientX - touchStartX.current;
    if (Math.abs(diff) > 10 && pressTimer.current) {
      clearTimeout(pressTimer.current); // Cancel long press if moving
    }
    // Only allow swipe right
    if (diff > 0 && diff < 80) {
      setTranslateX(diff);
    }
  };

  const endInteraction = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (translateX > 50) {
      onReply(msg);
    }
    setTranslateX(0); // Snap back
  };

  const handleClick = () => {
    if (selectionMode) onToggleSelect(msg.id);
  };

  const isMe = msg.sender === "me";

  return (
    <div 
      className={`flex items-center w-full my-0.5 relative transition-colors duration-200 ${isSelected ? "bg-[#25D366]/20" : ""}`}
      onClick={handleClick}
    >
      {/* Checkbox for Selection Mode */}
      {selectionMode && (
        <div className="w-10 flex justify-center shrink-0 cursor-pointer">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-[#00A884] border-[#00A884]" : "border-gray-400"}`}>
            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        </div>
      )}

      {/* Reply Icon Background (revealed on swipe) */}
      <div className="absolute left-4 opacity-0 transition-opacity" style={{ opacity: translateX / 100 }}>
        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
          <Reply className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      <div 
        className={`flex flex-col w-full px-2 md:px-4 ${isMe ? "items-end" : "items-start"}`}
        style={{ transform: `translateX(${translateX}px)`, transition: translateX === 0 ? "transform 0.2s ease-out" : "none" }}
        onTouchStart={(e) => startInteraction(e.touches[0].clientX)}
        onTouchMove={(e) => moveInteraction(e.touches[0].clientX)}
        onTouchEnd={endInteraction}
        onMouseDown={(e) => startInteraction(e.clientX)}
        onMouseMove={(e) => e.buttons === 1 && moveInteraction(e.clientX)}
        onMouseUp={endInteraction}
        onMouseLeave={endInteraction}
      >
        <div className={`relative max-w-[85%] md:max-w-[65%] rounded-lg px-2 pt-1.5 pb-2 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] cursor-pointer
          ${isMe ? "bg-[#D9FDD3] rounded-tr-none" : "bg-white rounded-tl-none border border-gray-100"}
        `}>
          {/* Reply Context */}
          {msg.replyTo && (
            <div className="bg-black/5 rounded-md p-2 mb-1.5 border-l-4 border-[#00A884] text-xs opacity-90 line-clamp-2">
              <span className="text-[#00A884] font-bold block text-[10px] mb-0.5">Replying</span>
              <span className="text-gray-700">{msg.replyTo}</span>
            </div>
          )}
          
          {/* Message Text & Spacer for Time */}
          <div className="text-[14px] leading-relaxed text-[#111B21] whitespace-pre-wrap break-words inline-block">
            {msg.text}
            <span className="inline-block w-14 h-1"></span> {/* Invisible Spacer so time doesn't overlap text */}
          </div>

          {/* Timestamp & Read Receipts */}
          <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-gray-500 float-right">
            <span>{msg.time}</span>
            {isMe && (
              <>
                {msg.status === "sent" && <Check className="w-3.5 h-3.5 text-gray-400" />}
                {msg.status === "delivered" && <CheckCheck className="w-3.5 h-3.5 text-gray-400" />}
                {msg.status === "read" && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───
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

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false); 
  
  // Selection Mode State (Long Press to Select Multiple)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (!phoneId) return;
    const chatsRef = ref(database, `chats/${phoneId}`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const contactList = Object.entries(data).map(([phone, val]: any) => ({
          id: phone,
          name: val.info?.name || phone,
          phoneNumber: phone,
          lastMessage: val.info?.lastMessage || "",
          time: val.info?.updatedAt ? new Date(val.info.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
          unread: val.info?.unread || 0
        })).sort((a, b) => b.time.localeCompare(a.time)); 
        
        setContacts(contactList);
      } else {
        setContacts([]);
      }
    });
    return () => unsubscribe(); 
  }, [phoneId]);

  useEffect(() => {
    if (!activeContact || !phoneId) return;
    const msgRef = ref(database, `chats/${phoneId}/${activeContact.phoneNumber}/messages`);
    const unsubscribe = onValue(msgRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.entries(data).map(([key, val]: any) => ({
          id: key,
          ...val
        }));
        setMessages(prev => ({ ...prev, [activeContact.id]: msgs }));
      } else {
        setMessages(prev => ({ ...prev, [activeContact.id]: [] }));
      }
    });
    return () => unsubscribe();
  }, [activeContact, phoneId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, activeContact]);

  const playSendSound = () => {
    const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3');
    audio.play().catch(e => console.log("Sound play error:", e));
  };

  // Textarea Auto-Resize Logic
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleOpenChat = (contact: Contact) => {
    setActiveContact(contact);
    setReplyingTo(null);
    setSelectedMessages(new Set()); // Reset selections on chat change
    if (contact.unread > 0 && phoneId) {
       const infoRef = ref(database, `chats/${phoneId}/${contact.phoneNumber}/info/unread`);
       set(infoRef, 0);
    }
  };

  const handleStartNewChat = () => {
    if (!newPhoneNumber) return alert("Please enter a phone number!");
    const newContact: Contact = {
      id: newPhoneNumber,
      name: newChatName || newPhoneNumber,
      phoneNumber: newPhoneNumber,
      lastMessage: "Started a new conversation",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0
    };
    setActiveContact(newContact);
    setShowNewChat(false);
    setNewPhoneNumber("");
    setNewChatName("");
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeContact || !phoneId || !accessToken) return;

    setIsSending(true);
    const messageText = inputText;
    const recipientPhone = activeContact.phoneNumber;
    
    // Reset Textarea Height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
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
        setIsSending(false);
        return;
      }

      playSendSound();

      const msgRef = ref(database, `chats/${phoneId}/${recipientPhone}/messages`);
      const newMsgRef = push(msgRef);

      await set(newMsgRef, {
        text: messageText,
        sender: "me",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        status: "sent",
        replyTo: replyingTo?.text || null,
        metaId: data.messages?.[0]?.id || null 
      });

      const infoRef = ref(database, `chats/${phoneId}/${recipientPhone}/info`);
      await set(infoRef, {
        name: activeContact.name,
        phoneNumber: recipientPhone,
        lastMessage: messageText,
        updatedAt: Date.now(),
        unread: 0
      });

      setInputText("");
      setReplyingTo(null);
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Message Selection
  const toggleSelection = (msgId: string) => {
    const newSet = new Set(selectedMessages);
    if (newSet.has(msgId)) newSet.delete(msgId);
    else newSet.add(msgId);
    setSelectedMessages(newSet);
  };

  // Delete Selected Messages
  const handleDeleteSelected = async () => {
    if(!activeContact || !phoneId) return;
    if(window.confirm(`Delete ${selectedMessages.size} message(s)?`)) {
      for (const msgId of Array.from(selectedMessages)) {
        const msgRef = ref(database, `chats/${phoneId}/${activeContact.phoneNumber}/messages/${msgId}`);
        await remove(msgRef);
      }
      setSelectedMessages(new Set()); // Clear selection mode
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#00A884]" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-white overflow-hidden pb-[70px] md:pb-0">
      <div className="flex w-full h-full relative">
        
        {/* New Chat Modal */}
        {showNewChat && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">New Chat</h3>
                <X className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-800" onClick={() => setShowNewChat(false)} />
              </div>
              <input 
                type="text" placeholder="Number (e.g. 919876543210)" value={newPhoneNumber} onChange={(e) => setNewPhoneNumber(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 outline-none focus:border-[#00A884]"
              />
              <input 
                type="text" placeholder="Name (Optional)" value={newChatName} onChange={(e) => setNewChatName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 outline-none focus:border-[#00A884]"
              />
              <button onClick={handleStartNewChat} className="w-full bg-[#00A884] text-white py-3 rounded-xl font-bold hover:bg-[#008f6f] transition">
                Start Messaging
              </button>
            </div>
          </div>
        )}

        <div className={`${activeContact ? 'hidden md:flex' : 'flex'} shrink-0`}>
          <Sidebar />
        </div>

        {/* Sidebar Chat List (Light Theme) */}
        <div className={`${activeContact ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[380px] h-full border-r border-gray-200 flex-col bg-white`}>
          <div className="p-3 md:px-4 md:py-3.5 flex items-center justify-between bg-[#F0F2F5]">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden">
                 <img src={user?.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="User" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-[17px] font-bold text-[#111B21]">Chats</h1>
            </div>
            <div className="flex gap-4 text-[#54656F]">
              <Plus onClick={() => setShowNewChat(true)} className="w-6 h-6 cursor-pointer hover:text-black transition" />
              <MoreVertical className="w-5 h-5 cursor-pointer hover:text-black transition" />
            </div>
          </div>

          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center bg-[#F0F2F5] rounded-lg p-1.5 px-3">
              <Search className="w-4 h-4 text-[#54656F] shrink-0" />
              <input type="text" placeholder="Search or start new chat" className="w-full bg-transparent border-none outline-none ml-4 text-[14px] text-gray-800 placeholder-[#54656F]" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {!phoneId ? (
               <div className="text-center text-gray-500 mt-10 text-sm px-4">API Config Not Matched.<br/>Please link your API in Settings.</div>
            ) : contacts.length === 0 ? (
              <div className="text-center text-gray-500 mt-10 text-sm px-4">No chats yet.<br/>Click '+' to start a new chat.</div>
            ) : (
              contacts.map((contact) => (
                <div key={contact.id} onClick={() => handleOpenChat(contact)} className={`flex items-center p-3 cursor-pointer transition hover:bg-[#F5F6F6] ${activeContact?.id === contact.id ? "bg-[#F0F2F5]" : ""}`}>
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold shrink-0 text-white shadow-sm overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${contact.name}&background=random`} alt="" />
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden border-b border-gray-100 pb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-[#111B21] text-[16px] truncate pr-2">{contact.name}</h3>
                      <span className={`text-[12px] ${contact.unread > 0 ? 'text-[#00A884] font-bold' : 'text-[#667781]'}`}>{contact.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className={`text-[13px] truncate pr-2 ${contact.unread > 0 ? 'text-[#111B21] font-medium' : 'text-[#667781]'}`}>{contact.lastMessage}</p>
                      {contact.unread > 0 && <span className="w-5 h-5 bg-[#00A884] text-white text-[11px] font-bold flex items-center justify-center rounded-full shrink-0">{contact.unread}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area (WhatsApp Meta Style) */}
        <div className={`${!activeContact ? 'hidden md:flex' : 'flex'} flex-1 h-full flex-col relative`}>
          {/* Chat Background Image */}
          <div className="absolute inset-0 z-0 bg-[#EFEAE2] opacity-80" 
               style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundRepeat: 'repeat' }}>
          </div>

          {activeContact ? (
            <div className="flex flex-col h-full z-10 w-full relative">
              
              {/* Dynamic Header (Selection Mode vs Normal) */}
              {selectedMessages.size > 0 ? (
                <div className="px-4 py-3 flex items-center justify-between bg-[#F0F2F5] shadow-sm">
                  <div className="flex items-center gap-4">
                    <X className="w-6 h-6 cursor-pointer text-gray-600 hover:text-gray-900" onClick={() => setSelectedMessages(new Set())} />
                    <span className="text-[#111B21] font-semibold text-lg">{selectedMessages.size} selected</span>
                  </div>
                  <div className="flex items-center gap-5 text-gray-600">
                    <Trash2 className="w-5 h-5 cursor-pointer hover:text-red-500 transition" onClick={handleDeleteSelected} />
                  </div>
                </div>
              ) : (
                <div className="px-3 md:px-4 py-2.5 flex items-center justify-between bg-[#F0F2F5] shadow-sm">
                  <div className="flex items-center">
                    <ArrowLeft onClick={() => setActiveContact(null)} className="w-6 h-6 mr-2 cursor-pointer md:hidden text-gray-600" />
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      <img src={`https://ui-avatars.com/api/?name=${activeContact.name}&background=random`} alt="" />
                    </div>
                    <div className="ml-3 cursor-pointer">
                      <h2 className="font-semibold text-[#111B21] text-[16px]">{activeContact.name}</h2>
                      <p className="text-[12px] text-[#667781] leading-tight">{activeContact.phoneNumber}</p>
                    </div>
                  </div>
                  <MoreVertical className="w-5 h-5 cursor-pointer text-[#54656F]" />
                </div>
              )}

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                 <div className="text-center text-[#54656F] bg-[#FFEECD] text-[11.5px] py-1.5 px-3 rounded-lg w-fit mx-auto mb-4 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
                    <span className="font-semibold">🔒 Messages are end-to-end encrypted.</span> No one outside of this chat can read them.
                 </div>
                 
                 {messages[activeContact.id]?.map((msg) => (
                    <MessageBubble 
                      key={msg.id}
                      msg={msg}
                      selectionMode={selectedMessages.size > 0}
                      isSelected={selectedMessages.has(msg.id)}
                      onToggleSelect={toggleSelection}
                      onReply={(msg) => setReplyingTo(msg)}
                    />
                 ))}
                 <div ref={chatEndRef} />
              </div>

              {/* WhatsApp Auto-expanding Chat Input Area */}
              <div className="bg-[#F0F2F5] pb-2 md:pb-4 pt-2 flex flex-col z-20">
                
                {/* Reply Banner */}
                {replyingTo && (
                  <div className="mx-4 mb-2 bg-[#E1E8ED] rounded-xl overflow-hidden shadow-sm flex items-stretch">
                    <div className="w-1.5 bg-[#00A884]"></div>
                    <div className="p-2 px-3 flex-1 flex justify-between items-start bg-black/5">
                      <div className="flex flex-col">
                        <span className="text-[#00A884] font-bold text-[12px] mb-0.5">{replyingTo.sender === "me" ? "You" : activeContact.name}</span>
                        <span className="text-[13px] text-gray-700 line-clamp-2">{replyingTo.text}</span>
                      </div>
                      <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-gray-800 shrink-0 mt-1" onClick={() => setReplyingTo(null)} />
                    </div>
                  </div>
                )}

                {/* Input Bar */}
                <div className="px-3 md:px-4 flex items-end gap-2 md:gap-3">
                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex items-end p-1">
                    <textarea 
                      ref={textareaRef}
                      value={inputText}
                      onChange={handleTextChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }} 
                      placeholder="Type a message" 
                      className="w-full max-h-[120px] bg-transparent resize-none overflow-y-auto px-3 py-2.5 text-[15px] text-[#111B21] outline-none placeholder-[#8696A0]"
                      rows={1}
                      disabled={isSending || selectedMessages.size > 0}
                    />
                  </div>
                  
                  {inputText.trim() ? (
                    <button 
                      onClick={handleSendMessage} 
                      disabled={isSending || selectedMessages.size > 0} 
                      className="w-[46px] h-[46px] bg-[#00A884] text-white rounded-full hover:bg-[#008f6f] flex items-center justify-center transition shadow-md shrink-0 disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                    </button>
                  ) : (
                    <button className="w-[46px] h-[46px] bg-[#00A884] text-white rounded-full flex items-center justify-center transition shadow-md shrink-0 pointer-events-none opacity-50">
                      <Send className="w-5 h-5 ml-1" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Empty State */
            <div className="hidden md:flex flex-1 flex-col items-center justify-center z-10 text-center px-10 bg-[#F0F2F5]">
              <div className="mb-8">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-24 h-24 opacity-20 grayscale" />
              </div>
              <h1 className="text-[32px] font-light text-[#41525D] mb-4">BaseKey for Web</h1>
              <p className="text-[#8696A0] text-[14px] max-w-md">Send and receive messages seamlessly.<br/>Click on any chat or start a new one to connect.</p>
              <div className="mt-10 flex items-center gap-2 text-[12px] text-[#8696A0]">
                 <span>🔒</span> End-to-end encrypted
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
