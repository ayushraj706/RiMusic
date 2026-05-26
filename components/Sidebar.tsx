"use client";

import { useEffect, useState } from "react";
import { auth, database } from "../lib/firebase"; 
import { ref, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { MessageSquare, Settings, AlertCircle, CheckCircle2, Loader2, Link2 } from "lucide-react";
import ConfigModal from "./ConfigModal"; 

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const [isMatched, setIsMatched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 1. Check karna ki user "Match" (Configured) hai ya nahi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Firebase Cloud DB check kar rahe hain
        const userRef = ref(database, `users/${currentUser.uid}/config`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists() && snapshot.val().isMatched) {
          setIsMatched(true);
        } else {
          setIsMatched(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

        <div className="flex-1 flex flex-col items-center gap-6 w-full">
          {isMatched ? (
            /* AGAR MATCH HAI: Chat aur aage ke options dikhao */
            <>
              <div className="relative group cursor-pointer">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95">
                  <MessageSquare className="w-6 h-6" />
                </div>
                {/* Active Indicator */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
              </div>

              {/* YAHAN UPDATE KIYA HAI: Settings icon par click karne se popup khulega */}
              <div 
                onClick={() => setIsModalOpen(true)} 
                className="w-12 h-12 text-muted-foreground rounded-2xl flex items-center justify-center hover:bg-white/5 cursor-pointer transition"
                title="API Configuration"
              >
                <Settings className="w-6 h-6" />
              </div>
            </>
          ) : (
            /* AGAR MATCH NAHI HAI: Setup/Match ka option dikhao */
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

        {/* User Profile Area (Bottom) */}
        <div className="mt-auto flex flex-col items-center gap-4">
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

      {/* Ye hamara popup modal hai jo khulega */}
      <ConfigModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsMatched(true); 
          setIsModalOpen(false); 
        }} 
      />
    </>
  );
}
