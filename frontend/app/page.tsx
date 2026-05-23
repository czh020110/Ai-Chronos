"use client";

import { useState, useCallback, useEffect } from "react";
import { sampleEvents } from "@/lib/data";
import { AIEvent, ZoomLevel, ViewMode, DrillState } from "@/lib/types";
import { StarField } from "@/components/background/StarField";
import { NavBar } from "@/components/navigation/NavBar";
import { Timeline } from "@/components/timeline/Timeline";
import { DetailDrawer } from "@/components/drawer/DetailDrawer";
import { SearchPanel } from "@/components/search/SearchPanel";
import { DrillControls } from "@/components/ui/DrillControls";
import { ViewToggle } from "@/components/ui/ViewToggle";

export default function Home() {
  const [events] = useState<AIEvent[]>(sampleEvents);
  const [selectedEvent, setSelectedEvent] = useState<AIEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drill, setDrill] = useState<DrillState>({ level: "year", year: null, month: null });
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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
    <main className="relative w-full h-screen overflow-hidden bg-cosmos-bg">
      <StarField />

      <NavBar onSearchOpen={() => setSearchOpen(true)} />

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
