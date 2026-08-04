"use client";

import { useEffect, useState } from "react";
import { auth, database } from "../lib/firebase";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
// NAYA: useRouter import kiya hai redirect karne ke liye
import { usePathname, useRouter } from "next/navigation"; 
import Link from "next/link";
import {
  MessageSquare,
  Settings,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Link2,
  Bot,
  LayoutTemplate,
  LayoutDashboard,
  Megaphone,
  GitFork,
  Users,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Code2,
  UserPlus, // NAYA: Team page icon ke liye
  LogOut    // NAYA: Logout icon ke liye
} from "lucide-react";
import ConfigModal from "./ConfigModal";

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const [isMatched, setIsMatched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [hideOnMobile, setHideOnMobile] = useState<boolean>(false);

  // ─── NAYA: Roles aur Agent details manage karne ke liye ───
  const [userRole, setUserRole] = useState<"ADMIN" | "AGENT" | null>(null);
  const [agentName, setAgentName] = useState<string>("");

  const pathname = usePathname();
  const router = useRouter(); // Router initialize kiya

  // Firebase Auth, Config Load & Agent LocalStorage Check
  useEffect(() => {
    // 1. Pehle check karo ki kya koi AGENT logged in hai?
    if (typeof window !== "undefined") {
      const agentToken = localStorage.getItem("agent_token");
      const savedAgentName = localStorage.getItem("agent_name");
      
      if (agentToken) {
        setUserRole("AGENT");
        setAgentName(savedAgentName || "Support Agent");
        setUser({ uid: agentToken }); // Dummy user banaya taaki aage ke error na aaye
        setIsMatched(true); // Agent ko API config hamesha true manenge
        setLoading(false);
        return;
      }
    }

    // 2. Agar Agent nahi hai, toh check karo kya ADMIN (Firebase) logged in hai?
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserRole("ADMIN");
        setUser(currentUser);
        const userRef = ref(database, `users/${currentUser.uid}/config`);
        const unsubscribeDB = onValue(userRef, (snapshot) => {
          setIsMatched(snapshot.exists() && snapshot.val().isMatched);
          setLoading(false);
        });
        return () => unsubscribeDB();
      } else {
        setUserRole(null);
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // ─── NAYA LOGIC: Route Guard & Default Redirect ───
  useEffect(() => {
    // Jab loading khatam ho jaye tab check karo
    if (!loading) {
      if (!userRole) {
        // 1. Bina login wale ko dhakka maar ke login page pe bhejo
        router.push("/login");
      } else if (pathname === "/") {
        // 2. Agar logged in hai aur default URL (/) khola hai, toh Role ke hisab se bhejo
        router.push(userRole === "AGENT" ? "/chat" : "/dashboard");
      }
    }
  }, [loading, userRole, pathname, router]);

  // Smart detector for mobile hide logic
  useEffect(() => {
    const checkIfDetailViewOpen = () => {
      const isDetailView =
        document.getElementById("hide-bottom-bar") ||
        document.getElementById("mobile-chat-view") ||
        document.getElementById("template-builder-view") ||
        document.getElementById("flow-builder-view");
      setHideOnMobile(!!isDetailView);
    };
    checkIfDetailViewOpen();
    const observer = new MutationObserver(checkIfDetailViewOpen);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // ─── NAYA: Logout Handler (Admin aur Agent dono ke liye) ───
  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      if (userRole === "AGENT") {
        localStorage.removeItem("agent_token");
        localStorage.removeItem("agent_name");
        router.push("/login");
      } else {
        await auth.signOut();
        router.push("/login");
      }
    }
  };

  const isActive = (paths: string[]) =>
    paths.some((p) => pathname === p || pathname?.startsWith(p + "/"));

  // ─── NAYA: Roles define kiye gaye hain har page ke liye ───
  const rawNavItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", activePaths: ["/dashboard"], roles: ["ADMIN"] },
    { href: "/campaigns", icon: Megaphone, label: "Campaigns", activePaths: ["/campaigns"], roles: ["ADMIN"] },
    { href: "/chat", icon: MessageSquare, label: "Chat", activePaths: ["/chat"], roles: ["ADMIN", "AGENT"] },
    { href: "/chatbot-builder", icon: GitFork, label: "Flows", activePaths: ["/chatbot-builder"], roles: ["ADMIN"] },
    { href: "/template", icon: LayoutTemplate, label: "Templates", activePaths: ["/template"], roles: ["ADMIN"] },
    { href: "/contacts", icon: Users, label: "Contacts", activePaths: ["/contacts"], roles: ["ADMIN", "AGENT"] },
    { href: "/dashboard/team", icon: UserPlus, label: "Team", activePaths: ["/dashboard/team"], roles: ["ADMIN"] }, // Added Team Page
  ];

  const rawBottomItems = [
    { href: "/settings", icon: Settings, label: "Settings", activePaths: ["/settings"], roles: ["ADMIN"] },
    { href: "/developers", icon: Code2, label: "Developers", activePaths: ["/developers"], roles: ["ADMIN"] },
    { href: "/help", icon: HelpCircle, label: "Help Center", activePaths: ["/help"], roles: ["ADMIN", "AGENT"] },
  ];

  // Sirf wahi options filter karke nikalenge jiska Access Current Role ko hai
  const navItems = rawNavItems.filter(item => item.roles.includes(userRole || ""));
  const bottomItems = rawBottomItems.filter(item => item.roles.includes(userRole || ""));

  if (loading) {
    return (
      <>
        {/* Desktop skeleton */}
        <div className="hidden md:flex flex-col h-full w-[220px] bg-white border-r border-gray-100 items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#25D366]" />
        </div>
        {/* Mobile skeleton */}
        <div className="md:hidden fixed bottom-0 left-0 z-30 w-full h-16 border-t border-gray-100 bg-white flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#25D366]" />
        </div>
      </>
    );
  }

  // Agar user null hai aur redirect ho raha hai, toh null return kardo taaki UI flash na ho
  if (!userRole) return null; 

  return (
    <>
      {/* ================================================ */}
      {/* DESKTOP SIDEBAR — Collapsible                    */}
      {/* ================================================ */}
      <aside
        className={`hidden md:flex flex-col h-full bg-white border-r border-gray-100 z-40 shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? "w-[64px]" : "w-[220px]"
        }`}
      >
        {/* Logo / Brand */}
        <div
          className={`flex items-center h-14 border-b border-gray-100 px-3 shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 bg-[#25D366] rounded-lg flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[15px] text-gray-900 tracking-tight whitespace-nowrap">
                BaseKey
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 bg-[#25D366] rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-500 transition-colors shrink-0 ${
              collapsed ? "mt-0 ml-0" : ""
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Main nav */}
        <div className="flex-1 flex flex-col py-3 overflow-y-auto no-scrollbar gap-0.5 px-2">
          {isMatched ? (
            <>
              {navItems.map((item) => {
                const active = isActive(item.activePaths);
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`group flex items-center gap-3 rounded-lg px-2.5 py-2.5 cursor-pointer transition-all duration-150 relative ${
                        active
                          ? "bg-[#e8faf0] text-[#25D366]"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#25D366] rounded-r-full" />
                      )}
                      <item.icon
                        className={`shrink-0 transition-none ${
                          active ? "text-[#25D366]" : "text-gray-400 group-hover:text-gray-600"
                        } ${collapsed ? "w-5 h-5" : "w-4 h-4"}`}
                      />
                      {!collapsed && (
                        <span
                          className={`text-[13.5px] font-medium whitespace-nowrap ${
                            active ? "text-[#25D366]" : "text-gray-600 group-hover:text-gray-800"
                          }`}
                        >
                          {item.label}
                        </span>
                      )}
                      {collapsed && (
                        <div className="absolute left-[52px] px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                          {item.label}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </>
          ) : (
            <div
              className={`flex flex-col items-center gap-2 mt-6 px-2 ${
                collapsed ? "" : ""
              }`}
            >
              <div className="w-9 h-9 bg-red-50 text-red-400 rounded-xl flex items-center justify-center border border-red-100">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
              {!collapsed && (
                <p className="text-[11px] text-gray-400 text-center leading-tight font-medium">
                  API Not Linked
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom section */}
        <div className={`flex flex-col pb-4 pt-2 border-t border-gray-100 gap-0.5 px-2`}>
          {bottomItems.map((item) => {
            const active = isActive(item.activePaths);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-150 ${
                    active ? "text-[#25D366] bg-[#e8faf0]" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"} ${active ? "text-[#25D366]" : ""}`} />
                  {!collapsed && (
                    <span className="text-[13px] font-medium whitespace-nowrap">{item.label}</span>
                  )}
                  {collapsed && (
                    <div className="absolute left-[52px] px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                      {item.label}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Config Button - SIRF ADMIN KO DIKHEGA */}
          {userRole === "ADMIN" && (
            <div
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-150 text-gray-400 hover:bg-gray-50 hover:text-gray-600 ${
                collapsed ? "justify-center px-0" : ""
              }`}
              onClick={() => setIsModalOpen(true)}
              title={collapsed ? (isMatched ? "Configuration" : "Connect API") : undefined}
            >
              <Link2 className={`shrink-0 text-gray-700 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
              {!collapsed && (
                <span className="text-[13px] font-medium text-gray-600">
                  {isMatched ? "Configuration" : "Connect API"}
                </span>
              )}
            </div>
          )}

          {/* ─── NAYA: User Profile & Logout (Agent/Admin Dono ke liye) ─── */}
          <div
            onClick={handleLogout}
            className={`group flex items-center gap-2.5 mt-1 px-2 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition-colors ${
              collapsed ? "justify-center px-0" : ""
            }`}
            title={collapsed ? "Logout" : undefined}
          >
            <div className="w-8 h-8 rounded-full bg-[#e8faf0] group-hover:bg-red-100 border border-[#b7e8cc] group-hover:border-red-200 flex items-center justify-center text-sm font-bold text-[#1a9e4e] group-hover:text-red-500 shrink-0 overflow-hidden transition-colors">
              {userRole === "ADMIN" && user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                (userRole === "AGENT" ? agentName : user?.email)?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-[12px] font-semibold text-gray-800 group-hover:text-red-600 truncate leading-tight transition-colors">
                  {userRole === "ADMIN" ? (user?.displayName || user?.email?.split("@")[0] || "Owner") : agentName}
                </span>
                <span className="text-[10px] text-gray-400 group-hover:text-red-400 truncate leading-tight transition-colors">
                  {userRole === "ADMIN" ? (user?.email || "Admin") : "Support Agent"}
                </span>
              </div>
            )}
            {!collapsed && isMatched && (
              <>
                {/* Default dikhega CheckCircle, Hover par dikhega Logout */}
                <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] ml-auto shrink-0 group-hover:hidden" />
                <LogOut className="w-3.5 h-3.5 text-red-500 ml-auto shrink-0 hidden group-hover:block" />
              </>
            )}
            {!collapsed && !isMatched && (
              <LogOut className="w-3.5 h-3.5 text-red-500 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </aside>

      {/* ================================================ */}
      {/* MOBILE BOTTOM BAR                                */}
      {/* ================================================ */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 ease-in-out ${
          hideOnMobile
            ? "translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="flex items-center h-16 px-2 overflow-x-auto gap-2 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {isMatched ? (
            <>
              {navItems.map((item) => {
                const active = isActive(item.activePaths);
                return (
                  <Link key={item.href} href={item.href} className="flex-1 min-w-[70px] shrink-0">
                    <div className="flex flex-col items-center justify-center gap-0.5 py-1.5">
                      <div
                        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          active
                            ? "bg-[#e8faf0] text-[#25D366]"
                            : "text-gray-400"
                        }`}
                      >
                        <item.icon className="w-[18px] h-[18px]" />
                        {active && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <span
                        className={`text-[9.5px] font-medium ${
                          active ? "text-[#25D366]" : "text-gray-400"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}

              {/* ─── NAYA: Mobile par Settings aur Config sirf ADMIN ko dikhenge ─── */}
              {userRole === "ADMIN" && (
                <>
                  <Link href="/settings" className="flex-1 min-w-[70px] shrink-0">
                    <div className="flex flex-col items-center justify-center gap-0.5 py-1.5">
                      <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        pathname === "/settings" || pathname?.startsWith("/settings/") ? "bg-[#e8faf0] text-[#25D366]" : "text-gray-400"
                      }`}>
                        <Settings className="w-[18px] h-[18px]" />
                      </div>
                      <span className={`text-[9.5px] font-medium ${
                        pathname === "/settings" || pathname?.startsWith("/settings/") ? "text-[#25D366]" : "text-gray-400"
                      }`}>Settings</span>
                    </div>
                  </Link>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 min-w-[70px] shrink-0 flex flex-col items-center justify-center gap-0.5 py-1.5"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400">
                      <Link2 className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-[9.5px] font-medium text-gray-400">Config</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center w-full gap-3 py-2 min-w-full">
              <div className="w-8 h-8 bg-red-50 text-red-400 rounded-lg flex items-center justify-center border border-red-100">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-sm text-gray-500 font-medium">API Not Connected</p>
              
              {/* Connect Button sirf Admin ko mobile par dikhega */}
              {userRole === "ADMIN" && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition"
                >
                  Connect
                </button>
              )}
            </div>
          )}
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-white" />
      </nav>

      {/* Config Modal sirf Admin ke liye render hoga */}
      {userRole === "ADMIN" && (
        <ConfigModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
