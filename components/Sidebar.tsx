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
  Bot, 
  FileText // <-- Naya icon Template builder ke liye
} from "lucide-react";
import ConfigModal from "./ConfigModal"; 

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const [isMatched, setIsMatched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
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
      <div className="fixed md:relative bottom-0 left-0 w-full h-[70px] md:w-20 md:h-full border-t md:border-t-0 md:border-r border-gray-200 bg-white flex items-center justify-center z-50">
        <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
      </div>
    );
  }

  return (
    <>
      {/* 
        Responsive Container: 
        Mobile: Fixed Bottom Bar (flex-row)
        Desktop: Fixed/Relative Left Sidebar (flex-col) 
      */}
      <div className="fixed z-50 bg-white border-gray-200 transition-all duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] md:shadow-none
                      bottom-0 left-0 w-full h-[70px] border-t px-6 flex flex-row items-center justify-between
                      md:top-0 md:left-0 md:w-20 md:h-full md:border-t-0 md:border-r md:flex-col md:justify-start md:px-0 md:py-6">
        
        {/* Navigation Section */}
        <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto gap-2 sm:gap-6 md:flex-1">
          {isMatched ? (
            <>
              <div className="flex flex-row md:flex-col items-center gap-4 sm:gap-6 w-full justify-center md:w-auto">
                {/* Chat Inbox Button */}
                <Link href="/">
                  <div 
                    className={`relative group cursor-pointer w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                      pathname === "/" || pathname === "/chat" ? "bg-[#25D366] text-white shadow-md shadow-[#25D366]/30" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    title="Chats"
                  >
                    <MessageSquare className="w-[22px] h-[22px]" />
                    {/* Notification Dot */}
                    {(pathname === "/" || pathname === "/chat") && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                </Link>

                {/* Chatbot Builder Button */}
                <Link href="/chatbot-builder">
                  <div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                      pathname === "/chatbot-builder" ? "bg-[#25D366] text-white shadow-md shadow-[#25D366]/30" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    title="Visual Flow Builder"
                  >
                    <Bot className="w-[22px] h-[22px]" />
                  </div>
                </Link>

                {/* Template Builder Button */}
                <Link href="/template">
                  <div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                      pathname === "/template" ? "bg-[#25D366] text-white shadow-md shadow-[#25D366]/30" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    title="WhatsApp Templates"
                  >
                    <FileText className="w-[22px] h-[22px]" />
                  </div>
                </Link>
              </div>

              {/* Settings (Desktop me neeche dikhega, Mobile me aakhri icon rahega) */}
              <div 
                onClick={() => setIsModalOpen(true)} 
                className="w-12 h-12 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition md:mt-auto active:scale-95 flex-shrink-0"
                title="API Configuration"
              >
                <Settings className="w-[24px] h-[24px]" />
              </div>
            </>
          ) : (
            /* Setup State (API Not Linked) */
            <div className="flex flex-row md:flex-col items-center w-full justify-between md:justify-center gap-4 md:mt-10">
              <div className="hidden md:flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase leading-tight">Not Linked</p>
              </div>
              
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="flex items-center justify-center w-[120px] h-10 md:w-14 md:h-14 bg-gray-900 text-white rounded-xl md:rounded-2xl hover:bg-gray-800 transition shadow-md active:scale-95 ml-auto md:ml-0 text-xs font-bold md:text-transparent gap-2 md:gap-0"
                title="Match & Configure API"
              >
                <Link2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                <span className="md:hidden">Connect API</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Picture Section */}
        <div className="flex flex-row md:flex-col items-center gap-4 md:mt-6 ml-4 md:ml-0 border-l md:border-l-0 md:border-t border-gray-200 pl-4 md:pl-0 md:pt-4">
          {isMatched && <CheckCircle2 className="hidden md:block w-4 h-4 text-[#25D366]" />}
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 border border-gray-200 overflow-hidden shadow-sm flex-shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User Profile" className="w-full h-full object-cover" />
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
