"use client";

import { motion } from "framer-motion";

interface NavBarProps {
  onSearchOpen: () => void;
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

export function NavBar({ onSearchOpen, stats }: NavBarProps) {
  return (
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="fixed left-4 right-4 top-4 z-50 flex items-center justify-between rounded-[28px] border border-white/[0.08] bg-[#050711]/62 px-4 py-3 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:left-6 md:right-6 md:px-5"
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

        <div className="hidden items-center gap-2 border-l border-white/[0.08] pl-4 lg:flex">
          {metrics.map(({ key, label }) => (
            <div key={key} className="rounded-2xl border border-white/[0.06] bg-white/[0.035] px-3 py-1.5">
              <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-cosmos-text-dim/75">{label}</span>
              <strong className="mt-0.5 block font-mono text-xs text-cosmos-text">{stats[key]}</strong>
            </div>
          ))}
        </div>
      </div>

      <nav className="hidden items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.035] p-1 xl:flex">
        <button className="rounded-full bg-cosmos-gold/12 px-4 py-2 text-xs tracking-wider text-cosmos-gold shadow-[inset_0_0_0_1px_rgba(212,168,83,0.16)]" aria-label="时间线视图">
          时间线
        </button>
        <button
          disabled
          title="敬请期待"
          className="cursor-not-allowed rounded-full px-4 py-2 text-xs tracking-wider text-cosmos-text-dim/42"
          aria-label="数据面板（即将推出）"
        >
          数据库
        </button>
        <button
          disabled
          title="敬请期待"
          className="cursor-not-allowed rounded-full px-4 py-2 text-xs tracking-wider text-cosmos-text-dim/42"
          aria-label="关于页面（即将推出）"
        >
          研究室
        </button>
      </nav>

      <button
        onClick={onSearchOpen}
        aria-label="打开搜索面板"
        className="group flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-2 text-cosmos-text-dim transition-all duration-300 hover:border-cosmos-gold/25 hover:bg-cosmos-gold/10 hover:text-cosmos-text md:px-4"
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
        <kbd className="hidden rounded-full bg-black/30 px-2 py-0.5 font-mono text-[10px] text-cosmos-text-dim sm:inline">
          ⌘K
        </kbd>
      </button>
    </motion.header>
  );
}
