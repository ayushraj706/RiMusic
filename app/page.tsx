"use client";

import { Search, MoreVertical, MessageSquare, Phone, Video } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

export default function ChatDashboard() {
  const { activeContact, setActiveContact } = useChatStore();

  // Dummy Contacts for Testing UI
  const dummyContacts = [
    { id: "1", name: "Sana", phoneNumber: "919876543210", lastMessage: "Hello BaseKey!", time: "10:45 AM", unread: 2 },
    { id: "2", name: "Anshu", phoneNumber: "919876543211", lastMessage: "API kab tak live hogi?", time: "09:30 AM", unread: 0 },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden p-4">
      {/* Main Glassmorphism Container */}
      <div className="flex w-full h-full glassmorphism rounded-2xl overflow-hidden shadow-2xl border border-border">
        
        {/* SIDEBAR (Contact List) */}
        <div className="w-1/3 h-full border-r border-border flex flex-col bg-card/50">
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between border-b border-border bg-card/80">
            <h1 className="text-xl font-bold text-primary">BaseKey CRM</h1>
            <div className="flex gap-4 text-muted-foreground">
              <MessageSquare className="w-5 h-5 cursor-pointer hover:text-primary transition" />
              <MoreVertical className="w-5 h-5 cursor-pointer hover:text-primary transition" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3">
            <div className="relative flex items-center bg-background rounded-xl p-2 border border-border">
              <Search className="w-4 h-4 text-muted-foreground ml-2" />
              <input 
                type="text" 
                placeholder="Search or start new chat" 
                className="w-full bg-transparent border-none outline-none ml-3 text-sm text-foreground"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {dummyContacts.map((contact) => (
              <div 
                key={contact.id} 
                onClick={() => setActiveContact(contact as any)}
                className={`flex items-center p-4 cursor-pointer border-b border-border transition hover:bg-primary/10 ${
                  activeContact?.id === contact.id ? "bg-primary/20 border-l-4 border-l-primary" : ""
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
                  {contact.name.charAt(0)}
                </div>
                {/* Details */}
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{contact.name}</h3>
                    <span className="text-xs text-muted-foreground">{contact.time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                    {contact.unread > 0 && (
                      <span className="w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center rounded-full">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 h-full flex flex-col relative bg-[url('https://i.ibb.co/3s1fKkW/whatsapp-bg-dark.png')] bg-cover bg-center">
          {/* Overlay to make background slightly dark */}
          <div className="absolute inset-0 bg-background/80 z-0"></div>

          {activeContact ? (
            <div className="flex flex-col h-full z-10">
              {/* Chat Header */}
              <div className="p-4 flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-md">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {activeContact.name?.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h2 className="font-bold">{activeContact.name}</h2>
                    <p className="text-xs text-green-500 font-medium">Online (API Active)</p>
                  </div>
                </div>
                <div className="flex gap-5 text-muted-foreground">
                   {/* WhatsApp API me call block hota hai, isliye disabled look diya hai */}
                  <Video className="w-5 h-5 opacity-50 cursor-not-allowed" />
                  <Phone className="w-5 h-5 opacity-50 cursor-not-allowed" />
                  <Search className="w-5 h-5 cursor-pointer hover:text-primary transition" />
                </div>
              </div>

              {/* Chat Messages Space (Empty for now) */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end">
                 <div className="text-center text-muted-foreground text-sm bg-background/50 py-1 px-3 rounded-lg w-fit mx-auto mb-4 border border-border">
                   This chat is securely managed by BaseKey Meta API.
                 </div>
              </div>

              {/* Chat Input Area */}
              <div className="p-4 bg-card/90 backdrop-blur-md border-t border-border flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                />
                <button className="bg-primary text-primary-foreground px-5 py-3 rounded-xl font-semibold hover:bg-primary/90 transition shadow-lg">
                  Send
                </button>
              </div>
            </div>
          ) : (
            /* Welcome Screen when no chat is selected */
            <div className="flex-1 flex flex-col items-center justify-center z-10 text-center px-10">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Welcome to BaseKey CRM</h1>
              <p className="text-muted-foreground max-w-md">
                Send and receive real-time messages, build interactive nodes, and manage your WhatsApp Business API directly from this futuristic dashboard.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
