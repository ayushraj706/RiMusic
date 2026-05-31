"use client";

import React, { useState, useEffect } from "react";
import { Palette, X } from "lucide-react";

export interface ChatTheme {
  id: string;
  name: string;
  bgImage?: string;
  bgColor?: string;
  pattern?: string;
}

const themes: ChatTheme[] = [
  {
    id: "whatsapp-default",
    name: "WhatsApp Default",
    bgImage: "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  },
  {
    id: "whatsapp-dark",
    name: "WhatsApp Dark",
    bgImage: "https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-light-pattern-texture.jpg",
  },
  {
    id: "solid-light",
    name: "Clean Light",
    bgColor: "#E5DDD5",
  },
  {
    id: "solid-warm",
    name: "Warm Beige",
    bgColor: "#F5E6D3",
  },
  {
    id: "solid-cool",
    name: "Cool Gray",
    bgColor: "#E8ECF1",
  },
  {
    id: "pattern-dots",
    name: "Dots Pattern",
    bgColor: "#F0F2F5",
    pattern: "radial-gradient(circle, #D1D7DB 1px, transparent 1px)",
  },
  {
    id: "pattern-lines",
    name: "Lines Pattern",
    bgColor: "#F8F9FA",
    pattern: "repeating-linear-gradient(45deg, #E9ECEF 0, #E9ECEF 1px, transparent 0, transparent 50%)",
  },
  {
    id: "nature-green",
    name: "Nature Green",
    bgImage: "https://www.transparenttextures.com/patterns/cubes.png",
    bgColor: "#DCF8C6",
  },
  {
    id: "midnight",
    name: "Midnight",
    bgColor: "#1a1a2e",
    pattern: "radial-gradient(circle at 50% 50%, #16213e 0%, #1a1a2e 100%)",
  },
];

interface ThemeSelectorProps {
  currentTheme: ChatTheme;
  onChange: (theme: ChatTheme) => void;
}

export default function ThemeSelector({ currentTheme, onChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Save theme to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chat-theme");
    if (saved) {
      const parsed = JSON.parse(saved);
      const found = themes.find((t) => t.id === parsed.id);
      if (found) onChange(found);
    }
  }, []);

  const handleSelect = (theme: ChatTheme) => {
    onChange(theme);
    localStorage.setItem("chat-theme", JSON.stringify(theme));
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-200 transition text-[#54656F]"
        title="Chat Theme"
      >
        <Palette className="w-5 h-5" />
      </button>

      {/* Theme Panel */}
      {isOpen && (
        <div className="absolute top-14 right-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Chat Theme</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="p-3 grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 ${
                  currentTheme.id === theme.id
                    ? "ring-2 ring-[#00A884] bg-[#00A884]/5"
                    : "hover:bg-gray-50"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  style={{
                    backgroundColor: theme.bgColor || "#E5DDD5",
                    backgroundImage: theme.pattern
                      ? `${theme.pattern}, ${theme.bgImage ? `url(${theme.bgImage})` : "none"}`
                      : theme.bgImage
                      ? `url(${theme.bgImage})`
                      : "none",
                    backgroundSize: theme.pattern ? "20px 20px, cover" : "cover",
                  }}
                />
                <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
