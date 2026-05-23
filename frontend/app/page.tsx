"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { sampleEvents } from "@/lib/data";
import { AIEvent, ZoomLevel, ViewMode, DrillState } from "@/lib/types";
import { StarField } from "@/components/background/StarField";
import { NavBar } from "@/components/navigation/NavBar";
import { Timeline } from "@/components/timeline/Timeline";
import { DetailDrawer } from "@/components/drawer/DetailDrawer";
import { SearchPanel } from "@/components/search/SearchPanel";
import { DrillControls } from "@/components/ui/DrillControls";
import { ViewToggle } from "@/components/ui/ViewToggle";

const levelCopy: Record<ZoomLevel, string> = {
  year: "Year Atlas",
  month: "Month Lens",
  day: "Day Trace",
};

export default function Home() {
  const [events] = useState<AIEvent[]>(sampleEvents);
  const [selectedEvent, setSelectedEvent] = useState<AIEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drill, setDrill] = useState<DrillState>({ level: "year", year: null, month: null });
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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
    drill.level === "year"
      ? "全局纪年索引"
      : drill.level === "month"
        ? `${drill.year} 年 · 月度显影`
        : `${drill.year} 年 ${(drill.month ?? 0) + 1} 月 · 日级轨迹`;

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

  const handleDrillDown = useCallback((year: number, month?: number) => {
    setDrill((prev) => {
      if (prev.level === "year") {
        return { level: "month" as ZoomLevel, year, month: null };
      }
      if (prev.level === "month" && month !== undefined) {
        return { level: "day" as ZoomLevel, year: prev.year, month };
      }
      return prev;
    });
    setHighlightedId(null);
  }, []);

  const handleDrillUp = useCallback(() => {
    setDrill((prev) => {
      if (prev.level === "day") {
        return { level: "month" as ZoomLevel, year: prev.year, month: null };
      }
      if (prev.level === "month") {
        return { level: "year" as ZoomLevel, year: null, month: null };
      }
      return prev;
    });
    setHighlightedId(null);
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

      <NavBar onSearchOpen={() => setSearchOpen(true)} />

      <motion.section
        initial={{ opacity: 0, x: -26 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="pointer-events-none fixed left-6 top-28 z-30 hidden w-[370px] xl:block"
      >
        <div className="chronos-panel chronos-panel-strong p-6">
          <p className="chronos-eyebrow">Synthetic Memory Atlas</p>
          <h1 className="mt-4 font-display text-5xl leading-[0.92] tracking-[-0.04em] aurora-text">
            AI Chronos
            <span className="block text-3xl italic tracking-[-0.02em]">智纪元</span>
          </h1>
          <p className="mt-5 max-w-[290px] text-sm leading-7 text-cosmos-text/72">
            以时间为坐标，把模型、论文、工具与产业事件压缩成可钻取的智能文明轨迹。
          </p>

          <div className="chronos-divider my-6" />

          <div className="grid grid-cols-2 gap-3">
            <div className="chronos-metric p-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-text-dim">Range</span>
              <strong className="mt-2 block font-mono text-lg text-cosmos-gold">{stats.span}</strong>
            </div>
            <div className="chronos-metric p-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-text-dim">Events</span>
              <strong className="mt-2 block font-mono text-lg text-cosmos-text">{stats.eventCount}</strong>
            </div>
            <div className="chronos-metric p-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-text-dim">High Impact</span>
              <strong className="mt-2 block font-mono text-lg text-cosmos-accent">{stats.highImpact}</strong>
            </div>
            <div className="chronos-metric p-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-text-dim">Domains</span>
              <strong className="mt-2 block font-mono text-lg text-cosmos-blue">{stats.categoryCount}</strong>
            </div>
          </div>
        </div>
      </motion.section>

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
              {levelCopy[drill.level]}
            </span>
          </div>
          <h2 className="mt-4 font-display text-xl text-cosmos-text glow-text">{activeCoordinate}</h2>
          <p className="mt-3 text-xs leading-6 text-cosmos-text-dim">
            当前版本使用本地精选事件集驱动完整交互，后续将接入离线采集与后端 API。
          </p>
          <div className="chronos-divider my-5" />
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-text-dim">Anchor Event</span>
            <p className="mt-2 text-sm leading-6 text-cosmos-text/86">{stats.topEvent.title}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.topEvent.impact_score}%` }}
                transition={{ duration: 0.9, delay: 0.35 }}
                className="h-full rounded-full bg-gradient-to-r from-cosmos-gold-dim via-cosmos-gold to-cosmos-accent"
              />
            </div>
          </div>
        </div>
      </motion.aside>

      <Timeline
        events={events}
        drill={drill}
        viewMode={viewMode}
        onNodeClick={handleNodeClick}
        onDrillDown={handleDrillDown}
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

      <DrillControls drill={drill} onDrillUp={handleDrillUp} />
      <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
    </main>
  );
}
