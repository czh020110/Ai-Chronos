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
    label: "时间线",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 12h18M12 3v18" />
      </svg>
    ),
  },
  {
    key: "grid",
    label: "网格",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    key: "list",
    label: "列表",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
];

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="fixed right-6 bottom-60 z-40"
    >
      <div className="glass-card p-1 flex flex-col gap-0.5">
        {modes.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all duration-200 ${
              viewMode === key
                ? "text-cosmos-gold bg-cosmos-gold/10"
                : "text-cosmos-text-dim hover:text-cosmos-text"
            }`}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
