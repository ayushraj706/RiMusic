"use client";

import React, { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import TemplateBuilderUI from "@/components/template-builder/TemplateBuilderUI";
import { Loader2 } from "lucide-react";

export default function TemplatePage() {
  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F6] overflow-hidden pb-[70px] md:pb-0 font-sans text-gray-900">
      
      {/* Sidebar Navigation */}
      <div className="shrink-0 z-50">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* 
          TemplateBuilderUI ab khud hi List, Create Form, Firebase API fetch, 
          aur Android URL routing (?step=create) handle karta hai.
          
          Suspense zaroori hai kyunki humare UI component mein Next.js ka 
          useSearchParams() hook use ho raha hai.
        */}
        <Suspense 
          fallback={
            <div className="flex flex-col h-full w-full items-center justify-center text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-[#25D366] mb-3" />
              <p className="text-sm font-medium">Loading Template Engine...</p>
            </div>
          }
        >
          <TemplateBuilderUI />
        </Suspense>
        
      </div>
    </div>
  );
}
