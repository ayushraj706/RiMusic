"use client";

import React, { useState, useCallback, useMemo } from "react";
import { 
  Image as ImageIcon, 
  Video, 
  FileText, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Phone, 
  CornerUpLeft,
  Trash2,
  Bot,
  Type,
  PanelBottom,
  Send,
  Loader2
} from "lucide-react";

// ─── Type Imports ─────────────────────────────────────────────────────────────
import {
  TemplateCategory,
  TemplateLanguage,
  HeaderFormat,
  ButtonType,
  CreateTemplatePayload,
  TemplateComponent,
  HeaderComponent,
  BodyComponent,
  FooterComponent,
  ButtonsComponent,
  TemplateButton,
  QuickReplyButton,
  UrlButton,
  PhoneNumberButton,
} from "../../types/template.types";

import {
  validateTemplate,
  ValidationResult,
  extractVariableNumbers,
} from "../../lib/validators/template.validator";

// ─── Local State Types ────────────────────────────────────────────────────────
interface ButtonDraft {
  id: string;
  type: ButtonType.QUICK_REPLY | ButtonType.URL | ButtonType.PHONE_NUMBER;
  text: string;
  url?: string;
  phone_number?: string;
}

interface FormState {
  name: string;
  category: TemplateCategory;
  language: string;
  headerFormat: HeaderFormat | "NONE";
  headerText: string;
  bodyText: string;
  footerText: string;
  buttons: ButtonDraft[];
}

const uid = () => Math.random().toString(36).slice(2, 9);

