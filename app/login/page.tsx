"use client";

import { 
  useEffect, 
  useState 
} from "react";
import { 
  signInWithPopup, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  auth, 
  googleProvider, 
  facebookProvider, 
  githubProvider, 
  twitterProvider 
} from "../../lib/firebase"; 
import { 
  KeyRound, 
  MessageCircle, 
  Globe, 
  Lock, 
  MessageSquare 
} from "lucide-react"; 
import { 
  motion, 
  AnimatePresence 
} from "framer-motion";

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState(0); // 0: Cluster, 1: Splash Logo, 2: Login Screen
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Animation ki timing set ki hai
    const t1 = setTimeout(() => setPhase(1), 1600); // 1.6s ke baad Logo aayega
    const t2 = setTimeout(() => setPhase(2), 2600); // 2.6s ke baad Login Screen aayega

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthed(true);
      }
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      unsubscribe();
    };
  }, []);

  // Jab animation poora ho jaye aur user logged in ho, tabhi redirect karo (Hang hone se bachayega)
  useEffect(() => {
    if (phase === 2 && isAuthed) {
      window.location.href = "/";
    }
  }, [phase, isAuthed]);

  const handleGoogleLogin = async () => {
    try { 
      const res = await signInWithPopup(auth, googleProvider); 
      if (res.user) window.location.href = "/"; 
    } catch (error: any) { 
      alert("Google Error: " + error.message); 
    }
  };

  const handleFacebookLogin = async () => {
    try { 
      const res = await signInWithPopup(auth, facebookProvider); 
      if (res.user) window.location.href = "/"; 
    } catch (error: any) { 
      alert("Facebook Error: " + error.message); 
    }
  };

  const handleGithubLogin = async () => {
    try { 
      const res = await signInWithPopup(auth, githubProvider); 
      if (res.user) window.location.href = "/"; 
    } catch (error: any) { 
      alert("GitHub Error: " + error.message); 
    }
  };

  const handleTwitterLogin = async () => {
    try { 
      const res = await signInWithPopup(auth, twitterProvider); 
      if (res.user) window.location.href = "/"; 
    } catch (error: any) { 
      alert("X Error: " + error.message); 
    }
  };

  if (!isMounted) return null; 

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-black font-sans relative overflow-hidden">
      <AnimatePresence mode="wait">
        
        {/* WATSAPP STYLE SPLASH SCREEN (PHASE 0 & 1) */}
        {phase < 2 && (
          <motion.div
            key="splash-screen"
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAFAFA] z-50"
            exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
          >
            <AnimatePresence mode="wait">
              {/* PHASE 0: WATSAPP JASA ICON CLUSTER */}
              {phase === 0 && (
                <motion.div
                  key="cluster"
                  className="relative w-48 h-48 flex items-center justify-center"
                  exit={{ scale: 0, opacity: 0, transition: { duration: 0.4, ease: "backIn" } }}
                >
                  <motion.div
                    className="absolute top-2 right-2 text-[#25D366]"
                    initial={{ y: -15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Globe size={52} strokeWidth={1.5} />
                  </motion.div>

                  <motion.div
                    className="absolute bottom-4 right-4 text-[#25D366] bg-[#FAFAFA] rounded-full p-1 z-20"
                    initial={{ x: 15, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    <Lock size={36} fill="currentColor" strokeWidth={1} />
                  </motion.div>

                  <motion.div
                    className="absolute bottom-6 left-2 text-[#25D366] z-0"
                    initial={{ x: -15, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <MessageCircle size={44} fill="currentColor" strokeWidth={1} />
                  </motion.div>

                  <motion.div
                    className="z-10 bg-white rounded-[1.5rem] p-4 shadow-xl text-[#25D366] border border-gray-100"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  >
                    <MessageSquare size={60} fill="white" strokeWidth={1.5} />
                  </motion.div>
                </motion.div>
              )}

              {/* PHASE 1: AAKPA LOGO */}
              {phase === 1 && (
                <motion.img
                  key="main-logo"
                  layoutId="basekey-logo" 
                  src="/logo.png" // Yahan SVG se PNG kar diya hai
                  alt="BaseKey Logo"
                  className="w-28 h-28 drop-shadow-xl"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
            
            <motion.div
              className="absolute bottom-12 flex flex-col items-center gap-1"
            >
              <span className="text-gray-400 text-[13px] font-light">from</span>
              <span className="text-[#3b82f6] font-medium text-lg tracking-widest flex items-center gap-2">
                BaseKey
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* PHASE 2: MAIN LOGIN SCREEN */}
        {phase === 2 && !isAuthed && (
          <motion.div
            key="login-screen"
            className="w-full max-w-sm p-10 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 text-center z-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div 
              className="w-20 h-20 mx-auto mb-6 flex items-center justify-center"
              animate={{ y: [0, -6, 0] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <motion.img
                layoutId="basekey-logo" 
                src="/logo.png" // Yahan bhi SVG se PNG kar diya hai
                alt="BaseKey Logo"
                className="w-16 h-16 drop-shadow-md"
              />
            </motion.div>
            
            <motion.h1 
              className="text-4xl font-light tracking-tight text-gray-950 mb-2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            >
              BaseKey
            </motion.h1>
            
            <motion.p 
              className="text-gray-500 font-light text-sm mb-8"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            >
              Sign in to continue to your dashboard
            </motion.p>

            <motion.div 
              className="space-y-2.5" 
              initial="hidden" 
              animate="visible" 
              transition={{ staggerChildren: 0.1, delayChildren: 0.4 }}
            >
              
              <motion.button 
                variants={itemVariants} 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={handleGoogleLogin} 
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-950 py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.6429 10.2273C19.6429 9.51705 19.5771 8.83523 19.4583 8.18182H10V12.0568H15.4036C15.1718 13.3068 14.4668 14.3636 13.4079 15.0739V17.5852H16.6393C18.5293 15.8466 19.6429 13.2784 19.6429 10.2273Z" fill="#000000"/>
                  <path d="M10 20C12.7 20 14.9621 19.1023 16.6393 17.5852L13.4079 15.0739C12.5111 15.6761 11.3571 16.0341 10 16.0341C7.38929 16.0341 5.17857 14.267 4.38571 11.8977H1.08214V14.4545C2.73 17.7273 6.09821 20 10 20Z" fill="#000000"/>
                  <path d="M4.38571 11.8977C4.18571 11.3068 4.07143 10.6705 4.07143 10C4.07143 9.32955 4.18571 8.69318 4.38571 8.10227V5.54545H1.08214C0.4 6.89773 0 8.40909 0 10C0 11.5909 0.4 13.1023 1.08214 14.4545L4.38571 11.8977Z" fill="#000000"/>
                  <path d="M10 3.96591C11.4679 3.96591 12.7857 4.46591 13.8196 5.45455L16.7121 2.5625C14.9571 0.977273 12.6964 0 10 0C6.09821 0 2.73 2.27273 1.08214 5.54545L4.38571 8.10227C5.17857 5.73295 7.38929 3.96591 10 3.96591Z" fill="#000000"/>
                </svg>
                <span className="font-medium text-[14px]">Continue with Google</span>
              </motion.button>

              <motion.button 
                variants={itemVariants} 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={handleFacebookLogin} 
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-3 px-6 rounded-xl hover:bg-[#166FE5] transition-colors shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0C5.373 0 0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24V15.562H7.078V12.073H10.125V9.413C10.125 6.388 11.916 4.714 14.657 4.714C15.97 4.714 17.343 4.95 17.343 4.95V7.935H15.83C14.339 7.935 13.875 8.868 13.875 9.837V12.073H17.203L16.671 15.562H13.875V24C19.612 23.094 24 18.1 24 12.073Z" />
                </svg>
                <span className="font-medium text-[14px]">Continue with Facebook</span>
              </motion.button>

              <motion.button 
                variants={itemVariants} 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={handleGithubLogin} 
                className="w-full flex items-center justify-center gap-3 bg-[#24292F] text-white py-3 px-6 rounded-xl hover:bg-[#1F2328] transition-colors shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.59 9.5 21.28 9.5 21.01C9.5 20.77 9.49 20.14 9.49 19.31C6.71 19.91 6.12 17.97 6.12 17.97C5.67 16.81 5.03 16.5 5.03 16.5C4.13 15.89 5.09 15.9 5.09 15.9C6.08 15.97 6.59 16.92 6.59 16.92C7.47 18.42 8.89 17.99 9.45 17.74C9.54 17.11 9.79 16.68 10.07 16.44C7.85 16.19 5.52 15.33 5.52 11.45C5.52 10.35 5.91 9.44 6.56 8.73C6.45 8.48 6.12 7.46 6.66 6.07C6.66 6.07 7.5 5.8 9.49 7.15C10.29 6.93 11.14 6.82 12 6.82C12.86 6.82 13.71 6.93 14.51 7.15C16.5 5.8 17.34 6.07 17.34 6.07C17.88 7.46 17.55 8.48 17.44 8.73C18.09 9.44 18.48 10.35 18.48 11.45C18.48 15.34 16.14 16.19 13.91 16.43C14.26 16.73 14.57 17.31 14.57 18.2C14.57 19.47 14.56 20.5 14.56 20.81C14.56 21.08 14.72 21.4 15.22 21.31C19.13 20.17 22 16.42 22 12C22 6.477 17.523 2 12 2Z" />
                </svg>
                <span className="font-medium text-[14px]">Continue with GitHub</span>
              </motion.button>

              <motion.button 
                variants={itemVariants} 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={handleTwitterLogin} 
                className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 px-6 rounded-xl hover:bg-gray-900 transition-colors shadow-sm border border-gray-800"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="font-medium text-[14px]">Continue with X</span>
              </motion.button>

            </motion.div>

            <motion.div 
              className="mt-8 flex items-center justify-center gap-1.5 text-[12px] text-gray-400 font-light"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.6 }}
            >
              <KeyRound className="w-3.5 h-3.5 stroke-[1.5]" />
              Protected by Firebase Authentication
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
