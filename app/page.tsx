"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { Search, MoreVertical, MessageSquare, Phone, Video, Loader2, Plus, Send, X, Check, CheckCheck, Reply, Trash2, Smile } from "lucide-react";
import Sidebar from "../components/Sidebar"; 

// Message interface ko bada kiya hai (Ticks aur Reply ke liye)
interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
  status?: "sent" | "delivered" | "read"; // Ticks ke liye
  replyTo?: string; // Agar kisi message ka reply diya hai
}

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export default function ChatDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputText, setInputText] = useState("");
  
  const [showNewChat, setShowNewChat] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newChatName, setNewChatName] = useState("");

  // Naya State: Reply karne ke liye
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setIsAuthorized(true);
      else router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContact]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const handleOpenChat = (contact: Contact) => {
    setActiveContact(contact);
    setReplyingTo(null); // Chat badalte hi reply box band kar do
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
  };

  const handleStartNewChat = () => {
    if (!newPhoneNumber) return alert("Please enter a phone number!");
    const newContactId = Date.now().toString();
    const newContact: Contact = {
      id: newContactId,
      name: newChatName || newPhoneNumber,
      phoneNumber: newPhoneNumber,
      lastMessage: "Started a new conversation",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0
    };
    setContacts(prev => [newContact, ...prev]);
    setMessages(prev => ({ ...prev, [newContactId]: [] }));
    setActiveContact(newContact);
    setShowNewChat(false);
    setNewPhoneNumber("");
    setNewChatName("");
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeContact) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent", // Default Single Tick aayega
      replyTo: replyingTo ? replyingTo.text : undefined // Agar reply tha toh jodo
    };

    setMessages(prev => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMessage]
    }));

    setContacts(prev => {
      const otherContacts = prev.filter(c => c.id !== activeContact.id);
      return [{ ...activeContact, lastMessage: inputText, time: newMessage.time }, ...otherContacts];
    });

    setInputText("");
    setReplyingTo(null); // Message bhejne ke baad reply box hata do
  };

  // Message Delete karne ka logic (UI se)
  const handleDeleteMessage = (msgId: string) => {
    if(!activeContact) return;
    setMessages(prev => ({
      ...prev,
      [activeContact.id]: prev[activeContact.id].filter(msg => msg.id !== msgId)
    }));
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden p-2 sm:p-4">
      <div className="flex w-full h-full glassmorphism rounded-2xl overflow-hidden shadow-2xl border border-border relative">
        
        {showNewChat && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card p-6 rounded-2xl border border-border w-96 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Start New Chat</h3>
                <X className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-white" onClick={() => setShowNewChat(false)} />
              </div>
              <input 
                type="text" placeholder="Phone Number (e.g., 919876543210)" value={newPhoneNumber} onChange={(e) => setNewPhoneNumber(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 mb-3 outline-none focus:ring-1 focus:ring-primary"
              />
              <input 
                type="text" placeholder="Name (Optional)" value={newChatName} onChange={(e) => setNewChatName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 mb-4 outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={handleStartNewChat} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition">
                Message Now
              </button>
            </div>
          </div>
        )}

        <Sidebar />

        <div className="w-[300px] lg:w-1/3 h-full border-r border-border flex flex-col bg-card/50">
          <div className="p-4 flex items-center justify-between border-b border-border bg-card/80">
            <h1 className="text-xl font-bold text-primary">BaseKey</h1>
            <div className="flex gap-4 text-muted-foreground">
              <Plus onClick={() => setShowNewChat(true)} className="w-6 h-6 cursor-pointer hover:text-primary transition" />
              <MoreVertical className="w-5 h-5 cursor-pointer hover:text-primary transition" />
            </div>
          </div>

          <div className="p-3">
            <div className="relative flex items-center bg-background rounded-xl p-2 border border-border">
              <Search className="w-4 h-4 text-muted-foreground ml-2" />
              <input type="text" placeholder="Search chats" className="w-full bg-transparent border-none outline-none ml-3 text-sm text-foreground" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
              <div className="text-center text-muted-foreground mt-10 text-sm">No chats yet.<br/>Click '+' to start messaging.</div>
            ) : (
              contacts.map((contact) => (
                <div key={contact.id} onClick={() => handleOpenChat(contact)} className={`flex items-center p-4 cursor-pointer border-b border-border transition hover:bg-primary/10 ${activeContact?.id === contact.id ? "bg-primary/20 border-l-4 border-l-primary" : ""}`}>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold shrink-0">{contact.name.charAt(0).toUpperCase()}</div>
                  <div className="ml-4 flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold truncate pr-2">{contact.name}</h3>
                      <span className={`text-[10px] ${contact.unread > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{contact.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-sm truncate pr-2 ${contact.unread > 0 ? 'text-white font-medium' : 'text-muted-foreground'}`}>{contact.lastMessage}</p>
                      {contact.unread > 0 && <span className="w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center rounded-full shrink-0">{contact.unread}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 h-full flex flex-col relative bg-[url('https://i.ibb.co/3s1fKkW/whatsapp-bg-dark.png')] bg-cover bg-center">
          <div className="absolute inset-0 bg-background/85 z-0"></div>

          {activeContact ? (
            <div className="flex flex-col h-full z-10">
              <div className="p-4 flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-md">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">{activeContact.name.charAt(0).toUpperCase()}</div>
                  <div className="ml-4">
                    <h2 className="font-bold">{activeContact.name}</h2>
                    <p className="text-xs text-muted-foreground">{activeContact.phoneNumber}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                 <div className="text-center text-muted-foreground text-xs bg-background/80 py-1.5 px-3 rounded-lg w-fit mx-auto mb-4 border border-border">Messages are securely managed by BaseKey Meta API.</div>
                 
                 {messages[activeContact.id]?.map((msg) => (
                   <div key={msg.id} className={`flex flex-col max-w-[70%] group ${msg.sender === "me" ? "self-end items-end" : "self-start items-start"}`}>
                     
                     {/* Hover Action Menu (Reply & Delete) */}
                     <div className={`hidden group-hover:flex items-center gap-2 mb-1 ${msg.sender === "me" ? "pr-2" : "pl-2"}`}>
                        <Smile className="w-4 h-4 text-muted-foreground hover:text-white cursor-pointer" />
                        <Reply className="w-4 h-4 text-muted-foreground hover:text-white cursor-pointer" onClick={() => setReplyingTo(msg)} />
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400 cursor-pointer" onClick={() => handleDeleteMessage(msg.id)} />
                     </div>

                     <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm flex flex-col min-w-[80px] ${msg.sender === "me" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card text-card-foreground border border-border rounded-tl-sm"}`}>
                       
                       {/* Agar is message ne kisi aur ko reply kiya hai */}
                       {msg.replyTo && (
                         <div className="bg-black/20 rounded-lg p-2 mb-2 text-xs border-l-4 border-white/50 opacity-80 line-clamp-2">
                           {msg.replyTo}
                         </div>
                       )}
                       
                       {msg.text}
                     </div>
                     
                     <div className="flex items-center gap-1 mt-1 px-1">
                       <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                       
                       {/* TICKS SYSTEM: Single, Double, Blue */}
                       {msg.sender === "me" && (
                         <>
                           {msg.status === "sent" && <Check className="w-3.5 h-3.5 text-muted-foreground" />}
                           {msg.status === "delivered" && <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />}
                           {msg.status === "read" && <CheckCheck className="w-3.5 h-3.5 text-blue-400" />}
                         </>
                       )}
                     </div>
                   </div>
                 ))}
                 <div ref={chatEndRef} />
              </div>

              {/* Chat Input Area (With Reply Context Box) */}
              <div className="bg-card/90 backdrop-blur-md border-t border-border flex flex-col">
                
                {/* Reply Preview Box */}
                {replyingTo && (
                  <div className="flex items-center justify-between p-3 bg-secondary/50 border-b border-border m-2 mb-0 rounded-xl">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-primary mb-0.5">Replying to {replyingTo.sender === "me" ? "yourself" : activeContact.name}</span>
                      <span className="text-xs text-muted-foreground truncate pr-4">{replyingTo.text}</span>
                    </div>
                    <X className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-white shrink-0" onClick={() => setReplyingTo(null)} />
                  </div>
                )}

                <div className="p-3 flex items-center gap-3">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} 
                    placeholder="Type a message..." 
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button onClick={handleSendMessage} disabled={!inputText.trim()} className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 transition shadow-lg disabled:opacity-50">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center z-10 text-center px-10">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-3">BaseKey Web</h1>
              <p className="text-muted-foreground max-w-md">Click on the '+' icon in the sidebar to start a new chat, or select an existing conversation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
