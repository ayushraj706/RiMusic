"use client";

import React, { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Loader2, Mail, Lock, User, ShieldCheck, Activity, Key, Layout } from "lucide-react";
import Sidebar from "@/components/Sidebar";

// System ke saare pages jo access ke liye available hain
const AVAILABLE_PAGES = [
  { id: "/dashboard", name: "Main Dashboard" },
  { id: "/chat", name: "Live Chat" },
  { id: "/contacts", name: "Contacts CRM" },
  { id: "/campaigns", name: "Bulk Campaigns" },
  { id: "/chatbot-builder", name: "Flow Builder" },
  { id: "/template", name: "Templates" },
  { id: "/settings", name: "Settings" }
];

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Naya Agent/Admin Form Data
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "",
    role: "AGENT", 
    allowedPages: ["/chat", "/contacts"], // Default Access
    primaryPage: "/chat" // Default Login Page
  });

  // REAL DATA FETCHING - No Dummy Data
  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    } catch (error) {
      console.error("Error fetching team", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    // Live tracking ke liye har 10 second mein real-time data fetch karega
    const interval = setInterval(fetchTeam, 10000); 
    return () => clearInterval(interval);
  }, []);

  // Checkbox (Page Access) Handle Karne Ka Logic
  const handleCheckboxChange = (pageId: string) => {
    setFormData(prev => {
      const newAllowed = prev.allowedPages.includes(pageId)
        ? prev.allowedPages.filter(p => p !== pageId) // Remove
        : [...prev.allowedPages, pageId]; // Add
      
      // Agar user ne Primary Page wala checkbox hata diya, toh naya Primary Page set karo
      const newPrimary = newAllowed.includes(prev.primaryPage) ? prev.primaryPage : (newAllowed[0] || "");
      
      return { ...prev, allowedPages: newAllowed, primaryPage: newPrimary };
    });
  };

  // Naya User Database mein Save Karna
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.allowedPages.length === 0) return alert("Please select at least one page access!");
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        // Form Reset
        setFormData({ name: "", email: "", password: "", role: "AGENT", allowedPages: ["/chat", "/contacts"], primaryPage: "/chat" });
        setIsModalOpen(false);
        fetchTeam(); // List Refresh
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add member");
      }
    } catch (error) {
      alert("Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // User Delete Karna
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently remove ${name}?`)) {
      try {
        const res = await fetch("/api/team", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        if (res.ok) fetchTeam();
      } catch (error) {
        console.error("Delete error", error);
      }
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#F5F7F9] font-sans text-gray-900">
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#00A884]" /> Access & Team Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage administrators, support agents, and track their live activity.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00A884] hover:bg-[#009172] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition"
          >
            <UserPlus className="w-5 h-5" /> Create Access
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-6 max-w-6xl mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#00A884]" /></div>
            ) : team.length === 0 ? (
              <div className="p-10 text-center text-gray-500 border-dashed border-2 border-gray-200 m-6 rounded-xl font-medium">
                No team members found. Click "Create Access" to add an Administrator or Agent.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Role & Access Permissions</th>
                    <th className="px-6 py-4">Live Activity Tracking</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-[15px]">{member.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" /> {member.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-[#e8faf0] text-[#00A884] border border-[#b7e8cc]'}`}>
                          {member.role === 'ADMIN' ? 'Administrator' : 'Support Agent'}
                        </span>
                        <div className="text-[11px] text-gray-500 mt-2 flex gap-1.5 flex-wrap">
                          {/* Yahan real database ke allowed pages show honge */}
                          {member.allowedPages?.slice(0, 3).map((page: string) => (
                            <span key={page} className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {AVAILABLE_PAGES.find(p => p.id === page)?.name || page}
                            </span>
                          ))}
                          {member.allowedPages?.length > 3 && (
                            <span className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              +{member.allowedPages.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-xs font-bold flex items-center gap-1.5 w-max ${member.status === 'ONLINE' ? 'text-green-600' : member.status === 'BUSY' ? 'text-orange-500' : 'text-gray-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${member.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : member.status === 'BUSY' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                            {member.status || "OFFLINE"}
                          </span>
                          <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100 w-max">
                            <Activity className="w-3.5 h-3.5 text-gray-400" /> {member.currentActivity || "Idle / Offline"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(member.id, member.name)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition" title="Delete User">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* CREATE ACCESS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-[#00A884]" /> System Access Configuration
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6 overflow-y-auto space-y-6">
              
              {/* Row 1: Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Full Name</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus-within:border-[#00A884]">
                    <User className="w-4 h-4 text-gray-400 ml-1" />
                    <input type="text" required placeholder="e.g. Rahul Kumar" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-transparent flex-1 outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email Address (Login ID)</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus-within:border-[#00A884]">
                    <Mail className="w-4 h-4 text-gray-400 ml-1" />
                    <input type="email" required placeholder="name@company.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-transparent flex-1 outline-none text-sm" />
                  </div>
                </div>
              </div>

              {/* Row 2: Role & Password */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Assign User Role</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setFormData({
                        ...formData, 
                        role: newRole,
                        // Agar Admin select kiya, toh apne aap saare pages select ho jayenge
                        allowedPages: newRole === 'ADMIN' ? AVAILABLE_PAGES.map(p => p.id) : ["/chat", "/contacts"]
                      });
                    }}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus:border-[#00A884] outline-none text-sm font-bold text-gray-700"
                  >
                    <option value="AGENT">Support Agent (Custom Access)</option>
                    <option value="ADMIN">Administrator (Full Owner Rights)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Initial Password</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus-within:border-[#00A884]">
                    <Lock className="w-4 h-4 text-gray-400 ml-1" />
                    <input type="text" required placeholder="Set user password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="bg-transparent flex-1 outline-none text-sm" />
                  </div>
                </div>
              </div>

              {/* Row 3: Advanced Page Permissions (Checkboxes) */}
              <div className="border-t border-gray-100 pt-5">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Allowed Workspace Modules</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_PAGES.map((page) => (
                    <label key={page.id} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${formData.allowedPages.includes(page.id) ? 'bg-[#e8faf0] border-[#00A884] text-[#00A884] shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                      <input 
                        type="checkbox" 
                        className="accent-[#00A884] w-4 h-4 cursor-pointer" 
                        checked={formData.allowedPages.includes(page.id)}
                        onChange={() => handleCheckboxChange(page.id)}
                      />
                      <span className="text-[13px] font-bold">{page.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Row 4: Primary Routing Page */}
              <div className="border-t border-gray-100 pt-5 bg-blue-50/50 -mx-6 px-6 pb-2 rounded-b-2xl">
                <label className="text-xs font-bold text-blue-700 uppercase block mb-2 flex items-center gap-2 pt-4">
                  <Layout className="w-4 h-4" /> Primary Landing Page
                </label>
                <select 
                  value={formData.primaryPage} 
                  onChange={(e) => setFormData({...formData, primaryPage: e.target.value})}
                  className="w-full bg-white p-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-sm font-bold text-gray-800 shadow-sm"
                  disabled={formData.allowedPages.length === 0}
                >
                  {/* Dropdown mein sirf wahi options aayenge jo upar Checkbox mein tick hain */}
                  {formData.allowedPages.map(pageId => (
                    <option key={pageId} value={pageId}>
                      {AVAILABLE_PAGES.find(p => p.id === pageId)?.name || pageId}
                    </option>
                  ))}
                </select>
                <p className="text-[11.5px] text-gray-500 mt-2 font-medium">
                  After successful login, the user will be automatically redirected to this specific page.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] bg-[#00A884] hover:bg-[#009172] text-white py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-md">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save User & Grant Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
