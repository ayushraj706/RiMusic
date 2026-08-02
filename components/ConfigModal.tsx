"use client";

import { useState, useEffect } from "react";
import { database, auth } from "../lib/firebase";
import { ref, set } from "firebase/database";
import { X, Key, Phone, Link2, CheckCircle2, Copy, ShieldAlert, Check, Facebook, Loader2 } from "lucide-react";

declare global {
  interface Window {
    fbAsyncInit: any;
    FB: any;
  }
}

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfigModal({ isOpen, onClose, onSuccess }: ConfigModalProps) {
  const [setupMode, setSetupMode] = useState<"auto" | "manual">("auto");
  
  const [accessToken, setAccessToken] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [wabaId, setWabaId] = useState(""); 
  const [verifyToken, setVerifyToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFbLoggingIn, setIsFbLoggingIn] = useState(false); // FB Login Button की लोडिंग के लिए
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 1. Data Load & Webhook URL Setup
  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem("metaAccessToken") || "";
      const savedPhone = localStorage.getItem("phoneId") || ""; 
      const savedWaba = localStorage.getItem("wabaId") || "";   
      const savedVerifyToken = localStorage.getItem("webhookVerifyToken");

      setAccessToken(savedToken);
      setPhoneId(savedPhone);
      setWabaId(savedWaba);

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

  // 2. Facebook SDK Load
  useEffect(() => {
    if (isOpen) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId      : '919361547126340', 
          cookie     : true,
          xfbml      : true,
          version    : 'v20.0'
        });
      };

      (function(d, s, id){
         var js, fjs = d.getElementsByTagName(s)[0] as HTMLElement;
         if (d.getElementById(id)) {return;}
         js = d.createElement(s) as HTMLScriptElement; js.id = id;
         js.src = "https://connect.facebook.net/en_US/sdk.js";
         fjs.parentNode?.insertBefore(js, fjs);
       }(document, 'script', 'facebook-jssdk'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- Functions ---

  const handleManualSave = async () => {
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
          accessToken, phoneId, wabaId,
          webhookVerifyToken: verifyToken,
          webhookUrl,
          configuredAt: new Date().toISOString(),
          isWebhookVerified: false,
          setupType: "manual" 
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

  // ✅ UPDATED: Facebook Embedded Signup Logic
  const handleFacebookLogin = () => {
    if (!window.FB) {
      alert("Facebook SDK is still loading. Please try again in a few seconds.");
      return;
    }

    setIsFbLoggingIn(true);

    // .env से Config ID लेगा, अगर नहीं मिला तो तुम्हारा टेस्टिंग वाला इस्तेमाल करेगा
    const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID || '1392579292765106';

    window.FB.login((response: any) => {
      setIsFbLoggingIn(false);

      if (response.authResponse) {
        // Embedded Signup में Token की जगह 'code' आता है
        const code = response.authResponse.code;
        console.log('WhatsApp Onboarding Success! Auth Code:', code);
        
        alert("Success! Check Console for Auth Code.");
        
        // TODO: Next step me is 'code' ko backend par bhej kar Permanent Token lena hoga
        
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {
      config_id: configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        dataLayer: {
          current_step: 'whatsapp_onboarding'
        }
      }
    });
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
            onClick={() => setSetupMode("auto")}
            className={`flex-1 py-2 text-sm font-bold border-b-2 transition-all ${setupMode === "auto" ? "border-[#25D366] text-[#25D366]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            Quick Connect (Auto)
          </button>
          <button 
            onClick={() => setSetupMode("manual")}
            className={`flex-1 py-2 text-sm font-bold border-b-2 transition-all ${setupMode === "manual" ? "border-[#25D366] text-[#25D366]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            Manual Setup
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh] bg-gray-50/50">
          
          {/* AUTO MODE UI */}
          {setupMode === "auto" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
              <div className="bg-blue-50 p-4 rounded-full">
                <Facebook className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">1-Click WhatsApp Setup</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                  Log in with Facebook to automatically link your WhatsApp Business account and API keys. No coding required.
                </p>
              </div>
              <button 
                onClick={handleFacebookLogin}
                disabled={isFbLoggingIn}
                className="flex items-center gap-2 bg-[#1877F2] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#166FE5] hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isFbLoggingIn ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
                ) : (
                  <><Facebook className="w-5 h-5" /> Continue with Facebook</>
                )}
              </button>
            </div>
          )}

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
                <div className="flex items-start gap-3 bg-blue-50/80 p-4 rounded-2xl border border-blue-100">
                  <ShieldAlert className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 leading-relaxed font-medium">
                    Put these details in your Meta Developer Dashboard <strong>Webhooks</strong> section.
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
