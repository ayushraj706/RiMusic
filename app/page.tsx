"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { Search, MoreVertical, MessageSquare, Phone, Video, Loader2, Plus, Send, X } from "lucide-react";
import Sidebar from "../components/Sidebar"; 

// Types define kar rahe hain taki error na aaye
interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
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
  
  // -- REAL-TIME STATES --
  const [contacts, setContacts] = useState<Contact[]>([]); // Default khali (No dummy)
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({}); // Har contact ki chat history
  const [inputText, setInputText] = useState("");
  
  // New Chat ke liye states
  const [showNewChat, setShowNewChat] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newChatName, setNewChatName] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // SECURITY GUARD
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setIsAuthorized(true);
      else router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  // Naya message aane par auto-scroll down
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

  // 1. Chat Open karna aur Unread Badge hatana
  const handleOpenChat = (contact: Contact) => {
    setActiveContact(contact);
    
    // Unread count 0 kar do (Seen logic)
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, unread: 0 } : c
    ));
  };

  // 2. Naye Number par Chat shuru karna
  const handleStartNewChat = () => {
    if (!newPhoneNumber) return alert("Please enter a phone number!");

    const newContactId = Date.now().toString(); // Temporary ID
    const newContact: Contact = {
      id: newContactId,
      name: newChatName || newPhoneNumber,
      phoneNumber: newPhoneNumber,
      lastMessage: "Started a new conversation",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0
    };

    // Naye contact ko list me sabse upar rakho
    setContacts(prev => [newContact, ...prev]);
    setMessages(prev => ({ ...prev, [newContactId]: [] })); // Chat history khali
    
    setActiveContact(newContact);
    setShowNewChat(false);
    setNewPhoneNumber("");
    setNewChatName("");
  };

  // 3. Message Send Karna
  const handleSendMessage = () => {
    if (!inputText.trim() || !activeContact) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Chat history me message dalo
    setMessages(prev => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMessage]
    }));

    // Contact list me Last Message update karo aur usko list me sabse UPAR (Top) par lao
    setContacts(prev => {
      const otherContacts = prev.filter(c => c.id !== activeContact.id);
      const updatedContact = { ...activeContact, lastMessage: inputText, time: newMessage.time };
      return [updatedContact, ...otherContacts]; // Sabse upar
    });

    setInputText("");

    // TODO: Yahan par Meta API ko (axios.post) message bhejne ka code aayega aage chalkar!
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden p-2 sm:p-4">
      <div className="flex w-full h-full glassmorphism rounded-2xl overflow-hidden shadow-2xl border border-border relative">
        
        {/* NEW CHAT POPUP (Modal) */}
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

        {/* CONTACT LIST */}
        <div className="w-[300px] lg:w-1/3 h-full border-r border-border flex flex-col bg-card/50">
          
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-border bg-card/80">
            <h1 className="text-xl font-bold text-primary">BaseKey</h1>
            <div className="flex gap-4 text-muted-foreground">
              {/* PLUS ICON: Yahan se title hata diya gaya hai taaki TypeScript error na aaye */}
              <Plus onClick={() => setShowNewChat(true)} className="w-6 h-6 cursor-pointer hover:text-primary transition" />
              <MoreVertical className="w-5 h-5 cursor-pointer hover:text-primary transition" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3">
            <div className="relative flex items-center bg-background rounded-xl p-2 border border-border">
              <Search className="w-4 h-4 text-muted-foreground ml-2" />
              <input type="text" placeholder="Search chats" className="w-full bg-transparent border-none outline-none ml-3 text-sm text-foreground" />
            </div>
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
              <div className="text-center text-muted-foreground mt-10 text-sm">
                No chats yet.<br/>Click '+' to start messaging.
              </div>
            ) : (
              contacts.map((contact) => (
                <div 
                  key={contact.id} 
                  onClick={() => handleOpenChat(contact)}
                  className={`flex items-center p-4 cursor-pointer border-b border-border transition hover:bg-primary/10 ${
                    activeContact?.id === contact.id ? "bg-primary/20 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4 flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold truncate pr-2">{contact.name}</h3>
                      <span className={`text-xs ${contact.unread > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{contact.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-sm truncate pr-2 ${contact.unread > 0 ? 'text-white font-medium' : 'text-muted-foreground'}`}>{contact.lastMessage}</p>
                      {contact.unread > 0 && (
                        <span className="w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center rounded-full shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]">
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

        {/* CHAT AREA */}
        <div className="flex-1 h-full flex flex-col relative bg-[url('https://i.ibb.co/3s1fKkW/whatsapp-bg-dark.png')] bg-cover bg-center">
          <div className="absolute inset-0 bg-background/85 z-0"></div>

          {activeContact ? (
            <div className="flex flex-col h-full z-10">
              
              {/* Chat Header */}
              <div className="p-4 flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-md">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {activeContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <h2 className="font-bold">{activeContact.name}</h2>
                    <p className="text-xs text-muted-foreground">{activeContact.phoneNumber}</p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                 <div className="text-center text-muted-foreground text-xs bg-background/80 py-1.5 px-3 rounded-lg w-fit mx-auto mb-4 border border-border">
                   Messages are securely managed by BaseKey Meta API.
                 </div>
                 
                 {/* Rendering Bubbles */}
                 {messages[activeContact.id]?.map((msg) => (
                   <div key={msg.id} className={`flex flex-col max-w-[70%] ${msg.sender === "me" ? "self-end items-end" : "self-start items-start"}`}>
                     <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${msg.sender === "me" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card text-card-foreground border border-border rounded-tl-sm"}`}>
                       {msg.text}
                     </div>
                     <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.time}</span>
                   </div>
                 ))}
                 <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-card/90 backdrop-blur-md border-t border-border flex items-center gap-3">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} // Enter dabane par send hoga
                  placeholder="Type a message..." 
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 transition shadow-lg disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center z-10 text-center px-10">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-3">BaseKey Web</h1>
              <p className="text-muted-foreground max-w-md">
                Click on the '+' icon in the sidebar to start a new chat, or select an existing conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
