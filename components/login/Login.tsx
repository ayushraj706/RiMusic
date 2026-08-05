"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { 
  KeyRound, 
  Lock, 
  Mail, 
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Zap
} from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";

type AuthState = "MAIN" | "PASSWORD" | "OTP" | "FORGOT_PASSWORD";

export default function LoginComponent() {
  const [authState, setAuthState] = useState<AuthState>("MAIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Animations
  const slideVariants = {
    enter: { x: 20, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 }
  };

  // --- 1. SOCIAL LOGINS (NextAuth) ---
  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  // --- 2. SEND OTP LOGIC ---
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setMessage({ type: "error", text: "Please enter your email first." });
    
    setIsLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      // Yahan hum apna Resend + Neon wala custom API call karenge
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (res.ok) {
        setAuthState("OTP");
        setMessage({ type: "success", text: "6-digit OTP sent to your email!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send OTP." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. LOGIN WITH PASSWORD OR OTP (NextAuth Credentials) ---
  const handleCredentialsLogin = async (e: React.FormEvent, type: "password" | "otp") => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    // NextAuth Credentials provider ko call karenge
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password: type === "password" ? password : "",
      otp: type === "otp" ? otp : "",
      loginType: type
    });

    if (res?.error) {
      setMessage({ type: "error", text: res.error });
      setIsLoading(false);
    } else {
      window.location.href = "/dashboard"; // Ya agent ke primary page par
    }
  };

  // --- 4. FORGOT PASSWORD ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        setMessage({ type: "success", text: "Password reset link sent!" });
        setTimeout(() => setAuthState("MAIN"), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to send reset link." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error sending email." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      key="login-screen"
      className="w-full max-w-md p-8 sm:p-10 bg-white rounded-[2rem] border border-gray-100 shadow-2xl shadow-gray-200/50 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Top Logo & Title */}
      <div className="text-center mb-6">
        <motion.div 
          className="w-14 h-14 mx-auto mb-4 flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100"
          whileHover={{ scale: 1.05, rotate: 5 }}
        >
          <img src="/logo.png" alt="BaseKey Logo" className="w-10 h-10 drop-shadow-sm" />
        </motion.div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Welcome to BaseKey</h1>
        <p className="text-gray-500 text-sm mt-1">Your complete CRM workspace</p>
      </div>

      {/* Messages Alert */}
      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl text-sm font-medium mb-4 text-center ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-[#00A884]"}`}
        >
          {message.text}
        </motion.div>
      )}

      {/* DYNAMIC SCREENS */}
      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: MAIN (Email Input + Socials) */}
          {authState === "MAIN" && (
            <motion.div key="MAIN" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
              
              <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 focus-within:border-[#00A884] focus-within:ring-4 focus-within:ring-[#00A884]/10 transition-all">
                <Mail className="w-5 h-5 text-gray-400" />
                <input 
                  type="email" required placeholder="Enter your email" 
                  value={email} onChange={(e) => setEmail(e.target.value)} 
                  className="bg-transparent flex-1 outline-none text-[15px] text-gray-900 placeholder:text-gray-400" 
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => { if(email) setAuthState("PASSWORD"); else setMessage({type: "error", text: "Enter email first"})}}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Password
                </button>
                <button 
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className="flex-1 bg-[#00A884] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#009172] transition-colors flex justify-center items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4"/> Get OTP</>}
                </button>
              </div>

              <div className="relative py-4 flex items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleSocialLogin("google")} className="flex justify-center items-center py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                   <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.6429 10.2273C19.6429 9.51705 19.5771 8.83523 19.4583 8.18182H10V12.0568H15.4036C15.1718 13.3068 14.4668 14.3636 13.4079 15.0739V17.5852H16.6393C18.5293 15.8466 19.6429 13.2784 19.6429 10.2273Z" fill="#4285F4"/><path d="M10 20C12.7 20 14.9621 19.1023 16.6393 17.5852L13.4079 15.0739C12.5111 15.6761 11.3571 16.0341 10 16.0341C7.38929 16.0341 5.17857 14.267 4.38571 11.8977H1.08214V14.4545C2.73 17.7273 6.09821 20 10 20Z" fill="#34A853"/><path d="M4.38571 11.8977C4.18571 11.3068 4.07143 10.6705 4.07143 10C4.07143 9.32955 4.18571 8.69318 4.38571 8.10227V5.54545H1.08214C0.4 6.89773 0 8.40909 0 10C0 11.5909 0.4 13.1023 1.08214 14.4545L4.38571 11.8977Z" fill="#FBBC05"/><path d="M10 3.96591C11.4679 3.96591 12.7857 4.46591 13.8196 5.45455L16.7121 2.5625C14.9571 0.977273 12.6964 0 10 0C6.09821 0 2.73 2.27273 1.08214 5.54545L4.38571 8.10227C5.17857 5.73295 7.38929 3.96591 10 3.96591Z" fill="#EA4335"/></svg>
                </button>
                <button onClick={() => handleSocialLogin("github")} className="flex justify-center items-center py-3 border border-gray-200 rounded-xl bg-gray-900 hover:bg-gray-800 transition">
                   <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.59 9.5 21.28 9.5 21.01C9.5 20.77 9.49 20.14 9.49 19.31C6.71 19.91 6.12 17.97 6.12 17.97C5.67 16.81 5.03 16.5 5.03 16.5C4.13 15.89 5.09 15.9 5.09 15.9C6.08 15.97 6.59 16.92 6.59 16.92C7.47 18.42 8.89 17.99 9.45 17.74C9.54 17.11 9.79 16.68 10.07 16.44C7.85 16.19 5.52 15.33 5.52 11.45C5.52 10.35 5.91 9.44 6.56 8.73C6.45 8.48 6.12 7.46 6.66 6.07C6.66 6.07 7.5 5.8 9.49 7.15C10.29 6.93 11.14 6.82 12 6.82C12.86 6.82 13.71 6.93 14.51 7.15C16.5 5.8 17.34 6.07 17.34 6.07C17.88 7.46 17.55 8.48 17.44 8.73C18.09 9.44 18.48 10.35 18.48 11.45C18.48 15.34 16.14 16.19 13.91 16.43C14.26 16.73 14.57 17.31 14.57 18.2C14.57 19.47 14.56 20.5 14.56 20.81C14.56 21.08 14.72 21.4 15.22 21.31C19.13 20.17 22 16.42 22 12C22 6.477 17.523 2 12 2Z" /></svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: PASSWORD LOGIN */}
          {authState === "PASSWORD" && (
            <motion.form key="PASSWORD" onSubmit={(e) => handleCredentialsLogin(e, "password")} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4 absolute w-full top-0">
              <button type="button" onClick={() => setAuthState("MAIN")} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-2 transition">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
              
              <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <Mail className="w-5 h-5 text-gray-400" />
                <input type="email" value={email} disabled className="bg-transparent flex-1 outline-none text-[15px] text-gray-500" />
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-900/10 transition-all">
                <Lock className="w-5 h-5 text-gray-400" />
                <input 
                  type="password" required autoFocus placeholder="Enter your password" 
                  value={password} onChange={(e) => setPassword(e.target.value)} 
                  className="bg-transparent flex-1 outline-none text-[15px] text-gray-900" 
                />
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setAuthState("FORGOT_PASSWORD")} className="text-sm font-medium text-[#00A884] hover:underline">Forgot password?</button>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
              </button>
            </motion.form>
          )}

          {/* SCREEN 3: OTP VERIFICATION */}
          {authState === "OTP" && (
            <motion.form key="OTP" onSubmit={(e) => handleCredentialsLogin(e, "otp")} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-5 absolute w-full top-0">
              <button type="button" onClick={() => setAuthState("MAIN")} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-2 transition">
                <ArrowLeft className="w-4 h-4 mr-1" /> Change Email
              </button>
              
              <p className="text-sm text-gray-600 text-center">We've sent a 6-digit code to <span className="font-semibold text-gray-900">{email}</span></p>

              <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 focus-within:border-[#00A884] focus-within:ring-4 focus-within:ring-[#00A884]/10 transition-all">
                <ShieldCheck className="w-5 h-5 text-[#00A884]" />
                <input 
                  type="text" required autoFocus maxLength={6} placeholder="Enter 6-digit OTP" 
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Sirf numbers allow karega
                  className="bg-transparent flex-1 outline-none text-center text-xl font-bold tracking-[0.5em] text-gray-900 placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-normal placeholder:text-[15px]" 
                />
              </div>

              <button type="submit" disabled={isLoading || otp.length !== 6} className="w-full bg-[#00A884] text-white py-3.5 rounded-xl font-semibold hover:bg-[#009172] transition flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
              </button>
            </motion.form>
          )}

          {/* SCREEN 4: FORGOT PASSWORD */}
          {authState === "FORGOT_PASSWORD" && (
            <motion.form key="FORGOT_PASSWORD" onSubmit={handleForgotPassword} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4 absolute w-full top-0">
              <button type="button" onClick={() => setAuthState("PASSWORD")} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-2 transition">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
              </button>
              
              <p className="text-sm text-gray-600 mb-4">Enter your email and we'll send you a link to reset your password.</p>

              <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 focus-within:border-gray-900 transition-all">
                <Mail className="w-5 h-5 text-gray-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-transparent flex-1 outline-none text-[15px] text-gray-900" />
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
              </button>
            </motion.form>
          )}

        </AnimatePresence>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[12px] text-gray-400 font-medium">
        <KeyRound className="w-3.5 h-3.5" />
        Secured by BaseKey Infrastructure
      </div>
    </motion.div>
  );
}
