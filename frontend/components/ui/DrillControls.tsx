"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DrillState } from "@/lib/types";

interface DrillControlsProps {
  drill: DrillState;
  onDrillUp: () => void;
}

const monthNames = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export function DrillControls({ drill, onDrillUp }: DrillControlsProps) {
  const canGoUp = drill.level !== "year";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="fixed left-1/2 -translate-x-1/2 bottom-10 z-40"
    >
      <div className="glass-card px-4 py-2.5 flex items-center gap-3">
        {/* Back button */}
        <AnimatePresence>
          {canGoUp && (
            <motion.button
              initial={{ width: 0, opacity: 0, marginRight: -8 }}
              animate={{ width: "auto", opacity: 1, marginRight: 0 }}
              exit={{ width: 0, opacity: 0, marginRight: -8 }}
              onClick={onDrillUp}
              className="flex items-center gap-1 text-xs text-cosmos-gold hover:text-cosmos-accent transition-colors whitespace-nowrap overflow-hidden"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span className="tracking-wider">返回上级</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs tracking-wider transition-colors duration-300 ${
              drill.level === "year" ? "text-cosmos-gold" : "text-cosmos-text-dim"
            }`}
          >
            全部年份
          </span>

          {drill.year !== null && (
            <>
              <span className="text-cosmos-text-dim/40 text-[10px]">/</span>
              <span
                className={`text-xs tracking-wider transition-colors duration-300 ${
                  drill.level === "month" ? "text-cosmos-gold" : "text-cosmos-text-dim"
                }`}
              >
                {drill.year}年
              </span>
            </>
          )}

          {drill.month !== null && (
            <>
              <span className="text-cosmos-text-dim/40 text-[10px]">/</span>
              <span className="text-xs tracking-wider text-cosmos-gold">
                {monthNames[drill.month]}
              </span>
            </>
          )}
        </div>

        {/* Level indicator */}
        <div className="flex items-center gap-0.5 ml-2">
          {(["year", "month", "day"] as const).map((level) => (
            <div
              key={level}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                drill.level === level
                  ? "bg-cosmos-gold shadow-[0_0_6px_rgba(212,168,83,0.6)]"
                  : "bg-cosmos-border"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
