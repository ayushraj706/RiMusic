"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider, facebookProvider, githubProvider } from "../../lib/firebase"; 
import { KeyRound, MessageCircle, Loader2 } from "lucide-react"; // MessageSquare ki jagah MessageCircle import kiya
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // Hydration fix
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
    } catch (error: any) {
      console.error("Google Login Failed:", error);
      alert("Google Error: " + error.message);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (error: any) {
      console.error("Facebook Login Failed:", error);
      alert("Facebook Error: " + error.message);
    }
  };

  const handleGithubLogin = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error: any) {
      console.error("GitHub Login Failed:", error);
      alert("GitHub Error: " + error.message);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-black">
        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
      </div>
    );
  }

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
        {/* Floating Logo Animation - WhatsApp Style */}
        <motion.div 
          className="w-20 h-20 mx-auto rounded-full bg-[#25D366]/10 flex items-center justify-center mb-8 border border-[#25D366]/20 shadow-inner"
          variants={itemVariants}
          animate={{ y: [0, -8, 0] }} // Floating effect
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          {/* WhatsApp jaisa gol icon */}
          <MessageCircle className="w-10 h-10 text-[#25D366] stroke-[1.5]" /> 
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

          {/* GitHub Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGithubLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#24292F] text-white py-3.5 px-6 rounded-xl hover:bg-[#1F2328] transition-colors shadow-sm"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.59 9.5 21.28 9.5 21.01C9.5 20.77 9.49 20.14 9.49 19.31C6.71 19.91 6.12 17.97 6.12 17.97C5.67 16.81 5.03 16.5 5.03 16.5C4.13 15.89 5.09 15.9 5.09 15.9C6.08 15.97 6.59 16.92 6.59 16.92C7.47 18.42 8.89 17.99 9.45 17.74C9.54 17.11 9.79 16.68 10.07 16.44C7.85 16.19 5.52 15.33 5.52 11.45C5.52 10.35 5.91 9.44 6.56 8.73C6.45 8.48 6.12 7.46 6.66 6.07C6.66 6.07 7.5 5.8 9.49 7.15C10.29 6.93 11.14 6.82 12 6.82C12.86 6.82 13.71 6.93 14.51 7.15C16.5 5.8 17.34 6.07 17.34 6.07C17.88 7.46 17.55 8.48 17.44 8.73C18.09 9.44 18.48 10.35 18.48 11.45C18.48 15.34 16.14 16.19 13.91 16.43C14.26 16.73 14.57 17.31 14.57 18.2C14.57 19.47 14.56 20.5 14.56 20.81C14.56 21.08 14.72 21.4 15.22 21.31C19.13 20.17 22 16.42 22 12C22 6.477 17.523 2 12 2Z" />
            </svg>
            <span className="font-medium text-[15px]">Continue with GitHub</span>
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
