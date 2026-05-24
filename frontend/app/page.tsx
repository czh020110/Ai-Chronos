"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { sampleEvents } from "@/lib/data";
import { AIEvent, TimelineFocus, TimelineScale, ViewMode } from "@/lib/types";
import { StarField } from "@/components/background/StarField";
import { NavBar } from "@/components/navigation/NavBar";
import { Timeline } from "@/components/timeline/Timeline";
import { DetailDrawer } from "@/components/drawer/DetailDrawer";
import { SearchPanel } from "@/components/search/SearchPanel";
import { ViewToggle } from "@/components/ui/ViewToggle";

const scaleCopy: Record<TimelineScale, string> = {
  year: "Year Orbs",
  month: "Year + Month",
  day: "Y + M + D",
};

export default function Home() {
  const [events] = useState<AIEvent[]>(sampleEvents);
  const [selectedEvent, setSelectedEvent] = useState<AIEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [timelineScale, setTimelineScale] = useState<TimelineScale>("month");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [timelineFocus, setTimelineFocus] = useState<TimelineFocus | null>(null);

  const stats = useMemo(() => {
    const years = events.map((event) => new Date(event.event_date).getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const highImpact = events.filter((event) => event.impact_score >= 95).length;
    const topEvent = events.reduce((best, event) =>
      event.impact_score > best.impact_score ? event : best
    );

    return {
      span: `${minYear}—${maxYear}`,
      eventCount: events.length,
      highImpact,
      categoryCount: new Set(events.map((event) => event.category)).size,
      topEvent,
    };
  }, [events]);

  const activeCoordinate =
    timelineScale === "year"
      ? "年份核心星球"
      : timelineScale === "month"
        ? "年份主星 + 月份轨道"
        : "年 / 月 / 日全息轨迹";

  const handleNodeClick = useCallback((event: AIEvent) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleSearchSelect = useCallback((event: AIEvent) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
    setHighlightedId(event.id);
    setSearchOpen(false);
    setTimeout(() => setHighlightedId(null), 3000);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#03040a] text-cosmos-text">
      <StarField />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_48%,transparent_0%,rgba(3,4,10,0.18)_38%,rgba(3,4,10,0.88)_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-[1] opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(circle_at_center,#000_0%,transparent_76%)]" />

      <NavBar onSearchOpen={() => setSearchOpen(true)} stats={stats} />

      <motion.aside
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        className="pointer-events-none fixed right-7 top-28 z-30 hidden w-[292px] 2xl:block"
      >
        <div className="chronos-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="chronos-eyebrow">Live Coordinate</p>
            <span className="rounded-full border border-cosmos-gold/20 bg-cosmos-gold/10 px-2 py-1 font-mono text-[10px] text-cosmos-gold">
              {timelineFocus ? scaleCopy[timelineScale] : "SCANNING"}
            </span>
          </div>
          <h2 className="mt-4 font-display text-xl text-cosmos-text glow-text">
            {timelineFocus ? `${timelineFocus.unitLabel} · ${timelineFocus.label}` : activeCoordinate}
          </h2>
          <p className="mt-3 text-xs leading-6 text-cosmos-text-dim">
            {timelineFocus?.subLabel ?? "滚动时间线，中央光柱会自动锁定最近的星球并同步这里的事件信息。"}
          </p>
          <div className="chronos-divider my-5" />
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-text-dim">
              {timelineFocus ? `${timelineFocus.eventCount} Linked Events` : "Focus Signal"}
            </span>
            <p className="mt-2 text-sm leading-6 text-cosmos-text/86">
              {timelineFocus?.events[0]?.title ?? stats.topEvent.title}
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${timelineFocus?.maxImpact ?? stats.topEvent.impact_score}%` }}
                transition={{ duration: 0.9, delay: 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-cosmos-gold-dim via-cosmos-gold to-cosmos-accent"
              />
            </div>
          </div>
        </div>
      </motion.aside>

      <Timeline
        events={events}
        timelineScale={timelineScale}
        viewMode={viewMode}
        onTimelineScaleChange={setTimelineScale}
        onFocusChange={setTimelineFocus}
        onNodeClick={handleNodeClick}
        highlightedId={highlightedId}
      />

      <DetailDrawer
        event={selectedEvent}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
      />

      <SearchPanel
        events={events}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSearchSelect}
      />
      <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
    </main>
  );
}
