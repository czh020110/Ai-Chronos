"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIEvent } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { tagClass } from "@/lib/tagStyles";

interface SearchPanelProps {
  events: AIEvent[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (event: AIEvent) => void;
}

const hints = ["Transformer", "ChatGPT", "DeepSeek", "开源", "论文", "商业化"];

export function SearchPanel({ events, isOpen, onClose, onSelect }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIdx(0);
    }
  }, [isOpen]);

  const normalizedQuery = query.toLowerCase();
  const filtered =
    query.length > 0
      ? events.filter(
          (event) =>
            event.title.toLowerCase().includes(normalizedQuery) ||
            event.tags.some((tag) => tag.includes(query)) ||
            event.content_md.toLowerCase().includes(normalizedQuery)
        )
      : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, Math.min(filtered.length, 8) - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filtered.length > 0) {
        onSelect(filtered[selectedIdx]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIdx, filtered, onClose, onSelect]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-cosmos-bg/72 backdrop-blur-[7px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -26, scale: 0.96, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -24, scale: 0.96, filter: "blur(12px)" }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed inset-x-2 top-[var(--sat)] z-50 h-[calc(100dvh-16px)] px-0
              sm:left-1/2 sm:top-24 sm:h-auto sm:max-h-[calc(100dvh-120px)] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:px-4"
          >
            <div className="theme-shell-strong relative flex h-full flex-col overflow-hidden rounded-[28px] sm:rounded-[32px]">
              <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cosmos-blue/14 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 top-10 h-48 w-48 rounded-full bg-cosmos-gold/12 blur-3xl" />
              <div className="relative z-10 shrink-0 flex items-center gap-4 border-b border-cosmos-border/30 px-5 py-5 md:px-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cosmos-gold/20 bg-cosmos-gold/10 text-cosmos-gold">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-cosmos-gold/78">Command Search</p>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSelectedIdx(0);
                    }}
                    placeholder="搜索模型、论文、开源项目、时间节点…"
                    className="w-full bg-transparent text-base text-cosmos-text placeholder:text-cosmos-text-dim/55 outline-none"
                  />
                </div>
                <kbd className="rounded-full border border-cosmos-border/30 bg-cosmos-card/70 px-2.5 py-1 font-mono text-[10px] text-cosmos-text-dim">
                  ESC
                </kbd>
              </div>

              <div className="relative z-10 flex-1 overflow-y-auto">
                {query.length > 0 ? (
                  <div className="p-3">
                    {filtered.length === 0 ? (
                      <div className="px-5 py-14 text-center">
                        <p className="font-display text-xl text-cosmos-text">没有找到匹配事件</p>
                        <p className="mt-2 text-sm text-cosmos-text-dim">尝试搜索 GPT、Transformer、论文或开源。</p>
                      </div>
                    ) : (
                      filtered.slice(0, 8).map((event, idx) => (
                        <button
                          key={event.id}
                          onClick={() => onSelect(event)}
                          className={`group mb-2 grid w-full grid-cols-[1fr_auto] gap-4 rounded-3xl border px-4 py-4 text-left transition-all duration-180 last:mb-0 ${
                            idx === selectedIdx
                              ? "border-cosmos-gold/30 bg-cosmos-gold/10 shadow-[0_0_38px_rgba(212,168,83,0.1)]"
                              : "border-cosmos-border/25 bg-cosmos-surface/55 hover:border-cosmos-border/35 hover:bg-cosmos-surface/70"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-cosmos-text transition-colors group-hover:text-cosmos-gold">
                              {event.title}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[10px] text-cosmos-text-dim">
                                {format(parseISO(event.event_date), "yyyy.MM.dd")}
                              </span>
                              {event.tags.map((tag) => (
                                <span key={tag} className={`rounded-full px-2 py-0.5 text-[9px] ${tagClass[tag] || "border border-cosmos-border/25 bg-cosmos-surface/55 text-cosmos-text-dim"}`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className={`mt-1 h-fit rounded-full px-2.5 py-1 font-mono text-[10px] ${
                            event.impact_score >= 90
                              ? "bg-cosmos-gold/14 text-cosmos-gold"
                              : "bg-cosmos-surface/60 text-cosmos-text-dim"
                          }`}>
                            {event.impact_score}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="px-6 py-7">
                    <p className="text-sm leading-6 text-cosmos-text-dim">
                      输入关键词可定位事件并在时间线中高亮。支持标题、标签与 Markdown 内容搜索。
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {hints.map((hint) => (
                        <button
                          key={hint}
                          onClick={() => setQuery(hint)}
                          className="rounded-full border border-cosmos-border/30 bg-cosmos-surface/60 px-3 py-1.5 text-xs text-cosmos-text-dim transition-all hover:border-cosmos-gold/25 hover:bg-cosmos-gold/10 hover:text-cosmos-gold"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
