"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar"; 
import { Code2, Key, Webhook, Copy, Check, Terminal, Eye, EyeOff, Plus, FileText, Database, Send, Trash2, Loader2, Zap } from "lucide-react";
import { auth, database } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, set, push, remove } from "firebase/database";

interface SavedAPI {
  id: string;
  templateName: string;
  apiKey: string;
  createdAt: number;
}

export default function DevelopersPage() {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>({});
  
  // Real Data States
  const [wabaId, setWabaId] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");
  const [phoneId, setPhoneId] = useState<string>("");
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [savedApis, setSavedApis] = useState<SavedAPI[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [testPhones, setTestPhones] = useState<{ [key: string]: string }>({});
  const [sendingStatus, setSendingStatus] = useState<{ [key: string]: boolean }>({});

  const apiUrl = "https://superkey-app.vercel.app/api/v1/trigger";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const configRef = ref(database, `users/${user.uid}/config`);
        onValue(configRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setWabaId(data.wabaId);
            setAccessToken(data.accessToken);
            setPhoneId(data.phoneId);
            fetchTemplatesFromMeta(data.wabaId, data.accessToken);
          }
        });

        const apiRef = ref(database, `users/${user.uid}/apiKeys`);
        onValue(apiRef, (snapshot) => {
          if (snapshot.exists()) {
            const apisArray: SavedAPI[] = [];
            snapshot.forEach((child: any) => {
              apisArray.push({ id: child.key, ...child.val() });
            });
            setSavedApis(apisArray.reverse());
          } else {
            setSavedApis([]);
          }
          setLoading(false);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchTemplatesFromMeta = async (waba: string, token: string) => {
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${waba}/message_templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.data) {
        const approved = result.data.filter((t: any) => t.status === "APPROVED");
        
        const uniqueTemplatesMap = new Map();
        approved.forEach((t: any) => {
           if(!uniqueTemplatesMap.has(t.name)) uniqueTemplatesMap.set(t.name, t);
        });
        const uniqueTemplates = Array.from(uniqueTemplatesMap.values());
        
        setAvailableTemplates(uniqueTemplates);
        if (uniqueTemplates.length > 0) {
          setSelectedTemplate(uniqueTemplates[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 🚀 SUPER-UPDATED: Generate API (अब यह तुम्हें बताएगा अगर Firebase रूल्स में गड़बड़ होगी)
  const generateNewApi = async () => {
    if (!selectedTemplate || !auth.currentUser) return;
    
    const newKey = "bk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const apiData = {
      templateName: selectedTemplate,
      apiKey: newKey,
      createdAt: Date.now(),
    };

    try {
      const userId = auth.currentUser.uid;
      
      // 1. यूज़र के प्रोफाइल में सेव करना
      const newListRef = push(ref(database, `users/${userId}/apiKeys`));
      const keyId = newListRef.key;
      await set(newListRef, apiData);

      // 2. apiKeysMap में सेव करना (ताकि बैकएंड को 1 सेकंड में मिल जाए)
      await set(ref(database, `apiKeysMap/${newKey}`), {
        uid: userId,
        keyId: keyId
      });

      alert("New API Key Generated Successfully!");
    } catch (error: any) {
      console.error("Firebase Write Error:", error);
      alert(`Failed to save API Key! Error: ${error.message}. (Hint: Check your Firebase Security Rules)`);
    }
  };

  // 🚀 SUPER-UPDATED: Delete API (दोनों जगह से क्लीन-अप करेगा)
  const deleteApi = async (id: string, apiKey: string) => {
    if (!auth.currentUser) return;
    if(confirm("Are you sure you want to revoke this API Key? Any app using it will stop working.")){
      try {
        await remove(ref(database, `users/${auth.currentUser.uid}/apiKeys/${id}`));
        await remove(ref(database, `apiKeysMap/${apiKey}`));
      } catch (error: any) {
        console.error("Firebase Delete Error:", error);
        alert(`Failed to revoke API Key: ${error.message}`);
      }
    }
  };

  const getDummyVariables = (tplName: string) => {
    const tplDef = availableTemplates.find(t => t.name === tplName);
    if (!tplDef || !tplDef.components) return [];
    
    const bodyComp = tplDef.components.find((c: any) => c.type === "BODY");
    if (!bodyComp || !bodyComp.text) return [];
    
    const matches = bodyComp.text.match(/\{\{\d+\}\}/g);
    return matches ? matches.map((_: any, i: number) => `TestVal_${i+1}`) : [];
  };

  const handleTestSend = async (api: SavedAPI) => {
    const phone = testPhones[api.id];
    if (!phone) {
      alert("Please enter a phone number to test.");
      return;
    }

    setSendingStatus({ ...sendingStatus, [api.id]: true });

    const tplDef = availableTemplates.find(t => t.name === api.templateName);
    let dynamicComponents: any[] = [];
    
    const dummyVars = getDummyVariables(api.templateName);
    if (dummyVars.length > 0) {
       dynamicComponents.push({
         type: "body",
         parameters: dummyVars.map((val: string) => ({ type: "text", text: val }))
       });
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: api.templateName,
            language: { code: tplDef ? tplDef.language : "en_US" },
            ...(dynamicComponents.length > 0 && { components: dynamicComponents })
          }
        })
      });

      const data = await response.json();
      if (data.error) {
        alert("Meta Error: " + data.error.message);
      } else {
        alert("Success! Check your WhatsApp.");
      }
    } catch (error) {
      alert("Failed to send test message.");
    } finally {
      setSendingStatus({ ...sendingStatus, [api.id]: false });
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#F5F7F9] overflow-hidden pb-[70px] md:pb-0 font-sans text-gray-900 relative">
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Code2 className="w-6 h-6 text-[#00A884]" />
              Developers & API
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage API keys, webhooks, and trigger templates.</p>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-[#00A884]" /> BaseKey Trigger API Endpoint
            </h2>
            <p className="text-sm text-gray-500 mb-4">Use this base URL to trigger template messages from your backend or GitHub Actions.</p>
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input type="text" readOnly value={apiUrl} className="bg-transparent font-mono text-sm flex-1 text-gray-700 outline-none" />
              <button onClick={() => handleCopy(apiUrl, "apiUrl")} className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                {copiedStates["apiUrl"] ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copiedStates["apiUrl"] ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="bg-[#00A884]/5 rounded-2xl border border-[#00A884]/20 p-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#00A884]" /> Select Template to Generate API
              </label>
              {availableTemplates.length === 0 ? (
                <div className="bg-white border border-gray-200 text-gray-400 text-sm rounded-xl px-4 py-3">
                  {loading ? "Loading templates from Meta..." : "No approved templates found."}
                </div>
              ) : (
                <select 
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#00A884]/20 focus:border-[#00A884] shadow-sm font-medium"
                >
                  {availableTemplates.map((tpl: any) => (
                    <option key={tpl.name} value={tpl.name}>{tpl.name}</option>
                  ))}
                </select>
              )}
            </div>
            <button 
              onClick={generateNewApi}
              disabled={availableTemplates.length === 0}
              className="w-full md:w-auto bg-[#00A884] hover:bg-[#009172] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" /> Generate API Key
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#00A884]" /> Active API Keys
            </h2>
            
            {loading ? (
              <div className="flex justify-center items-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#00A884]" />
              </div>
            ) : savedApis.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-500">
                Generate an API key above to see it here.
              </div>
            ) : (
              savedApis.map((api) => {
                const currentPhone = testPhones[api.id] || "919876543210";
                const requiredVars = getDummyVariables(api.templateName);
                
                return (
                <div key={api.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Target Template</p>
                      <p className="font-bold text-gray-900">{api.templateName}</p>
                    </div>
                    <button onClick={() => deleteApi(api.id, api.apiKey)} className="text-xs text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition">
                      <Trash2 className="w-4 h-4" /> Revoke API
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">API Key (Keep Secret)</label>
                      <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                        <Key className="w-4 h-4 text-gray-400 ml-1" />
                        <input 
                          type={visibleKeys[api.id] ? "text" : "password"} 
                          readOnly 
                          value={api.apiKey} 
                          className="bg-transparent font-mono text-sm flex-1 text-gray-800 outline-none select-all"
                        />
                        <button onClick={() => toggleKeyVisibility(api.id)} className="p-1.5 text-gray-400 hover:text-gray-700 transition">
                          {visibleKeys[api.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleCopy(api.apiKey, `key-${api.id}`)} className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                          {copiedStates[`key-${api.id}`] ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          {copiedStates[`key-${api.id}`] ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#E8F8F5] border border-[#A7E9D1] rounded-xl p-4">
                      <h3 className="text-sm font-bold text-[#075E54] mb-2 flex items-center gap-1.5">
                        <Send className="w-4 h-4" /> Live Test this API
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text"
                          placeholder="Phone No. with Country Code (e.g. 917320041415)"
                          value={testPhones[api.id] || ""}
                          onChange={(e) => setTestPhones({...testPhones, [api.id]: e.target.value})}
                          className="flex-1 bg-white border border-[#A7E9D1] text-gray-800 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-[#00A884] shadow-sm"
                        />
                        <button 
                          onClick={() => handleTestSend(api)}
                          disabled={sendingStatus[api.id]}
                          className="bg-[#00A884] hover:bg-[#009172] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                        >
                          {sendingStatus[api.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Test"}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#075E54]/70 mt-2">
                        * Note: If your Meta App is in Development Mode, you can only send tests to verified numbers.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Terminal className="w-4 h-4" /> cURL Request for your Backend
                      </label>
                      <div className="relative group">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`curl -X POST https://superkey-app.vercel.app/api/v1/trigger \\
  -H "Authorization: Bearer ${visibleKeys[api.id] ? api.apiKey : "bk_live_************************"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template": "${api.templateName}",
    "phone": "${currentPhone}",
    "variables": ${JSON.stringify(requiredVars)}
  }'`}
                        </pre>
                        <button 
                          onClick={() => handleCopy(`curl -X POST https://superkey-app.vercel.app/api/v1/trigger -H "Authorization: Bearer ${api.apiKey}" -H "Content-Type: application/json" -d '{"template": "${api.templateName}", "phone": "${currentPhone}", "variables": ${JSON.stringify(requiredVars)}}'`, `curl-${api.id}`)}
                          className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm transition"
                        >
                          {copiedStates[`curl-${api.id}`] ? "Copied!" : "Copy Code"}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )})
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
