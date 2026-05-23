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

const levelLabels = {
  year: "纪年",
  month: "月度",
  day: "日迹",
};

export function DrillControls({ drill, onDrillUp }: DrillControlsProps) {
  const canGoUp = drill.level !== "year";

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: 0.45, ease: "easeOut" }}
      className="fixed bottom-6 left-1/2 z-40 w-[calc(100vw-32px)] max-w-[720px] -translate-x-1/2"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#060814]/72 px-3 py-3 shadow-[0_22px_80px_rgba(0,0,0,0.46)] backdrop-blur-2xl md:px-4">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cosmos-gold/45 to-transparent" />
        <div className="flex items-center justify-between gap-3">
          <AnimatePresence initial={false}>
            {canGoUp ? (
              <motion.button
                key="back"
                initial={{ opacity: 0, x: -12, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "auto" }}
                exit={{ opacity: 0, x: -12, width: 0 }}
                onClick={onDrillUp}
                className="flex shrink-0 items-center gap-2 overflow-hidden rounded-full border border-cosmos-gold/20 bg-cosmos-gold/10 px-3 py-2 text-xs text-cosmos-gold transition-colors hover:bg-cosmos-gold/15"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                <span className="whitespace-nowrap tracking-wider">返回上级</span>
              </motion.button>
            ) : (
              <motion.div
                key="root"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cosmos-text-dim sm:block"
              >
                Root Atlas
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden text-center">
            <span className={`truncate rounded-full px-2.5 py-1 text-xs tracking-wider ${drill.level === "year" ? "bg-cosmos-gold/12 text-cosmos-gold" : "text-cosmos-text-dim"}`}>
              全部年份
            </span>
            {drill.year !== null && (
              <>
                <span className="text-cosmos-text-dim/35">/</span>
                <span className={`truncate rounded-full px-2.5 py-1 text-xs tracking-wider ${drill.level === "month" ? "bg-cosmos-gold/12 text-cosmos-gold" : "text-cosmos-text-dim"}`}>
                  {drill.year}年
                </span>
              </>
            )}
            {drill.month !== null && (
              <>
                <span className="text-cosmos-text-dim/35">/</span>
                <span className="truncate rounded-full bg-cosmos-gold/12 px-2.5 py-1 text-xs tracking-wider text-cosmos-gold">
                  {monthNames[drill.month]}
                </span>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.035] p-1">
            {(["year", "month", "day"] as const).map((level) => (
              <div
                key={level}
                title={levelLabels[level]}
                className={`h-7 rounded-full px-2.5 py-1 font-mono text-[10px] transition-all duration-300 ${
                  drill.level === level
                    ? "bg-cosmos-gold/14 text-cosmos-gold shadow-[0_0_18px_rgba(212,168,83,0.12)]"
                    : "text-cosmos-text-dim/55"
                }`}
              >
                {levelLabels[level]}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
