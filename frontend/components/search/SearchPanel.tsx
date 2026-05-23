"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIEvent } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface SearchPanelProps {
  events: AIEvent[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (event: AIEvent) => void;
}

import { tagClass } from "@/lib/tagStyles";

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

  const filtered =
    query.length > 0
      ? events.filter(
          (e) =>
            e.title.toLowerCase().includes(query.toLowerCase()) ||
            e.tags.some((t) => t.includes(query)) ||
            e.content_md.toLowerCase().includes(query.toLowerCase())
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
  }, [isOpen, selectedIdx, filtered.length]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
          >
            <div className="glass-card overflow-hidden mx-4">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-cosmos-border">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="text-cosmos-gold"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIdx(0);
                  }}
                  placeholder="搜索 AI 事件、论文、模型…"
                  className="flex-1 bg-transparent text-sm text-cosmos-text placeholder-cosmos-text-dim outline-none font-ui"
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-cosmos-border text-cosmos-text-dim">
                  ESC
                </kbd>
              </div>

              {query.length > 0 && (
                <div className="max-h-80 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-cosmos-text-dim">
                      未找到相关事件
                    </div>
                  ) : (
                    filtered.slice(0, 8).map((event, idx) => (
                      <button
                        key={event.id}
                        onClick={() => onSelect(event)}
                        className={`w-full text-left px-5 py-3.5 flex items-start gap-4 transition-colors duration-150 ${
                          idx === selectedIdx
                            ? "bg-cosmos-gold/10"
                            : "hover:bg-cosmos-surface"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-cosmos-text truncate font-medium">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-cosmos-text-dim">
                              {format(parseISO(event.event_date), "yyyy年M月d日")}
                            </span>
                            <div className="flex gap-1">
                              {event.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${tagClass[tag] || "text-cosmos-text-dim bg-cosmos-surface"}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full ${
                            event.impact_score >= 90
                              ? "bg-cosmos-gold/20 text-cosmos-gold"
                              : "bg-cosmos-surface text-cosmos-text-dim"
                          }`}
                        >
                          {event.impact_score}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {query.length === 0 && (
                <div className="px-5 py-6 text-center">
                  <p className="text-xs text-cosmos-text-dim">
                    输入关键词搜索 AI 历史事件
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {["Transformer", "GPT", "开源", "论文", "DeepSeek"].map(
                      (hint) => (
                        <button
                          key={hint}
                          onClick={() => setQuery(hint)}
                          className="text-[10px] px-2.5 py-1 rounded-full glass-card-light text-cosmos-text-dim hover:text-cosmos-text transition-colors"
                        >
                          {hint}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
