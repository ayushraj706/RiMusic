"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, FileText, Send, AlertCircle } from "lucide-react";

interface TemplatePickerProps {
  wabaId?: string | null;
  accessToken?: string | null;
  onClose: () => void;
  onSelect: (template: any) => void;
}

export default function TemplatePicker({ wabaId, accessToken, onClose, onSelect }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!wabaId || !accessToken) {
      setError("Meta API Credentials missing. Please connect your account in Settings.");
      return;
    }
    fetchTemplates();
  }, [wabaId, accessToken]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${wabaId}/message_templates`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      
      if (data.data) {
        // Sirf APPROVED templates dikhayenge
        setTemplates(data.data.filter((t: any) => t.status === "APPROVED"));
      } else {
        setError(data.error?.message || "Failed to load templates");
      }
    } catch (err) {
      setError("Network error. Could not fetch templates.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bottom-full left-4 sm:left-12 mb-3 w-[320px] max-h-[400px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-200 overflow-hidden pointer-events-auto">
      
      {/* Header */}
      <div className="bg-[#00A884] text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-sm">Send Template</h3>
        <button onClick={onClose} className="hover:bg-black/20 p-1 rounded-full transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-2 bg-gray-50 min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#00A884]" />
            <p className="text-xs">Loading templates...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center text-red-500">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-xs">No approved templates found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((tpl) => (
              <div 
                key={tpl.id} 
                onClick={() => onSelect(tpl)}
                className="bg-white border border-gray-200 p-3 rounded-xl hover:border-[#00A884] hover:shadow-md cursor-pointer transition group"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[13px] font-bold text-gray-800 truncate pr-2">{tpl.name}</p>
                  <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase font-bold">{tpl.language}</span>
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                  {tpl.components?.find((c: any) => c.type === "BODY")?.text || "No body text"}
                </p>
                <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] flex items-center gap-1 font-bold text-[#00A884]">
                    Select <Send className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

