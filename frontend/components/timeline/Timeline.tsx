"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIEvent, ViewMode, DrillState } from "@/lib/types";
import { format, parseISO, getDaysInMonth } from "date-fns";

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */

interface TimelineProps {
  events: AIEvent[];
  drill: DrillState;
  viewMode: ViewMode;
  onNodeClick: (event: AIEvent) => void;
  onDrillDown: (year: number, month?: number) => void;
  highlightedId: string | null;
}

interface RenderNode {
  key: string;
  x: number;
  y: number;
  label: string;
  subLabel?: string;
  isDrillable: boolean;
  year: number;
  month?: number;
  events: AIEvent[];
  maxImpact: number;
  eventCount: number;
}

/* ------------------------------------------------------------------ */
/*  TimelineCanvas – enhanced cosmic background                       */
/* ------------------------------------------------------------------ */

function TimelineCanvas({
  scrollX,
  drill,
  winW,
  winH,
}: {
  scrollX: number;
  drill: DrillState;
  winW: number;
  winH: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const dpr = devicePixelRatio;
    c.width = c.offsetWidth * dpr;
    c.height = c.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const dw = c.offsetWidth;
    const dh = c.offsetHeight;
    const midY = dh / 2;

    ctx.clearRect(0, 0, dw, dh);

    /* cosmic river — multi-layer glow */
    const glowLayers = [
      { y: midY, h: 80, a1: 0, a2: 0.06, a3: 0.12 },
      { y: midY, h: 40, a1: 0, a2: 0.08, a3: 0.18 },
      { y: midY, h: 4, a1: 0.15, a2: 0.35, a3: 0.15 },
    ];

    for (const layer of glowLayers) {
      const g = ctx.createLinearGradient(0, layer.y - layer.h / 2, 0, layer.y + layer.h / 2);
      g.addColorStop(0, `rgba(212,168,83,${layer.a1})`);
      g.addColorStop(0.4, `rgba(212,168,83,${layer.a2})`);
      g.addColorStop(0.5, `rgba(240,192,96,${layer.a3})`);
      g.addColorStop(0.6, `rgba(212,168,83,${layer.a2})`);
      g.addColorStop(1, `rgba(212,168,83,${layer.a1})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, layer.y - layer.h / 2, dw, layer.h);
    }

    /* central line */
    ctx.strokeStyle = "rgba(212,168,83,0.35)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(240,192,96,0.3)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(dw, midY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* tick marks based on current drill level */
    if (drill.level === "year") {
      for (let y = 2012; y <= 2026; y++) {
        const x = (y - 2012) * 160 + 120 - scrollX;
        if (x < -50 || x > dw + 50) continue;
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, dh);
        ctx.stroke();
        ctx.fillStyle = "rgba(200,200,220,0.4)";
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(y), x, midY - 70);
      }
    } else if (drill.level === "month" && drill.year !== null) {
      const spacing = winW / 14;
      for (let m = 0; m < 12; m++) {
        const x = m * spacing + spacing * 1.2 - scrollX;
        if (x < -30 || x > dw + 30) continue;
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, midY - 30);
        ctx.lineTo(x, midY + 30);
        ctx.stroke();
      }
    } else if (drill.level === "day" && drill.year !== null && drill.month !== null) {
      const daysInMonth = getDaysInMonth(new Date(drill.year, drill.month, 1));
      const spacing = winW / (daysInMonth + 4);
      for (let d = 1; d <= daysInMonth; d++) {
        const x = d * spacing + spacing * 1.5 - scrollX;
        if (x < -20 || x > dw + 20) continue;
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(x - 0.5, midY - 15, 1, 30);
      }
    }

    /* decorative particles along the line */
    const dotSpacing = 30;
    const startX = -(scrollX % dotSpacing);
    for (let x = startX; x < dw; x += dotSpacing) {
      const phase = (x + scrollX) * 0.03;
      const alpha = 0.04 + 0.06 * Math.abs(Math.sin(phase));
      ctx.beginPath();
      ctx.arc(x, midY, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,168,83,${alpha})`;
      ctx.fill();
    }

    /* present-day marker (2026) */
    if (drill.level === "year") {
      const nowX = (2026 - 2012) * 160 + 120 - scrollX;
      if (nowX > 0 && nowX < dw) {
        ctx.strokeStyle = "rgba(240,192,96,0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(nowX, midY - 50);
        ctx.lineTo(nowX, midY + 50);
        ctx.stroke();
        ctx.setLineDash([]);

        /* pulsing dot */
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.003);
        ctx.beginPath();
        ctx.arc(nowX, midY, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,192,96,${0.3 + pulse * 0.4})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(nowX, midY, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,192,96,${0.05 + pulse * 0.1})`;
        ctx.fill();
      }
    }
  }, [scrollX, drill, winW, winH]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Grid / List views (unchanged logic)                                */
/* ------------------------------------------------------------------ */

function GridView({
  events,
  onNodeClick,
  highlightedId,
}: {
  events: AIEvent[];
  onNodeClick: (e: AIEvent) => void;
  highlightedId: string | null;
}) {
  return (
    <div className="absolute inset-0 top-20 overflow-y-auto px-8 pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {events.map((event, i) => (
          <motion.button
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              boxShadow:
                highlightedId === event.id
                  ? "0 0 30px rgba(212,168,83,0.5)"
                  : "0 4px 24px rgba(0,0,0,0.4)",
            }}
            transition={{ delay: i * 0.03, duration: 0.35 }}
            onClick={() => onNodeClick(event)}
            className="glass-card p-5 text-left hover:border-cosmos-gold/20 transition-all duration-300 group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-cosmos-text-dim font-mono">
                {format(parseISO(event.event_date), "yyyy.MM.dd")}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  event.impact_score >= 95
                    ? "bg-cosmos-gold shadow-[0_0_6px_rgba(212,168,83,0.6)]"
                    : event.impact_score >= 85
                    ? "bg-cosmos-blue"
                    : "bg-cosmos-purple"
                }`}
              />
            </div>
            <h3 className="text-sm font-medium text-cosmos-text leading-snug mb-2 group-hover:text-cosmos-gold transition-colors">
              {event.title}
            </h3>
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-cosmos-surface text-cosmos-text-dim">
                  {tag}
                </span>
              ))}
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
  onNodeClick: (e: AIEvent) => void;
  highlightedId: string | null;
}) {
  return (
    <div className="absolute inset-0 top-20 overflow-y-auto px-8 pb-20">
      <div className="max-w-3xl mx-auto space-y-2">
        {events.map((event, i) => (
          <motion.button
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: 1,
              x: 0,
              boxShadow:
                highlightedId === event.id
                  ? "inset 0 0 0 1px rgba(212,168,83,0.5)"
                  : "none",
            }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
            onClick={() => onNodeClick(event)}
            className="w-full glass-card-light p-4 flex items-center gap-4 text-left hover:bg-cosmos-card/60 transition-all group"
          >
            <div className="flex-shrink-0 w-16 text-right">
              <span className="text-xs text-cosmos-text-dim font-mono">
                {format(parseISO(event.event_date), "yyyy")}
              </span>
              <span className="block text-[10px] text-cosmos-text-dim font-mono">
                {format(parseISO(event.event_date), "MM.dd")}
              </span>
            </div>
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                event.impact_score >= 95
                  ? "bg-cosmos-gold shadow-[0_0_8px_rgba(212,168,83,0.5)]"
                  : "bg-cosmos-blue-dim"
              }`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm text-cosmos-text truncate group-hover:text-cosmos-gold transition-colors">
                {event.title}
              </h3>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {event.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-cosmos-surface text-cosmos-text-dim">
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Timeline                                                      */
/* ------------------------------------------------------------------ */

const monthNames = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export function Timeline({
  events,
  drill,
  viewMode,
  onNodeClick,
  onDrillDown,
  highlightedId,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<RenderNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const animRef = useRef<number | null>(null);
  const targetScrollX = useRef(0);
  const currentScrollX = useRef(0);
  const [winW, setWinW] = useState(1200);
  const [winH, setWinH] = useState(800);
  const [transitioning, setTransitioning] = useState(false);
  const prevDrillKey = useRef("");

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

  /* animate drill-level transitions */
  useEffect(() => {
    const key = `${drill.level}-${drill.year}-${drill.month}`;
    if (key !== prevDrillKey.current && prevDrillKey.current !== "") {
      setTransitioning(true);
      const t = setTimeout(() => setTransitioning(false), 500);
      prevDrillKey.current = key;
      return () => clearTimeout(t);
    }
    prevDrillKey.current = key;
  }, [drill]);

  /* RAF scroll animation */
  const startAnim = useCallback(() => {
    if (animRef.current) return;
    const animate = () => {
      const diff = targetScrollX.current - currentScrollX.current;
      if (Math.abs(diff) < 0.3) {
        currentScrollX.current = targetScrollX.current;
        setScrollX(targetScrollX.current);
        animRef.current = null;
        return;
      }
      currentScrollX.current += diff * 0.08;
      setScrollX(currentScrollX.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    startAnim();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, [startAnim]);

  /* reset scroll on drill change */
  useEffect(() => {
    targetScrollX.current = 0;
    currentScrollX.current = 0;
    setScrollX(0);
  }, [drill.level, drill.year, drill.month]);

  /* input handlers */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const maxScroll = Math.max(0, (drill.level === "year" ? 2500 : drill.level === "month" ? winW * 0.7 : winW * 0.8) - winW);
      targetScrollX.current += e.deltaY;
      targetScrollX.current = Math.max(0, Math.min(targetScrollX.current, maxScroll));
      startAnim();
    },
    [drill.level, winW, startAnim]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
  }, []);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const dx = lastX.current - e.clientX;
      const maxScroll = Math.max(0, (drill.level === "year" ? 2500 : drill.level === "month" ? winW * 0.7 : winW * 0.8) - winW);
      targetScrollX.current += dx;
      targetScrollX.current = Math.max(0, Math.min(targetScrollX.current, maxScroll));
      lastX.current = e.clientX;
      startAnim();
    },
    [drill.level, winW, startAnim]
  );
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  /* ---- build render nodes based on drill level ---- */
  const nodes = useMemo<RenderNode[]>(() => {
    if (drill.level === "year") {
      const map = new Map<number, AIEvent[]>();
      for (const e of events) {
        const y = parseISO(e.event_date).getFullYear();
        if (!map.has(y)) map.set(y, []);
        map.get(y)!.push(e);
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, evts], i) => {
          const x = (year - 2012) * 160 + 120;
          return {
            key: `y-${year}`,
            x,
            y: i % 2 === 0 ? -35 : 35,
            label: String(year),
            subLabel: `${evts.length} 事件`,
            isDrillable: true,
            year,
            events: evts,
            maxImpact: Math.max(...evts.map((e) => e.impact_score)),
            eventCount: evts.length,
          };
        });
    }

    if (drill.level === "month" && drill.year !== null) {
      const map = new Map<number, AIEvent[]>();
      for (const e of events) {
        const d = parseISO(e.event_date);
        if (d.getFullYear() !== drill.year) continue;
        const m = d.getMonth();
        if (!map.has(m)) map.set(m, []);
        map.get(m)!.push(e);
      }
      const spacing = winW / 14;
      return Array.from({ length: 12 }, (_, m) => {
        const evts = map.get(m) || [];
        return {
          key: `m-${drill.year}-${m}`,
          x: m * spacing + spacing * 1.2,
          y: m % 2 === 0 ? -30 : 30,
          label: monthNames[m],
          subLabel: evts.length > 0 ? `${evts.length} 事件` : undefined,
          isDrillable: evts.length > 0,
          year: drill.year!,
          month: m,
          events: evts,
          maxImpact: evts.length > 0 ? Math.max(...evts.map((e) => e.impact_score)) : 0,
          eventCount: evts.length,
        };
      });
    }

    if (drill.level === "day" && drill.year !== null && drill.month !== null) {
      const daysInMonth = getDaysInMonth(new Date(drill.year, drill.month, 1));
      const map = new Map<number, AIEvent[]>();
      for (const e of events) {
        const d = parseISO(e.event_date);
        if (d.getFullYear() !== drill.year || d.getMonth() !== drill.month) continue;
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(e);
      }
      const spacing = winW / (daysInMonth + 4);
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const evts = map.get(day) || [];
        return {
          key: `d-${drill.year}-${drill.month}-${day}`,
          x: day * spacing + spacing * 1.5,
          y: day % 2 === 0 ? -22 : 22,
          label: `${day}日`,
          subLabel: evts.length > 0 ? evts[0].title.slice(0, 12) + "…" : undefined,
          isDrillable: false,
          year: drill.year!,
          month: drill.month!,
          events: evts,
          maxImpact: evts.length > 0 ? Math.max(...evts.map((e) => e.impact_score)) : 0,
          eventCount: evts.length,
        };
      });
    }

    return [];
  }, [events, drill, winW]);

  if (viewMode === "grid") {
    return <GridView events={events} onNodeClick={onNodeClick} highlightedId={highlightedId} />;
  }
  if (viewMode === "list") {
    return <ListView events={events} onNodeClick={onNodeClick} highlightedId={highlightedId} />;
  }

  const midY = winH / 2;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 top-0 cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <TimelineCanvas scrollX={scrollX} drill={drill} winW={winW} winH={winH} />

      {/* Title */}
      <motion.div
        key={`title-${drill.level}-${drill.year}-${drill.month}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute left-8 top-28 pointer-events-none"
      >
        <h2 className="text-2xl font-display text-cosmos-text tracking-wide glow-text">
          {drill.level === "year"
            ? "AI 进化时间线"
            : drill.level === "month"
            ? `${drill.year} 年`
            : `${drill.year}年${(drill.month ?? 0) + 1}月`}
        </h2>
        <p className="text-xs text-cosmos-text-dim mt-1 tracking-wider">
          {drill.level === "year"
            ? "点击年份钻取查看月度事件"
            : drill.level === "month"
            ? "点击月份查看每日详情"
            : "点击事件球查看详情"}
        </p>
      </motion.div>

      {/* Render nodes */}
      <div className="absolute inset-0 pointer-events-none" style={{ top: midY - 60 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`layer-${drill.level}-${drill.year}-${drill.month}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0"
          >
            {nodes.map((node, i) => {
              const nodeX = node.x - scrollX;
              const nodeY = 60 + node.y;
              if (nodeX < -80 || nodeX > winW + 80) return null;

              const isHighlighted =
                highlightedId != null && node.events.some((e) => e.id === highlightedId);
              const hasEvents = node.eventCount > 0;

              /* size based on level + impact */
              const baseSize =
                drill.level === "year" ? 8 : drill.level === "month" ? 6 : 4.5;
              const impactBonus = node.maxImpact >= 95 ? 3 : node.maxImpact >= 85 ? 1.5 : 0;
              const size = baseSize + impactBonus * (drill.level === "day" ? 0.3 : 1);

              const isGold = node.maxImpact >= 90;
              const orbColor = isGold
                ? "rgba(240,192,96,ALPHA)"
                : node.maxImpact >= 80
                ? "rgba(91,141,239,ALPHA)"
                : "rgba(139,92,246,ALPHA)";
              const glowColor = isGold
                ? "rgba(240,192,96,ALPHA)"
                : "rgba(91,141,239,ALPHA)";

              return (
                <motion.div
                  key={node.key}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: i * (drill.level === "day" ? 0.01 : 0.04),
                    duration: 0.4,
                    type: "spring",
                    stiffness: 200,
                    damping: 18,
                  }}
                  className="absolute pointer-events-auto"
                  style={{
                    left: nodeX,
                    top: nodeY,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Orbital ring */}
                  {hasEvents && node.maxImpact >= 85 && drill.level === "year" && (
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cosmos-gold/20"
                      style={{ width: size * 5, height: size * 5 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20 + i * 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {hasEvents && node.maxImpact >= 85 && drill.level === "month" && (
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cosmos-gold/12"
                      style={{ width: size * 4, height: size * 4 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15 + i * 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}

                  {/* Clickable orb */}
                  <button
                    onClick={() => {
                      if (!hasEvents) return;
                      if (node.isDrillable && drill.level !== "day") {
                        onDrillDown(node.year, node.month);
                      } else if (drill.level === "day" && node.events.length === 1) {
                        onNodeClick(node.events[0]);
                      } else if (drill.level === "day" && node.events.length > 1) {
                        const top = node.events.reduce((a, b) =>
                          a.impact_score >= b.impact_score ? a : b
                        );
                        onNodeClick(top);
                      } else if (drill.level === "year" && node.isDrillable) {
                        onDrillDown(node.year);
                      } else if (drill.level === "month" && node.isDrillable) {
                        onDrillDown(node.year, node.month);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!hasEvents) return;
                      setHoveredNode(node);
                      setTooltipPos({ x: nodeX, y: 60 + node.y - size * 3 });
                    }}
                    onMouseLeave={() => setHoveredNode(null)}
                    aria-label={
                      hasEvents
                        ? `${node.label}: ${node.eventCount}个事件`
                        : `${node.label}: 无事件`
                    }
                    className={`block relative z-10 transition-all duration-300 ${
                      hasEvents
                        ? "hover:scale-150 cursor-pointer"
                        : "cursor-default opacity-30"
                    }`}
                    style={{ width: size * 2.2, height: size * 2.2 }}
                  >
                    {/* Outer glow */}
                    {hasEvents && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${glowColor.replace("ALPHA", "0.35")} 0%, transparent 70%)`,
                        }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 3 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    {/* Core */}
                    <div
                      className="absolute inset-[15%] rounded-full transition-shadow duration-300"
                      style={{
                        background: isHighlighted
                          ? `radial-gradient(circle at 40% 35%, ${orbColor.replace("ALPHA", "0.95")} 0%, ${orbColor.replace("ALPHA", "0.5")} 50%, transparent 100%)`
                          : `radial-gradient(circle at 40% 35%, ${orbColor.replace("ALPHA", "0.85")} 0%, ${orbColor.replace("ALPHA", "0.35")} 50%, transparent 100%)`,
                        boxShadow: isHighlighted
                          ? `0 0 ${size * 4}px ${glowColor.replace("ALPHA", "0.7")}`
                          : hasEvents && node.maxImpact >= 90
                          ? `0 0 ${size * 2.5}px ${glowColor.replace("ALPHA", "0.35")}`
                          : "none",
                      }}
                    />
                  </button>

                  {/* Label */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                    style={{ top: size * 1.5 + 8 }}
                  >
                    <span
                      className={`text-center font-mono transition-all duration-300 ${
                        drill.level === "day"
                          ? "text-[9px]"
                          : drill.level === "month"
                          ? "text-[10px]"
                          : "text-xs"
                      } ${
                        isHighlighted
                          ? "text-cosmos-gold"
                          : hasEvents
                          ? "text-cosmos-text-dim"
                          : "text-cosmos-text-dim/30"
                      }`}
                    >
                      {node.label}
                    </span>
                    {node.subLabel && (
                      <span className="block text-[8px] text-cosmos-text-dim/60 mt-0.5 text-center">
                        {node.subLabel}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && hoveredNode.eventCount > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed z-50 glass-card p-3 min-w-[200px] max-w-[280px] pointer-events-none"
            style={{
              left: Math.min(tooltipPos.x, winW - 300),
              top: tooltipPos.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="text-[9px] text-cosmos-text-dim mb-1.5 uppercase tracking-wider">
              {hoveredNode.label} · {hoveredNode.eventCount} 个事件
            </p>
            {hoveredNode.events.slice(0, 3).map((e) => (
              <p key={e.id} className="text-[11px] text-cosmos-text leading-snug truncate">
                {e.title}
              </p>
            ))}
            {hoveredNode.events.length > 3 && (
              <p className="text-[10px] text-cosmos-text-dim mt-0.5">
                +{hoveredNode.events.length - 3} 更多…
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
