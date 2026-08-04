"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // 🔥 NAYA: Firebase hata kar NextAuth lagaya
import { X, Key, Phone, Link2, CheckCircle2, Copy, ShieldAlert, Check, Facebook, Loader2 } from "lucide-react";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfigModal({ isOpen, onClose, onSuccess }: ConfigModalProps) {
  const { data: session } = useSession(); // 🔥 NAYA: Session get kiya

  // 👇 Default ko 'manual' kar diya hai
  const [setupMode, setSetupMode] = useState<"manual" | "auto">("manual");
  
  const [accessToken, setAccessToken] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [wabaId, setWabaId] = useState(""); 
  const [verifyToken, setVerifyToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 1. Data Load & Webhook URL Setup
  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem("metaAccessToken") || "";
      const savedPhone = localStorage.getItem("phoneId") || ""; 
      const savedWaba = localStorage.getItem("wabaId") || "";   

      setAccessToken(savedToken);
      setPhoneId(savedPhone);
      setWabaId(savedWaba);

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      setWebhookUrl(`${baseUrl}/api/webhook`);

      // 🔥 FIX: TypeScript ko bypass karne ke liye 'as any' use kiya
      const user = session?.user as any;
      if (user?.id) {
        const staticToken = "BASEKEY_" + String(user.id).substring(0, 12).toUpperCase();
        setVerifyToken(staticToken);
      } else {
        setVerifyToken("BASEKEY_TEMP_TOKEN");
      }
    }
  }, [isOpen, session]);

  if (!isOpen) return null;

  // --- Functions ---

  const handleManualSave = async () => {
    if (!accessToken || !phoneId || !wabaId) {
      alert("Please fill all the Meta API details!");
      return;
    }

    setLoading(true);
    try {
      // Local storage mein backup ke liye rakh lete hain
      localStorage.setItem("metaAccessToken", accessToken);
      localStorage.setItem("phoneId", phoneId);
      localStorage.setItem("wabaId", wabaId);
      localStorage.setItem("webhookVerifyToken", verifyToken);

      // 🔥 Firebase hata kar NextAuth session check lagaya
      if (session?.user) {
        // 👇 YAHAN "/api/config" KAR DIYA HAI (Pehle /api/settings tha)
        const res = await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            phoneNumberId: phoneId,
            businessAccountId: wabaId,
            verifyToken,
          }),
        });

        if (res.ok) {
          onSuccess(); 
          onClose(); 
          // 🔥 NAYA: API connect hote hi page refresh kar dega taaki Sidebar update ho jaye
          window.location.reload(); 
        } else {
          alert("Failed to save configuration in Database.");
        }
      } else {
        alert("Authentication error: Please log in again.");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save configuration.");
    }
    setLoading(false);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#25D366] border border-green-100 shadow-sm">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Link Meta API</h2>
              <p className="text-sm text-gray-500 font-medium">Connect your WhatsApp Business</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-4 bg-gray-50/50">
          <button 
            onClick={() => setSetupMode("manual")}
            className={`flex-1 py-2 text-sm font-bold border-b-2 transition-all ${setupMode === "manual" ? "border-[#25D366] text-[#25D366]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            Manual Setup
          </button>
          <button 
            onClick={() => setSetupMode("auto")}
            className={`flex-1 py-2 text-sm font-bold border-b-2 transition-all ${setupMode === "auto" ? "border-[#25D366] text-[#25D366]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            Quick Connect <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full ml-1">Soon</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh] bg-gray-50/50">
          
          {/* MANUAL MODE UI */}
          {setupMode === "manual" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-gray-500" /> Permanent Access Token
                </label>
                <input 
                  type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAGm0P..." className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 text-sm font-medium transition-all shadow-sm"
                />
              </div>

              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-gray-500" /> Phone Number ID
                  </label>
                  <input 
                    type="text" value={phoneId} onChange={(e) => setPhoneId(e.target.value)}
                    placeholder="103456789..." className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 text-sm font-medium transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-semibold text-gray-700">WABA ID</label>
                  <input 
                    type="text" value={wabaId} onChange={(e) => setWabaId(e.target.value)}
                    placeholder="105678901..." className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 text-sm font-medium transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-200 space-y-4">
                <div className="flex items-start gap-3 bg-red-50/80 p-4 rounded-2xl border border-red-100">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 leading-relaxed font-medium">
                    <strong>IMPORTANT:</strong> You MUST click the green "Save & Link" button below <strong>BEFORE</strong> you verify this token on the Meta Dashboard!
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Webhook URL</label>
                  <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm group">
                    <input type="text" readOnly value={webhookUrl} className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-gray-600 font-medium" />
                    <button onClick={() => handleCopy(webhookUrl, 'url')} className="px-5 border-l border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                      {copiedField === 'url' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-4 h-4 text-gray-600" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Verify Token</label>
                  <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm group">
                    <input type="text" readOnly value={verifyToken} className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-[#25D366] font-bold font-mono" />
                    <button onClick={() => handleCopy(verifyToken, 'token')} className="px-5 border-l border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                      {copiedField === 'token' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-4 h-4 text-gray-600" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AUTO MODE UI (COMING SOON) */}
          {setupMode === "auto" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center opacity-80 grayscale">
              <div className="bg-blue-50 p-4 rounded-full">
                <Facebook className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-800">1-Click WhatsApp Setup</h3>
                  <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Coming Soon</span>
                </div>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Automatic Facebook login integration is currently under development. Please use the Manual Setup for now.
                </p>
              </div>
              <button 
                disabled
                className="flex items-center gap-2 bg-gray-300 text-gray-500 px-8 py-3.5 rounded-xl font-bold cursor-not-allowed"
              >
                <Facebook className="w-5 h-5" /> Continue with Facebook
              </button>
            </div>
          )}
        </div>

        {/* Footer (Manual Mode Only) */}
        {setupMode === "manual" && (
          <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-3xl">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">Cancel</button>
            <button 
              onClick={handleManualSave} disabled={loading}
              className="flex items-center gap-2 bg-[#25D366] text-white px-7 py-3 rounded-xl font-bold hover:bg-[#20b858] hover:shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : <><CheckCircle2 className="w-5 h-5" /> Save & Link</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
