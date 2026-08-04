"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
// 🔥 NAYA: Firebase hata kar NextAuth ka session import kiya
import { useSession } from "next-auth/react"; 
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const { data: session, status } = useSession(); // NextAuth se login status la raha hai

  useEffect(() => {
    // 1. Check karo ki kya Agent login hai? (Local Storage se)
    if (typeof window !== "undefined") {
      const agentToken = localStorage.getItem("agent_token");
      
      // Agent ka primary page nikalo (Agar nahi mila toh default /chat par bhejo)
      const primaryPage = localStorage.getItem("agent_primary_page") || "/chat";

      if (agentToken) {
        // Agent ko uske assigned primary page par bhejo!
        router.push(primaryPage); 
        return;
      }
    }

    // 2. Agar Agent nahi hai, toh NextAuth (Admin) check karo
    if (status === "loading") {
      return; // Jab tak check kar raha hai, tab tak wait karo
    }

    if (status === "authenticated" && session?.user) {
      // Agar Admin login hai, toh dashboard par bhejo
      router.push("/dashboard"); 
    } else if (status === "unauthenticated") {
      // Agar koi login nahi hai, toh wapas login page par fenk do
      router.push("/login"); 
    }
    
  }, [router, session, status]); // Status change hone par yeh effect dobara chalega

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A884]" />
        <p className="text-sm text-gray-500 font-medium animate-pulse">Checking authentication...</p>
      </div>
    </div>
  );
}
