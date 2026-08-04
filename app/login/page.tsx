"use client";

import { useEffect, useState } from "react";
// Dono naye components ko import kar rahe hain
import Anymation from "@/components/login/Anymation";
import LoginComponent from "@/components/login/Login";

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState(0); // 0: Cluster, 1: Splash Logo, 2: Login Screen
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Animation ki timing set ki hai (Pehle Icons, Phir Logo, Phir Login screen)
    const t1 = setTimeout(() => setPhase(1), 1600); 
    const t2 = setTimeout(() => setPhase(2), 2600); 

    // Check if user is already logged in via LocalStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("agent_token");
      if (token) {
        setIsAuthed(true);
      }
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Jab animation poora ho jaye aur user logged in ho, tabhi redirect karo (Hang hone se bachayega)
  useEffect(() => {
    if (phase === 2 && isAuthed) {
      // Primary page nikal kar wahi redirect karenge
      const primaryPage = localStorage.getItem("agent_primary_page") || "/chat";
      window.location.href = primaryPage;
    }
  }, [phase, isAuthed]);

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-black font-sans relative overflow-hidden">
      
      {/* 1. ANIMATION COMPONENT (Phase 0 aur Phase 1 yahan chalenge) */}
      <Anymation phase={phase} />

      {/* 2. LOGIN FORM COMPONENT (Phase 2 aane par yeh dikhega) */}
      {phase === 2 && !isAuthed && (
        <LoginComponent />
      )}

    </div>
  );
}
