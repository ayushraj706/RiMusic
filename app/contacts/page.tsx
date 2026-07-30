"use client";

import React, { useState } from "react";
import { 
  Users, Search, Filter, Plus, 
  UploadCloud, Chrome, FileSpreadsheet, 
  MoreVertical, CheckSquare, Phone
} from "lucide-react";

// ─── Dummy Data ─────────────────────────────────────────────
const DUMMY_CONTACTS = [
  { id: "c1", name: "Raju Srivastava", phone: "+91 98765 43210", source: "google", addedOn: "30 Jul 2026" },
  { id: "c2", name: "Amit Sharma", phone: "+91 87654 32109", source: "csv", addedOn: "29 Jul 2026" },
  { id: "c3", name: "Priya Singh", phone: "+91 76543 21098", source: "google", addedOn: "28 Jul 2026" },
  { id: "c4", name: "Neha Gupta", phone: "+91 65432 10987", source: "csv", addedOn: "25 Jul 2026" },
  { id: "c5", name: "Vikram Verma", phone: "+91 54321 09876", source: "google", addedOn: "20 Jul 2026" },
];

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "google" | "csv">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // Filter contacts based on Tab & Search
  const filteredContacts = DUMMY_CONTACTS.filter((contact) => {
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
          
          {/* ─── Tabs (All | Google | CSV) ─── */}
          <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100 bg-gray-50/50">
            <button 
              onClick={() => setActiveTab("all")}
              className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors ${activeTab === "all" ? "border-[#00A884] text-[#00A884]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              All Contacts
            </button>
            <button 
              onClick={() => setActiveTab("google")}
              className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "google" ? "border-[#00A884] text-[#00A884]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <Chrome className="w-4 h-4" /> Google
            </button>
            <button 
              onClick={() => setActiveTab("csv")}
              className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "csv" ? "border-[#00A884] text-[#00A884]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <FileSpreadsheet className="w-4 h-4" /> CSV / Excel
            </button>
          </div>

          {/* Table Controls (Search & Filter) */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name or phone..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] bg-white"
              />
            </div>
            {selectedContacts.length > 0 ? (
              <span className="text-sm font-bold text-[#00A884] bg-[#E8F8F5] px-3 py-1.5 rounded-lg">
                {selectedContacts.length} Selected
              </span>
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
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      <p className="text-sm font-medium">No contacts found.</p>
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
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                            <Chrome className="w-3.5 h-3.5" /> Google
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold">
                            <FileSpreadsheet className="w-3.5 h-3.5" /> CSV List
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {contact.addedOn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 text-gray-400 hover:text-[#00A884] hover:bg-green-50 rounded-full transition">
                          <MoreVertical className="w-5 h-5" />
                        </button>
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
              <p className="text-sm text-gray-500 mb-6">Choose how you want to add contacts to BaseKey. Don't worry, we keep data separate.</p>
              
              <div className="space-y-3">
                {/* Google Sync Button */}
                <button className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Chrome className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">Sync Google Contacts</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Auto-updates from your phonebook</p>
                  </div>
                </button>

                {/* CSV Upload Button */}
                <button className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:border-[#00A884] hover:bg-[#E8F8F5] transition-all group">
                  <div className="w-10 h-10 bg-[#E8F8F5] text-[#00A884] rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">Upload CSV / Excel</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Import bulk contacts from a file</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button 
                onClick={() => setIsImportModalOpen(false)}
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
