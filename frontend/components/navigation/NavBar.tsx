"use client";

import { motion } from "framer-motion";

interface NavBarProps {
  onSearchOpen: () => void;
}

export function NavBar({ onSearchOpen }: NavBarProps) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cosmos-gold to-cosmos-accent flex items-center justify-center">
          <span className="text-cosmos-bg font-bold text-sm">C</span>
        </div>
        <div>
          <h1 className="text-lg font-display text-cosmos-text tracking-wide">
            AI Chronos
          </h1>
          <p className="text-[10px] text-cosmos-text-dim tracking-widest uppercase">
            智纪元
          </p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-6">
        <button className="text-xs text-cosmos-text tracking-wider uppercase transition-colors duration-300" aria-label="时间线视图">
          时间线
        </button>
        <button
          disabled
          title="敬请期待"
          className="text-xs text-cosmos-text-dim/40 cursor-not-allowed tracking-wider uppercase transition-colors duration-300"
          aria-label="数据面板（即将推出）"
        >
          数据
        </button>
        <button
          disabled
          title="敬请期待"
          className="text-xs text-cosmos-text-dim/40 cursor-not-allowed tracking-wider uppercase transition-colors duration-300"
          aria-label="关于页面（即将推出）"
        >
          关于
        </button>
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={onSearchOpen}
          aria-label="打开搜索面板"
          className="flex items-center gap-2 px-4 py-2 glass-card-light text-cosmos-text-dim hover:text-cosmos-text transition-all duration-300"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="text-xs tracking-wider">搜索</span>
          <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-cosmos-border text-cosmos-text-dim">
            ⌘K
          </kbd>
        </button>
      </div>
    </motion.header>
  );
}
