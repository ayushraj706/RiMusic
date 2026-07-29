"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../../lib/firebase"; 
import { KeyRound, MessageSquare, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
      console.error("Google Login Failed:", error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (error) {
      console.error("Facebook Login Failed:", error);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-gray-400" />
        </motion.div>
      </div>
    );
  }

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-black p-6 font-sans">
      <motion.div 
        className="w-full max-w-sm p-10 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Floating Logo Animation */}
        <motion.div 
          className="w-20 h-20 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center mb-8 border border-gray-100 shadow-inner"
          variants={itemVariants}
          animate={{ y: [0, -8, 0] }} // Floating effect
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <MessageSquare className="w-10 h-10 text-gray-900 stroke-[1.5]" />
        </motion.div>
        
        <motion.h1 
          className="text-4xl font-light tracking-tight text-gray-950 mb-2"
          variants={itemVariants}
        >
          BaseKey
        </motion.h1>
        
        <motion.p 
          className="text-gray-500 font-light text-sm mb-10"
          variants={itemVariants}
        >
          Sign in to continue to your dashboard
        </motion.p>

        <motion.div className="space-y-3" variants={itemVariants}>
          {/* Google Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-950 py-3.5 px-6 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.6429 10.2273C19.6429 9.51705 19.5771 8.83523 19.4583 8.18182H10V12.0568H15.4036C15.1718 13.3068 14.4668 14.3636 13.4079 15.0739V17.5852H16.6393C18.5293 15.8466 19.6429 13.2784 19.6429 10.2273Z" fill="#000000"/>
                <path d="M10 20C12.7 20 14.9621 19.1023 16.6393 17.5852L13.4079 15.0739C12.5111 15.6761 11.3571 16.0341 10 16.0341C7.38929 16.0341 5.17857 14.267 4.38571 11.8977H1.08214V14.4545C2.73 17.7273 6.09821 20 10 20Z" fill="#000000"/>
                <path d="M4.38571 11.8977C4.18571 11.3068 4.07143 10.6705 4.07143 10C4.07143 9.32955 4.18571 8.69318 4.38571 8.10227V5.54545H1.08214C0.4 6.89773 0 8.40909 0 10C0 11.5909 0.4 13.1023 1.08214 14.4545L4.38571 11.8977Z" fill="#000000"/>
                <path d="M10 3.96591C11.4679 3.96591 12.7857 4.46591 13.8196 5.45455L16.7121 2.5625C14.9571 0.977273 12.6964 0 10 0C6.09821 0 2.73 2.27273 1.08214 5.54545L4.38571 8.10227C5.17857 5.73295 7.38929 3.96591 10 3.96591Z" fill="#000000"/>
            </svg>
            <span className="font-medium text-[15px]">Continue with Google</span>
          </motion.button>

          {/* Facebook Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFacebookLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-3.5 px-6 rounded-xl hover:bg-[#166FE5] transition-colors shadow-sm"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073C24 5.405 18.627 0 12 0C5.373 0 0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24V15.562H7.078V12.073H10.125V9.413C10.125 6.388 11.916 4.714 14.657 4.714C15.97 4.714 17.343 4.95 17.343 4.95V7.935H15.83C14.339 7.935 13.875 8.868 13.875 9.837V12.073H17.203L16.671 15.562H13.875V24C19.612 23.094 24 18.1 24 12.073Z" />
            </svg>
            <span className="font-medium text-[15px]">Continue with Facebook</span>
          </motion.button>
        </motion.div>

        <motion.div 
          className="mt-14 flex items-center justify-center gap-1.5 text-[13px] text-gray-400 font-light"
          variants={itemVariants}
        >
          <KeyRound className="w-3.5 h-3.5 stroke-[1.5]" />
          Protected by Firebase Authentication
        </motion.div>
      </motion.div>
    </div>
  );
}
