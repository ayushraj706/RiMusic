"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import * as Popover from "@radix-ui/react-popover";
import { Palette, Check, X, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: any[]) => twMerge(clsx(inputs));

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatTheme {
  id: string;
  name: string;
  bgImage?: string;
  bgColor?: string;
  pattern?: string;
  category: "classic" | "nature" | "dark" | "solid" | "abstract";
  accent?: string;
}

// ─── Theme Data ───────────────────────────────────────────────────────────────

const themes: ChatTheme[] = [
  // Classic
  {
    id: "wa-default",
    name: "WhatsApp",
    bgImage: "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
    bgColor: "#E5DDD5",
    category: "classic",
    accent: "#00A884",
  },
  {
    id: "telegram",
    name: "Telegram",
    bgImage: "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=400&q=80",
    bgColor: "#17212B",
    category: "classic",
    accent: "#5CAFFA",
  },
  {
    id: "imessage",
    name: "iMessage",
    bgColor: "#FFFFFF",
    pattern: "radial-gradient(circle at 20% 50%, #f0f0f0 0%, #ffffff 100%)",
    category: "classic",
    accent: "#007AFF",
  },

  // Bright Nature
  {
    id: "sakura",
    name: "Sakura",
    bgImage: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&q=80",
    category: "nature",
    accent: "#FF6B9D",
  },
  {
    id: "forest",
    name: "Forest",
    bgImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80",
    category: "nature",
    accent: "#4CAF50",
  },
  {
    id: "ocean",
    name: "Ocean",
    bgImage: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=80",
    category: "nature",
    accent: "#0EA5E9",
  },
  {
    id: "sunset",
    name: "Sunset",
    bgImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
    category: "nature",
    accent: "#F97316",
  },
  {
    id: "aurora",
    name: "Aurora",
    bgImage: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80",
    category: "nature",
    accent: "#A78BFA",
  },

  // Dark Vibes
  {
    id: "midnight",
    name: "Midnight",
    bgColor: "#0D0D0D",
    pattern: "radial-gradient(ellipse at top, #1a1a2e 0%, #0D0D0D 70%)",
    category: "dark",
    accent: "#7C3AED",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    bgImage: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&q=80",
    category: "dark",
    accent: "#818CF8",
  },
  {
    id: "neon-city",
    name: "Neon City",
    bgImage: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=400&q=80",
    category: "dark",
    accent: "#EC4899",
  },
  {
    id: "abyss",
    name: "Abyss",
    bgColor: "#050810",
    pattern: "radial-gradient(circle at 30% 107%, #1e1b4b 0%, #050810 50%)",
    category: "dark",
    accent: "#6366F1",
  },

  // Solid Colors
  {
    id: "mint",
    name: "Mint",
    bgColor: "#D1FAE5",
    category: "solid",
    accent: "#059669",
  },
  {
    id: "lavender",
    name: "Lavender",
    bgColor: "#EDE9FE",
    category: "solid",
    accent: "#7C3AED",
  },
  {
    id: "peach",
    name: "Peach",
    bgColor: "#FEE2E2",
    category: "solid",
    accent: "#EF4444",
  },
  {
    id: "sky",
    name: "Sky",
    bgColor: "#E0F2FE",
    category: "solid",
    accent: "#0284C7",
  },
  {
    id: "lemon",
    name: "Lemon",
    bgColor: "#FEF9C3",
    category: "solid",
    accent: "#CA8A04",
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    bgColor: "#FCE7F3",
    category: "solid",
    accent: "#DB2777",
  },

  // Abstract Patterns
  {
    id: "grid",
    name: "Grid",
    bgColor: "#F8FAFC",
    pattern: "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
    category: "abstract",
    accent: "#475569",
  },
  {
    id: "dots",
    name: "Dots",
    bgColor: "#FAFAFA",
    pattern: "radial-gradient(circle, #CBD5E1 1.5px, transparent 1.5px)",
    category: "abstract",
    accent: "#64748B",
  },
  {
    id: "waves",
    name: "Waves",
    bgColor: "#EFF6FF",
    pattern: "repeating-linear-gradient(-45deg, #BFDBFE 0, #BFDBFE 1px, transparent 0, transparent 50%)",
    category: "abstract",
    accent: "#3B82F6",
  },
  {
    id: "mesh",
    name: "Mesh",
    bgColor: "#F0FDF4",
    pattern: "radial-gradient(at 40% 20%, #BBF7D0 0px, transparent 50%), radial-gradient(at 80% 0%, #A7F3D0 0px, transparent 50%), radial-gradient(at 0% 50%, #D1FAE5 0px, transparent 50%)",
    category: "abstract",
    accent: "#10B981",
  },
];

