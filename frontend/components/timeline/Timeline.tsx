"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIEvent, TimelineFocus, TimelineScale, TimelineUnit, ViewMode } from "@/lib/types";
import { format, parseISO, getDaysInMonth } from "date-fns";

interface TimelineProps {
  events: AIEvent[];
  timelineScale: TimelineScale;
  viewMode: ViewMode;
  onTimelineScaleChange: (scale: TimelineScale) => void;
  onFocusChange: (focus: TimelineFocus | null) => void;
  onNodeClick: (event: AIEvent) => void;
  highlightedId: string | null;
}

type TimeUnit = TimelineUnit;

interface RenderNode {
  key: string;
  x: number;
  angle: number;
  radius: number;
  label: string;
  subLabel?: string;
  unit: TimeUnit;
  year: number;
  month?: number;
  day?: number;
  events: AIEvent[];
  maxImpact: number;
  eventCount: number;
}

const monthNames = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

const scaleOptions: {
  key: TimelineScale;
  label: string;
  title: string;
  subtitle: string;
  code: string;
}[] = [
  {
    key: "year",
    label: "只看年份",
    title: "纪年星球",
    subtitle: "只显示年份核心星球，快速观察宏观年份密度。",
    code: "Y",
  },
  {
    key: "month",
    label: "年 + 月",
    title: "年月螺旋",
    subtitle: "滚轮与方向键逐星球吸附，螺旋随选中星球转动，高亮星球始终置前。",
    code: "Y + M",
  },
  {
    key: "day",
    label: "年 + 月 + 日",
    title: "全息日迹",
    subtitle: "在年月螺旋上叠加日级事件星点，查看具体事件落点。",
    code: "Y + M + D",
  },
];

const unitCopy: Record<TimeUnit, string> = {
  year: "年份主星",
  month: "月份星球",
  day: "日级星点",
};

function eventImpact(events: AIEvent[]) {
  return events.length > 0 ? Math.max(...events.map((event) => event.impact_score)) : 0;
}

function focusFromNode(node: RenderNode): TimelineFocus {
  return {
    key: node.key,
    unit: node.unit,
    unitLabel: unitCopy[node.unit],
    label: node.label,
    subLabel: node.subLabel,
    eventCount: node.eventCount,
    maxImpact: node.maxImpact,
    events: node.events,
  };
}

