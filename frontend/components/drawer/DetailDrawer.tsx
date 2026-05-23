"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIEvent } from "@/lib/types";
import { format, parseISO } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DetailDrawerProps {
  event: AIEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

import { tagClass } from "@/lib/tagStyles";

export function DetailDrawer({ event, isOpen, onClose }: DetailDrawerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [event?.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && event && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg glass-card rounded-none border-l border-cosmos-border/50 flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-cosmos-border/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tagClass[tag] || ""}`}
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-[10px] text-cosmos-text-dim">
                      {format(parseISO(event.event_date), "yyyy年M月d日")}
                    </span>
                  </div>
                  <h2 className="text-lg font-display text-cosmos-text leading-snug">
                    {event.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full glass-card-light text-cosmos-text-dim hover:text-cosmos-text transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Impact bar */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1 rounded-full bg-cosmos-border overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${event.impact_score}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-cosmos-gold-dim to-cosmos-gold"
                  />
                </div>
                <span className="text-[10px] text-cosmos-text-dim font-mono">
                  影响力 {event.impact_score}
                </span>
              </div>
            </div>

            {/* Content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto px-6 py-5"
            >
              <div className="prose prose-invert prose-sm max-w-none
                prose-headings:font-display prose-headings:text-cosmos-text
                prose-h2:text-base prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3
                prose-h3:text-sm prose-h3:font-medium
                prose-p:text-sm prose-p:text-cosmos-text/85 prose-p:leading-relaxed
                prose-strong:text-cosmos-text prose-strong:font-semibold
                prose-a:text-cosmos-blue prose-a:no-underline hover:prose-a:text-cosmos-blue
                prose-li:text-sm prose-li:text-cosmos-text/80
                prose-code:text-xs prose-code:font-mono prose-code:text-cosmos-accent prose-code:bg-cosmos-surface prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-blockquote:border-cosmos-gold prose-blockquote:text-cosmos-text/70 prose-blockquote:text-sm
                prose-hr:border-cosmos-border
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {event.content_md}
                </ReactMarkdown>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-cosmos-border/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-cosmos-text-dim tracking-wider uppercase">
                  参考来源
                </span>
              </div>
              <div className="space-y-1.5">
                {event.source_urls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-cosmos-blue/70 hover:text-cosmos-blue truncate transition-colors"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
