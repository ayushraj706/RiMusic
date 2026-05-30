"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, database } from "../lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, push, set, remove } from "firebase/database"; 
import { Search, MoreVertical, MessageSquare, Loader2, Plus, Send, X, Check, CheckCheck, Reply, Trash2, Smile, ArrowLeft } from "lucide-react";
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
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Auth & Fetch Dynamic Config
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

  // 2. Real-time Contacts Listener
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

  // 3. Real-time Messages Listener
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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContact]);

  // SOUND PLAY FUNCTION
  const playSendSound = () => {
    // Note: Agar aapke paas apni koi mp3 file hai, toh use 'public' folder me 'send.mp3' naam se save kar lein.
    // Abhi ke liye ek generic short notification beep play kar rahe hain.
    const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3');
    audio.play().catch(e => console.log("Sound play error:", e));
  };

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const handleOpenChat = (contact: Contact) => {
    setActiveContact(contact);
    setReplyingTo(null);
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
    
    try {
      // Send message via Meta Graph API
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
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
        console.error("Meta API Error:", data.error);
        alert(`Message Failed: ${data.error.message}`);
        setIsSending(false);
        return;
      }

      // Success Sound ("Tang")
      playSendSound();

      // Save to Firebase
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

      // Update Sidebar Info
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
      console.error("Error sending message:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if(!activeContact || !phoneId) return;
    if(window.confirm("Are you sure you want to delete this message?")) {
      const msgRef = ref(database, `chats/${phoneId}/${activeContact.phoneNumber}/messages/${msgId}`);
      await remove(msgRef); 
    }
  };

  return (
    // Mobile par padding 0 kar di taaki full screen feel aaye
    <div className="flex h-screen w-full bg-background overflow-hidden p-0 sm:p-2 md:p-4">
      <div className="flex w-full h-full glassmorphism rounded-none sm:rounded-2xl overflow-hidden shadow-2xl border-0 sm:border border-border relative">
        
        {/* New Chat Modal */}
        {showNewChat && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-sm p-6 rounded-2xl border border-border shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Start New Chat</h3>
                <X className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-white" onClick={() => setShowNewChat(false)} />
              </div>
              <input 
                type="text" placeholder="Number (e.g. 919876543210)" value={newPhoneNumber} onChange={(e) => setNewPhoneNumber(e.target.value)}
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

        {/* Sidebar Mini (Icons) - Hides on Mobile when Chat is Active */}
        <div className={`${activeContact ? 'hidden md:flex' : 'flex'} shrink-0`}>
          <Sidebar />
        </div>

        {/* Sidebar Chat List - Hides on Mobile when Chat is Active */}
        <div className={`${activeContact ? 'hidden md:flex' : 'flex'} w-full md:w-[300px] lg:w-1/3 h-full border-r border-border flex-col bg-card/50`}>
          <div className="p-3 md:p-4 flex items-center justify-between border-b border-border bg-card/80">
            <h1 className="text-xl font-bold text-primary">BaseKey</h1>
            <div className="flex gap-4 text-muted-foreground">
              <Plus onClick={() => setShowNewChat(true)} className="w-6 h-6 cursor-pointer hover:text-primary transition" />
              <MoreVertical className="w-5 h-5 cursor-pointer hover:text-primary transition" />
            </div>
          </div>

          <div className="p-2 md:p-3">
            <div className="relative flex items-center bg-background rounded-xl p-2 border border-border">
              <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
              <input type="text" placeholder="Search chats" className="w-full bg-transparent border-none outline-none ml-3 text-sm text-foreground" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!phoneId ? (
               <div className="text-center text-muted-foreground mt-10 text-sm">API Config Not Matched.<br/>Please configure via settings.</div>
            ) : contacts.length === 0 ? (
              <div className="text-center text-muted-foreground mt-10 text-sm">No chats yet.<br/>Click '+' to start messaging.</div>
            ) : (
              contacts.map((contact) => (
                <div key={contact.id} onClick={() => handleOpenChat(contact)} className={`flex items-center p-3 md:p-4 cursor-pointer border-b border-border transition hover:bg-primary/10 ${activeContact?.id === contact.id ? "hidden md:flex bg-primary/20 border-l-4 border-l-primary" : ""}`}>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold shrink-0">{contact.name.charAt(0).toUpperCase()}</div>
                  <div className="ml-3 md:ml-4 flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold truncate pr-2 text-sm md:text-base">{contact.name}</h3>
                      <span className={`text-[10px] ${contact.unread > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{contact.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5 md:mt-1">
                      <p className={`text-xs md:text-sm truncate pr-2 ${contact.unread > 0 ? 'text-white font-medium' : 'text-muted-foreground'}`}>{contact.lastMessage}</p>
                      {contact.unread > 0 && <span className="w-4 h-4 md:w-5 md:h-5 bg-primary text-primary-foreground text-[10px] md:text-xs flex items-center justify-center rounded-full shrink-0">{contact.unread}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area - Shows on Mobile ONLY when Chat is Active */}
        <div className={`${!activeContact ? 'hidden md:flex' : 'flex'} flex-1 h-full flex-col relative bg-[url('https://i.ibb.co/3s1fKkW/whatsapp-bg-dark.png')] bg-cover bg-center`}>
          <div className="absolute inset-0 bg-background/85 z-0"></div>

          {activeContact ? (
            <div className="flex flex-col h-full z-10 w-full">
              
              {/* Header */}
              <div className="p-3 md:p-4 flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-md">
                <div className="flex items-center">
                  {/* MOBILE BACK BUTTON */}
                  <ArrowLeft onClick={() => setActiveContact(null)} className="w-6 h-6 mr-3 cursor-pointer md:hidden text-muted-foreground hover:text-white" />
                  
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">{activeContact.name.charAt(0).toUpperCase()}</div>
                  <div className="ml-3 md:ml-4">
                    <h2 className="font-bold text-sm md:text-base">{activeContact.name}</h2>
                    <p className="text-[10px] md:text-xs text-muted-foreground">{activeContact.phoneNumber}</p>
                  </div>
                </div>
                <MoreVertical className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-white" />
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-2 md:gap-3">
                 <div className="text-center text-muted-foreground text-[10px] md:text-xs bg-background/80 py-1 px-2 md:py-1.5 md:px-3 rounded-lg w-fit mx-auto mb-2 md:mb-4 border border-border">Messages are securely managed by BaseKey Meta API.</div>
                 
                 {messages[activeContact.id]?.map((msg) => (
                   <div key={msg.id} className={`flex flex-col max-w-[85%] md:max-w-[70%] group ${msg.sender === "me" ? "self-end items-end" : "self-start items-start"}`}>
                     
                     {/* Hover Action Menu */}
                     <div className={`hidden md:group-hover:flex items-center gap-2 mb-1 ${msg.sender === "me" ? "pr-2" : "pl-2"}`}>
                        <Reply className="w-4 h-4 text-muted-foreground hover:text-white cursor-pointer" onClick={() => setReplyingTo(msg)} />
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400 cursor-pointer" onClick={() => handleDeleteMessage(msg.id)} />
                     </div>

                     {/* Mobile Long Press Simulation (For demonstration, using visible icons on mobile is complex without libraries, so we keep simple hover/click for now. You can click to reply/delete) */}
                     <div className={`md:hidden flex items-center gap-2 mb-1 opacity-50 ${msg.sender === "me" ? "pr-2" : "pl-2"}`}>
                         <Reply className="w-3 h-3 cursor-pointer" onClick={() => setReplyingTo(msg)} />
                         <Trash2 className="w-3 h-3 text-red-500 cursor-pointer" onClick={() => handleDeleteMessage(msg.id)} />
                     </div>

                     <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-2xl shadow-sm text-[13px] md:text-sm flex flex-col min-w-[70px] md:min-w-[80px] ${msg.sender === "me" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card text-card-foreground border border-border rounded-tl-sm"}`}>
                       
                       {msg.replyTo && (
                         <div className="bg-black/20 rounded-lg p-1.5 md:p-2 mb-1.5 md:mb-2 text-[10px] md:text-xs border-l-4 border-white/50 opacity-80 line-clamp-2">
                           {msg.replyTo}
                         </div>
                       )}
                       
                       {msg.text}
                     </div>
                     
                     <div className="flex items-center gap-1 mt-0.5 md:mt-1 px-1">
                       <span className="text-[9px] md:text-[10px] text-muted-foreground">{msg.time}</span>
                       
                       {msg.sender === "me" && (
                         <>
                           {msg.status === "sent" && <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-muted-foreground" />}
                           {msg.status === "delivered" && <CheckCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-muted-foreground" />}
                           {msg.status === "read" && <CheckCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-400" />}
                         </>
                       )}
                     </div>
                   </div>
                 ))}
                 <div ref={chatEndRef} />
              </div>

              {/* Chat Input Area */}
              <div className="bg-card/90 backdrop-blur-md border-t border-border flex flex-col">
                
                {replyingTo && (
                  <div className="flex items-center justify-between p-2 md:p-3 bg-secondary/50 border-b border-border m-2 mb-0 rounded-xl">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] md:text-xs font-bold text-primary mb-0.5">Replying to {replyingTo.sender === "me" ? "yourself" : activeContact.name}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground truncate pr-4">{replyingTo.text}</span>
                    </div>
                    <X className="w-4 h-4 md:w-5 md:h-5 cursor-pointer text-muted-foreground hover:text-white shrink-0" onClick={() => setReplyingTo(null)} />
                  </div>
                )}

                <div className="p-2 md:p-3 flex items-center gap-2 md:gap-3">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} 
                    placeholder="Type a message..." 
                    className="flex-1 bg-background border border-border rounded-full md:rounded-xl px-4 py-2.5 md:py-3 text-sm md:text-base outline-none focus:ring-1 focus:ring-primary"
                    disabled={isSending}
                  />
                  <button onClick={handleSendMessage} disabled={!inputText.trim() || isSending} className="bg-primary text-primary-foreground p-2.5 md:p-3 rounded-full md:rounded-xl hover:bg-primary/90 transition shadow-lg disabled:opacity-50">
                    {isSending ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5" />}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center z-10 text-center px-10">
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
