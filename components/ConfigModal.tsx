"use client";

import { useState, useEffect } from "react";
import { database, auth } from "../lib/firebase";
import { ref, set } from "firebase/database";
import { X, Key, Phone, Link2, CheckCircle2, Copy, ShieldAlert } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  // Jab popup khule, toh local storage se purana data nikalo
  useEffect(() => {
    if (isOpen) {
      // Local Storage se data read karna
      const savedToken = localStorage.getItem("metaAccessToken") || "";
      const savedPhone = localStorage.getItem("metaPhoneId") || "";
      const savedWaba = localStorage.getItem("metaWabaId") || "";
      const savedVerifyToken = localStorage.getItem("webhookVerifyToken");

      setAccessToken(savedToken);
      setPhoneId(savedPhone);
      setWabaId(savedWaba);

      // Agar pehle se token generate kiya tha toh wahi dikhao, warna naya banao
      if (savedVerifyToken) {
        setVerifyToken(savedVerifyToken);
      } else {
        const randomToken = "BASEKEY_" + Math.random().toString(36).substring(2, 15).toUpperCase();
        setVerifyToken(randomToken);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const webhookUrl = "https://ri-music.vercel.app/api/webhook";

  const handleSaveConfig = async () => {
    if (!accessToken || !phoneId || !wabaId) {
      alert("Please fill all the Meta API details!");
      return;
    }

    setLoading(true);
    try {
      // 1. Browser ke Local Storage mein save karo (taki agali baar auto-fill ho jaye)
      localStorage.setItem("metaAccessToken", accessToken);
      localStorage.setItem("metaPhoneId", phoneId);
      localStorage.setItem("metaWabaId", wabaId);
      localStorage.setItem("webhookVerifyToken", verifyToken);

      const user = auth.currentUser;
      if (user) {
        // 2. Firebase Cloud DB mein save karo
        await set(ref(database, `users/${user.uid}/config`), {
          isMatched: true,
          metaAccessToken: accessToken,
          metaPhoneId: phoneId,
          metaWabaId: wabaId,
          webhookVerifyToken: verifyToken,
          webhookUrl: webhookUrl,
          configuredAt: new Date().toISOString(),
          isWebhookVerified: false // Default false, jab Meta API ping karega tab ise True karenge
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-background/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Link Meta API</h2>
              <p className="text-xs text-muted-foreground">Configure your WhatsApp Business Account</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body - Input Fields */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Key className="w-3 h-3" /> Permanent Access Token
            </label>
            <input 
              type="password" 
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAGm0P..." 
              className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary text-sm"
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone Number ID
              </label>
              <input 
                type="text" 
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
                placeholder="103456789..." 
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary text-sm"
              />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-semibold text-muted-foreground">WABA ID</label>
              <input 
                type="text" 
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="105678901..." 
                className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary text-sm"
              />
            </div>
          </div>

          <div className="my-4 border-t border-border pt-4">
            <div className="flex items-start gap-2 mb-3 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              <ShieldAlert className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-400">
                Put these details in your Meta Developer Dashboard -&gt; Webhooks section to verify your app.
              </p>
            </div>
            
            <div className="space-y-1 mb-3">
              <label className="text-xs font-semibold text-muted-foreground">Your Webhook Callback URL</label>
              <div className="flex bg-background border border-border rounded-xl overflow-hidden">
                <input type="text" readOnly value={webhookUrl} className="flex-1 bg-transparent px-4 py-2 text-sm outline-none text-muted-foreground" />
                <button onClick={() => copyToClipboard(webhookUrl)} className="bg-secondary px-4 hover:bg-secondary/80 transition flex items-center justify-center">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Auto-Generated Verify Token</label>
              <div className="flex bg-background border border-border rounded-xl overflow-hidden">
                <input type="text" readOnly value={verifyToken} className="flex-1 bg-transparent px-4 py-2 text-sm outline-none text-green-500 font-mono" />
                <button onClick={() => copyToClipboard(verifyToken)} className="bg-secondary px-4 hover:bg-secondary/80 transition flex items-center justify-center">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-background/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium hover:bg-secondary transition">Cancel</button>
          <button 
            onClick={handleSaveConfig}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Saving..." : <><CheckCircle2 className="w-5 h-5" /> Save & Link</>}
          </button>
        </div>
      </div>
    </div>
  );
}
