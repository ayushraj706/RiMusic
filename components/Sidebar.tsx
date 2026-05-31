"use client";

import { useEffect, useState } from "react";
import { auth, database } from "../lib/firebase"; 
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  MessageSquare, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Link2,
  Bot // <-- Naya icon Bot builder ke liye
} from "lucide-react";
import ConfigModal from "./ConfigModal"; 

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const [isMatched, setIsMatched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  // Current route pata karne ke liye taaki active button highlight ho sake
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = ref(database, `users/${currentUser.uid}/config`);
        
        const unsubscribeDB = onValue(userRef, (snapshot) => {
          setIsMatched(snapshot.exists() && snapshot.val().isMatched);
          setLoading(false);
        });
        
        return () => unsubscribeDB();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <div className="w-20 h-full border-r border-border bg-card/50 flex flex-col items-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="w-20 h-full border-r border-border bg-card/50 flex flex-col items-center py-6 glassmorphism z-10 transition-all duration-300">
        
        {/* App Logo */}
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-10 border border-primary/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>

        {/* Navigation Section */}
        <div className="flex-1 flex flex-col items-center gap-6 w-full">
          {isMatched ? (
            <>
              {/* Chat Inbox Button */}
              <Link href="/">
                <div 
                  className={`relative group cursor-pointer w-12 h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-95 ${
                    pathname === "/" || pathname === "/chat" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
                  }`}
                  title="Chats"
                >
                  <MessageSquare className="w-6 h-6" />
                  {/* Notification Dot (Optional) */}
                  {(pathname === "/" || pathname === "/chat") && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
              </Link>

              {/* Chatbot Builder Button */}
              <Link href="/chatbot-builder">
                <div 
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
                    pathname === "/chatbot-builder" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
                  }`}
                  title="Bot Builder"
                >
                  <Bot className="w-6 h-6" />
                </div>
              </Link>

              {/* Settings */}
              <div 
                onClick={() => setIsModalOpen(true)} 
                className="w-12 h-12 text-muted-foreground rounded-2xl flex items-center justify-center hover:bg-white/5 cursor-pointer transition mt-auto"
                title="API Configuration"
              >
                <Settings className="w-6 h-6" />
              </div>
            </>
          ) : (
            /* Setup State */
            <div className="flex flex-col items-center gap-4 px-2 text-center mt-10">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">API Not Linked</p>
              
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="mt-4 flex flex-col items-center justify-center gap-1 w-14 h-14 bg-white text-black rounded-xl hover:bg-gray-200 transition shadow-lg"
                title="Match & Configure API"
              >
                <Link2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Profile */}
        <div className="mt-6 flex flex-col items-center gap-4">
          {isMatched && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold border border-border overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
              user?.email?.charAt(0).toUpperCase() || "U"
            )}
          </div>
        </div>
      </div>

      <ConfigModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => setIsModalOpen(false)} 
      />
    </>
  );
}
