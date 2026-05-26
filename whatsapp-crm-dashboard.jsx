
import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// ICONS (inline SVG components to avoid external dependencies)
// ============================================================
const Icon = ({ path, size = 20, className = "", fill = "none", stroke = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={path} />
  </svg>
);

const Icons = {
  whatsapp: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.564 4.14 1.543 5.87L0 24l6.324-1.51A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.796 9.796 0 01-5.017-1.381l-.36-.214-3.732.891.938-3.618-.235-.372A9.786 9.786 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/></svg>,
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  bot: "M12 2a2 2 0 012 2v1h3a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h3V4a2 2 0 012-2z M9 11h.01 M15 11h.01 M9 15h6",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  template: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  flow: "M5 9a2 2 0 100-4 2 2 0 000 4z M19 15a2 2 0 100-4 2 2 0 000 4z M19 5a2 2 0 100-4 2 2 0 000 4z M5 9v6m14-6v2m0-8v2",
  image: "M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M21 15l-5-5L5 21",
  paperclip: "M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
  emoji: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M8 14s1.5 2 4 2 4-2 4-2 M9 9h.01 M15 9h.01",
  check: "M20 6L9 17l-5-5",
  checkDouble: "M18 6L7 17l-5-5 M23 6L12 17",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  video: "M23 7l-7 5 7 5V7z M1 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5z",
  mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z M19 10v2a7 7 0 01-14 0v-2 M12 19v4 M8 23h8",
  location: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a2 2 0 100-4 2 2 0 000 4z",  
  close: "M18 6L6 18 M6 6l12 12",
  plus: "M12 5v14 M5 12h14",
  trash: "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
  copy: "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  moon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  sun: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z",
  wifi: "M5 12.55a11 11 0 0114.08 0 M1.42 9a16 16 0 0121.16 0 M8.53 16.11a6 6 0 016.95 0 M12 20h.01",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
};

// ============================================================
// COLOR PALETTE & THEME
// ============================================================
const theme = {
  dark: {
    bg: "#0a0e1a",
    sidebar: "#0d1220",
    card: "#111827",
    cardHover: "#1a2235",
    border: "#1e2d45",
    borderLight: "#253350",
    text: "#e2e8f0",
    textMuted: "#64748b",
    textDim: "#94a3b8",
    accent: "#25d366",
    accentDark: "#128c7e",
    accentGlow: "rgba(37,211,102,0.15)",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    orange: "#f97316",
    red: "#ef4444",
    yellow: "#eab308",
    bubble: "#1e3a2f",
    bubbleOut: "#1a3a2a",
    input: "#131c2e",
    overlay: "rgba(10,14,26,0.95)",
  },
  light: {
    bg: "#f0f4f8",
    sidebar: "#ffffff",
    card: "#ffffff",
    cardHover: "#f8fafc",
    border: "#e2e8f0",
    borderLight: "#cbd5e1",
    text: "#1e293b",
    textMuted: "#94a3b8",
    textDim: "#64748b",
    accent: "#25d366",
    accentDark: "#128c7e",
    accentGlow: "rgba(37,211,102,0.1)",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    orange: "#f97316",
    red: "#ef4444",
    yellow: "#eab308",
    bubble: "#dcf8c6",
    bubbleOut: "#ffffff",
    input: "#f8fafc",
    overlay: "rgba(240,244,248,0.97)",
  }
};

// ============================================================
// SAMPLE DATA
// ============================================================
const sampleContacts = [
  { id: 1, name: "Rahul Sharma", phone: "+91 98765 43210", avatar: "RS", color: "#25d366", lastMsg: "Haan bhai, kal milte hai!", time: "10:32 AM", unread: 3, active: true, status: "online" },
  { id: 2, name: "Priya Kapoor", phone: "+91 87654 32109", avatar: "PK", color: "#3b82f6", lastMsg: "Order ka kya hua? Please check karo", time: "9:15 AM", unread: 1, active: true, status: "online" },
  { id: 3, name: "Amit Singh", phone: "+91 76543 21098", avatar: "AS", color: "#8b5cf6", lastMsg: "Invoice bhej dena please 🙏", time: "Yesterday", unread: 0, active: false, status: "away" },
  { id: 4, name: "Sneha Patel", phone: "+91 65432 10987", avatar: "SP", color: "#f97316", lastMsg: "Thanks! Product bahut accha hai ✨", time: "Yesterday", unread: 0, active: false, status: "offline" },
  { id: 5, name: "Vikram Mehta", phone: "+91 54321 09876", avatar: "VM", color: "#ef4444", lastMsg: "Delivery kab hogi?", time: "Mon", unread: 7, active: true, status: "online" },
  { id: 6, name: "Anjali Gupta", phone: "+91 43210 98765", avatar: "AG", color: "#eab308", lastMsg: "Support chahiye tha ek cheez ke liye", time: "Sun", unread: 0, active: false, status: "offline" },
];

const sampleMessages = {
  1: [
    { id: 1, type: "incoming", content: "Bhai, aapka product dekha, bahut accha laga!", time: "10:00 AM", status: "read", msgType: "text" },
    { id: 2, type: "outgoing", content: "Thank you Rahul bhai! Koi help chahiye?", time: "10:02 AM", status: "read", msgType: "text" },
    { id: 3, type: "incoming", content: "Haan, ek demo chahiye tha weekend pe", time: "10:05 AM", status: "read", msgType: "text" },
    { id: 4, type: "outgoing", content: "Bilkul! Saturday 11 AM kaisa rahega?", time: "10:06 AM", status: "delivered", msgType: "text" },
    { id: 5, type: "incoming", content: "Perfect! Confirm kar deta hoon shaam tak", time: "10:15 AM", status: "read", msgType: "text" },
    { id: 6, type: "outgoing", content: "Sure bhai, wait kar raha hoon! 👍", time: "10:16 AM", status: "sent", msgType: "text" },
    { id: 7, type: "incoming", content: "Haan bhai, kal milte hai!", time: "10:32 AM", status: "read", msgType: "text" },
  ],
  2: [
    { id: 1, type: "incoming", content: "Hello, mujhe ek order place karna tha", time: "9:00 AM", status: "read", msgType: "text" },
    { id: 2, type: "outgoing", content: "Bilkul Priya ji! Kya chahiye aapko?", time: "9:02 AM", status: "read", msgType: "text" },
    { id: 3, type: "incoming", content: "Order ka kya hua? Please check karo", time: "9:15 AM", status: "read", msgType: "text" },
  ],
};

const templates = [
  { id: 1, name: "welcome_message", category: "MARKETING", language: "Hindi", status: "APPROVED", body: "Namaste {{1}}! 🙏 Humari service mein aapka swagat hai. Koi bhi sawal ho toh freely poochh sakte hain.", variables: ["customer_name"] },
  { id: 2, name: "order_confirmation", category: "UTILITY", language: "Hindi", status: "APPROVED", body: "Aapka order #{{1}} confirm ho gaya hai! 🎉 Estimated delivery: {{2}}. Track karne ke liye link: {{3}}", variables: ["order_id", "delivery_date", "tracking_link"] },
  { id: 3, name: "payment_reminder", category: "UTILITY", language: "Hindi", status: "APPROVED", body: "{{1}} ji, aapki payment due hai ₹{{2}} ki. Kripya {{3}} tak pay kar dein.", variables: ["name", "amount", "date"] },
  { id: 4, name: "otp_verification", category: "AUTHENTICATION", language: "Hindi", status: "APPROVED", body: "Aapka OTP hai: {{1}}. Yeh 10 minutes mein expire ho jayega. Kisi se share mat karein.", variables: ["otp"] },
  { id: 5, name: "flash_sale", category: "MARKETING", language: "Hindi", status: "PENDING", body: "🔥 Flash Sale! Aaj sirf {{1}} ghante tak {{2}}% discount. Jaldi karo!", variables: ["hours", "discount"] },
];

// ============================================================
// FLOW BUILDER NODES DATA
// ============================================================
const flowNodeTypes = [
  { type: "text", label: "Text Message", color: "#25d366", icon: "💬", desc: "Simple text message" },
  { type: "image", label: "Image/Media", color: "#3b82f6", icon: "🖼️", desc: "Image, video, or document" },
  { type: "buttons", label: "Reply Buttons", color: "#8b5cf6", icon: "🔘", desc: "Up to 3 quick reply buttons" },
  { type: "list", label: "List Menu", color: "#f97316", icon: "📋", desc: "Up to 10 menu items" },
  { type: "cta", label: "Call to Action", color: "#ef4444", icon: "🔗", desc: "URL or phone button" },
  { type: "condition", label: "Condition", color: "#eab308", icon: "⚡", desc: "If/else branching logic" },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const generateId = () => Math.random().toString(36).substr(2, 9);

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
let toastQueue = [];
let toastListeners = [];

const toast = {
  show: (message, type = "success", duration = 3000) => {
    const id = generateId();
    const newToast = { id, message, type, duration };
    toastQueue = [...toastQueue, newToast];
    toastListeners.forEach(fn => fn([...toastQueue]));
    setTimeout(() => {
      toastQueue = toastQueue.filter(t => t.id !== id);
      toastListeners.forEach(fn => fn([...toastQueue]));
    }, duration);
  },
  success: (msg) => toast.show(msg, "success"),
  error: (msg) => toast.show(msg, "error"),
  info: (msg) => toast.show(msg, "info"),
};

const useToasts = () => {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    toastListeners.push(setToasts);
    return () => { toastListeners = toastListeners.filter(fn => fn !== setToasts); };
  }, []);
  return toasts;
};

