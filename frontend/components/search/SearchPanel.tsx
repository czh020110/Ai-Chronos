"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIEvent, SearchMode } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { tagClass } from "@/lib/tagStyles";
import { fetchSearch } from "@/lib/api";

interface SearchPanelProps {
  events: AIEvent[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (event: AIEvent) => void;
}

const hints = ["Transformer", "ChatGPT", "DeepSeek", "开源", "论文", "商业化"];

type SearchModeOption = {
  key: SearchMode;
  label: string;
  desc: string;
};

const searchModes: SearchModeOption[] = [
  { key: "keyword", label: "关键词", desc: "本地关键词匹配" },
  { key: "hybrid", label: "混合", desc: "语义+关键词混合检索" },
  { key: "semantic", label: "语义", desc: "深度语义向量检索" },
];

interface SearchResultItem {
  id: string;
  title: string;
  event_date: string;
  content_md: string;
  tags: string[];
  source_urls: string[];
  impact_score: number;
  category: string;
  status: string;
  score: number;
}

function toItemAsEvent(item: SearchResultItem): AIEvent {
  return {
    id: item.id,
    title: item.title,
    event_date: item.event_date,
    content_md: item.content_md,
    tags: item.tags as AIEvent["tags"],
    source_urls: item.source_urls,
    impact_score: item.impact_score,
    category: item.category as AIEvent["category"],
    status: item.status as AIEvent["status"],
  };
}

export function SearchPanel({ events, isOpen, onClose, onSelect }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchMode, setSearchMode] = useState<SearchMode>("keyword");
  const [ragResults, setRagResults] = useState<SearchResultItem[]>([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIdx(0);
      setRagResults([]);
      setRagError(null);
    }
  }, [isOpen]);

  // Local keyword filtering
  const normalizedQuery = query.toLowerCase();
  const localFiltered =
    query.length > 0
      ? events.filter(
          (event) =>
            event.title.toLowerCase().includes(normalizedQuery) ||
            event.tags.some((tag) => tag.includes(query)) ||
            event.content_md.toLowerCase().includes(normalizedQuery)
        )
      : [];

  // RAG search trigger
  const doRagSearch = useCallback(async (q: string, mode: SearchMode) => {
    if (q.length === 0) {
      setRagResults([]);
      return;
    }
    setRagLoading(true);
    setRagError(null);
    try {
      const result = await fetchSearch(q, 20, mode);
      setRagResults(result.events);
    } catch (err) {
      setRagError(err instanceof Error ? err.message : "搜索失败");
      setRagResults([]);
    } finally {
      setRagLoading(false);
    }
  }, []);

  // Debounce RAG search
  useEffect(() => {
    if (searchMode === "keyword" || query.length === 0) return;
    const timer = setTimeout(() => {
      doRagSearch(query, searchMode);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, searchMode, doRagSearch]);

  // Active result set (unified type)
  const isRagMode = searchMode !== "keyword";
  const displayResults: SearchResultItem[] = isRagMode
    ? ragResults
    : localFiltered.slice(0, 8).map((e) => ({ ...e, score: 0 }));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, Math.min(displayResults.length, 20) - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && displayResults.length > 0) {
        onSelect(toItemAsEvent(displayResults[selectedIdx]));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIdx, displayResults, onClose, onSelect]);

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
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cosmos-gold/78">
                      {isRagMode ? "AI Search" : "Command Search"}
                    </p>
                    {/* Search mode toggle */}
                    <div className="flex rounded-full border border-cosmos-border/25 bg-cosmos-surface/50 p-0.5">
                      {searchModes.map((mode) => (
                        <button
                          key={mode.key}
                          onClick={() => setSearchMode(mode.key)}
                          title={mode.desc}
                          className={`rounded-full px-2 py-0.5 font-mono text-[9px] tracking-wider transition-all ${
                            searchMode === mode.key
                              ? "bg-cosmos-gold/14 text-cosmos-gold"
                              : "text-cosmos-text-dim hover:text-cosmos-text"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSelectedIdx(0);
                    }}
                    placeholder={isRagMode ? "用自然语言描述你要找的 AI 事件…" : "搜索模型、论文、开源项目、时间节点…"}
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
                    {ragLoading && isRagMode ? (
                      <div className="px-5 py-14 text-center">
                        <p className="font-display text-lg text-cosmos-text">检索中…</p>
                        <p className="mt-2 text-sm text-cosmos-text-dim">正在分析语义相关性</p>
                      </div>
                    ) : ragError && isRagMode ? (
                      <div className="px-5 py-14 text-center">
                        <p className="font-display text-lg text-cosmos-text">检索失败</p>
                        <p className="mt-2 text-sm text-cosmos-text-dim">{ragError}</p>
                      </div>
                    ) : displayResults.length === 0 ? (
                      <div className="px-5 py-14 text-center">
                        <p className="font-display text-xl text-cosmos-text">没有找到匹配事件</p>
                        <p className="mt-2 text-sm text-cosmos-text-dim">尝试搜索 GPT、Transformer、论文或开源。</p>
                      </div>
                    ) : (
                      displayResults.map((event, idx) => {
                        const ragEvent = event as SearchResultItem;
                        const hasScore = isRagMode && ragEvent.score !== undefined;
                        return (
                          <button
                            key={event.id}
                            onClick={() => onSelect(toItemAsEvent(event))}
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
                                {event.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className={`rounded-full px-2 py-0.5 text-[9px] ${tagClass[tag] || "border border-cosmos-border/25 bg-cosmos-surface/55 text-cosmos-text-dim"}`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              {/* Relevance score bar */}
                              {hasScore && (
                                <div className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-cosmos-surface/60">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-cosmos-blue to-cosmos-gold"
                                    style={{ width: `${Math.min(100, Math.max(5, ragEvent.score * 10))}%` }}
                                  />
                                </div>
                              )}
                            </div>
                            <span className={`mt-1 h-fit rounded-full px-2.5 py-1 font-mono text-[10px] ${
                              event.impact_score >= 90
                                ? "bg-cosmos-gold/14 text-cosmos-gold"
                                : "bg-cosmos-surface/60 text-cosmos-text-dim"
                            }`}>
                              {event.impact_score}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="px-6 py-7">
                    <p className="text-sm leading-6 text-cosmos-text-dim">
                      {isRagMode
                        ? "用自然语言描述你想了解的 AI 事件，系统会通过语义理解找到最相关的结果。"
                        : "输入关键词可定位事件并在时间线中高亮。支持标题、标签与 Markdown 内容搜索。"}
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
