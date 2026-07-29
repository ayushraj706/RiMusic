"use client";

import { useState, useEffect } from "react";
import { database, auth } from "../lib/firebase";
import { ref, set } from "firebase/database";
import { X, Key, Phone, Link2, CheckCircle2, Copy, ShieldAlert, Check } from "lucide-react";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfigModal({ isOpen, onClose, onSuccess }: ConfigModalProps) {
  const [accessToken, setAccessToken] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [wabaId, setWabaId] = useState(""); 
  const [verifyToken, setVerifyToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem("metaAccessToken") || "";
      const savedPhone = localStorage.getItem("phoneId") || ""; 
      const savedWaba = localStorage.getItem("wabaId") || "";   
      const savedVerifyToken = localStorage.getItem("webhookVerifyToken");

      setAccessToken(savedToken);
      setPhoneId(savedPhone);
      setWabaId(savedWaba);

      // डायनामिक Webhook URL (Localhost और Vercel दोनों पर काम करेगा)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      setWebhookUrl(`${baseUrl}/api/webhook`);

      if (savedVerifyToken) {
        setVerifyToken(savedVerifyToken);
      } else {
        const randomToken = "BASEKEY_" + Math.random().toString(36).substring(2, 15).toUpperCase();
        setVerifyToken(randomToken);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = async () => {
    if (!accessToken || !phoneId || !wabaId) {
      alert("Please fill all the Meta API details!");
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem("metaAccessToken", accessToken);
      localStorage.setItem("phoneId", phoneId);
      localStorage.setItem("wabaId", wabaId);
      localStorage.setItem("webhookVerifyToken", verifyToken);

      const user = auth.currentUser;
      if (user) {
        await set(ref(database, `users/${user.uid}/config`), {
          isMatched: true,
          accessToken: accessToken,
          phoneId: phoneId,
          wabaId: wabaId,
          webhookVerifyToken: verifyToken,
          webhookUrl: webhookUrl,
          configuredAt: new Date().toISOString(),
          isWebhookVerified: false 
        });
        
        onSuccess(); 
        onClose(); 
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save configuration.");
    }
    setLoading(false);
  };

  // बिना Alert वाला स्मार्ट कॉपी फंक्शन
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000); // 2 सेकंड बाद वापस Copy आइकॉन आ जाएगा
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
              <p className="text-sm text-gray-500 font-medium">Configure your WhatsApp Business Account</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Input Fields */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh] bg-gray-50/50">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-gray-500" /> Permanent Access Token
            </label>
            <input 
              type="password" 
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAGm0P..." 
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 text-sm font-medium transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-gray-500" /> Phone Number ID
              </label>
              <input 
                type="text" 
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
                placeholder="103456789..." 
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 text-sm font-medium transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-semibold text-gray-700">WABA ID</label>
              <input 
                type="text" 
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="105678901..." 
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 text-sm font-medium transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 space-y-4">
            <div className="flex items-start gap-3 bg-blue-50/80 p-4 rounded-2xl border border-blue-100">
              <ShieldAlert className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 leading-relaxed font-medium">
                Put these details in your Meta Developer Dashboard <strong>Webhooks</strong> section to verify your app.
              </p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Your Webhook Callback URL</label>
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-gray-100 focus-within:border-gray-300 transition-all shadow-sm group">
                <input type="text" readOnly value={webhookUrl} className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-gray-600 font-medium" />
                <button 
                  onClick={() => handleCopy(webhookUrl, 'url')} 
                  className="px-5 border-l border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 group-hover:text-gray-900"
                >
                  {copiedField === 'url' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Auto-Generated Verify Token</label>
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-green-500/10 focus-within:border-green-300 transition-all shadow-sm group">
                <input type="text" readOnly value={verifyToken} className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-[#25D366] font-bold font-mono tracking-wide" />
                <button 
                  onClick={() => handleCopy(verifyToken, 'token')} 
                  className="px-5 border-l border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 group-hover:text-gray-900"
                >
                  {copiedField === 'token' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-3xl">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">Cancel</button>
          <button 
            onClick={handleSaveConfig}
            disabled={loading}
            className="flex items-center gap-2 bg-[#25D366] text-white px-7 py-3 rounded-xl font-bold hover:bg-[#20b858] hover:shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> 
                Saving...
              </span>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> Save & Link</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
