"use client";

import { motion } from "framer-motion";
import { ZoomLevel } from "@/lib/types";

interface ZoomControlsProps {
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
}

const levels: { key: ZoomLevel; label: string; scale: string }[] = [
  { key: "year", label: "年", scale: "1:50" },
  { key: "month", label: "月", scale: "1:10" },
  { key: "day", label: "日", scale: "1:1" },
];

export function ZoomControls({ zoomLevel, onZoomChange }: ZoomControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="fixed right-6 bottom-32 z-40 flex flex-col items-center gap-1"
    >
      <div className="glass-card p-1.5 flex flex-col gap-1">
        <button
          onClick={() => {
            const idx = levels.findIndex((l) => l.key === zoomLevel);
            if (idx > 0) onZoomChange(levels[idx - 1].key);
          }}
          disabled={zoomLevel === "day"}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-cosmos-text-dim hover:text-cosmos-text hover:bg-cosmos-surface transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        </button>

        <div className="w-8 flex flex-col items-center gap-0.5 py-0.5">
          {levels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onZoomChange(key)}
              className={`w-full py-1 text-[10px] rounded-md tracking-widest transition-all duration-300 ${
                zoomLevel === key
                  ? "text-cosmos-gold bg-cosmos-gold/10"
                  : "text-cosmos-text-dim hover:text-cosmos-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            const idx = levels.findIndex((l) => l.key === zoomLevel);
            if (idx < levels.length - 1) onZoomChange(levels[idx + 1].key);
          }}
          disabled={zoomLevel === "year"}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-cosmos-text-dim hover:text-cosmos-text hover:bg-cosmos-surface transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
          </svg>
        </button>
      </div>

      <span className="text-[9px] text-cosmos-text-dim tracking-widest mt-1">
        {levels.find((l) => l.key === zoomLevel)?.scale}
      </span>
    </motion.div>
  );
}
