"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase"; // Apne path check kar lena
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Agar user logged in hai, toh Dashboard par bhejo
      if (user) {
        router.push("/dashboard");
      } else {
        // Agar logged in nahi hai, toh Login page par bhejo
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Jab tak check ho raha hai, tab tak ek loader dikhao
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
    </div>
  );
}
