"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase"; // Apne path check kar lena
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. NAYA LOGIC: Pehle check karo ki kya Agent login hai? (Local Storage se)
    // typeof window !== "undefined" lagana zaroori hai Next.js mein localStorage use karne ke liye
    if (typeof window !== "undefined") {
      const agentToken = localStorage.getItem("agent_token");
      if (agentToken) {
        router.push("/dashboard/chat"); // Agent ko seedha Chat par bhejo
        return;
      }
    }

    // 2. PURANA LOGIC: Agar Agent nahi hai, toh check karo ki Admin login hai? (Firebase se)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard"); // Admin ko Main Dashboard par bhejo
      } else {
        router.push("/login"); // Koi login nahi hai toh Login page par bhejo
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Jab tak check ho raha hai, tab tak ek loader dikhao
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-[#00A884]" />
    </div>
  );
}
