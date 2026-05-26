"use client";

import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase"; // Dhyan de path par
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KeyRound, MessageSquare, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Security Check: Agar user pehle se login hai, toh use dashboard par bhej do
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Success hone par useEffect apne aap redirect kar dega
    } catch (error) {
      console.error("Login Failed:", error);
      // Aap chahein toh yahan ek error state dikha sakte hain
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-black p-6 font-sans">
      
      {/* Main Login Container */}
      <div className="w-full max-w-sm p-10 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
        
        {/* App Icon - Sleek and Thin */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-8 border border-gray-100">
          <MessageSquare className="w-10 h-10 text-gray-900 stroke-[1]" />
        </div>
        
        {/* Title - Thin Font (font-extralight/font-light) */}
        <h1 className="text-4xl font-extralight tracking-tight text-gray-950 mb-3">
          BaseKey
        </h1>
        <p className="text-gray-500 font-light text-sm mb-12">
          Sign in to continue to your dashboard
        </p>

        {/* Custom Monochrome Google Button */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-4 bg-white border border-gray-200 text-gray-950 py-3.5 px-6 rounded-xl hover:bg-gray-50 transition duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98]"
        >
          {/* Black/White Google Icon SVG */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.6429 10.2273C19.6429 9.51705 19.5771 8.83523 19.4583 8.18182H10V12.0568H15.