function TimelineCanvas({
  scrollX,
  globalRotation,
  timelineScale,
  winW,
  winH,
}: {
  scrollX: number;
  globalRotation: number;
  timelineScale: TimelineScale;
  winW: number;
  winH: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvas.offsetWidth * dpr);
    canvas.height = Math.floor(canvas.offsetHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const axisY = Math.max(350, height * 0.6);

    ctx.clearRect(0, 0, width, height);

    const horizon = ctx.createLinearGradient(0, axisY - 210, 0, axisY + 210);
    horizon.addColorStop(0, "rgba(91,141,239,0)");
    horizon.addColorStop(0.42, "rgba(91,141,239,0.055)");
    horizon.addColorStop(0.5, timelineScale === "day" ? "rgba(240,192,96,0.18)" : "rgba(240,192,96,0.13)");
    horizon.addColorStop(0.58, "rgba(139,92,246,0.06)");
    horizon.addColorStop(1, "rgba(91,141,239,0)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, axisY - 210, width, 420);

    ctx.save();
    ctx.strokeStyle = "rgba(240,192,96,0.42)";
    ctx.lineWidth = 1;
    ctx.shadowBlur = 22;
    ctx.shadowColor = "rgba(240,192,96,0.36)";
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const step = timelineScale === "year" ? 0.009 : timelineScale === "month" ? 0.014 : 0.016;
    const radius = timelineScale === "year" ? 104 : timelineScale === "month" ? 148 : 178;
    for (const rail of [0, Math.PI]) {
      ctx.beginPath();
      for (let x = -90; x <= width + 90; x += 18) {
        const worldX = x + scrollX;
        const phase = worldX * step + rail + globalRotation;
        const y = axisY + Math.sin(phase) * radius;
        if (x === -90) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rail === 0 ? "rgba(91,141,239,0.19)" : "rgba(240,192,96,0.11)";
      ctx.lineWidth = rail === 0 ? 1.15 : 0.8;
      ctx.shadowBlur = rail === 0 ? 18 : 12;
      ctx.shadowColor = rail === 0 ? "rgba(91,141,239,0.28)" : "rgba(240,192,96,0.2)";
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const centerGlow = ctx.createRadialGradient(width / 2, axisY, 0, width / 2, axisY, 170);
    centerGlow.addColorStop(0, "rgba(255,236,180,0.28)");
    centerGlow.addColorStop(0.18, "rgba(240,192,96,0.13)");
    centerGlow.addColorStop(0.58, "rgba(91,141,239,0.055)");
    centerGlow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = centerGlow;
    ctx.fillRect(width / 2 - 190, axisY - 190, 380, 380);
    ctx.restore();
  }, [scrollX, globalRotation, timelineScale, winW, winH]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}

function GridView({
  events,
  onNodeClick,
  highlightedId,
}: {
  events: AIEvent[];
  onNodeClick: (event: AIEvent) => void;
  highlightedId: string | null;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 top-24 z-20 overflow-y-auto px-5 pb-28 2xl:right-[335px]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event, index) => (
          <motion.button
            key={event.id}
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              boxShadow: highlightedId === event.id
                ? "0 0 0 1px rgba(240,192,96,0.5), 0 22px 70px rgba(212,168,83,0.16)"
                : "0 22px 70px rgba(0,0,0,0.32)",
            }}
            transition={{ delay: index * 0.025, duration: 0.42, ease: "easeOut" }}
            onClick={() => onNodeClick(event)}
            className="group chronos-panel min-h-[190px] p-5 text-left transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] tracking-[0.2em] text-cosmos-text-dim">
                  {format(parseISO(event.event_date), "yyyy.MM.dd")}
                </span>
                <span className="rounded-full border border-cosmos-gold/20 bg-cosmos-gold/10 px-2 py-0.5 font-mono text-[10px] text-cosmos-gold">
                  {event.impact_score}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl leading-tight text-cosmos-text transition-colors group-hover:text-cosmos-gold">
                {event.title}
              </h3>
              <div className="mt-auto pt-5">
                <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${event.impact_score}%` }}
                    transition={{ duration: 0.8, delay: index * 0.02 }}
                    className="h-full rounded-full bg-gradient-to-r from-cosmos-blue via-cosmos-gold to-cosmos-accent"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {event.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-cosmos-text-dim">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ListView({
  events,
  onNodeClick,
  highlightedId,
}: {
  events: AIEvent[];
  onNodeClick: (event: AIEvent) => void;
  highlightedId: string | null;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 top-24 z-20 overflow-y-auto px-5 pb-28 2xl:right-[355px]">
      <div className="mx-auto max-w-4xl space-y-3">
        {events.map((event, index) => (
          <motion.button
            key={event.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.018, duration: 0.36 }}
            onClick={() => onNodeClick(event)}
            className={`group grid w-full grid-cols-[88px_1fr_auto] items-center gap-5 rounded-2xl border px-5 py-4 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cosmos-gold/25 ${
              highlightedId === event.id
                ? "border-cosmos-gold/45 bg-cosmos-gold/10 shadow-[0_0_34px_rgba(212,168,83,0.18)]"
                : "border-white/[0.07] bg-white/[0.035]"
            }`}
          >
            <div className="font-mono text-right">
              <span className="block text-sm text-cosmos-gold">{format(parseISO(event.event_date), "yyyy")}</span>
              <span className="text-[10px] tracking-[0.16em] text-cosmos-text-dim">{format(parseISO(event.event_date), "MM.dd")}</span>
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm text-cosmos-text transition-colors group-hover:text-cosmos-gold">
                {event.title}
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {event.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] text-cosmos-text-dim">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-cosmos-text-dim">
              {event.impact_score}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function Timeline({
  events,
  timelineScale,
  viewMode,
  onTimelineScaleChange,
  onFocusChange,
  onNodeClick,
  highlightedId,
}: TimelineProps) {
  const [scrollX, setScrollX] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<RenderNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [winW, setWinW] = useState(1200);
  const [winH, setWinH] = useState(800);
  const [globalRotation, setGlobalRotation] = useState(0);
  const lastFocusKey = useRef<string | null>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const dragDelta = useRef(0);
  const animRef = useRef<number | null>(null);
  const targetScrollX = useRef(0);
  const currentScrollX = useRef(0);
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);
  const wheelLockedUntil = useRef(0);

  useEffect(() => {
    setWinW(window.innerWidth);
    setWinH(window.innerHeight);
    const onResize = () => {
      setWinW(window.innerWidth);
      setWinH(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const yearRange = useMemo(() => {
    const years = events.map((event) => parseISO(event.event_date).getFullYear());
    const min = Math.min(...years);
    const max = Math.max(...years);
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }, [events]);

  const nodes = useMemo<RenderNode[]>(() => {
    const byYear = new Map<number, AIEvent[]>();
    const byMonth = new Map<string, AIEvent[]>();
    const byDay = new Map<string, AIEvent[]>();

    for (const event of events) {
      const date = parseISO(event.event_date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const monthKey = `${year}-${month}`;
      const dayKey = `${year}-${month}-${day}`;
      byYear.set(year, [...(byYear.get(year) ?? []), event]);
      byMonth.set(monthKey, [...(byMonth.get(monthKey) ?? []), event]);
      byDay.set(dayKey, [...(byDay.get(dayKey) ?? []), event]);
    }

    const stepX = timelineScale === "year" ? 310 : timelineScale === "month" ? 78 : 84;
    const helixRadius = timelineScale === "year" ? 120 : timelineScale === "month" ? 160 : 190;
    const leftPad = winW / 2;
    const renderNodes: RenderNode[] = [];

    const freq = timelineScale === "year" ? 0.96 : 0.58;

    for (const [yearIndex, year] of yearRange.entries()) {
      const yearEvents = (byYear.get(year) ?? []).sort((a, b) => b.impact_score - a.impact_score);
      const yearOrdinal = timelineScale === "year" ? yearIndex : yearIndex * 12 + 5.5;
      const yearRadius = helixRadius * 0.72;
      renderNodes.push({
        key: `year-${year}`,
        x: leftPad + yearOrdinal * stepX,
        angle: yearOrdinal * freq,
        radius: yearRadius,
        label: String(year),
        subLabel: yearEvents.length > 0 ? `${yearEvents.length} 个事件` : "低活动年",
        unit: "year",
        year,
        events: yearEvents,
        maxImpact: eventImpact(yearEvents),
        eventCount: yearEvents.length,
      });

      if (timelineScale === "year") continue;

      for (let month = 0; month < 12; month += 1) {
        const monthEvents = (byMonth.get(`${year}-${month}`) ?? []).sort((a, b) => b.impact_score - a.impact_score);
        const monthOrdinal = yearIndex * 12 + month;
        renderNodes.push({
          key: `month-${year}-${month}`,
          x: leftPad + monthOrdinal * stepX,
          angle: monthOrdinal * freq,
          radius: helixRadius,
          label: monthNames[month],
          subLabel: monthEvents.length > 0 ? `${year} 年 ${monthNames[month]} · ${monthEvents.length} 个事件` : `${year} 年 ${monthNames[month]} · 暂无事件`,
          unit: "month",
          year,
          month,
          events: monthEvents,
          maxImpact: eventImpact(monthEvents),
          eventCount: monthEvents.length,
        });
      }
    }

    if (timelineScale === "day") {
      Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([key, dayEvents]) => {
          const [yearText, monthText, dayText] = key.split("-");
          const year = Number(yearText);
          const month = Number(monthText);
          const day = Number(dayText);
          const yearIndex = yearRange.indexOf(year);
          if (yearIndex < 0) return;
          const daysInMonth = getDaysInMonth(new Date(year, month, 1));
          const dayOrdinal = yearIndex * 12 + month + (day - 1) / daysInMonth;
          renderNodes.push({
            key: `day-${key}`,
            x: leftPad + dayOrdinal * stepX,
            angle: dayOrdinal * freq,
            radius: helixRadius * 1.08,
            label: String(day).padStart(2, "0"),
            subLabel: dayEvents[0]?.title,
            unit: "day",
            year,
            month,
            day,
            events: dayEvents.sort((a, b) => b.impact_score - a.impact_score),
            maxImpact: eventImpact(dayEvents),
            eventCount: dayEvents.length,
          });
        });
    }

    return renderNodes.sort((a, b) => a.x - b.x || a.unit.localeCompare(b.unit));
  }, [events, timelineScale, winW, yearRange]);

  const totalWidth = useMemo(() => {
    if (nodes.length === 0) return winW;
    return Math.max(winW, Math.max(...nodes.map((node) => node.x)) + winW / 2);
  }, [nodes, winW]);

  const maxScroll = Math.max(0, totalWidth - winW);
  const focusedNode = nodes[selectedIndex] ?? null;

  const startAnim = useCallback(() => {
    if (animRef.current) return;
    const animate = () => {
      const scrollDiff = targetScrollX.current - currentScrollX.current;
      const rotDiff = targetRotation.current - currentRotation.current;

      if (Math.abs(scrollDiff) < 0.22 && Math.abs(rotDiff) < 0.0005) {
        currentScrollX.current = targetScrollX.current;
        currentRotation.current = targetRotation.current;
        setScrollX(targetScrollX.current);
        setGlobalRotation(targetRotation.current);
        animRef.current = null;
        return;
      }

      currentScrollX.current += scrollDiff * 0.14;
      currentRotation.current += rotDiff * 0.14;
      setScrollX(currentScrollX.current);
      setGlobalRotation(currentRotation.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  const stepFocus = useCallback((direction: number) => {
    if (nodes.length === 0) return;
    setSelectedIndex((index) => Math.max(0, Math.min(index + direction, nodes.length - 1)));
  }, [nodes.length]);

  const selectNode = useCallback((node: RenderNode) => {
    const nextIndex = nodes.findIndex((item) => item.key === node.key);
    if (nextIndex >= 0) setSelectedIndex(nextIndex);
  }, [nodes]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (nodes.length === 0) return;
    const firstEventIndex = nodes.findIndex((node) => node.eventCount > 0);
    setSelectedIndex(firstEventIndex >= 0 ? firstEventIndex : 0);
    lastFocusKey.current = null;
  }, [timelineScale, nodes.length]);

  useEffect(() => {
    if (nodes.length === 0) return;
    setSelectedIndex((index) => Math.max(0, Math.min(index, nodes.length - 1)));
  }, [nodes.length]);

  useEffect(() => {
    if (!focusedNode) return;
    const nextTarget = Math.max(0, Math.min(focusedNode.x - winW / 2, maxScroll));
    targetScrollX.current = nextTarget;

    const rawTarget = -focusedNode.angle;
    const diff = rawTarget - currentRotation.current;
    const twoPi = 2 * Math.PI;
    const wrappedDiff = diff - Math.round(diff / twoPi) * twoPi;
    targetRotation.current = currentRotation.current + wrappedDiff;

    startAnim();
  }, [focusedNode, maxScroll, startAnim, winW]);

  useEffect(() => {
    targetScrollX.current = Math.max(0, Math.min(targetScrollX.current, maxScroll));
    currentScrollX.current = Math.max(0, Math.min(currentScrollX.current, maxScroll));
    setScrollX((value) => Math.max(0, Math.min(value, maxScroll)));
  }, [maxScroll]);

  useEffect(() => {
    if (!focusedNode) {
      if (lastFocusKey.current !== null) {
        lastFocusKey.current = null;
        onFocusChange(null);
      }
      return;
    }
    if (lastFocusKey.current === focusedNode.key) return;
    lastFocusKey.current = focusedNode.key;
    onFocusChange(focusFromNode(focusedNode));
  }, [focusedNode, onFocusChange]);

  useEffect(() => {
    if (viewMode !== "timeline") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepFocus(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepFocus(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stepFocus, viewMode]);

  useEffect(() => {
    if (viewMode !== "timeline") onFocusChange(null);
  }, [onFocusChange, viewMode]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const now = Date.now();
    if (now < wheelLockedUntil.current) return;
    stepFocus(event.deltaY > 0 ? 1 : -1);
    wheelLockedUntil.current = now + 100;
  }, [stepFocus]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = event.clientX;
    dragDelta.current = 0;
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging.current) return;
    const delta = lastX.current - event.clientX;
    lastX.current = event.clientX;
    dragDelta.current += delta;
    if (Math.abs(dragDelta.current) < 86) return;
    stepFocus(dragDelta.current > 0 ? 1 : -1);
    dragDelta.current = 0;
  }, [stepFocus]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    dragDelta.current = 0;
  }, []);

  const openNode = useCallback((node: RenderNode) => {
    selectNode(node);
    if (node.eventCount === 0) return;
    onNodeClick(node.events[0]);
  }, [onNodeClick, selectNode]);

  if (viewMode === "grid") {
    return <GridView events={events} onNodeClick={onNodeClick} highlightedId={highlightedId} />;
  }

  if (viewMode === "list") {
    return <ListView events={events} onNodeClick={onNodeClick} highlightedId={highlightedId} />;
  }

  const meta = scaleOptions.find((option) => option.key === timelineScale) ?? scaleOptions[1];
  const axisY = Math.max(350, winH * 0.6);

  const visibleNodes = useMemo(() => {
    return nodes
      .map((node) => {
        const angle = node.angle + globalRotation;
        return {
          node,
          nodeX: node.x - scrollX,
          renderY: Math.sin(angle) * node.radius,
          renderZ: Math.cos(angle),
        };
      })
      .filter(({ nodeX }) => nodeX > -230 && nodeX < winW + 230)
      .sort((a, b) => a.renderZ - b.renderZ);
  }, [nodes, scrollX, globalRotation, winW]);

  return (
    <div
      className="absolute inset-0 z-10 cursor-grab select-none active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <TimelineCanvas scrollX={scrollX} globalRotation={globalRotation} timelineScale={timelineScale} winW={winW} winH={winH} />

      <motion.div
        initial={{ opacity: 0, y: -16, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="pointer-events-auto absolute left-5 right-5 top-[96px] z-40 md:left-6 md:right-[330px] 2xl:right-[360px]"
      >
        <div className="flex flex-col gap-3 rounded-[28px] border border-white/[0.08] bg-[#050711]/72 p-3 shadow-[0_22px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-between lg:p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-cosmos-gold/20 bg-cosmos-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-cosmos-gold">
                {meta.code}
              </span>
              <span className="hidden h-px w-16 bg-gradient-to-r from-cosmos-gold/50 to-transparent md:block" />
            </div>
            <h2 className="mt-2 font-display text-2xl leading-none tracking-[-0.04em] aurora-text md:text-3xl">
              {meta.title}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-cosmos-text-dim md:text-sm md:leading-6">{meta.subtitle}</p>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2 rounded-[24px] border border-white/[0.08] bg-black/28 p-1.5 shadow-[inset_0_0_24px_rgba(255,255,255,0.03)]">
            {scaleOptions.map((option) => {
              const active = option.key === timelineScale;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onTimelineScaleChange(option.key)}
                  aria-pressed={active}
                  className={`group relative overflow-hidden rounded-[18px] px-3 py-3 text-center transition-all duration-300 md:min-w-[118px] ${
                    active
                      ? "bg-cosmos-gold/16 text-cosmos-gold shadow-[0_0_32px_rgba(212,168,83,0.18)]"
                      : "text-cosmos-text-dim hover:bg-white/[0.06] hover:text-cosmos-text"
                  }`}
                >
                  <span className={`absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-cosmos-gold/70 to-transparent transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-70"}`} />
                  <span className="relative block font-mono text-[10px] uppercase tracking-[0.2em]">{option.code}</span>
                  <span className="relative mt-1 block whitespace-nowrap text-xs tracking-wider">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ perspective: 1100 }}>
        <div className="absolute bottom-0 left-0 top-[170px] z-[70] w-[18vw] bg-gradient-to-r from-[#03040a] via-[#03040a]/50 to-transparent" />
        <div className="absolute bottom-0 right-0 top-[170px] z-[70] w-[18vw] bg-gradient-to-l from-[#03040a] via-[#03040a]/50 to-transparent" />
        <div className="absolute left-1/2 top-[18vh] z-30 h-[70vh] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cosmos-gold/40 to-transparent shadow-[0_0_14px_rgba(240,192,96,0.35)]" />
        <div
          className="absolute left-1/2 z-30 h-24 w-[220px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,238,190,0.42)_0%,rgba(240,192,96,0.14)_24%,rgba(91,141,239,0.07)_48%,transparent_72%)] blur-sm"
          style={{ top: axisY }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={`helix-${timelineScale}`}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(12px)" }}
            transition={{ duration: 0.34, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {visibleNodes.map(({ node, nodeX, renderY, renderZ }) => {
              const depth = (renderZ + 1) / 2;
              const hasEvents = node.eventCount > 0;
              const isFocused = focusedNode?.key === node.key;
              const isHighlighted = highlightedId != null && node.events.some((event) => event.id === highlightedId);
              const density = Math.min(1, node.eventCount / 4);
              const isMajor = node.maxImpact >= 95;
              const isStrong = node.maxImpact >= 85 || node.eventCount >= 2;
              const baseSize = node.unit === "year" ? 40 : node.unit === "month" ? 20 : 11;
              const depthSize = node.unit === "year" ? 14 : node.unit === "month" ? 8 : 4;
              const nodeSize = baseSize + density * depthSize + depth * (node.unit === "year" ? 10 : node.unit === "month" ? 6 : 3);
              const nodeY = axisY + renderY;
              const scale = 0.66 + depth * 0.5 + (isFocused ? 0.24 : 0);
              const labelOffset = renderY < 0 ? -50 : 38;
              const labelWidth = node.unit === "year" ? 150 : node.unit === "month" ? 112 : 78;
              const showLabelCard = isFocused || hasEvents || node.unit === "year";
              const accent = node.unit === "year"
                ? "rgba(240,192,96,ALPHA)"
                : node.unit === "month"
                  ? "rgba(91,141,239,ALPHA)"
                  : "rgba(139,92,246,ALPHA)";
              const idleOpacity = isFocused ? 1 : node.unit !== "year" && !hasEvents ? 0.18 + depth * 0.22 : 0.58 + depth * 0.3;

              return (
                <div
                  key={node.key}
                  className="pointer-events-auto absolute transition-[filter,opacity] duration-300"
                  style={{
                    left: nodeX,
                    top: nodeY,
                    opacity: idleOpacity,
                    zIndex: Math.round(20 + depth * 60 + (isFocused ? 90 : 0)),
                    transform: `translate(-50%, -50%) translateZ(${renderZ * 130}px) scale(${scale})`,
                    filter: `blur(${Math.max(0, (1 - depth) * 0.8 - (isFocused ? 1 : 0))}px)`,
                  }}
                >
                  {hasEvents && (isFocused || isStrong) && (
                    <motion.div
                      className="absolute left-1/2 top-1/2 rounded-full border border-white/10"
                      style={{
                        width: nodeSize * (isFocused ? 2.45 : 1.85),
                        height: nodeSize * (isFocused ? 2.45 : 1.85),
                        marginLeft: nodeSize * (isFocused ? -1.225 : -0.925),
                        marginTop: nodeSize * (isFocused ? -1.225 : -0.925),
                      }}
                      animate={{ rotate: 360, opacity: isFocused ? [0.42, 0.82, 0.42] : [0.18, 0.34, 0.18] }}
                      transition={{ rotate: { duration: node.unit === "year" ? 30 : 22, repeat: Infinity, ease: "linear" }, opacity: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } }}
                    />
                  )}

                  <button
                    onClick={() => openNode(node)}
                    onMouseEnter={() => {
                      setHoveredNode(node);
                      setTooltipPos({ x: nodeX, y: nodeY + labelOffset });
                    }}
                    onMouseLeave={() => setHoveredNode(null)}
                    aria-label={hasEvents ? `${node.label}: ${node.eventCount} 个事件` : `${node.label}: 无事件`}
                    className={`relative z-10 flex items-center justify-center rounded-full border transition-transform duration-300 ${
                      hasEvents ? "cursor-pointer hover:scale-110" : "cursor-default hover:scale-105"
                    } ${
                      node.unit === "year" ? "border-cosmos-gold/45" : node.unit === "month" ? "border-cosmos-blue/36" : "border-cosmos-purple/42"
                    }`}
                    style={{
                      width: nodeSize,
                      height: nodeSize,
                      background: hasEvents
                        ? `radial-gradient(circle at 30% 24%, rgba(255,255,255,0.96) 0%, ${accent.replace("ALPHA", isMajor ? "0.9" : "0.68")} 18%, ${accent.replace("ALPHA", "0.32")} 58%, rgba(3,4,10,0.36) 100%)`
                        : node.unit === "month"
                          ? "radial-gradient(circle at 35% 25%, rgba(91,141,239,0.24), rgba(255,255,255,0.035) 70%)"
                          : "rgba(255,255,255,0.055)",
                      boxShadow: hasEvents
                        ? isFocused || isHighlighted
                          ? `0 0 ${nodeSize * 1.75}px ${accent.replace("ALPHA", "0.72")}, inset 0 0 ${nodeSize * 0.45}px rgba(255,255,255,0.28)`
                          : `0 0 ${nodeSize * (isStrong ? 0.92 : 0.58)}px ${accent.replace("ALPHA", isStrong ? "0.32" : "0.18")}, inset -8px -10px ${nodeSize * 0.35}px rgba(0,0,0,0.32)`
                        : "inset -6px -8px 14px rgba(0,0,0,0.26)",
                    }}
                  >
                    {hasEvents && <span className="h-1.5 w-1.5 rounded-full bg-white/85 shadow-[0_0_10px_rgba(255,255,255,0.7)]" />}
                  </button>

                  <div
                    className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2"
                    style={{ top: labelOffset, width: labelWidth }}
                  >
                    {showLabelCard ? (
                      <div className={`rounded-2xl border px-3 py-2 text-center backdrop-blur-xl transition-all duration-300 ${
                        isFocused
                          ? "border-cosmos-gold/34 bg-[#0a0b17]/76 shadow-[0_18px_54px_rgba(212,168,83,0.18)]"
                          : hasEvents
                            ? "border-white/[0.07] bg-[#080a16]/54 shadow-[0_14px_38px_rgba(0,0,0,0.28)]"
                            : "border-white/[0.035] bg-white/[0.018]"
                      }`}>
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-mono leading-none ${node.unit === "year" ? "text-lg" : node.unit === "month" ? "text-sm" : "text-[11px]"} ${hasEvents || node.unit === "year" ? "text-cosmos-text" : "text-cosmos-text-dim/45"}`}>
                            {node.label}
                          </span>
                          {hasEvents && node.unit !== "day" && (
                            <span className="rounded-full bg-cosmos-gold/10 px-1.5 py-0.5 font-mono text-[9px] text-cosmos-gold">
                              {node.eventCount}
                            </span>
                          )}
                        </div>
                        {isFocused && node.subLabel && (
                          <p className="mt-1 truncate text-[9px] text-cosmos-text-dim">{node.subLabel}</p>
                        )}
                        {hasEvents && (
                          <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-white/[0.08]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cosmos-blue via-cosmos-gold to-cosmos-accent"
                              style={{ width: `${node.maxImpact}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-cosmos-text-dim/40">{node.label}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none fixed z-50 w-[300px] max-w-[calc(100vw-32px)] rounded-3xl border border-white/[0.09] bg-[#070914]/88 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-2xl"
            style={{
              left: Math.max(16, Math.min(tooltipPos.x - 150, winW - 316)),
              top: Math.max(100, Math.min(tooltipPos.y, winH - 230)),
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-gold">
                {unitCopy[hoveredNode.unit]} · {hoveredNode.label}
              </p>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-cosmos-text-dim">
                {hoveredNode.eventCount} Events
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {hoveredNode.events.length > 0 ? hoveredNode.events.slice(0, 3).map((event) => (
                <div key={event.id} className="rounded-2xl bg-white/[0.04] px-3 py-2">
                  <p className="truncate text-xs text-cosmos-text">{event.title}</p>
                  <p className="mt-1 font-mono text-[9px] text-cosmos-text-dim">
                    {format(parseISO(event.event_date), "yyyy.MM.dd")}
                  </p>
                </div>
              )) : (
                <p className="rounded-2xl bg-white/[0.04] px-3 py-2 text-xs text-cosmos-text-dim">当前星球暂无事件</p>
              )}
            </div>
            {hoveredNode.events.length > 3 && (
              <p className="mt-2 text-[10px] text-cosmos-text-dim">+{hoveredNode.events.length - 3} 更多事件</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
