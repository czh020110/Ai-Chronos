"use client";

import { motion } from "framer-motion";
import { ViewMode } from "@/lib/types";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

const modes: { key: ViewMode; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  {
    key: "timeline",
    label: "螺旋时间线",
    shortLabel: "时间线",
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
    label: "事件矩阵",
    shortLabel: "矩阵",
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
    label: "事件档案",
    shortLabel: "档案",
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
      className="fixed bottom-7 right-5 z-40 md:right-7"
    >
      <div className="theme-shell flex items-center gap-1 rounded-[24px] p-1.5 md:flex-col">
        {modes.map(({ key, label, shortLabel, icon }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`group relative flex h-11 items-center justify-center gap-2 rounded-[18px] px-3 text-xs transition-all duration-300 md:w-20 md:px-2 ${
              viewMode === key
                ? "bg-cosmos-gold/14 text-cosmos-gold shadow-[0_0_24px_rgba(212,168,83,0.12)]"
                : "text-cosmos-text-dim hover:bg-cosmos-surface/60 hover:text-cosmos-text"
            }`}
            title={label}
            aria-label={`切换到${label}视图`}
          >
            {icon}
            <span className="hidden whitespace-nowrap tracking-wider sm:inline md:text-[10px]">{shortLabel}</span>
            <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-cosmos-border/30 bg-cosmos-card/90 px-3 py-1.5 text-[10px] tracking-wider text-cosmos-text-dim opacity-0 shadow-xl backdrop-blur-xl transition-opacity group-hover:opacity-100 md:block">
              {label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
