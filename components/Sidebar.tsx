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
  FileText,
  LayoutTemplate
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
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t border-gray-200 bg-white flex items-center justify-center md:static md:w-20 md:h-screen md:border-t-0 md:border-r">
        <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
      </div>
    );
  }

  // Navigation items config
  const navItems = [
    { href: "/", icon: MessageSquare, label: "Chats", activePaths: ["/", "/chat"] },
    { href: "/chatbot-builder", icon: Bot, label: "Flow Builder", activePaths: ["/chatbot-builder"] },
    { href: "/template", icon: LayoutTemplate, label: "Templates", activePaths: ["/template"] },
  ];

  const isActive = (paths: string[]) => paths.some(p => pathname === p || pathname?.startsWith(p + "/"));

  return (
    <>
      {/* ============================================ */}
      {/* DESKTOP SIDEBAR - Left side, full height */}
      {/* ============================================ */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-20 bg-white border-r border-gray-200 z-50">
        {/* Top Section - Navigation */}
        <div className="flex-1 flex flex-col items-center py-6 gap-2 overflow-y-auto no-scrollbar">
          {isMatched ? (
            <>
              {navItems.map((item) => {
                const active = isActive(item.activePaths);
                return (
                  <Link key={item.href} href={item.href} className="w-full flex justify-center py-1">
                    <div
                      className={`relative group w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        active 
                          ? "bg-[#25D366] text-white shadow-md shadow-[#25D366]/25" 
                          : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                      title={item.label}
                    >
                      <item.icon className="w-5 h-5" />
                      {/* Active indicator dot */}
                      {active && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                      )}
                      {/* Tooltip */}
                      <div className="absolute left-14 px-2 py-1 bg-gray-900 text-white text-[11px] font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {item.label}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 mt-8">
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-[9px] text-gray-400 font-bold tracking-wide uppercase text-center leading-tight px-1">
                Not<br/>Linked
              </p>
            </div>
          )}
        </div>

        {/* Bottom Section - Settings & Profile */}
        <div className="flex flex-col items-center gap-3 pb-6 pt-3 border-t border-gray-100">
          {isMatched && (
            <button
              onClick={() => setIsModalOpen(true)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                isModalOpen 
                  ? "bg-gray-100 text-gray-900" 
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              }`}
              title="API Configuration"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {!isMatched && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-gray-800 transition shadow-md"
              title="Connect API"
            >
              <Link2 className="w-5 h-5" />
            </button>
          )}

          {/* Profile */}
          <div className="flex flex-col items-center gap-1">
            {isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />}
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 border border-gray-200 overflow-hidden shadow-sm">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                user?.email?.charAt(0).toUpperCase() || "U"
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================ */}
      {/* MOBILE BOTTOM BAR - Fixed bottom */}
      {/* ============================================ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-16 px-2">
          {isMatched ? (
            <>
              {navItems.map((item) => {
                const active = isActive(item.activePaths);
                return (
                  <Link key={item.href} href={item.href} className="flex-1">
                    <div className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all duration-200">
                      <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
                        active 
                          ? "bg-[#25D366] text-white shadow-md shadow-[#25D366]/25" 
                          : "text-gray-400"
                      }`}>
                        <item.icon className="w-5 h-5" />
                        {active && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <span className={`text-[10px] font-medium ${active ? "text-[#25D366]" : "text-gray-400"}`}>
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}

              {/* Settings */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-gray-400">Settings</span>
              </button>

              {/* Profile */}
              <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 border border-gray-200 overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    user?.email?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <span className="text-[10px] font-medium text-gray-400">Profile</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full gap-3 py-2">
              <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center border border-red-100">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-sm text-gray-500 font-medium">API Not Connected</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition"
              >
                Connect
              </button>
            </div>
          )}
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white" />
      </nav>

      <ConfigModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => setIsModalOpen(false)} 
      />
    </>
  );
}