function renderBodyWithVars(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\{\{\d+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{\d+\}\}$/.test(part)) {
      return (
        <span key={i} className="inline-block bg-[#E8F8F5] text-[#075E54] text-[11px] font-mono px-1 rounded mx-0.5 border border-[#A7E9D1]">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function buildPayload(form: FormState): CreateTemplatePayload {
  const components: TemplateComponent[] = [];
  if (form.headerFormat !== "NONE") {
    components.push({
      type: "HEADER",
      format: form.headerFormat as HeaderFormat,
      ...(form.headerFormat === HeaderFormat.TEXT && { text: form.headerText }),
    } as HeaderComponent);
  }
  components.push({ type: "BODY", text: form.bodyText } as BodyComponent);
  
  if (form.footerText.trim()) {
    components.push({ type: "FOOTER", text: form.footerText } as FooterComponent);
  }
  
  if (form.buttons.length > 0) {
    const buttons: TemplateButton[] = form.buttons.map((b) => {
      if (b.type === ButtonType.QUICK_REPLY) return { type: ButtonType.QUICK_REPLY, text: b.text } as QuickReplyButton;
      if (b.type === ButtonType.URL) return { type: ButtonType.URL, text: b.text, url: b.url ?? "" } as UrlButton;
      return { type: ButtonType.PHONE_NUMBER, text: b.text, phone_number: b.phone_number ?? "" } as PhoneNumberButton;
    });
    components.push({ type: "BUTTONS", buttons } as ButtonsComponent);
  }
  return { name: form.name, category: form.category, language: form.language, components };
}

// ─── Styled Components ────────────────────────────────────────────────────────
const InputCls = "w-full bg-[#F9FAFB] border border-[#E5E7EB] text-gray-800 text-[13px] rounded-lg px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] transition-all font-sans shadow-sm";

// ─── Apple iPhone Mockup (Official UI) ────────────────────────────────────────
function PhoneMockup({ form }: { form: FormState }) {
  const hasButtons = form.buttons.length > 0;

  const renderHeader = () => {
    if (form.headerFormat === "NONE" || form.headerFormat === undefined) return null;
    if (form.headerFormat === HeaderFormat.TEXT) {
      if (!form.headerText) return null;
      return <p className="font-bold text-[13px] text-[#111b21] mb-1.5">{form.headerText}</p>;
    }
    
    const iconMap = {
      [HeaderFormat.IMAGE]: <ImageIcon className="w-8 h-8 text-gray-400" />,
      [HeaderFormat.VIDEO]: <Video className="w-8 h-8 text-gray-400" />,
      [HeaderFormat.DOCUMENT]: <FileText className="w-8 h-8 text-gray-400" />,
      [HeaderFormat.LOCATION]: <MapPin className="w-8 h-8 text-gray-400" />,
    };

    return (
      <div className="w-full h-[110px] bg-[#E1E8ED] rounded-lg mb-2 flex flex-col items-center justify-center gap-1.5 shadow-inner">
        {iconMap[form.headerFormat as keyof typeof iconMap]}
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
          {form.headerFormat} MEDIA
        </span>
      </div>
    );
  };

  return (
    <div className="relative mx-auto w-[270px] flex-shrink-0 mt-4">
      {/* Apple iPhone Hardware Frame */}
      <div className="bg-[#1C1C1E] rounded-[45px] p-2.5 shadow-2xl shadow-gray-300/50 border-[3px] border-[#3A3A3C] ring-[1px] ring-gray-200">
        <div className="bg-[#EFEAE2] relative w-full h-[560px] rounded-[36px] overflow-hidden flex flex-col border-[4px] border-black">
          
          {/* Dynamic Island / Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-b-[18px] z-20 flex justify-center items-center">
            <div className="w-[40px] h-[5px] bg-gray-800 rounded-full"></div>
          </div>

          {/* iOS Status Bar */}
          <div className="bg-[#075E54] pt-[30px] pb-2 px-4 flex items-center gap-2.5 z-10 shadow-md">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white leading-tight">
                {form.name ? form.name.replace(/_/g, " ") : "BaseKey Bot"}
              </p>
              <p className="text-[10px] text-green-100 font-medium tracking-wide">online</p>
            </div>
          </div>

          {/* Chat Background */}
          <div className="flex-1 px-3 py-4 bg-[url('https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-light-pattern-texture.jpg')] bg-cover bg-center overflow-y-auto">
            
            {/* Meta Official WhatsApp Bubble */}
            {(form.bodyText || form.headerFormat !== "NONE" || form.footerText) ? (
              <div className="w-[210px] flex flex-col">
                <div className="bg-white rounded-xl rounded-tl-none shadow-sm overflow-hidden relative">
                  <div className="px-2.5 pt-2.5 pb-1">
                    {renderHeader()}
                    
                    {form.bodyText ? (
                      <p className="text-[13.5px] text-[#111b21] leading-[19px] whitespace-pre-wrap break-words font-normal">
                        {renderBodyWithVars(form.bodyText)}
                      </p>
                    ) : (
                      <p className="text-[13.5px] text-gray-400 italic">Body message...</p>
                    )}

                    {form.footerText && (
                      <p className="mt-2 text-[11px] text-[#667781] leading-tight">
                        {form.footerText}
                      </p>
                    )}

                    <div className="flex justify-end items-center mt-1 pb-1">
                      <span className="text-[10px] text-[#667781] mr-1">10:30 AM</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#53bdeb]" />
                    </div>
                  </div>

                  {/* Official Meta Interactive Buttons */}
                  {hasButtons && (
                    <div className="border-t border-gray-200 bg-white">
                      {form.buttons.map((btn, i) => (
                        <div
                          key={btn.id}
                          className={`flex items-center justify-center gap-2 py-2.5 text-[14px] font-medium text-[#00A884] cursor-pointer active:bg-gray-50 ${
                            i < form.buttons.length - 1 ? "border-b border-gray-100" : ""
                          }`}
                        >
                          {btn.type === ButtonType.QUICK_REPLY && <CornerUpLeft className="w-4 h-4" strokeWidth={2.5} />}
                          {btn.type === ButtonType.URL && <ExternalLink className="w-4 h-4" strokeWidth={2.5} />}
                          {btn.type === ButtonType.PHONE_NUMBER && <Phone className="w-4 h-4" strokeWidth={2.5} />}
                          {btn.text || "Action Button"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="bg-[#FFF3C7] text-gray-600 text-[11px] px-3 py-1.5 rounded-lg shadow-sm text-center">
                  Messages to this chat are secured with end-to-end encryption.
                </span>
              </div>
            )}
          </div>

          {/* iOS Bottom Bar */}
          <div className="bg-[#F0F0F0] px-3 py-2 pb-5 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-gray-500 text-lg">
              +
            </div>
            <div className="flex-1 bg-white border border-gray-300 rounded-full px-3 py-1.5 text-xs text-gray-400 shadow-sm">
              Message
            </div>
            <div className="w-8 h-8 rounded-full bg-[#00A884] flex items-center justify-center text-white shadow-sm">
              <Send className="w-4 h-4 ml-0.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Template Builder UI ─────────────────────────────────────────────────
export function TemplateBuilderUI({ onSave }: { onSave?: (data: any) => Promise<void> | void }) {
  const [form, setForm] = useState<FormState>({
    name: "",
    category: TemplateCategory.MARKETING,
    language: TemplateLanguage.ENGLISH_US,
    headerFormat: "NONE",
    headerText: "",
    bodyText: "",
    footerText: "",
    buttons: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const payload = useMemo(() => buildPayload(form), [form]);
  const validation = useMemo<ValidationResult>(() => validateTemplate(payload), [payload]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addButton = (type: ButtonDraft["type"]) => {
    const qr = form.buttons.filter((b) => b.type === ButtonType.QUICK_REPLY).length;
    const url = form.buttons.filter((b) => b.type === ButtonType.URL).length;
    const phone = form.buttons.filter((b) => b.type === ButtonType.PHONE_NUMBER).length;

    if (form.buttons.length >= 10) return;
    if (type === ButtonType.QUICK_REPLY && qr >= 3) return;
    if (type === ButtonType.URL && url >= 1) return;
    if (type === ButtonType.PHONE_NUMBER && phone >= 1) return;

    setForm((prev) => ({
      ...prev,
      buttons: [...prev.buttons, { id: uid(), type, text: "", url: type === ButtonType.URL ? "https://" : undefined, phone_number: type === ButtonType.PHONE_NUMBER ? "+" : undefined }],
    }));
  };

  const removeButton = (id: string) => setForm((p) => ({ ...p, buttons: p.buttons.filter((b) => b.id !== id) }));
  const updateButton = (id: string, changes: Partial<ButtonDraft>) => setForm((p) => ({ ...p, buttons: p.buttons.map((b) => (b.id === id ? { ...b, ...changes } : b)) }));

  const insertVariable = () => {
    const vars = extractVariableNumbers(form.bodyText);
    const next = vars.length > 0 ? Math.max(...vars) + 1 : 1;
    setField("bodyText", form.bodyText + `{{${next}}}`);
  };

  // ─── Backend Integration Logic ───
  const handleSubmit = async () => {
    if (!validation.isValid) return;
    
    setIsSubmitting(true);
    
    try {
      // Agar page.tsx se onSave function pass kiya gaya hai, toh payload backend ko bhej do
      if (onSave) {
        await onSave(payload);
      } else {
        // Fallback for testing (agar onSave nahi hai)
        console.log("Submitting Payload to Meta API Endpoint:", payload);
        await new Promise((r) => setTimeout(r, 1500)); 
      }
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bodyCharLimit = form.category === TemplateCategory.AUTHENTICATION ? 150 : 1024;
  const fieldError = (field: string) => validation.errors.find((e) => e.field === field)?.message;

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-gray-900 font-sans flex flex-col">
      {/* Navbar (Light Theme) */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-gray-800 leading-tight">Template Builder</h1>
            <p className="text-[11px] font-medium text-gray-500">WhatsApp Cloud API · Meta Business</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${validation.isValid ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]" : "bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${validation.isValid ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />
            {validation.isValid ? "Valid" : `${validation.errors.length} Errors`}
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={!validation.isValid || isSubmitting} 
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${validation.isValid && !isSubmitting ? "bg-[#25D366] hover:bg-[#1DA851] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSubmitting ? "Saving..." : "Save & Submit to Meta"}
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Form Panel */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-5 pb-20">
          
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#25D366]" /> Identity
            </h2>
            <div className="mb-4">
              <label className="flex justify-between text-[12px] font-bold text-gray-700 mb-1.5">Template Name <span className="text-gray-400 font-normal">{form.name.length}/512</span></label>
              <input className={InputCls} placeholder="e.g. order_confirmation" value={form.name} onChange={(e) => setField("name", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} />
              {fieldError("name") ? <p className="text-red-500 text-xs mt-1 font-medium">{fieldError("name")}</p> : <p className="text-gray-400 text-[11px] mt-1">Lowercase, numbers, underscores only.</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">Category</label>
                <select className={InputCls} value={form.category} onChange={(e) => setField("category", e.target.value as TemplateCategory)}>
                  {Object.values(TemplateCategory).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">Language</label>
                <select className={InputCls} value={form.language} onChange={(e) => setField("language", e.target.value)}>
                  {Object.entries(TemplateLanguage).map(([k, v]) => <option key={v} value={v}>{k.replace(/_/g, " ")}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#25D366]" /> Header <span className="normal-case font-medium text-gray-400 tracking-normal">(Optional)</span>
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {(["NONE", ...Object.values(HeaderFormat)]).map((fmt) => (
                <button key={fmt} onClick={() => setField("headerFormat", fmt as FormState["headerFormat"])} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${form.headerFormat === fmt ? "bg-[#ECFDF5] border-[#25D366] text-[#065F46]" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-[#25D366]"}`}>
                  {fmt === "NONE" ? "None" : fmt === HeaderFormat.TEXT ? <><Type className="w-3.5 h-3.5"/> Text</> : fmt === HeaderFormat.IMAGE ? <><ImageIcon className="w-3.5 h-3.5"/> Image</> : fmt === HeaderFormat.VIDEO ? <><Video className="w-3.5 h-3.5"/> Video</> : fmt === HeaderFormat.DOCUMENT ? <><FileText className="w-3.5 h-3.5"/> Document</> : <><MapPin className="w-3.5 h-3.5"/> Location</>}
                </button>
              ))}
            </div>
            {form.headerFormat === HeaderFormat.TEXT && (
              <div>
                <label className="flex justify-between text-[12px] font-bold text-gray-700 mb-1.5">Header Text <span className="text-gray-400 font-normal">{form.headerText.length}/60</span></label>
                <input className={InputCls} placeholder="Enter header text…" value={form.headerText} onChange={(e) => setField("headerText", e.target.value)} maxLength={60} />
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <Type className="w-4 h-4 text-[#25D366]" /> Message Body
            </h2>
            <label className="flex justify-between text-[12px] font-bold text-gray-700 mb-1.5">Body Text <span className={`${form.bodyText.length > bodyCharLimit ? 'text-red-500 font-bold' : 'text-gray-400'} font-normal`}>{form.bodyText.length}/{bodyCharLimit}</span></label>
            <div className="relative">
              <textarea className={`${InputCls} resize-none min-h-[120px]`} placeholder="Hi {{1}}, your order is confirmed! 🎉" value={form.bodyText} onChange={(e) => setField("bodyText", e.target.value)} />
              <button onClick={insertVariable} className="absolute right-2 bottom-3 px-2 py-1 text-[11px] font-bold bg-[#E8F8F5] border border-[#A7E9D1] text-[#075E54] rounded-md hover:bg-[#D1F2EB] shadow-sm">+ {"{{"}{extractVariableNumbers(form.bodyText).length + 1}{"}}"}</button>
            </div>
            {fieldError("components.BODY") && <p className="text-red-500 text-xs mt-1 font-medium">{fieldError("components.BODY")}</p>}
          </div>

          {/* New Footer Section Added Back */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <PanelBottom className="w-4 h-4 text-[#25D366]" /> Footer <span className="normal-case font-medium text-gray-400 tracking-normal">(Optional)</span>
            </h2>
            <div>
              <label className="flex justify-between text-[12px] font-bold text-gray-700 mb-1.5">Footer Text <span className="text-gray-400 font-normal">{form.footerText.length}/60</span></label>
              <input className={InputCls} placeholder="e.g. Reply STOP to unsubscribe" value={form.footerText} onChange={(e) => setField("footerText", e.target.value)} maxLength={60} />
            </div>
          </div>

          {/* Interactive Buttons Section with Official Icons */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <CornerUpLeft className="w-4 h-4 text-[#25D366]" /> Buttons <span className="normal-case font-medium text-gray-400 tracking-normal">(Interactive)</span>
            </h2>
            <div className="flex flex-wrap gap-2 mb-5">
              <button onClick={() => addButton(ButtonType.QUICK_REPLY)} className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-[#25D366] hover:text-[#25D366] transition-all"><CornerUpLeft className="w-3.5 h-3.5"/> Quick Reply</button>
              <button onClick={() => addButton(ButtonType.URL)} className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-[#25D366] hover:text-[#25D366] transition-all"><ExternalLink className="w-3.5 h-3.5"/> URL Button</button>
              <button onClick={() => addButton(ButtonType.PHONE_NUMBER)} className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-[#25D366] hover:text-[#25D366] transition-all"><Phone className="w-3.5 h-3.5"/> Phone Number</button>
            </div>
            
            <div className="space-y-3">
              {form.buttons.map((btn, idx) => (
                <div key={btn.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative">
                  <button onClick={() => removeButton(btn.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    {btn.type === ButtonType.QUICK_REPLY ? <><CornerUpLeft className="w-3.5 h-3.5"/> Quick Reply</> : btn.type === ButtonType.URL ? <><ExternalLink className="w-3.5 h-3.5"/> URL Button</> : <><Phone className="w-3.5 h-3.5"/> Phone</>} #{idx + 1}
                  </p>
                  <div className="mb-3">
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Button Text <span className="text-gray-400 font-normal">({btn.text.length}/25)</span></label>
                    <input className={InputCls} placeholder="Label" value={btn.text} onChange={(e) => updateButton(btn.id, { text: e.target.value })} maxLength={25} />
                  </div>
                  {btn.type === ButtonType.URL && (
                    <div><label className="text-[11px] font-bold text-gray-700 block mb-1">URL Link</label><input className={InputCls} value={btn.url} onChange={(e) => updateButton(btn.id, { url: e.target.value })} /></div>
                  )}
                  {btn.type === ButtonType.PHONE_NUMBER && (
                    <div><label className="text-[11px] font-bold text-gray-700 block mb-1">Phone (E.164)</label><input className={InputCls} value={btn.phone_number} onChange={(e) => updateButton(btn.id, { phone_number: e.target.value })} /></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Preview Panel */}
        <aside className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-gray-200 bg-white flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10 overflow-y-auto">
          <div className="p-6 sticky top-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[15px] font-bold text-gray-800">Live Preview</h2>
              <span className="flex items-center gap-1.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[10px] font-bold px-2 py-1 rounded-full uppercase"><span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"/> WhatsApp</span>
            </div>
            
            <PhoneMockup form={form} />

            <div className="mt-8 bg-[#F9FAFB] border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">API Payload Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Name</p><p className="text-[12px] font-bold text-gray-800 truncate">{form.name || "—"}</p></div>
                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Language</p><p className="text-[12px] font-bold text-gray-800">{form.language}</p></div>
                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Category</p><p className="text-[12px] font-bold text-gray-800">{form.category}</p></div>
                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Buttons</p><p className="text-[12px] font-bold text-gray-800">{form.buttons.length}</p></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default TemplateBuilderUI;
