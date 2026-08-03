"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar"; 
import { 
  Users, Search, Filter, Plus, 
  UploadCloud, Chrome, FileSpreadsheet, 
  MoreVertical, CheckSquare, Phone, Loader2, Mail, Trash2
} from "lucide-react";

// API se aane wale Contact ka type
interface ContactData {
  id: string;
  name: string | null;
  phoneNumber: string;
  email: string | null;
  source: string;
  createdAt: string;
}

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "google" | "csv" | "manual">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  
  // Real Data States (Prisma API via Fetch)
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── 1. Load Google Sign-In Script ───
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // ─── 2. Fetch Contacts from Prisma API ───
  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // ─── 3. SAVE TO DB (API Call) ───
  const saveContactsToDB = async (newContacts: any[]) => {
    setIsImporting(true);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: newContacts }),
      });
      
      if (res.ok) {
        alert(`${newContacts.length} contacts imported successfully!`);
        setIsImportModalOpen(false);
        fetchContacts(); // Refresh list
      } else {
        alert("Failed to import contacts.");
      }
    } catch (error) {
      console.error("Error saving contacts:", error);
      alert("Failed to save contacts.");
    } finally {
      setIsImporting(false);
    }
  };

  // ─── 4. GOOGLE CONTACTS IMPORT ───
  const handleGoogleImport = () => {
    const win = window as any;

    if (!win.google) return alert("Google script loading, please wait...");
    
    const client = win.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      scope: "https://www.googleapis.com/auth/contacts.readonly",
      callback: async (response: any) => {
        if (response.error) {
          alert("Google login failed.");
          return;
        }
        
        setIsImporting(true);
        try {
          // Name, Phone aur Email teeno fetch karenge
          const res = await fetch("https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses&pageSize=1000", {
            headers: { Authorization: `Bearer ${response.access_token}` }
          });
          const data = await res.json();
          
          if (!data.connections) {
            setIsImporting(false);
            return alert("No contacts found in your Google account.");
          }

          const formattedContacts = data.connections.map((c: any) => {
            const name = c.names?.[0]?.displayName || "Unknown";
            const phone = c.phoneNumbers?.[0]?.value?.replace(/\D/g, '') || "";
            const email = c.emailAddresses?.[0]?.value || null;
            
            if (phone) {
              return { name, phoneNumber: phone, email, source: "google" };
            }
            return null;
          }).filter(Boolean);

          if (formattedContacts.length > 0) {
            await saveContactsToDB(formattedContacts);
          } else {
            alert("No valid phone numbers found.");
            setIsImporting(false);
          }
        } catch (error) {
          alert("Error fetching Google contacts.");
          setIsImporting(false);
        }
      },
    });
    client.requestAccessToken();
  };

  // ─── 5. CSV IMPORT ───
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const formattedContacts = [];

      // Format expected: Name, Phone, Email (Email is optional)
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",");
        if (row.length >= 2) {
          const name = row[0].trim();
          const phone = row[1].trim().replace(/\D/g, ''); // Clean phone number
          const email = row[2] ? row[2].trim() : null;

          if (phone) {
            formattedContacts.push({
              name: name || "Unknown",
              phoneNumber: phone,
              email: email || null,
              source: "csv"
            });
          }
        }
      }

      if (formattedContacts.length > 0) {
        await saveContactsToDB(formattedContacts);
      } else {
        alert("No valid data found in CSV. Format: Name, Phone, Email");
        setIsImporting(false);
      }
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  // ─── 6. DELETE LOGIC ───
  const deleteContacts = async (ids: string[]) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} contact(s)?`)) return;
    
    try {
      const res = await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (res.ok) {
        setSelectedContacts([]);
        setActiveDropdown(null);
        fetchContacts(); // Refresh UI
      } else {
        alert("Failed to delete contacts");
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  // ─── 7. FILTERING & SELECTION ───
  const filteredContacts = contacts.filter((contact) => {
    const matchesTab = activeTab === "all" || contact.source === activeTab;
    const matchesSearch = 
      (contact.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
      contact.phoneNumber.includes(searchQuery) ||
      (contact.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedContacts(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) setSelectedContacts([]);
    else setSelectedContacts(filteredContacts.map(c => c.id));
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#F5F7F9] overflow-hidden pb-[70px] md:pb-0 font-sans text-gray-900 relative">
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#00A884]" />
              Audience & Contacts
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your contacts, sync via Google, or import CSV lists.</p>
          </div>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-[#00A884] hover:bg-[#008f6f] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Import Contacts
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            
            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100 bg-gray-50/50">
              <button onClick={() => setActiveTab("all")} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors ${activeTab === "all" ? "border-[#00A884] text-[#00A884]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                All Contacts
              </button>
              <button onClick={() => setActiveTab("google")} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "google" ? "border-[#00A884] text-[#00A884]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                <Chrome className="w-4 h-4" /> Google
              </button>
              <button onClick={() => setActiveTab("csv")} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "csv" ? "border-[#00A884] text-[#00A884]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                <FileSpreadsheet className="w-4 h-4" /> CSV / Excel
              </button>
            </div>

            {/* Table Controls (Search & Bulk Delete) */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search name, phone, or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] bg-gray-50/50"/>
              </div>
              
              {/* Dynamic Action Button based on Selection */}
              {selectedContacts.length > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#00A884] bg-[#E8F8F5] px-3 py-1.5 rounded-lg">
                    {selectedContacts.length} Selected
                  </span>
                  <button 
                    onClick={() => deleteContacts(selectedContacts)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Selected
                  </button>
                </div>
              ) : (
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <Filter className="w-4 h-4" /> Filter
                </button>
              )}
            </div>

            {/* Actual Table */}
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="px-6 py-4 w-10">
                      <button onClick={toggleSelectAll} className="text-gray-400 hover:text-[#00A884] transition">
                        <CheckSquare className={`w-5 h-5 ${selectedContacts.length === filteredContacts.length && filteredContacts.length > 0 ? "text-[#00A884]" : ""}`} />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone & Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date Added</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-[#00A884]" />
                        <p className="text-sm font-medium">Loading contacts from secure database...</p>
                      </td>
                    </tr>
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <Users className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-base font-bold text-gray-700 mb-1">No contacts found</p>
                        <p className="text-sm">Import via Google or CSV to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact.id} className={`transition-colors group ${selectedContacts.includes(contact.id) ? 'bg-[#E8F8F5]/30' : 'hover:bg-gray-50/80'}`}>
                        <td className="px-6 py-4">
                          <button onClick={() => toggleSelect(contact.id)} className="text-gray-300 hover:text-[#00A884] transition">
                            <CheckSquare className={`w-5 h-5 ${selectedContacts.includes(contact.id) ? "text-[#00A884]" : ""}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00A884] to-[#008f6f] flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm">
                              {(contact.name && contact.name !== "Unknown") ? contact.name.charAt(0) : <Users className="w-4 h-4"/>}
                            </div>
                            <p className="text-sm font-bold text-gray-900">{contact.name || "Unknown"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <p className="text-sm text-gray-700 font-medium flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-400" /> +{contact.phoneNumber}
                            </p>
                            {contact.email ? (
                              <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-gray-400" /> {contact.email}
                              </p>
                            ) : (
                              <p className="text-[11px] text-gray-400 italic">No email provided</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {contact.source === "google" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold uppercase tracking-wider"><Chrome className="w-3 h-3" /> Google</span>
                          ) : contact.source === "csv" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-100 text-[11px] font-bold uppercase tracking-wider"><FileSpreadsheet className="w-3 h-3" /> CSV</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-bold uppercase tracking-wider">Manual</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                          {new Date(contact.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === contact.id ? null : contact.id)}
                            className="p-2 text-gray-400 hover:text-[#00A884] hover:bg-green-50 rounded-full transition"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {/* Individual Delete Dropdown */}
                          {activeDropdown === contact.id && (
                            <div className="absolute right-8 top-10 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-50 min-w-[120px] animate-in fade-in zoom-in-95 duration-150">
                              <button 
                                onClick={() => deleteContacts([contact.id])}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── IMPORT CONTACTS MODAL ─── */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
              
              <div className="p-6 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Import Contacts</h2>
                <p className="text-sm text-gray-500 mb-6">Choose how you want to add contacts to BaseKey. Data is saved securely in your PostgreSQL Database.</p>
                
                <div className="space-y-3">
                  <button 
                    onClick={handleGoogleImport}
                    disabled={isImporting}
                    className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-gray-900 text-sm">Sync Google Contacts</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Fetch Name, Phone & Email automatically</p>
                    </div>
                  </button>

                  <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-[#00A884] hover:bg-[#E8F8F5]/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 bg-[#E8F8F5] text-[#00A884] rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-gray-900 text-sm">Upload CSV</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Format: Name, Phone, Email (Optional)</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