// ============================================================
// TOAST COMPONENT
// ============================================================
const ToastContainer = () => {
  const toasts = useToasts();
  const colors = { success: "#25d366", error: "#ef4444", info: "#3b82f6" };
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: "#1a2235", border: `1px solid ${colors[t.type]}40`,
          borderLeft: `3px solid ${colors[t.type]}`, borderRadius: 10, padding: "12px 16px",
          color: "#e2e8f0", fontSize: 13, minWidth: 260, maxWidth: 340,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
          animation: "slideInRight 0.3s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: colors[t.type], fontSize: 16 }}>
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
            </span>
            {t.message}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// MAIN APP COMPONENT
// ============================================================
export default function WhatsAppCRM() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedContact, setSelectedContact] = useState(sampleContacts[0]);
  const [messages, setMessages] = useState(sampleMessages);
  const [contacts, setContacts] = useState(sampleContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [webhookActive, setWebhookActive] = useState(true);
  const [settings, setSettings] = useState({
    phoneNumberId: "123456789012345",
    businessAccountId: "987654321098765",
    accessToken: "EAABwz...REDACTED",
    verifyToken: "whatsapp_crm_secure_2024",
    systemPrompt: "Tum ek helpful WhatsApp customer service agent ho. Customers ke sawalon ka jawab Hindi aur English mix mein do. Professional aur friendly raho.",
    webhookUrl: "https://your-domain.com/api/webhook"
  });

  const t = darkMode ? theme.dark : theme.light;
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedContact, messages]);

  const handleLogin = () => {
    if (loginForm.email === "admin@crm.com" && loginForm.password === "admin123") {
      setIsAuthenticated(true);
      toast.success("Welcome back, Super Admin! 👑");
    } else {
      setLoginError("Invalid credentials. Use admin@crm.com / admin123");
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    const newMsg = {
      id: Date.now(),
      type: "outgoing",
      content: messageInput,
      time: formatTime(new Date()),
      status: "sent",
      msgType: "text",
    };
    setMessages(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMsg]
    }));
    setContacts(prev => prev.map(c =>
      c.id === selectedContact.id ? { ...c, lastMsg: messageInput, time: "Now" } : c
    ));
    setMessageInput("");
    toast.success(`Message sent to ${selectedContact.name}`);

    // Simulate reply
    setTimeout(() => {
      if (aiEnabled) {
        const aiReplies = [
          "Shukriya! Mujhe thoda time do, main check karta hoon. 🙏",
          "Ji bilkul! Aapki problem solve karne ki koshish karta hoon.",
          "Thank you for reaching out! Kya aur help chahiye?",
          "Samajh gaya! Aapka kaam ho jayega. ✅",
        ];
        const replyMsg = {
          id: Date.now() + 1,
          type: "incoming",
          content: aiReplies[Math.floor(Math.random() * aiReplies.length)],
          time: formatTime(new Date()),
          status: "read",
          msgType: "text",
          isAI: true,
        };
        setMessages(prev => ({
          ...prev,
          [selectedContact.id]: [...(prev[selectedContact.id] || []), replyMsg]
        }));
      }
    }, 2000);
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  if (!isAuthenticated) {
    return <LoginPage t={t} loginForm={loginForm} setLoginForm={setLoginForm} handleLogin={handleLogin} loginError={loginError} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: t.bg, color: t.text, fontFamily: "'Outfit', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #253350; border-radius: 2px; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 8px rgba(37,211,102,0.4); } 50% { box-shadow: 0 0 16px rgba(37,211,102,0.8); } }
        .nav-item { transition: all 0.2s ease; }
        .nav-item:hover { background: rgba(37,211,102,0.1) !important; }
        .contact-item { transition: all 0.2s ease; }
        .contact-item:hover { background: rgba(255,255,255,0.05) !important; }
        .btn { transition: all 0.2s ease; cursor: pointer; }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .input { outline: none; transition: all 0.2s ease; }
        .input:focus { border-color: #25d366 !important; box-shadow: 0 0 0 2px rgba(37,211,102,0.15); }
        .glow-badge { animation: glow 2s ease-in-out infinite; }
        .typing-dot { animation: pulse 1.4s ease-in-out infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        .msg-bubble { animation: fadeIn 0.3s ease; }
        .node-item { transition: all 0.2s ease; }
        .node-item:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important; }
        .toggle-switch { transition: all 0.3s ease; }
        textarea { resize: none; }
        select { outline: none; }
      `}</style>

      {/* LEFT NAV BAR */}
      <NavBar t={t} activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} setDarkMode={setDarkMode} setIsAuthenticated={setIsAuthenticated} />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {activeTab === "chat" && (
          <ChatModule
            t={t} contacts={filteredContacts} selectedContact={selectedContact}
            setSelectedContact={setSelectedContact} messages={messages}
            sendMessage={sendMessage} messageInput={messageInput}
            setMessageInput={setMessageInput} searchQuery={searchQuery}
            setSearchQuery={setSearchQuery} messagesEndRef={messagesEndRef}
            showMediaPanel={showMediaPanel} setShowMediaPanel={setShowMediaPanel}
            chatInputRef={chatInputRef}
          />
        )}
        {activeTab === "templates" && <TemplatesModule t={t} templates={templates} />}
        {activeTab === "flow" && <FlowBuilderModule t={t} />}
        {activeTab === "ai" && <AIModule t={t} aiEnabled={aiEnabled} setAiEnabled={setAiEnabled} settings={settings} setSettings={setSettings} />}
        {activeTab === "settings" && <SettingsModule t={t} settings={settings} setSettings={setSettings} webhookActive={webhookActive} />}
      </div>

      <ToastContainer />
    </div>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage({ t, loginForm, setLoginForm, handleLogin, loginError, darkMode, setDarkMode }) {
  return (
    <div style={{
      height: "100vh", background: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Outfit', sans-serif", position: "relative", overflow: "hidden"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');`}</style>

      {/* Background grid pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "linear-gradient(#25d366 1px, transparent 1px), linear-gradient(90deg, #25d366 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "20%", left: "15%", width: 300, height: 300, background: "radial-gradient(circle, rgba(37,211,102,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 250, height: 250, background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />

      <div style={{
        background: "rgba(17,24,39,0.8)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(37,211,102,0.2)", borderRadius: 24, padding: "48px 40px",
        width: 420, position: "relative", animation: "fadeIn 0.6s ease"
      }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, background: "linear-gradient(135deg, #25d366, #128c7e)",
            borderRadius: 20, display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16, boxShadow: "0 0 40px rgba(37,211,102,0.3)"
          }}>
            <Icons.whatsapp />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>WhatsApp CRM</h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Enterprise Automation Dashboard</p>
          <div style={{ margin: "12px auto", display: "inline-block", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 20, padding: "4px 16px" }}>
            <span style={{ color: "#25d366", fontSize: 12, fontWeight: 600 }}>⚡ SUPER ADMIN</span>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>Email Address</label>
            <input
              className="input"
              type="email"
              value={loginForm.email}
              onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="admin@crm.com"
              style={{
                width: "100%", padding: "12px 16px", background: "#131c2e",
                border: "1px solid #1e2d45", borderRadius: 12, color: "#e2e8f0",
                fontSize: 14, fontFamily: "Outfit"
              }}
            />
          </div>
          <div>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>Password</label>
            <input
              className="input"
              type="password"
              value={loginForm.password}
              onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              style={{
                width: "100%", padding: "12px 16px", background: "#131c2e",
                border: "1px solid #1e2d45", borderRadius: 12, color: "#e2e8f0",
                fontSize: 14, fontFamily: "Outfit"
              }}
            />
          </div>

          {loginError && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 13 }}>
              ⚠ {loginError}
            </div>
          )}

          <div style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 10, padding: "10px 14px", color: "#64748b", fontSize: 12 }}>
            Demo: <span style={{ color: "#25d366" }}>admin@crm.com</span> / <span style={{ color: "#25d366" }}>admin123</span>
          </div>

          <button
            className="btn"
            onClick={handleLogin}
            style={{
              width: "100%", padding: "14px", background: "linear-gradient(135deg, #25d366, #128c7e)",
              border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700,
              fontFamily: "Outfit", cursor: "pointer", letterSpacing: 0.5,
              boxShadow: "0 4px 20px rgba(37,211,102,0.3)"
            }}
          >
            🔐 Sign In as Super Admin
          </button>
        </div>

        <p style={{ textAlign: "center", color: "#374151", fontSize: 12, marginTop: 24 }}>
          WhatsApp CRM v2.0 • Powered by Meta Business API
        </p>
      </div>
    </div>
  );
}

// ============================================================
// NAV BAR (Left Sidebar Icons)
// ============================================================
function NavBar({ t, activeTab, setActiveTab, darkMode, setDarkMode, setIsAuthenticated }) {
  const navItems = [
    { id: "chat", icon: "message", label: "Chats" },
    { id: "templates", icon: "template", label: "Templates" },
    { id: "flow", icon: "flow", label: "Flow Builder" },
    { id: "ai", icon: "bot", label: "AI Bot" },
    { id: "settings", icon: "settings", label: "Settings" },
  ];

  return (
    <div style={{
      width: 68, background: t.sidebar, borderRight: `1px solid ${t.border}`,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "16px 0", gap: 4, flexShrink: 0, zIndex: 10
    }}>
      {/* Logo */}
      <div style={{
        width: 42, height: 42, background: "linear-gradient(135deg, #25d366, #128c7e)",
        borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16, boxShadow: "0 4px 16px rgba(37,211,102,0.3)", flexShrink: 0
      }}>
        <Icons.whatsapp />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, width: "100%", padding: "0 8px" }}>
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              className="nav-item"
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              style={{
                width: "100%", padding: "10px", borderRadius: 12, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                background: isActive ? "rgba(37,211,102,0.15)" : "transparent",
                border: isActive ? "1px solid rgba(37,211,102,0.3)" : "1px solid transparent",
                position: "relative"
              }}
            >
              <Icon
                path={Icons[item.icon]}
                size={20}
                stroke={isActive ? "#25d366" : t.textMuted}
              />
              <span style={{ fontSize: 9, color: isActive ? "#25d366" : t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {item.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", padding: "0 8px" }}>
        <div className="nav-item" onClick={() => setDarkMode(!darkMode)} title="Toggle Theme"
          style={{ padding: "10px", borderRadius: 12, cursor: "pointer", display: "flex", justifyContent: "center", color: t.textMuted }}>
          <Icon path={darkMode ? Icons.sun : Icons.moon} size={18} />
        </div>
        <div className="nav-item" onClick={() => setIsAuthenticated(false)} title="Logout"
          style={{ padding: "10px", borderRadius: 12, cursor: "pointer", display: "flex", justifyContent: "center", color: t.textMuted }}>
          <Icon path={Icons.logout} size={18} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CHAT MODULE - COMPLETE
// ============================================================
function ChatModule({ t, contacts, selectedContact, setSelectedContact, messages, sendMessage, messageInput, setMessageInput, searchQuery, setSearchQuery, messagesEndRef, showMediaPanel, setShowMediaPanel, chatInputRef }) {
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showTemplateQuick, setShowTemplateQuick] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const currentMessages = messages[selectedContact?.id] || [];
  const isSessionExpired = false; // Simulate: check if last message was > 24hrs

  const emojis = ["😊", "👍", "🙏", "✅", "❤️", "🔥", "💯", "🎉", "😂", "🤝", "💪", "⚡", "🌟", "👋", "🎯"];

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* CONTACT SIDEBAR */}
      <div style={{ width: 320, background: t.sidebar, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: "16px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text }}>Conversations</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <div className="btn" style={{ width: 32, height: 32, borderRadius: 8, background: t.cardHover, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon path={Icons.users} size={16} stroke={t.textMuted} />
              </div>
              <div className="btn" style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon path={Icons.plus} size={16} stroke="#25d366" />
              </div>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <Icon path={Icons.search} size={15} stroke={t.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              className="input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              style={{
                width: "100%", padding: "9px 12px 9px 34px", background: t.input,
                border: `1px solid ${t.border}`, borderRadius: 10, color: t.text,
                fontSize: 13, fontFamily: "Outfit"
              }}
            />
          </div>
        </div>

        {/* Stats Strip */}
        <div style={{ display: "flex", borderBottom: `1px solid ${t.border}` }}>
          {[
            { label: "All", count: contacts.length, color: t.textMuted },
            { label: "Active", count: contacts.filter(c => c.active).length, color: "#25d366" },
            { label: "Unread", count: contacts.reduce((a, c) => a + c.unread, 0), color: "#3b82f6" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRight: i < 2 ? `1px solid ${t.border}` : "none" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {contacts.map(contact => {
            const isSelected = selectedContact?.id === contact.id;
            return (
              <div
                key={contact.id}
                className="contact-item"
                onClick={() => setSelectedContact(contact)}
                style={{
                  padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                  background: isSelected ? (darkMode ? "rgba(37,211,102,0.08)" : "rgba(37,211,102,0.06)") : "transparent",
                  borderLeft: isSelected ? "3px solid #25d366" : "3px solid transparent",
                  borderBottom: `1px solid ${t.border}30`
                }}
              >
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%", background: `${contact.color}20`,
                    border: `2px solid ${contact.color}40`, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 14, fontWeight: 700, color: contact.color
                  }}>
                    {contact.avatar}
                  </div>
                  {contact.active && (
                    <div className="glow-badge" style={{
                      position: "absolute", bottom: 0, right: 0, width: 12, height: 12,
                      background: "#25d366", borderRadius: "50%", border: `2px solid ${t.sidebar}`
                    }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                      {contact.name}
                    </span>
                    <span style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}>{contact.time}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: t.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                      {contact.lastMsg}
                    </span>
                    {contact.unread > 0 && (
                      <span style={{
                        minWidth: 20, height: 20, background: "#25d366", borderRadius: 10, display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                        color: "white", padding: "0 6px", flexShrink: 0
                      }}>
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: t.bg, position: "relative" }}>
        {/* Chat Background Pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.02, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, #25d366 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }} />

        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: "12px 20px", background: t.sidebar, borderBottom: `1px solid ${t.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", background: `${selectedContact.color}20`,
                    border: `2px solid ${selectedContact.color}40`, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 13, fontWeight: 700, color: selectedContact.color
                  }}>
                    {selectedContact.avatar}
                  </div>
                  {selectedContact.active && (
                    <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, background: "#25d366", borderRadius: "50%", border: `2px solid ${t.sidebar}` }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{selectedContact.name}</div>
                  <div style={{ fontSize: 12, color: selectedContact.active ? "#25d366" : t.textMuted }}>
                    {selectedContact.active ? "● Online • 24h Session Active" : selectedContact.phone}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[Icons.phone, Icons.video, Icons.search, Icons.bell].map((icon, i) => (
                  <div key={i} className="btn" style={{ width: 36, height: 36, borderRadius: 10, background: t.cardHover, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Icon path={icon} size={16} stroke={t.textMuted} />
                  </div>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 4, position: "relative", zIndex: 1 }}>
              {/* Date Label */}
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <span style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: "4px 14px", fontSize: 11, color: t.textMuted }}>
                  Today
                </span>
              </div>

              {currentMessages.map((msg, idx) => (
                <MessageBubble key={msg.id} msg={msg} t={t} />
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "18px 18px 18px 4px", padding: "10px 16px", display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} className="typing-dot" style={{ width: 6, height: 6, background: t.textMuted, borderRadius: "50%" }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Session Expired Banner */}
            {isSessionExpired && (
              <div style={{ padding: "12px 20px", background: "rgba(239,68,68,0.1)", borderTop: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                <Icon path={Icons.alert} size={18} stroke="#ef4444" />
                <span style={{ color: "#ef4444", fontSize: 13, flex: 1 }}>24-hour session expired. Use Template Message to re-engage.</span>
                <button onClick={() => toast.info("Template panel opening...")} style={{ background: "#ef4444", border: "none", borderRadius: 8, padding: "6px 16px", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Send Template
                </button>
              </div>
            )}

            {/* Input Area */}
            <div style={{ padding: "12px 16px", background: t.sidebar, borderTop: `1px solid ${t.border}`, position: "relative", zIndex: 1 }}>
              {/* Emoji Panel */}
              {showEmojiPanel && (
                <div style={{
                  position: "absolute", bottom: "100%", left: 16, background: t.card,
                  border: `1px solid ${t.border}`, borderRadius: 14, padding: 12,
                  display: "flex", flexWrap: "wrap", gap: 6, width: 240,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
                }}>
                  {emojis.map(emoji => (
                    <button key={emoji} onClick={() => { setMessageInput(p => p + emoji); setShowEmojiPanel(false); }}
                      style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 2, borderRadius: 6 }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                {/* Left buttons */}
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn" onClick={() => setShowEmojiPanel(!showEmojiPanel)}
                    style={{ width: 38, height: 38, borderRadius: 10, background: showEmojiPanel ? "rgba(37,211,102,0.15)" : t.cardHover, border: `1px solid ${showEmojiPanel ? "#25d366" : t.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon path={Icons.emoji} size={18} stroke={showEmojiPanel ? "#25d366" : t.textMuted} />
                  </button>
                  <button className="btn" onClick={() => { toast.info("File picker: Upload image/video/document"); }}
                    style={{ width: 38, height: 38, borderRadius: 10, background: t.cardHover, border: `1px solid ${t.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon path={Icons.paperclip} size={18} stroke={t.textMuted} />
                  </button>
                </div>

                {/* Text input */}
                <div style={{ flex: 1, position: "relative" }}>
                  <textarea
                    ref={chatInputRef}
                    className="input"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    style={{
                      width: "100%", padding: "10px 14px", background: t.input,
                      border: `1px solid ${t.border}`, borderRadius: 12, color: t.text,
                      fontSize: 14, fontFamily: "Outfit", lineHeight: 1.5, maxHeight: 120,
                    }}
                  />
                </div>

                {/* Send / Mic button */}
                <button
                  className="btn"
                  onClick={sendMessage}
                  style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: messageInput.trim() ? "linear-gradient(135deg, #25d366, #128c7e)" : t.cardHover,
                    border: `1px solid ${messageInput.trim() ? "#25d366" : t.border}`,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease",
                    boxShadow: messageInput.trim() ? "0 4px 16px rgba(37,211,102,0.3)" : "none"
                  }}
                >
                  <Icon path={messageInput.trim() ? Icons.send : Icons.mic} size={18} stroke={messageInput.trim() ? "white" : t.textMuted} />
                </button>
              </div>

              {/* Quick Actions */}
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {["📋 Template", "📍 Location", "👤 Contact", "📊 List Menu", "🔘 Buttons"].map(action => (
                  <button key={action} className="btn"
                    onClick={() => toast.info(`${action} panel opening...`)}
                    style={{
                      padding: "4px 10px", background: t.cardHover, border: `1px solid ${t.border}`,
                      borderRadius: 8, color: t.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "Outfit"
                    }}>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 64, opacity: 0.3 }}>💬</div>
            <p style={{ color: t.textMuted, fontSize: 16 }}>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================
function MessageBubble({ msg, t }) {
  const isOut = msg.type === "outgoing";
  const StatusIcon = () => {
    if (!isOut) return null;
    if (msg.status === "sent") return <span style={{ color: t.textMuted, fontSize: 10 }}>✓</span>;
    if (msg.status === "delivered") return <span style={{ color: t.textMuted, fontSize: 10 }}>✓✓</span>;
    if (msg.status === "read") return <span style={{ color: "#25d366", fontSize: 10 }}>✓✓</span>;
    return null;
  };

  return (
    <div className="msg-bubble" style={{ display: "flex", justifyContent: isOut ? "flex-end" : "flex-start", marginBottom: 2 }}>
      <div style={{
        maxWidth: "68%", padding: "10px 14px",
        background: isOut
          ? "linear-gradient(135deg, #1e3a2f, #1a3a2a)"
          : t.card,
        borderRadius: isOut ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        border: `1px solid ${isOut ? "rgba(37,211,102,0.2)" : t.border}`,
        boxShadow: isOut ? "0 2px 12px rgba(37,211,102,0.08)" : `0 2px 8px rgba(0,0,0,0.1)`,
        position: "relative"
      }}>
        {/* AI Badge */}
        {msg.isAI && (
          <div style={{ fontSize: 10, color: "#8b5cf6", fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            ⚡ Gemini AI Reply
          </div>
        )}

        {/* Message content */}
        <p style={{ fontSize: 14, color: t.text, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {msg.content}
        </p>

        {/* Time & status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: t.textMuted }}>{msg.time}</span>
          <StatusIcon />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TEMPLATES MODULE
// ============================================================
function TemplatesModule({ t, templates }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filterCat, setFilterCat] = useState("ALL");
  const [sendModal, setSendModal] = useState(false);
  const [variables, setVariables] = useState({});
  const [phoneNumber, setPhoneNumber] = useState("");

  const categories = ["ALL", "MARKETING", "UTILITY", "AUTHENTICATION"];
  const filtered = templates.filter(t => filterCat === "ALL" || t.category === filterCat);

  const statusColors = { APPROVED: "#25d366", PENDING: "#eab308", REJECTED: "#ef4444" };
  const catColors = { MARKETING: "#f97316", UTILITY: "#3b82f6", AUTHENTICATION: "#8b5cf6" };

  const handleSend = () => {
    if (!phoneNumber) { toast.error("Please enter phone number"); return; }
    toast.success(`Template "${selectedTemplate?.name}" sent to ${phoneNumber}! 🚀`);
    setSendModal(false);
    setPhoneNumber("");
    setVariables({});
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: t.bg }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${t.border}`, background: t.sidebar }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: t.text }}>📋 Template Manager</h1>
            <p style={{ color: t.textMuted, fontSize: 13, marginTop: 2 }}>Manage & send Meta-approved WhatsApp templates</p>
          </div>
          <button className="btn" onClick={() => toast.info("Opening Meta Business Manager to create new template...")}
            style={{ padding: "10px 20px", background: "linear-gradient(135deg, #25d366, #128c7e)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit" }}>
            + New Template
          </button>
        </div>

        {/* Category filters */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {categories.map(cat => (
            <button key={cat} className="btn" onClick={() => setFilterCat(cat)}
              style={{
                padding: "6px 16px", borderRadius: 20, border: `1px solid ${filterCat === cat ? "#25d366" : t.border}`,
                background: filterCat === cat ? "rgba(37,211,102,0.15)" : t.cardHover,
                color: filterCat === cat ? "#25d366" : t.textMuted, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "Outfit"
              }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map(tmpl => (
            <div key={tmpl.id} style={{
              background: t.card, border: `1px solid ${selectedTemplate?.id === tmpl.id ? "#25d366" : t.border}`,
              borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.2s ease",
              boxShadow: selectedTemplate?.id === tmpl.id ? "0 0 20px rgba(37,211,102,0.15)" : "none"
            }}
              onClick={() => setSelectedTemplate(tmpl)}
              className="node-item"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}>{tmpl.name}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: catColors[tmpl.category], background: `${catColors[tmpl.category]}15`, padding: "2px 8px", borderRadius: 10, border: `1px solid ${catColors[tmpl.category]}30` }}>
                      {tmpl.category}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: t.cardHover, padding: "2px 8px", borderRadius: 10 }}>
                      {tmpl.language}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColors[tmpl.status], background: `${statusColors[tmpl.status]}15`, padding: "4px 10px", borderRadius: 12, border: `1px solid ${statusColors[tmpl.status]}30` }}>
                  {tmpl.status}
                </span>
              </div>

              <p style={{ fontSize: 13, color: t.textDim, lineHeight: 1.6, marginBottom: 12, background: t.input, padding: "10px 12px", borderRadius: 10, border: `1px solid ${t.border}` }}>
                {tmpl.body}
              </p>

              {tmpl.variables.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                  {tmpl.variables.map(v => (
                    <span key={v} style={{ fontSize: 10, color: "#8b5cf6", background: "rgba(139,92,246,0.1)", padding: "2px 8px", borderRadius: 6 }}>
                      {"{{"}{v}{"}}"}
                    </span>
                  ))}
                </div>
              )}

              <button className="btn" onClick={(e) => { e.stopPropagation(); setSelectedTemplate(tmpl); setSendModal(true); }}
                style={{
                  width: "100%", padding: "10px", background: "linear-gradient(135deg, #25d366, #128c7e)",
                  border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "Outfit"
                }}>
                🚀 Send This Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Send Modal */}
      {sendModal && selectedTemplate && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)"
        }}>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: 28, width: 480, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Send Template</h3>
              <button onClick={() => setSendModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}>
                <Icon path={Icons.close} size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ color: t.textMuted, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>RECIPIENT PHONE</label>
                <input className="input" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: "100%", padding: "10px 14px", background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 14, fontFamily: "Outfit" }} />
              </div>

              {selectedTemplate.variables.map(v => (
                <div key={v}>
                  <label style={{ color: t.textMuted, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{v.toUpperCase()}</label>
                  <input className="input" value={variables[v] || ""} onChange={e => setVariables(p => ({ ...p, [v]: e.target.value }))}
                    placeholder={`Enter ${v}...`}
                    style={{ width: "100%", padding: "10px 14px", background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 14, fontFamily: "Outfit" }} />
                </div>
              ))}

              <div style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 6, fontWeight: 600 }}>PREVIEW</div>
                <p style={{ fontSize: 13, color: t.text, lineHeight: 1.6 }}>
                  {selectedTemplate.body.replace(/\{\{(\d+)\}\}/g, (_, idx) => {
                    const varName = selectedTemplate.variables[parseInt(idx) - 1];
                    return variables[varName] ? `[${variables[varName]}]` : `{{${idx}}}`;
                  })}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setSendModal(false)} style={{ flex: 1, padding: "12px", background: t.cardHover, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textMuted, cursor: "pointer", fontFamily: "Outfit" }}>
                  Cancel
                </button>
                <button onClick={handleSend} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg, #25d366, #128c7e)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "Outfit" }}>
                  🚀 Send Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FLOW BUILDER MODULE - Interactive Canvas
// ============================================================
function FlowBuilderModule({ t }) {
  const [nodes, setNodes] = useState([
    { id: "start", type: "text", x: 160, y: 100, label: "Start Node", content: "Namaste! Aapka swagat hai 🙏\n\nKya aapko help chahiye?", color: "#25d366", connections: ["btn1"] },
    { id: "btn1", type: "buttons", x: 160, y: 320, label: "Quick Replies", content: "", color: "#8b5cf6", buttons: ["✅ Haan, chahiye", "❌ Nahin, thanks", "📞 Call karo"], connections: [] },
  ]);
  const [connections, setConnections] = useState([{ from: "start", to: "btn1" }]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState(null);
  const canvasRef = useRef(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  const nodeTypeInfo = {
    text: { icon: "💬", color: "#25d366", label: "Text Message" },
    image: { icon: "🖼️", color: "#3b82f6", label: "Image/Media" },
    buttons: { icon: "🔘", color: "#8b5cf6", label: "Reply Buttons" },
    list: { icon: "📋", color: "#f97316", label: "List Menu" },
    cta: { icon: "🔗", color: "#ef4444", label: "Call to Action" },
    condition: { icon: "⚡", color: "#eab308", label: "Condition" },
  };

  const addNode = (type) => {
    const info = nodeTypeInfo[type];
    const newNode = {
      id: generateId(),
      type, x: 100 + Math.random() * 200, y: 100 + Math.random() * 200,
      label: info.label, content: type === "text" ? "New message..." : "",
      color: info.color, connections: [],
      buttons: type === "buttons" ? ["Button 1", "Button 2"] : undefined,
      items: type === "list" ? ["Item 1", "Item 2", "Item 3"] : undefined,
    };
    setNodes(p => [...p, newNode]);
    toast.success(`${info.icon} ${info.label} node added!`);
  };

  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    setDragging(nodeId);
    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y });
    setSelectedNode(nodeId);
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    setNodes(p => p.map(n => n.id === dragging ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n));
  };

  const handleMouseUp = () => setDragging(null);

  const deleteNode = (id) => {
    setNodes(p => p.filter(n => n.id !== id));
    setConnections(p => p.filter(c => c.from !== id && c.to !== id));
    if (selectedNode === id) setSelectedNode(null);
    toast.success("Node deleted");
  };

  const exportJSON = () => {
    const payload = {
      messaging_product: "whatsapp",
      to: "{{RECIPIENT_PHONE}}",
      type: "interactive",
      flow: nodes.map(n => ({
        id: n.id, type: n.type, content: n.content,
        ...(n.buttons && { buttons: n.buttons }),
        ...(n.items && { items: n.items }),
        connections: n.connections,
      })),
      connections,
      generated_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "whatsapp_flow.json"; a.click();
    toast.success("Flow exported as JSON! 📥");
  };

  const getConnectionPath = (fromNode, toNode) => {
    if (!fromNode || !toNode) return "";
    const fromX = fromNode.x + 140;
    const fromY = fromNode.y + 40;
    const toX = toNode.x;
    const toY = toNode.y + 40;
    const midX = (fromX + toX) / 2;
    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", background: t.bg }}>
      {/* Left Panel - Node Palette */}
      <div style={{ width: 220, background: t.sidebar, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: `1px solid ${t.border}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: t.text }}>⚡ Flow Builder</h2>
          <p style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>Drag nodes to canvas</p>
        </div>

        <div style={{ padding: "12px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Node Types</div>
          {flowNodeTypes.map(nt => (
            <div
              key={nt.type}
              className="node-item"
              onClick={() => addNode(nt.type)}
              style={{
                padding: "10px 12px", borderRadius: 10, marginBottom: 6, cursor: "pointer",
                background: t.cardHover, border: `1px solid ${t.border}`,
                display: "flex", alignItems: "center", gap: 10
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${nt.color}20`, border: `1px solid ${nt.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15
              }}>
                {nt.icon}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{nt.label}</div>
                <div style={{ fontSize: 10, color: t.textMuted }}>{nt.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: "12px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#25d366", fontWeight: 600, marginBottom: 4 }}>💡 How to use</div>
            <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
              Click nodes to add to canvas. Drag to reposition. Click to edit. Export as WhatsApp JSON.
            </div>
          </div>
        </div>

        <div style={{ padding: "12px", borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="btn" onClick={exportJSON}
            style={{ padding: "10px", background: "linear-gradient(135deg, #25d366, #128c7e)", border: "none", borderRadius: 10, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit" }}>
            📥 Export JSON
          </button>
          <button className="btn" onClick={() => { setNodes([]); setConnections([]); toast.success("Canvas cleared"); }}
            style={{ padding: "10px", background: t.cardHover, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "Outfit" }}>
            🗑 Clear Canvas
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        style={{ flex: 1, position: "relative", overflow: "hidden", cursor: dragging ? "grabbing" : "default" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setSelectedNode(null)}
      >
        {/* Dot grid background */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.15,
          backgroundImage: `radial-gradient(circle, ${t.borderLight} 1px, transparent 1px)`,
          backgroundSize: "28px 28px"
        }} />

        {/* Canvas label */}
        <div style={{ position: "absolute", top: 16, right: 16, background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "6px 14px" }}>
          <span style={{ fontSize: 11, color: t.textMuted }}>{nodes.length} nodes • {connections.length} connections</span>
        </div>

        {/* SVG connections */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#25d366" opacity="0.6" />
            </marker>
          </defs>
          {connections.map((conn, i) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            return (
              <path
                key={i}
                d={getConnectionPath(fromNode, toNode)}
                stroke="#25d366"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,3"
                opacity="0.5"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const info = nodeTypeInfo[node.type];
          const isSelected = selectedNode === node.id;
          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              style={{
                position: "absolute", left: node.x, top: node.y,
                width: 200, background: t.card,
                border: `2px solid ${isSelected ? node.color : t.border}`,
                borderRadius: 14, boxShadow: isSelected ? `0 0 24px ${node.color}30, 0 8px 32px rgba(0,0,0,0.3)` : "0 4px 16px rgba(0,0,0,0.2)",
                cursor: dragging === node.id ? "grabbing" : "grab",
                transition: "box-shadow 0.2s, border-color 0.2s",
                userSelect: "none", zIndex: isSelected ? 10 : 1,
              }}
            >
              {/* Node Header */}
              <div style={{
                padding: "10px 12px", borderBottom: `1px solid ${t.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: `${node.color}12`, borderRadius: "12px 12px 0 0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{info.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: node.color }}>{info.label.toUpperCase()}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setEditingNode(node.id); }}
                    style={{ width: 20, height: 20, background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontSize: 12 }}>✏️</button>
                  <button onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                    style={{ width: 20, height: 20, background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 12 }}>✕</button>
                </div>
              </div>

              {/* Node Content */}
              <div style={{ padding: "10px 12px" }}>
                {node.type === "text" && (
                  <p style={{ fontSize: 12, color: t.textDim, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{node.content}</p>
                )}
                {node.type === "buttons" && node.buttons && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {node.buttons.map((btn, i) => (
                      <div key={i} style={{ padding: "6px 10px", background: `${node.color}15`, border: `1px solid ${node.color}40`, borderRadius: 8, fontSize: 11, color: node.color, textAlign: "center" }}>
                        {btn}
                      </div>
                    ))}
                  </div>
                )}
                {node.type === "list" && node.items && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {node.items.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ fontSize: 11, color: t.textDim, padding: "4px 8px", background: t.cardHover, borderRadius: 6 }}>
                        {i + 1}. {item}
                      </div>
                    ))}
                    {node.items.length > 3 && <div style={{ fontSize: 10, color: t.textMuted, textAlign: "center" }}>+{node.items.length - 3} more</div>}
                  </div>
                )}
                {node.type === "image" && (
                  <div style={{ background: t.cardHover, borderRadius: 8, height: 60, display: "flex", alignItems: "center", justifyContent: "center", color: t.textMuted, fontSize: 11 }}>
                    🖼️ Media Attachment
                  </div>
                )}
                {node.type === "cta" && (
                  <div style={{ padding: "8px 10px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 11, color: "#ef4444", textAlign: "center" }}>
                    🔗 Click Here →
                  </div>
                )}
                {node.type === "condition" && (
                  <div style={{ fontSize: 11, color: t.textDim }}>
                    <div style={{ marginBottom: 4 }}>IF: message contains keyword</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ color: "#25d366", fontSize: 10 }}>✅ YES →</span>
                      <span style={{ color: "#ef4444", fontSize: 10 }}>❌ NO →</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Connection dots */}
              <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, background: node.color, borderRadius: "50%", border: "2px solid white", cursor: "crosshair" }} />
              <div style={{ position: "absolute", left: -8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, background: t.border, borderRadius: "50%", border: `2px solid ${node.color}` }} />
            </div>
          );
        })}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 56, opacity: 0.3 }}>⚡</div>
            <p style={{ color: t.textMuted, fontSize: 16 }}>Click node types on the left to add them to canvas</p>
          </div>
        )}
      </div>

      {/* Right Panel - Node Properties */}
      {selectedNode && (
        <NodePropertiesPanel
          t={t}
          node={nodes.find(n => n.id === selectedNode)}
          onUpdate={(updatedNode) => setNodes(p => p.map(n => n.id === updatedNode.id ? updatedNode : n))}
          onClose={() => setSelectedNode(null)}
          connections={connections}
          setConnections={setConnections}
          nodes={nodes}
        />
      )}
    </div>
  );
}

// ============================================================
// NODE PROPERTIES PANEL
// ============================================================
function NodePropertiesPanel({ t, node, onUpdate, onClose, connections, setConnections, nodes }) {
  if (!node) return null;
  const [localNode, setLocalNode] = useState(node);

  useEffect(() => { setLocalNode(node); }, [node]);

  const save = () => { onUpdate(localNode); toast.success("Node updated! ✅"); };

  return (
    <div style={{ width: 280, background: t.sidebar, borderLeft: `1px solid ${t.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Node Properties</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>NODE LABEL</label>
            <input className="input" value={localNode.label} onChange={e => setLocalNode(p => ({ ...p, label: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 13, fontFamily: "Outfit" }} />
          </div>

          {localNode.type === "text" && (
            <div>
              <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>MESSAGE CONTENT</label>
              <textarea className="input" value={localNode.content} onChange={e => setLocalNode(p => ({ ...p, content: e.target.value }))}
                rows={5}
                style={{ width: "100%", padding: "8px 12px", background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 13, fontFamily: "Outfit" }} />
            </div>
          )}

          {localNode.type === "buttons" && localNode.buttons && (
            <div>
              <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>BUTTONS (MAX 3)</label>
              {localNode.buttons.map((btn, i) => (
                <input key={i} className="input" value={btn}
                  onChange={e => setLocalNode(p => ({ ...p, buttons: p.buttons.map((b, bi) => bi === i ? e.target.value : b) }))}
                  style={{ width: "100%", padding: "8px 12px", background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 13, fontFamily: "Outfit", marginBottom: 6 }} />
              ))}
              {localNode.buttons.length < 3 && (
                <button onClick={() => setLocalNode(p => ({ ...p, buttons: [...p.buttons, `Button ${p.buttons.length + 1}`] }))}
                  style={{ padding: "6px 12px", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, color: "#8b5cf6", fontSize: 11, cursor: "pointer", fontFamily: "Outfit" }}>
                  + Add Button
                </button>
              )}
            </div>
          )}

          {localNode.type === "list" && localNode.items && (
            <div>
              <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>LIST ITEMS (MAX 10)</label>
              {localNode.items.map((item, i) => (
                <input key={i} className="input" value={item}
                  onChange={e => setLocalNode(p => ({ ...p, items: p.items.map((it, ii) => ii === i ? e.target.value : it) }))}
                  style={{ width: "100%", padding: "8px 12px", background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 13, fontFamily: "Outfit", marginBottom: 6 }} />
              ))}
              {localNode.items.length < 10 && (
                <button onClick={() => setLocalNode(p => ({ ...p, items: [...p.items, `Item ${p.items.length + 1}`] }))}
                  style={{ padding: "6px 12px", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, color: "#f97316", fontSize: 11, cursor: "pointer", fontFamily: "Outfit" }}>
                  + Add Item
                </button>
              )}
            </div>
          )}

          {/* Connection to */}
          <div>
            <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>CONNECT TO</label>
            <select className="input"
              onChange={e => {
                if (!e.target.value) return;
                const exists = connections.find(c => c.from === localNode.id && c.to === e.target.value);
                if (!exists) { setConnections(p => [...p, { from: localNode.id, to: e.target.value }]); toast.success("Connection added!"); }
              }}
              style={{ width: "100%", padding: "8px 12px", background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 13, fontFamily: "Outfit" }}>
              <option value="">Select target node...</option>
              {nodes.filter(n => n.id !== localNode.id).map(n => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
          </div>

          <button onClick={save}
            style={{ padding: "10px", background: "linear-gradient(135deg, #25d366, #128c7e)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "Outfit", fontSize: 13 }}>
            ✅ Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AI BOT MODULE
// ============================================================
function AIModule({ t, aiEnabled, setAiEnabled, settings, setSettings }) {
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [conversationLog, setConversationLog] = useState([
    { role: "user", content: "Mujhe product ke baare mein jaankari chahiye", time: "10:32 AM" },
    { role: "ai", content: "Bilkul! Hamara product premium quality ka hai aur aapko bahut faayda dega. Kya specific jaankari chahiye? 🙏", time: "10:32 AM", tokens: 42 },
    { role: "user", content: "Price kya hai?", time: "10:35 AM" },
    { role: "ai", content: "Hamare plans ₹999/month se start hote hain. Aapke liye best plan recommend kar sakta hoon, agar aap batayein ki aapki requirements kya hain?", time: "10:35 AM", tokens: 58 },
  ]);

  const testAI = async () => {
    if (!testInput.trim()) return;
    setIsTesting(true);
    const newLog = { role: "user", content: testInput, time: formatTime(new Date()) };
    setConversationLog(p => [...p, newLog]);

    setTimeout(() => {
      const responses = [
        "Main aapki help karne ke liye taiyaar hoon! Aapka sawaal samajh gaya. 😊",
        "Bahut accha sawaal hai! Iske baare mein detail mein bata sakta hoon.",
        "Shukriya aapke sawaal ke liye. Main abhi check karta hoon aur jawab deta hoon. ✅",
        "Haan bilkul! Yeh ek important point hai. Let me explain in detail.",
      ];
      const aiResponse = responses[Math.floor(Math.random() * responses.length)];
      setConversationLog(p => [...p, { role: "ai", content: aiResponse, time: formatTime(new Date()), tokens: Math.floor(Math.random() * 60) + 20 }]);
      setTestOutput(aiResponse);
      setIsTesting(false);
    }, 1500);
    setTestInput("");
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", background: t.bg }}>
      {/* Left - Settings */}
      <div style={{ width: 360, background: t.sidebar, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text }}>⚡ Gemini AI Bot</h2>
          <p style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>Context-aware auto-reply system</p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* AI Toggle */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>AI Bot Status</div>
                <div style={{ fontSize: 12, color: aiEnabled ? "#25d366" : t.textMuted }}>
                  {aiEnabled ? "● Active & Responding" : "○ Paused"}
                </div>
              </div>
              <div
                className="toggle-switch"
                onClick={() => { setAiEnabled(!aiEnabled); toast.success(aiEnabled ? "AI Bot paused" : "AI Bot activated! 🤖"); }}
                style={{
                  width: 50, height: 26, borderRadius: 13, cursor: "pointer",
                  background: aiEnabled ? "#25d366" : t.border, position: "relative",
                  transition: "background 0.3s"
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", background: "white",
                  position: "absolute", top: 3, left: aiEnabled ? 27 : 3, transition: "left 0.3s ease"
                }} />
              </div>
            </div>
            {aiEnabled && (
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Messages Today", val: "47" },
                  { label: "Avg Response", val: "1.2s" },
                  { label: "Tokens Used", val: "8,420" },
                ].map(stat => (
                  <div key={stat.label} style={{ flex: 1, textAlign: "center", background: t.cardHover, borderRadius: 8, padding: "8px 4px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#25d366" }}>{stat.val}</div>
                    <div style={{ fontSize: 9, color: t.textMuted, textTransform: "uppercase" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Settings */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>🔧 Model Config</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Model", value: "gemini-1.5-pro" },
                { label: "Temperature", value: "0.7" },
                { label: "Max Tokens", value: "500" },
                { label: "Context Window", value: "5 messages" },
              ].map(cfg => (
                <div key={cfg.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: t.textMuted }}>{cfg.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.text, background: t.cardHover, padding: "3px 10px", borderRadius: 6 }}>{cfg.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>System Prompt (Bot Persona)</label>
            <textarea
              className="input"
              value={settings.systemPrompt}
              onChange={e => setSettings(p => ({ ...p, systemPrompt: e.target.value }))}
              rows={6}
              style={{
                width: "100%", padding: "12px 14px", background: t.input,
                border: `1px solid ${t.border}`, borderRadius: 12, color: t.text,
                fontSize: 13, fontFamily: "Outfit", lineHeight: 1.6
              }}
            />
            <button onClick={() => toast.success("System prompt saved! 🎯")}
              style={{ marginTop: 8, padding: "8px 20px", background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 8, color: "#25d366", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit" }}>
              💾 Save Prompt
            </button>
          </div>

          {/* Trigger Keywords */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 10 }}>🎯 Trigger Keywords</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["help", "price", "order", "delivery", "refund", "support", "kya", "kaise", "batao"].map(kw => (
                <span key={kw} style={{ padding: "4px 10px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 12, fontSize: 11, color: "#3b82f6" }}>
                  {kw}
                </span>
              ))}
              <span style={{ padding: "4px 10px", background: "rgba(37,211,102,0.1)", border: "1px dashed rgba(37,211,102,0.3)", borderRadius: 12, fontSize: 11, color: "#25d366", cursor: "pointer" }}>
                + Add
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Test & Logs */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", background: t.sidebar, borderBottom: `1px solid ${t.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text }}>🧪 Live Test Playground</h3>
          <p style={{ color: t.textMuted, fontSize: 12 }}>Test how the AI responds to customer messages</p>
        </div>

        {/* Conversation log */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {conversationLog.map((entry, i) => (
            <div key={i} style={{ display: "flex", justifyContent: entry.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "70%", padding: "12px 16px",
                background: entry.role === "user" ? "linear-gradient(135deg, #1e3a2f, #1a3a2a)" : t.card,
                border: `1px solid ${entry.role === "user" ? "rgba(37,211,102,0.2)" : t.border}`,
                borderRadius: entry.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              }}>
                {entry.role === "ai" && (
                  <div style={{ fontSize: 10, color: "#8b5cf6", fontWeight: 700, marginBottom: 4 }}>
                    ⚡ GEMINI AI {entry.tokens && `• ${entry.tokens} tokens`}
                  </div>
                )}
                <p style={{ fontSize: 13, color: t.text, lineHeight: 1.6 }}>{entry.content}</p>
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 4 }}>{entry.time}</div>
              </div>
            </div>
          ))}
          {isTesting && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, color: "#8b5cf6", fontWeight: 700, marginBottom: 6 }}>⚡ Gemini is typing...</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ width: 8, height: 8, background: "#8b5cf6", borderRadius: "50%" }} />)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Input */}
        <div style={{ padding: "12px 20px", background: t.sidebar, borderTop: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="input"
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && testAI()}
              placeholder="Simulate a customer message..."
              style={{
                flex: 1, padding: "10px 16px", background: t.input,
                border: `1px solid ${t.border}`, borderRadius: 10, color: t.text,
                fontSize: 13, fontFamily: "Outfit"
              }}
            />
            <button onClick={testAI} disabled={isTesting}
              style={{ padding: "10px 20px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "Outfit", opacity: isTesting ? 0.7 : 1 }}>
              {isTesting ? "⏳" : "⚡ Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS MODULE
// ============================================================
function SettingsModule({ t, settings, setSettings, webhookActive }) {
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("whatsapp");

  const saveSettings = () => {
    setSaved(true);
    toast.success("Settings saved securely! 🔒");
    setTimeout(() => setSaved(false), 3000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success(`${label} copied! 📋`);
  };

  const sections = [
    { id: "whatsapp", label: "WhatsApp API", icon: "📱" },
    { id: "webhook", label: "Webhook", icon: "🔗" },
    { id: "cloudinary", label: "Cloudinary", icon: "☁️" },
    { id: "database", label: "Database", icon: "🗄️" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", background: t.bg }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: t.sidebar, borderRight: `1px solid ${t.border}`, padding: "16px 12px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 16, padding: "0 8px" }}>⚙️ Settings</h2>
        {sections.map(s => (
          <div key={s.id} className="nav-item" onClick={() => setActiveSection(s.id)}
            style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer",
              background: activeSection === s.id ? "rgba(37,211,102,0.15)" : "transparent",
              border: `1px solid ${activeSection === s.id ? "rgba(37,211,102,0.3)" : "transparent"}`,
              color: activeSection === s.id ? "#25d366" : t.textMuted, fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 10
            }}>
            <span>{s.icon}</span> {s.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {activeSection === "whatsapp" && (
          <div style={{ maxWidth: 640 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 4 }}>📱 WhatsApp Business API</h3>
            <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 24 }}>Configure your Meta Business API credentials</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "phoneNumberId", label: "Phone Number ID", placeholder: "123456789012345", secret: false },
                { key: "businessAccountId", label: "Business Account ID", placeholder: "987654321098765", secret: false },
                { key: "accessToken", label: "Access Token (Permanent)", placeholder: "EAABwz...", secret: true },
              ].map(field => (
                <div key={field.key} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                  <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
                    {field.label}
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input"
                      type={field.secret ? "password" : "text"}
                      value={settings[field.key]}
                      onChange={e => setSettings(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      style={{ flex: 1, padding: "10px 14px", background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 13, fontFamily: "Outfit" }}
                    />
                    <button onClick={() => copyToClipboard(settings[field.key], field.label)}
                      style={{ padding: "10px 14px", background: t.cardHover, border: `1px solid ${t.border}`, borderRadius: 10, cursor: "pointer", color: t.textMuted }}>
                      📋
                    </button>
                  </div>
                </div>
              ))}

              <button onClick={saveSettings}
                style={{ padding: "14px", background: "linear-gradient(135deg, #25d366, #128c7e)", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit", boxShadow: "0 4px 20px rgba(37,211,102,0.3)" }}>
                {saved ? "✅ Saved!" : "💾 Save API Settings"}
              </button>
            </div>
          </div>
        )}

        {activeSection === "webhook" && (
          <div style={{ maxWidth: 640 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 4 }}>🔗 Webhook Configuration</h3>
            <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 24 }}>Configure webhook to receive WhatsApp messages</p>

            {/* Status Card */}
            <div style={{
              background: webhookActive ? "rgba(37,211,102,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${webhookActive ? "rgba(37,211,102,0.3)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: 14, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 14
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: "50%",
                background: webhookActive ? "#25d366" : "#ef4444",
                boxShadow: webhookActive ? "0 0 12px rgba(37,211,102,0.8)" : "none",
                animation: webhookActive ? "glow 2s ease-in-out infinite" : "none"
              }} />
              <div>
                <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>
                  Webhook {webhookActive ? "ACTIVE" : "INACTIVE"}
                </div>
                <div style={{ color: t.textMuted, fontSize: 12 }}>
                  {webhookActive ? "Receiving 200 OK responses • Last ping: 2 seconds ago" : "No webhook activity detected"}
                </div>
              </div>
              <div style={{ marginLeft: "auto", padding: "4px 12px", background: webhookActive ? "rgba(37,211,102,0.2)" : "rgba(239,68,68,0.2)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: webhookActive ? "#25d366" : "#ef4444" }}>
                {webhookActive ? "LIVE" : "OFFLINE"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Webhook URL", value: settings.webhookUrl, desc: "Add this URL in Meta Developer Console" },
                { label: "Verify Token", value: settings.verifyToken, desc: "Use this token in Meta webhook verification" },
              ].map(item => (
                <div key={item.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</label>
                    <button onClick={() => copyToClipboard(item.value, item.label)}
                      style={{ padding: "4px 12px", background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 8, color: "#25d366", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Outfit" }}>
                      📋 Copy
                    </button>
                  </div>
                  <div style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#25d366", wordBreak: "break-all" }}>
                    {item.value}
                  </div>
                  <p style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>💡 {item.desc}</p>
                </div>
              ))}

              {/* Events subscription */}
              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 10 }}>📡 Subscribed Events</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["messages", "message_deliveries", "message_reads", "messaging_postbacks", "message_reactions"].map(ev => (
                    <span key={ev} style={{ padding: "4px 12px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 12, fontSize: 11, color: "#25d366" }}>
                      ✓ {ev}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent webhook logs */}
              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 10 }}>📝 Recent Webhook Logs</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { status: 200, method: "POST", path: "/api/webhook", time: "10:32:15 AM", type: "message" },
                    { status: 200, method: "GET", path: "/api/webhook", time: "10:30:00 AM", type: "verification" },
                    { status: 200, method: "POST", path: "/api/webhook", time: "10:28:42 AM", type: "status" },
                    { status: 200, method: "POST", path: "/api/webhook", time: "10:25:18 AM", type: "message" },
                  ].map((log, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: t.cardHover, borderRadius: 8, fontFamily: "monospace", fontSize: 12 }}>
                      <span style={{ color: "#25d366", fontWeight: 700, minWidth: 36 }}>{log.status}</span>
                      <span style={{ color: "#3b82f6", minWidth: 40 }}>{log.method}</span>
                      <span style={{ color: t.textDim, flex: 1 }}>{log.path}</span>
                      <span style={{ padding: "2px 8px", background: "rgba(37,211,102,0.1)", borderRadius: 6, color: "#25d366", fontSize: 10 }}>{log.type}</span>
                      <span style={{ color: t.textMuted, fontSize: 11 }}>{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "cloudinary" && (
          <div style={{ maxWidth: 640 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 4 }}>☁️ Cloudinary Media Engine</h3>
            <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 24 }}>Configure Cloudinary for media upload and delivery</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "cloudName", label: "Cloud Name", placeholder: "your-cloud-name" },
                { key: "apiKey", label: "API Key", placeholder: "123456789012345" },
                { key: "apiSecret", label: "API Secret", placeholder: "abc123...", secret: true },
                { key: "uploadPreset", label: "Upload Preset", placeholder: "whatsapp_uploads" },
              ].map(field => (
                <div key={field.key} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                  <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
                    {field.label}
                  </label>
                  <input
                    className="input"
                    type={field.secret ? "password" : "text"}
                    placeholder={field.placeholder}
                    style={{ width: "100%", padding: "10px 14px", background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 13, fontFamily: "Outfit" }}
                  />
                </div>
              ))}

              {/* Media Stats */}
              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>📊 Media Storage Stats</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Total Storage", val: "2.4 GB", icon: "💾" },
                    { label: "Files Uploaded", val: "1,247", icon: "📁" },
                    { label: "Images", val: "892", icon: "🖼️" },
                    { label: "Documents", val: "355", icon: "📄" },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: t.cardHover, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{stat.val}</div>
                      <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => toast.success("Cloudinary settings saved! ☁️")}
                style={{ padding: "14px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 12, color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit" }}>
                💾 Save Cloudinary Config
              </button>
            </div>
          </div>
        )}

        {activeSection === "database" && (
          <div style={{ maxWidth: 640 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 4 }}>🗄️ Database Configuration</h3>
            <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 24 }}>Prisma ORM + PostgreSQL/Supabase setup</p>

            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#25d366", boxShadow: "0 0 10px rgba(37,211,102,0.8)" }} />
                <span style={{ fontWeight: 700, color: t.text }}>Database Connected</span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: t.textMuted }}>PostgreSQL v15.2</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { table: "contacts", rows: "247", icon: "👥" },
                  { table: "messages", rows: "14,892", icon: "💬" },
                  { table: "templates", rows: "12", icon: "📋" },
                ].map(db => (
                  <div key={db.table} style={{ background: t.cardHover, borderRadius: 10, padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{db.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{db.rows}</div>
                    <div style={{ fontSize: 10, color: t.textMuted }}>{db.table}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schema Preview */}
            <div style={{ background: "#0d1117", border: `1px solid ${t.border}`, borderRadius: 14, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#e6db74", lineHeight: 1.7, overflowX: "auto" }}>
              <div style={{ color: "#66d9ef" }}>{"// prisma/schema.prisma"}</div>
              <div style={{ color: "#a6e22e" }}>{"model Contact {"}</div>
              <div style={{ paddingLeft: 16 }}>{"  id          String    @id @default(cuid())"}</div>
              <div style={{ paddingLeft: 16 }}>{"  phone       String    @unique"}</div>
              <div style={{ paddingLeft: 16 }}>{"  name        String?"}</div>
              <div style={{ paddingLeft: 16 }}>{"  messages    Message[]"}</div>
              <div style={{ paddingLeft: 16 }}>{"  lastSeen    DateTime?"}</div>
              <div style={{ paddingLeft: 16 }}>{"  createdAt   DateTime  @default(now())"}</div>
              <div>{"}"}</div>
              <div style={{ marginTop: 8, color: "#a6e22e" }}>{"model Message {"}</div>
              <div style={{ paddingLeft: 16 }}>{"  id          String     @id @default(cuid())"}</div>
              <div style={{ paddingLeft: 16 }}>{"  waId        String?    @unique"}</div>
              <div style={{ paddingLeft: 16 }}>{"  content     String"}</div>
              <div style={{ paddingLeft: 16 }}>{"  type        MessageType"}</div>
              <div style={{ paddingLeft: 16 }}>{"  status      MsgStatus  @default(SENT)"}</div>
              <div style={{ paddingLeft: 16 }}>{"  mediaUrl    String?"}</div>
              <div style={{ paddingLeft: 16 }}>{"  contact     Contact    @relation(...)"}</div>
              <div style={{ paddingLeft: 16 }}>{"  isAI        Boolean    @default(false)"}</div>
              <div style={{ paddingLeft: 16 }}>{"  createdAt   DateTime   @default(now())"}</div>
              <div>{"}"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
