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
  LayoutTemplate,
  LayoutDashboard,
  Megaphone,
  GitFork,
  Users,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Code2,
} from "lucide-react";
import ConfigModal from "./ConfigModal";

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const [isMatched, setIsMatched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [hideOnMobile, setHideOnMobile] = useState<boolean>(false);

  const pathname = usePathname();

  // Firebase Auth & Config Load
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

  const isActive = (paths: string[]) =>
    paths.some((p) => pathname === p || pathname?.startsWith(p + "/"));

  // Main nav items — mirroring Waplify's structure from screenshot
  const navItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      activePaths: ["/dashboard"],
    },
    {
      href: "/campaigns",
      icon: Megaphone,
      label: "Campaigns",
      activePaths: ["/campaigns"],
    },
    {
      href: "/",
      icon: MessageSquare,
      label: "Chat",
      activePaths: ["/", "/chat"],
    },
    {
      href: "/chatbot-builder",
      icon: GitFork,
      label: "Flows",
      activePaths: ["/chatbot-builder"],
    },
    {
      href: "/template",
      icon: LayoutTemplate,
      label: "Templates",
      activePaths: ["/template"],
    },
    {
      href: "/contacts",
      icon: Users,
      label: "Contacts",
      activePaths: ["/contacts"],
    },
  ];

  const bottomItems = [
    { href: "/developers", icon: Code2, label: "Developers", activePaths: ["/developers"] },
    { href: "/help", icon: HelpCircle, label: "Help Center", activePaths: ["/help"] },
  ];

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
              {/* WhatsApp-style brand mark */}
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
          {/* Collapse toggle button */}
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
                      {/* Active indicator bar */}
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
                      {/* Tooltip when collapsed */}
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
          {/* Bottom nav items */}
          {bottomItems.map((item) => {
            const active = isActive(item.activePaths);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-150 ${
                    active ? "text-[#25D366]" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
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

          {/* Settings / Connect */}
          <div
            className={`flex items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-150 text-gray-400 hover:bg-gray-50 hover:text-gray-600 ${
              collapsed ? "justify-center px-0" : ""
            }`}
            onClick={() => setIsModalOpen(true)}
            title={collapsed ? (isMatched ? "Settings" : "Connect API") : undefined}
          >
            {isMatched ? (
              <Settings className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
            ) : (
              <Link2 className={`shrink-0 text-gray-700 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
            )}
            {!collapsed && (
              <span className="text-[13px] font-medium text-gray-600">
                {isMatched ? "Settings" : "Connect API"}
              </span>
            )}
          </div>

          {/* User profile row */}
          <div
            className={`flex items-center gap-2.5 mt-1 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#e8faf0] border border-[#b7e8cc] flex items-center justify-center text-sm font-bold text-[#1a9e4e] shrink-0 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                user?.email?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-[12px] font-semibold text-gray-800 truncate leading-tight">
                  {user?.displayName || user?.email?.split("@")[0] || "User"}
                </span>
                <span className="text-[10px] text-gray-400 truncate leading-tight">
                  {user?.email || ""}
                </span>
              </div>
            )}
            {!collapsed && isMatched && (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] ml-auto shrink-0" />
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
        <div className="flex items-center justify-around h-16 px-1">
          {isMatched ? (
            <>
              {navItems.slice(0, 4).map((item) => {
                const active = isActive(item.activePaths);
                return (
                  <Link key={item.href} href={item.href} className="flex-1">
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

              {/* Settings button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400">
                  <Settings className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[9.5px] font-medium text-gray-400">Settings</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center w-full gap-3 py-2">
              <div className="w-8 h-8 bg-red-50 text-red-400 rounded-lg flex items-center justify-center border border-red-100">
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
