"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ThemeMode } from "@/lib/types";

interface NavBarProps {
  onSearchOpen: () => void;
  onThemeToggle: () => void;
  theme: ThemeMode;
  stats: {
    span: string;
    eventCount: number;
    highImpact: number;
    categoryCount: number;
  };
}

const metrics = [
  { key: "span", label: "Range" },
  { key: "eventCount", label: "Events" },
  { key: "highImpact", label: "High Impact" },
  { key: "categoryCount", label: "Domains" },
] as const;

export function NavBar({ onSearchOpen, onThemeToggle, theme, stats }: NavBarProps) {
  return (
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="theme-shell fixed left-4 right-4 top-4 z-50 flex items-center justify-between rounded-[28px] px-4 py-3 md:left-6 md:right-6 md:px-5"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-cosmos-gold/20 bg-cosmos-gold/10 shadow-[0_0_34px_rgba(212,168,83,0.12)]">
          <motion.div
            className="absolute inset-1 rounded-full border border-cosmos-gold/35"
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[13px] rounded-full bg-gradient-to-br from-cosmos-gold to-cosmos-accent"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="min-w-0 shrink-0">
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-lg tracking-[-0.02em] text-cosmos-text md:text-xl">
              AI Chronos
            </h1>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.26em] text-cosmos-gold/80 sm:inline">
              智纪元
            </span>
          </div>
          <p className="hidden text-[10px] tracking-[0.28em] text-cosmos-text-dim md:block">
            INTELLIGENCE EVOLUTION ATLAS
          </p>
        </div>

        <div className="hidden items-center gap-2 border-l border-cosmos-border/35 pl-4 lg:flex">
          {metrics.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-2xl border border-cosmos-border/30 bg-cosmos-surface/65 px-3 py-1.5"
            >
              <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-cosmos-text-dim/75">
                {label}
              </span>
              <strong className="mt-0.5 block font-mono text-xs text-cosmos-text">
                {stats[key]}
              </strong>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onThemeToggle}
          aria-pressed={theme === "day"}
          aria-label={theme === "night" ? "切换到白天主题" : "切换到黑夜主题"}
          className="group flex items-center gap-2 rounded-full border border-cosmos-border/40 bg-cosmos-surface/70 px-3 py-2 text-cosmos-text-dim transition-all duration-300 hover:border-cosmos-gold/30 hover:bg-cosmos-gold/10 hover:text-cosmos-text"
        >
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-cosmos-border/40 bg-cosmos-card/70 shadow-[0_0_24px_rgba(212,168,83,0.12)]">
            <motion.span
              className="absolute inset-1 rounded-full bg-gradient-to-br from-cosmos-gold/20 via-cosmos-accent/35 to-transparent"
              animate={{ rotate: theme === "day" ? 360 : -360, scale: theme === "day" ? 1 : 0.92 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <AnimatePresence mode="wait" initial={false}>
              {theme === "day" ? (
                <motion.svg
                  key="sun"
                  initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="relative z-10 text-cosmos-gold"
                >
                  <circle cx="12" cy="12" r="4.5" />
                  <path d="M12 1.8v3.2M12 19v3.2M4.8 4.8l2.3 2.3M16.9 16.9l2.3 2.3M1.8 12h3.2M19 12h3.2M4.8 19.2l2.3-2.3M16.9 7.1l2.3-2.3" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="moon"
                  initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="relative z-10 text-cosmos-text"
                >
                  <path d="M21 12.2A8.8 8.8 0 1 1 11.8 3a6.5 6.5 0 0 0 9.2 9.2Z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </span>
          <span className="hidden flex-col text-left sm:flex">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-cosmos-text-dim/70">
              Theme
            </span>
            <span className="text-xs tracking-wider text-cosmos-text">
              {theme === "night" ? "Nightfall" : "Daylight"}
            </span>
          </span>
        </button>

        <button
          onClick={onSearchOpen}
          aria-label="打开搜索面板"
          className="group flex items-center gap-2 rounded-full border border-cosmos-border/40 bg-cosmos-surface/70 px-3 py-2 text-cosmos-text-dim transition-all duration-300 hover:border-cosmos-gold/25 hover:bg-cosmos-gold/10 hover:text-cosmos-text md:px-4"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-transform duration-300 group-hover:scale-110"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="hidden text-xs tracking-wider sm:inline">搜索事件</span>
          <kbd className="hidden rounded-full border border-cosmos-border/30 bg-cosmos-card/70 px-2 py-0.5 font-mono text-[10px] text-cosmos-text-dim sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>
    </motion.header>
  );
}
