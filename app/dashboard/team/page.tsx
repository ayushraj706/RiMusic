
"use client";

import React, { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Loader2, Mail, Lock, User } from "lucide-react";
import Sidebar from "@/components/Sidebar"; // Aapka existing sidebar

export default function TeamPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Fetch Karna
  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      console.error("Error fetching team", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // Naya Agent Add Karna
  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("Agent added successfully!");
        setFormData({ name: "", email: "", password: "" }); // Reset form
        setIsModalOpen(false); // Modal band
        fetchTeam(); // List refresh
      } else {
        alert(data.error || "Failed to add agent");
      }
    } catch (error) {
      alert("Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Agent Delete Karna
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the team?`)) {
      try {
        const res = await fetch("/api/team", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        
        if (res.ok) {
          setAgents(agents.filter(agent => agent.id !== id));
        } else {
          alert("Failed to delete agent");
        }
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

      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="bg-white border-b border-gray-200 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#00A884]" /> Team Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your agents, customer support staff, and their access.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00A884] hover:bg-[#009172] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition"
          >
            <UserPlus className="w-5 h-5" /> Add New Agent
          </button>
        </div>

        <div className="p-6 max-w-6xl mx-auto w-full">
          {/* Agents List Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#00A884]" /></div>
            ) : agents.length === 0 ? (
              <div className="p-10 text-center text-gray-500 border-dashed border-2 border-gray-200 m-6 rounded-xl">
                No agents found. Click "Add New Agent" to build your team.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                    <th className="px-6 py-4">Agent Name</th>
                    <th className="px-6 py-4">Email Details</th>
                    <th className="px-6 py-4">Live Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{agent.name}</div>
                        <div className="text-xs text-gray-500">Role: {agent.role}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{agent.email}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-max">
                          <span className="w-2 h-2 rounded-full bg-gray-400"></span> {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(agent.id, agent.name)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                        >
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

      {/* Add Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#00A884]" /> Register Agent
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleAddAgent} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Full Name</label>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-[#00A884]">
                  <User className="w-5 h-5 text-gray-400 ml-1" />
                  <input type="text" required placeholder="e.g. Rahul Kumar" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-transparent flex-1 outline-none text-sm" />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email Address</label>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-[#00A884]">
                  <Mail className="w-5 h-5 text-gray-400 ml-1" />
                  <input type="email" required placeholder="rahul@company.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-transparent flex-1 outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Temporary Password</label>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-[#00A884]">
                  <Lock className="w-5 h-5 text-gray-400 ml-1" />
                  <input type="text" required placeholder="Enter password for agent" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="bg-transparent flex-1 outline-none text-sm" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#00A884] hover:bg-[#009172] text-white py-2.5 rounded-xl font-bold transition flex justify-center items-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
