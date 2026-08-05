"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; 
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const { data: session, status } = useSession(); 

  useEffect(() => {
    // 1. Agar status loading hai, toh wait karo (koi redirect nahi)
    if (status === "loading") {
      return; 
    }

    // 2. Check karo ki kya Agent login hai? (Local Storage se)
    if (typeof window !== "undefined") {
      const agentToken = localStorage.getItem("agent_token");
      
      if (agentToken) {
        const primaryPage = localStorage.getItem("agent_primary_page") || "/chat";
        // 🔥 push() ki jagah replace() use kiya taaki back button se wapas login par na aaye
        router.replace(primaryPage); 
        return;
      }
    }

    // 3. Agar Agent nahi hai, toh NextAuth (Admin) check karo
    if (status === "authenticated" && session?.user) {
      // 🔥 yahan bhi replace()
      router.replace("/dashboard"); 
    } else if (status === "unauthenticated") {
      // 🔥 yahan bhi replace()
      router.replace("/login"); 
    }
    
  }, [router, session, status]); 

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        {/* Spinner ko premium blue color de diya hai */}
        <Loader2 className="w-8 h-8 animate-spin text-[#1877F2]" />
        <p className="text-sm text-gray-500 font-medium animate-pulse">Checking authentication...</p>
      </div>
    </div>
  );
}
