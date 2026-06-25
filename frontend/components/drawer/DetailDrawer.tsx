"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimelineBucket } from "@/lib/types";
import { format, parseISO } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { tagClass } from "@/lib/tagStyles";

interface DetailDrawerProps {
  bucket: TimelineBucket | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DetailDrawer({ bucket, isOpen, onClose }: DetailDrawerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const events = useMemo(() => bucket?.events ?? [], [bucket]);
  const uniqueTags = useMemo(
    () => Array.from(new Set(events.flatMap((event) => event.tags))),
    [events],
  );

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [bucket?.key]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const primaryEvent = events[0];
  const drawerTitle = bucket?.subLabel && bucket.eventCount === 1 ? bucket.subLabel : bucket?.label;

  return (
    <AnimatePresence>
      {isOpen && bucket && events.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-cosmos-bg/58 backdrop-blur-[5px]"
            onClick={onClose}
          />

          <motion.aside
            initial={isMobile ? { y: "100%", opacity: 0.7 } : { x: "104%", opacity: 0.7, filter: "blur(12px)" }}
            animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1, filter: "blur(0px)" }}
            exit={isMobile ? { y: "100%", opacity: 0.65 } : { x: "104%", opacity: 0.65, filter: "blur(12px)" }}
            transition={{ type: "spring", damping: 36, stiffness: 220 }}
            className="theme-shell-strong fixed z-50 flex flex-col overflow-hidden
              bottom-0 left-0 right-0 h-[85dvh] rounded-t-[28px]
              md:bottom-5 md:right-5 md:top-5 md:left-auto md:h-auto md:w-[calc(100vw-24px)] md:max-w-[600px] md:rounded-[32px]"
          >
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cosmos-gold/50 to-transparent" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cosmos-gold/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cosmos-blue/10 blur-3xl" />

            <div className="relative z-10 flex-shrink-0 px-4 pt-4 pb-5 md:px-7 md:pt-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="chronos-eyebrow">{bucket.unitLabel}</span>
                    <span className="rounded-full bg-cosmos-surface/60 px-2 py-0.5 font-mono text-[10px] text-cosmos-text-dim">
                      {bucket.eventCount} linked {bucket.eventCount === 1 ? "event" : "events"}
                    </span>
                    {primaryEvent && bucket.eventCount === 1 && (
                      <span className="rounded-full bg-cosmos-surface/60 px-2 py-0.5 font-mono text-[10px] text-cosmos-text-dim">
                        {format(parseISO(primaryEvent.event_date), "yyyy.MM.dd")}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-2xl leading-[1.05] tracking-[-0.04em] text-cosmos-text md:text-3xl md:leading-[1.05] lg:text-4xl">
                    {drawerTitle}
                  </h2>
                  {bucket.subLabel && bucket.eventCount > 1 && (
                    <p className="mt-3 text-sm leading-6 text-cosmos-text-dim">
                      {bucket.subLabel}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-cosmos-border/30 bg-cosmos-surface/65 text-cosmos-text-dim transition-all hover:border-cosmos-gold/20 hover:bg-cosmos-gold/10 hover:text-cosmos-text"
                  aria-label="关闭详情抽屉"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {uniqueTags.map((tag) => (
                  <span key={tag} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${tagClass[tag] || "border border-cosmos-border/25 bg-cosmos-surface/55 text-cosmos-text-dim"}`}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-cosmos-border/25 bg-cosmos-surface/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-text-dim">Peak Impact Signal</span>
                  <span className="font-mono text-sm text-cosmos-gold">{bucket.maxImpact}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-cosmos-bg/35">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${bucket.maxImpact}%` }}
                    transition={{ duration: 0.8, delay: 0.18, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-cosmos-blue via-cosmos-gold to-cosmos-accent shadow-[0_0_24px_rgba(212,168,83,0.18)]"
                  />
                </div>
              </div>
            </div>

            <div ref={contentRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-2 md:px-7">
              <div className="space-y-5 pb-[calc(1.5rem+var(--sab))]">
                {events.map((event, index) => (
                  <article key={event.id} className="rounded-3xl border border-cosmos-border/25 bg-cosmos-surface/50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cosmos-card/70 px-2 py-0.5 font-mono text-[10px] text-cosmos-text-dim">
                            {format(parseISO(event.event_date), "yyyy.MM.dd")}
                          </span>
                          {events.length > 1 && (
                            <span className="rounded-full border border-cosmos-border/20 px-2 py-0.5 font-mono text-[10px] text-cosmos-text-dim">
                              #{String(index + 1).padStart(2, "0")}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-xl leading-tight tracking-[-0.03em] text-cosmos-text">
                          {event.title}
                        </h3>
                      </div>
                      <span className="rounded-full border border-cosmos-gold/20 bg-cosmos-gold/10 px-2.5 py-1 font-mono text-xs text-cosmos-gold">
                        {event.impact_score}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <span key={tag} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${tagClass[tag] || "border border-cosmos-border/25 bg-cosmos-surface/55 text-cosmos-text-dim"}`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="prose prose-sm mt-5 max-w-none
                      prose-headings:font-display prose-headings:tracking-[-0.03em] prose-headings:text-cosmos-text
                      prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3
                      prose-h3:text-base prose-h3:font-medium prose-h3:text-cosmos-gold
                      prose-p:text-sm prose-p:text-cosmos-text/82 prose-p:leading-8
                      prose-strong:text-cosmos-text prose-strong:font-semibold
                      prose-a:text-cosmos-blue prose-a:no-underline hover:prose-a:text-cosmos-accent
                      prose-li:text-sm prose-li:text-cosmos-text/78 prose-li:leading-7
                      prose-code:text-xs prose-code:font-mono prose-code:text-cosmos-accent prose-code:bg-cosmos-surface/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                      prose-blockquote:rounded-2xl prose-blockquote:border-cosmos-gold/50 prose-blockquote:bg-cosmos-gold/8 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:text-cosmos-text/72 prose-blockquote:text-sm
                      prose-hr:border-cosmos-border/30
                    ">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {event.content_md}
                      </ReactMarkdown>
                    </div>

                    {event.source_urls.length > 0 && (
                      <div className="mt-5 border-t border-cosmos-border/20 pt-4">
                        <div className="mb-3 flex items-center justify-between gap-4">
                          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-text-dim">Sources</span>
                          <span className="rounded-full bg-cosmos-card/70 px-2 py-0.5 font-mono text-[10px] text-cosmos-text-dim">
                            {event.source_urls.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {event.source_urls.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate rounded-2xl border border-cosmos-border/25 bg-cosmos-surface/55 px-3 py-2 text-xs text-cosmos-blue/78 transition-all hover:border-cosmos-blue/30 hover:bg-cosmos-blue/10 hover:text-cosmos-blue"
                            >
                              {url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
