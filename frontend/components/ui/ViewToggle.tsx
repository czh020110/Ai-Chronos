"use client";

import { motion } from "framer-motion";
import { ViewMode } from "@/lib/types";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

const modes: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    key: "timeline",
    label: "星图",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 12h16" />
        <path d="M8 8v8M16 7v10" />
        <circle cx="8" cy="8" r="2" />
        <circle cx="16" cy="17" r="2" />
      </svg>
    ),
  },
  {
    key: "grid",
    label: "矩阵",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    key: "list",
    label: "档案",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
];

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="fixed bottom-32 right-5 z-40 md:right-7"
    >
      <div className="rounded-[24px] border border-white/[0.08] bg-[#060814]/72 p-1.5 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        {modes.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`group relative mb-1 flex h-11 w-11 items-center justify-center rounded-[18px] text-xs transition-all duration-300 last:mb-0 ${
              viewMode === key
                ? "bg-cosmos-gold/14 text-cosmos-gold shadow-[0_0_24px_rgba(212,168,83,0.12)]"
                : "text-cosmos-text-dim hover:bg-white/[0.05] hover:text-cosmos-text"
            }`}
            title={label}
            aria-label={`切换到${label}视图`}
          >
            {icon}
            <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/[0.08] bg-[#070914]/90 px-3 py-1.5 text-[10px] tracking-wider text-cosmos-text-dim opacity-0 shadow-xl backdrop-blur-xl transition-opacity group-hover:opacity-100 md:block">
              {label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
