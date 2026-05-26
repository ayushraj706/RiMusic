"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase"; 
import { KeyRound, MessageSquare, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error("Login Failed:", error);
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
      <div className="w-full max-w-sm p-10 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-8 border border-gray-100">
          <MessageSquare className="w-10 h-10 text-gray-900 stroke-[1]" />
        </div>
        
        <h1 className="text-4xl font-extralight tracking-tight text-gray-950 mb-3">
          BaseKey
        </h1>
        <p className="text-gray-500 font-light text-sm mb-12">
          Sign in to continue to your dashboard
        </p>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-4 bg-white border border-gray-200 text-gray-950 py-3.5 px-6 rounded-xl hover:bg-gray-50 transition duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98]"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.6429 10.2273C19.6429 9.51705 19.5771 8.83523 19.4583 8.18182H10V12.0568H15.4036C15.1718 13.3068 14.4668 14.3636 13.4079 15.0739V17.5852H16.6393C18.5293 15.8466 19.6429 13.2784 19.6429 10.2273Z" fill="#000000"/>
              <path d="M10 20C12.7 20 14.9621 19.1023 16.6393 17.5852L13.4079 15.0739C12.5111 15.6761 11.3571 16.0341 10 16.0341C7.38929 16.0341 5.17857 14.267 4.38571 11.8977H1.08214V14.4545C2.73 17.7273 6.09821 20 10 20Z" fill="#000000"/>
              <path d="M4.38571 11.8977C4.18571 11.3068 4.07143 10.6705 4.07143 10C4.07143 9.32955 4.18571 8.69318 4.38571 8.10227V5.54545H1.08214C0.4 6.89773 0 8.40909 0 10C0 11.5909 0.4 13.1023 1.08214 14.4545L4.38571 11.8977Z" fill="#000000"/>
              <path d="M10 3.96591C11.4679 3.96591 12.7857 4.46591 13.8196 5.45455L16.7121 2.5625C14.9571 0.977273 12.6964 0 10 0C6.09821 0 2.73 2.27273 1.08214 5.54545L4.38571 8.10227C5.17857 5.73295 7.38929 3.96591 10 3.96591Z" fill="#000000"/>
          </svg>
          <span className="font-light text-base tracking-tight">Continue with Google</span>
        </button>

        <div className="mt-16 flex items-center justify-center gap-1.5 text-xs text-gray-400 font-light">
          <KeyRound className="w-3.5 h-3.5 stroke-[1]" />
          Protected by Firebase Authentication
        </div>
      </div>
    </div>
  );
}