const categories = [
  { id: "classic", label: "Classic", emoji: "✨" },
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "dark", label: "Dark Vibes", emoji: "🌙" },
  { id: "solid", label: "Solid Colors", emoji: "🎨" },
  { id: "abstract", label: "Abstract", emoji: "〰️" },
] as const;

// ─── 3D Tilt Card ─────────────────────────────────────────────────────────────

function TiltCard({
  theme,
  isSelected,
  onSelect,
  index,
}: {
  theme: ChatTheme;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-40, 40], [8, -8]);
  const rotateY = useTransform(x, [-40, 40], [-8, 8]);
  const springRotateX = useSpring(rotateX, { stiffness: 400, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 400, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const bgStyle: React.CSSProperties = {
    backgroundColor: theme.bgColor || "#E5DDD5",
    backgroundImage: theme.pattern
      ? theme.bgImage
        ? `${theme.pattern}, url(${theme.bgImage})`
        : theme.pattern
      : theme.bgImage
      ? `url(${theme.bgImage})`
      : "none",
    backgroundSize: theme.pattern ? "20px 20px, cover" : "cover",
    backgroundPosition: "center",
  };

  return (
    <motion.button
      ref={ref}
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.04,
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        perspective: 800,
      }}
      whileHover={{ scale: 1.06, zIndex: 10 }}
      whileTap={{ scale: 0.96 }}
      className="relative flex flex-col items-center gap-2 focus:outline-none group"
    >
      {/* Card — 9:16 aspect ratio */}
      <div
        className={cn(
          "relative w-[72px] rounded-xl overflow-hidden shadow-md transition-shadow duration-300",
          "group-hover:shadow-xl",
          isSelected && "ring-[3px] shadow-lg"
        )}
        style={{
          aspectRatio: "9/16",
          ...(isSelected ? { ringColor: theme.accent || "#00A884" } : {}),
          boxShadow: isSelected
            ? `0 0 0 3px ${theme.accent || "#00A884"}, 0 8px 24px ${theme.accent || "#00A884"}33`
            : undefined,
        }}
      >
        {/* Background */}
        <div className="absolute inset-0" style={bgStyle} />

        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20" />

        {/* Fake chat bubbles (decorative) */}
        <div className="absolute inset-0 flex flex-col justify-end p-1.5 gap-1">
          <div className="self-end bg-white/90 rounded-lg rounded-br-sm px-1.5 py-0.5 w-10 h-1.5" />
          <div className="self-start rounded-lg rounded-bl-sm px-1.5 py-0.5 w-8 h-1.5"
            style={{ backgroundColor: `${theme.accent || "#00A884"}CC` }} />
          <div className="self-end bg-white/90 rounded-lg rounded-br-sm px-1.5 py-0.5 w-12 h-1.5" />
        </div>

        {/* Selected checkmark */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 20 }}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: theme.accent || "#00A884" }}
            >
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shimmer on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ transform: "translateX(-100%) skewX(-15deg)" }}
          whileHover={{ translateX: ["−100%", "200%"], transition: { duration: 0.6 } }}
        />
      </div>

      <span className="text-[10px] font-semibold text-gray-500 group-hover:text-gray-800 transition-colors duration-200 text-center leading-tight max-w-[72px] truncate">
        {theme.name}
      </span>
    </motion.button>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  themes,
  selectedId,
  onSelect,
  startIndex,
}: {
  category: (typeof categories)[number];
  themes: ChatTheme[];
  selectedId: string;
  onSelect: (theme: ChatTheme) => void;
  startIndex: number;
}) {
  return (
    <div className="mb-5">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-2 mb-3 -mx-1 border-b border-gray-100/80">
        <div className="flex items-center gap-2">
          <span className="text-base">{category.emoji}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.12em]">
            {category.label}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-2">
        {themes.map((theme, i) => (
          <TiltCard
            key={theme.id}
            theme={theme}
            isSelected={selectedId === theme.id}
            onSelect={() => onSelect(theme)}
            index={startIndex + i}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ThemeSelectorProps {
  currentTheme: ChatTheme;
  onChange: (theme: ChatTheme) => void;
}

export default function ThemeSelector({ currentTheme, onChange }: ThemeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(currentTheme.id);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chat-theme");
      if (saved) {
        const parsed = JSON.parse(saved);
        const found = themes.find((t) => t.id === parsed.id);
        if (found) {
          setSelectedId(found.id);
          onChange(found);
        }
      }
    } catch {}
  }, []);

  const handleSelect = (theme: ChatTheme) => {
    setSelectedId(theme.id);
    onChange(theme);
    try {
      localStorage.setItem("chat-theme", JSON.stringify(theme));
    } catch {}
  };

  // Group themes by category, preserve order
  let cardIndex = 0;
  const grouped = categories.map((cat) => {
    const catThemes = themes.filter((t) => t.category === cat.id);
    const start = cardIndex;
    cardIndex += catThemes.length;
    return { category: cat, themes: catThemes, startIndex: start };
  });

  const currentThemeData = themes.find((t) => t.id === selectedId) || themes[0];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {/* ── Trigger Button ── */}
      <Popover.Trigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className={cn(
            "relative w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200",
            open
              ? "bg-[#00A884]/15 text-[#00A884]"
              : "text-[#54656F] hover:bg-gray-200"
          )}
          title="Chat Wallpaper"
        >
          <Palette className="w-5 h-5" />
          {/* Active dot */}
          <motion.span
            className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
            style={{ backgroundColor: currentThemeData.accent || "#00A884" }}
            animate={{ scale: open ? 1.3 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          />
        </motion.button>
      </Popover.Trigger>

      {/* ── Panel ── */}
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          avoidCollisions
          className="z-[100] outline-none"
          asChild
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={cn(
              "w-[340px] max-h-[520px] rounded-3xl overflow-hidden",
              "bg-white/80 backdrop-blur-3xl",
              "shadow-[0_32px_80px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.06)]",
              "border border-white/60",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/80 shrink-0">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-4 h-4 text-[#00A884]" />
                </motion.div>
                <h3 className="text-[15px] font-bold text-gray-800 tracking-tight">Wallpaper</h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Current preview pill */}
                <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2.5 py-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                    style={{
                      backgroundColor: currentThemeData.bgColor || "#E5DDD5",
                      backgroundImage: currentThemeData.bgImage
                        ? `url(${currentThemeData.bgImage})`
                        : "none",
                      backgroundSize: "cover",
                    }}
                  />
                  <span className="text-[11px] font-semibold text-gray-500">
                    {currentThemeData.name}
                  </span>
                </div>

                <Popover.Close asChild>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </motion.button>
                </Popover.Close>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              className={cn(
                "flex-1 overflow-y-auto py-2",
                // Custom scrollbar — invisible until hover
                "scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent",
                "hover:scrollbar-thumb-gray-300"
              )}
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "transparent transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.scrollbarColor = "#E2E8F0 transparent";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.scrollbarColor = "transparent transparent";
              }}
            >
              {grouped.map(({ category, themes: catThemes, startIndex }) =>
                catThemes.length > 0 ? (
                  <CategorySection
                    key={category.id}
                    category={category}
                    themes={catThemes}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    startIndex={startIndex}
                  />
                ) : null
              )}

              {/* Bottom padding */}
              <div className="h-4" />
            </div>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
