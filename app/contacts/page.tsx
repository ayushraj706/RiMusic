"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Users, Search, Filter, Plus, 
  UploadCloud, Chrome, FileSpreadsheet, 
  MoreVertical, CheckSquare, Phone, Loader2
} from "lucide-react";
// 👇 YAHAN PATH FIX HAI (@/lib/firebase)
import { auth, database } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, update, push } from "firebase/database";

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "google" | "csv">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  
  // Real Data States
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Load Google Sign-In Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // 2. Fetch Contacts from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const contactsRef = ref(database, `users/${currentUser.uid}/contacts`);
        onValue(contactsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // Convert Firebase object to Array
            const contactsArray = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            }));
            // Sort by newest first
            setContacts(contactsArray.reverse());
          } else {
            setContacts([]);
          }
          setIsLoading(false);
        });
      } else {
        setContacts([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ─── SAVE TO FIREBASE FUNCTION ───
  const saveContactsToDB = async (newContacts: any[]) => {
    if (!user) return alert("Please login first!");
    setIsImporting(true);
    try {
      const updates: any = {};
      newContacts.forEach(contact => {
        const newKey = push(ref(database, `users/${user.uid}/contacts`)).key;
        updates[`users/${user.uid}/contacts/${newKey}`] = contact;
      });
      await update(ref(database), updates);
      alert(`${newContacts.length} contacts imported successfully!`);
      setIsImportModalOpen(false);
    } catch (error) {
      console.error("Error saving contacts:", error);
      alert("Failed to save contacts.");
    } finally {
      setIsImporting(false);
    }
  };

  // ─── GOOGLE CONTACTS IMPORT ───
  const handleGoogleImport = () => {
    // 👇 YAHAN TYPESCRIPT ERROR FIX HAI
    const win = window as any;

    if (!win.google) return alert("Google script loading, please wait...");
    
    const client = win.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      scope: "https://www.googleapis.com/auth/contacts.readonly",
      callback: async (response: any) => {
        if (response.error) {
          console.error("Google Auth Error:", response);
          alert("Google login failed.");
          return;
        }
        
        setIsImporting(true);
        try {
          // Fetch contacts from Google People API
          const res = await fetch("https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers&pageSize=1000", {
            headers: { Authorization: `Bearer ${response.access_token}` }
          });
          const data = await res.json();
          
          if (!data.connections) {
            setIsImporting(false);
            return alert("No contacts found in your Google account.");
          }

          const formattedContacts = data.connections.map((c: any) => {
            const name = c.names?.[0]?.displayName || "Unknown";
            const phone = c.phoneNumbers?.[0]?.value || "";
            if (phone) {
              return { name, phone, source: "google", addedOn: new Date().toLocaleDateString("en-GB") };
            }
            return null;
          }).filter(Boolean); // Remove nulls (contacts without phone numbers)

          if (formattedContacts.length > 0) {
            await saveContactsToDB(formattedContacts);
          } else {
            alert("No valid phone numbers found.");
            setIsImporting(false);
          }
        } catch (error) {
          console.error("Fetch API Error:", error);
          alert("Error fetching Google contacts.");
          setIsImporting(false);
        }
      },
    });
    client.requestAccessToken();
  };

  // ─── CSV IMPORT ───
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const formattedContacts = [];

      // Loop through CSV lines (Assuming format: Name, Phone)
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",");
        if (row.length >= 2) {
          const name = row[0].trim();
          const phone = row[1].trim();
          if (phone) {
            formattedContacts.push({
              name: name || "Unknown",
              phone: phone,
              source: "csv",
              addedOn: new Date().toLocaleDateString("en-GB")
            });
          }
        }
      }

      if (formattedContacts.length > 0) {
        await saveContactsToDB(formattedContacts);
      } else {
        alert("No valid data found in CSV. Make sure format is: Name, Phone");
        setIsImporting(false);
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  // ─── FILTERING LOGIC ───
  const filteredContacts = contacts.filter((contact) => {
    const matchesTab = activeTab === "all" || contact.source === activeTab;
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          contact.phone.includes(searchQuery);
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
    <div className="flex flex-col h-full min-h-screen bg-[#F5F7F9] text-gray-800 font-sans relative">
      
      {/* ─── Header Section ─── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00A884]" />
            Audience & Contacts
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your Google and CSV contacts in one place.</p>
        </div>
        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="bg-[#00A884] hover:bg-[#008f6f] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Import Contacts
        </button>
      </div>

      {/* ─── Main Content Area ─── */}
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

          {/* Table Controls */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] bg-white"/>
            </div>
            {selectedContacts.length > 0 ? (
              <span className="text-sm font-bold text-[#00A884] bg-[#E8F8F5] px-3 py-1.5 rounded-lg">{selectedContacts.length} Selected</span>
            ) : (
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"><Filter className="w-4 h-4" /> Filter</button>
            )}
          </div>

          {/* Actual Table */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-[#00A884] transition">
                      <CheckSquare className={`w-5 h-5 ${selectedContacts.length === filteredContacts.length && filteredContacts.length > 0 ? "text-[#00A884]" : ""}`} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Added On</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00A884]" />
                      <p className="text-sm font-medium">Loading contacts from database...</p>
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      <p className="text-sm font-medium">No contacts found. Import some to get started!</p>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <button onClick={() => toggleSelect(contact.id)} className="text-gray-300 hover:text-[#00A884] transition">
                          <CheckSquare className={`w-5 h-5 ${selectedContacts.includes(contact.id) ? "text-[#00A884]" : ""}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm uppercase">
                            {contact.name.charAt(0)}
                          </div>
                          <p className="text-sm font-bold text-gray-900">{contact.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {contact.phone}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.source === "google" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold"><Chrome className="w-3.5 h-3.5" /> Google</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold"><FileSpreadsheet className="w-3.5 h-3.5" /> CSV List</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{contact.addedOn}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 text-gray-400 hover:text-[#00A884] hover:bg-green-50 rounded-full transition"><MoreVertical className="w-5 h-5" /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
            
            <div className="p-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Import Contacts</h2>
              <p className="text-sm text-gray-500 mb-6">Choose how you want to add contacts to BaseKey. Data is saved securely in your database.</p>
              
              <div className="space-y-3">
                {/* Google Sync Button */}
                <button 
                  onClick={handleGoogleImport}
                  disabled={isImporting}
                  className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">Sync Google Contacts</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Fetch numbers from your Google Account</p>
                  </div>
                </button>

                {/* CSV Upload Button */}
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef} 
                  onChange={handleCSVUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-[#00A884] hover:bg-[#E8F8F5] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 bg-[#E8F8F5] text-[#00A884] rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">Upload CSV</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Format: Name in column 1, Phone in column 2</p>
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
  );
}
