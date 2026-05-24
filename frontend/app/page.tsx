"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { sampleEvents } from "@/lib/data";
import { AIEvent, ThemeMode, TimelineFocus, TimelineScale, ViewMode } from "@/lib/types";
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
  const [theme, setTheme] = useState<ThemeMode>("night");
  const [themeReady, setThemeReady] = useState(false);

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

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => (prev === "night" ? "day" : "night"));
  }, []);

  const handleSearchSelect = useCallback((event: AIEvent) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
    setHighlightedId(event.id);
    setSearchOpen(false);
    setTimeout(() => setHighlightedId(null), 3000);
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("ai-chronos-theme");
    if (storedTheme === "night" || storedTheme === "day") {
      setTheme(storedTheme);
    }
    setThemeReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === "day" ? "light" : "dark";
    if (themeReady) {
      window.localStorage.setItem("ai-chronos-theme", theme);
    }
  }, [theme, themeReady]);

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
    <main className="chronos-stage relative h-screen w-full overflow-hidden">
      <StarField theme={theme} />
      <div className="chronos-vignette pointer-events-none fixed inset-0 z-[1]" />
      <div className="chronos-grid-overlay pointer-events-none fixed inset-0 z-[1]" />

      <NavBar
        onSearchOpen={() => setSearchOpen(true)}
        onThemeToggle={handleThemeToggle}
        stats={stats}
        theme={theme}
      />

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
          <h2 className="mt-4 chronos-title text-xl text-cosmos-text glow-text">
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
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-cosmos-surface/60">
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
        theme={theme}
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
