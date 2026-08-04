"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Check karo ki kya Agent login hai?
    if (typeof window !== "undefined") {
      const agentToken = localStorage.getItem("agent_token");
      if (agentToken) {
        // YAHAN THEEK KIYA HAI: /dashboard/chat ki jagah sirf /chat aayega
        router.push("/chat"); 
        return;
      }
    }

    // 2. Agar Agent nahi hai, toh Admin check karo
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard"); 
      } else {
        router.push("/login"); 
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-[#00A884]" />
    </div>
  );
}
