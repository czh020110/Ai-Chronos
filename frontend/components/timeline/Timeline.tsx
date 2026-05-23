"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIEvent, ViewMode, DrillState } from "@/lib/types";
import { format, parseISO, getDaysInMonth } from "date-fns";

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

const monthNames = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

const levelMeta = {
  year: {
    title: "纪年星图",
    subtitle: "点击年份进入月度透镜，观察 AI 事件如何在不同周期聚集。",
    code: "YEAR ATLAS",
  },
  month: {
    title: "月度透镜",
    subtitle: "点击有事件的月份，进入日级轨迹并查看具体事件。",
    code: "MONTH LENS",
  },
  day: {
    title: "日级轨迹",
    subtitle: "点击发光节点打开事件档案，阅读 Markdown 详情与来源。",
    code: "DAY TRACE",
  },
};

function TimelineCanvas({
  scrollX,
  drill,
  nodes,
  winW,
  winH,
}: {
  scrollX: number;
  drill: DrillState;
  nodes: RenderNode[];
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
    const midY = height / 2;
    const time = Date.now();

    ctx.clearRect(0, 0, width, height);

    const horizon = ctx.createLinearGradient(0, midY - 210, 0, midY + 210);
    horizon.addColorStop(0, "rgba(91,141,239,0)");
    horizon.addColorStop(0.36, "rgba(91,141,239,0.08)");
    horizon.addColorStop(0.5, "rgba(240,192,96,0.18)");
    horizon.addColorStop(0.64, "rgba(139,92,246,0.09)");
    horizon.addColorStop(1, "rgba(91,141,239,0)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, midY - 210, width, 420);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let layer = 0; layer < 5; layer++) {
      ctx.beginPath();
      const amp = 10 + layer * 13;
      const phase = scrollX * 0.005 + layer * 1.4 + time * 0.00045;
      ctx.moveTo(-60, midY + Math.sin(phase) * amp);
      for (let x = -60; x <= width + 80; x += 40) {
        const y = midY + Math.sin(x * 0.012 + phase) * amp + Math.cos(x * 0.006 + phase * 0.7) * amp * 0.5;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = layer % 2 === 0
        ? `rgba(240,192,96,${0.09 - layer * 0.01})`
        : `rgba(91,141,239,${0.08 - layer * 0.008})`;
      ctx.lineWidth = 34 - layer * 5;
      ctx.shadowBlur = 24;
      ctx.shadowColor = layer % 2 === 0 ? "rgba(240,192,96,0.24)" : "rgba(91,141,239,0.22)";
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(240,192,96,0.48)";
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(240,192,96,0.36)";
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();
    ctx.restore();

    const tickAlpha = drill.level === "year" ? 0.09 : drill.level === "month" ? 0.07 : 0.045;
    for (const node of nodes) {
      const x = node.x - scrollX;
      if (x < -80 || x > width + 80) continue;
      const major = node.eventCount > 0;

      ctx.strokeStyle = major ? `rgba(240,192,96,${tickAlpha + 0.08})` : `rgba(255,255,255,${tickAlpha})`;
      ctx.lineWidth = major ? 1 : 0.6;
      ctx.beginPath();
      ctx.moveTo(x, midY - (major ? 52 : 24));
      ctx.lineTo(x, midY + (major ? 52 : 24));
      ctx.stroke();

      if (major) {
        const radius = drill.level === "year" ? 54 : drill.level === "month" ? 42 : 28;
        const gradient = ctx.createRadialGradient(x, midY, 0, x, midY, radius);
        gradient.addColorStop(0, "rgba(240,192,96,0.12)");
        gradient.addColorStop(0.48, "rgba(91,141,239,0.055)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, midY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const dotSpacing = drill.level === "day" ? 18 : 28;
    const startX = -(scrollX % dotSpacing);
    for (let x = startX; x < width; x += dotSpacing) {
      const pulse = 0.38 + 0.62 * Math.abs(Math.sin((x + scrollX) * 0.035 + time * 0.0012));
      ctx.beginPath();
      ctx.arc(x, midY, 0.9 + pulse * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,192,96,${0.045 + pulse * 0.06})`;
      ctx.fill();
    }

    if (drill.level === "year") {
      const markerX = (2026 - 2012) * 172 + Math.max(170, winW * 0.17) - scrollX;
      if (markerX > 0 && markerX < width) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.004);
        ctx.save();
        ctx.setLineDash([3, 9]);
        ctx.strokeStyle = `rgba(240,192,96,${0.18 + pulse * 0.12})`;
        ctx.beginPath();
        ctx.moveTo(markerX, midY - 96);
        ctx.lineTo(markerX, midY + 96);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = `rgba(240,192,96,${0.16 + pulse * 0.22})`;
        ctx.beginPath();
        ctx.arc(markerX, midY, 9 + pulse * 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [scrollX, drill, nodes, winW, winH]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />;
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
    <div className="absolute inset-x-0 bottom-0 top-24 z-20 overflow-y-auto px-5 pb-28 xl:left-[410px] 2xl:right-[335px]">
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
    <div className="absolute inset-x-0 bottom-0 top-24 z-20 overflow-y-auto px-5 pb-28 xl:left-[430px] 2xl:right-[355px]">
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
              <span className="text-[10px] tracking-[0.16em] text-cosmos-text-dim">{format(parseISO(event.event_date), "MM.DD")}</span>
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
  drill,
  viewMode,
  onNodeClick,
  onDrillDown,
  highlightedId,
}: TimelineProps) {
  const [scrollX, setScrollX] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<RenderNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [winW, setWinW] = useState(1200);
  const [winH, setWinH] = useState(800);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const animRef = useRef<number | null>(null);
  const targetScrollX = useRef(0);
  const currentScrollX = useRef(0);

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

  const nodes = useMemo<RenderNode[]>(() => {
    const leftPad = Math.max(170, winW * 0.17);

    if (drill.level === "year") {
      const map = new Map<number, AIEvent[]>();
      for (const event of events) {
        const year = parseISO(event.event_date).getFullYear();
        map.set(year, [...(map.get(year) ?? []), event]);
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, evts], index) => ({
          key: `y-${year}`,
          x: (year - 2012) * 172 + leftPad,
          y: index % 2 === 0 ? -108 : 100,
          label: String(year),
          subLabel: `${evts.length} 个事件`,
          isDrillable: true,
          year,
          events: evts.sort((a, b) => b.impact_score - a.impact_score),
          maxImpact: Math.max(...evts.map((event) => event.impact_score)),
          eventCount: evts.length,
        }));
    }

    if (drill.level === "month" && drill.year !== null) {
      const map = new Map<number, AIEvent[]>();
      for (const event of events) {
        const date = parseISO(event.event_date);
        if (date.getFullYear() !== drill.year) continue;
        const month = date.getMonth();
        map.set(month, [...(map.get(month) ?? []), event]);
      }
      const spacing = Math.max(106, winW / 11.5);
      return Array.from({ length: 12 }, (_, month) => {
        const evts = (map.get(month) ?? []).sort((a, b) => b.impact_score - a.impact_score);
        return {
          key: `m-${drill.year}-${month}`,
          x: month * spacing + Math.max(130, winW * 0.1),
          y: month % 2 === 0 ? -92 : 92,
          label: monthNames[month],
          subLabel: evts.length > 0 ? `${evts.length} 个事件` : "静默区间",
          isDrillable: evts.length > 0,
          year: drill.year!,
          month,
          events: evts,
          maxImpact: evts.length > 0 ? Math.max(...evts.map((event) => event.impact_score)) : 0,
          eventCount: evts.length,
        };
      });
    }

    if (drill.level === "day" && drill.year !== null && drill.month !== null) {
      const daysInMonth = getDaysInMonth(new Date(drill.year, drill.month, 1));
      const map = new Map<number, AIEvent[]>();
      for (const event of events) {
        const date = parseISO(event.event_date);
        if (date.getFullYear() !== drill.year || date.getMonth() !== drill.month) continue;
        const day = date.getDate();
        map.set(day, [...(map.get(day) ?? []), event]);
      }
      const spacing = Math.max(58, winW / Math.min(daysInMonth + 3, 19));
      return Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const evts = (map.get(day) ?? []).sort((a, b) => b.impact_score - a.impact_score);
        return {
          key: `d-${drill.year}-${drill.month}-${day}`,
          x: day * spacing + Math.max(70, winW * 0.06),
          y: day % 2 === 0 ? -72 : 72,
          label: `${day}`,
          subLabel: evts.length > 0 ? evts[0].title : undefined,
          isDrillable: false,
          year: drill.year!,
          month: drill.month!,
          events: evts,
          maxImpact: evts.length > 0 ? Math.max(...evts.map((event) => event.impact_score)) : 0,
          eventCount: evts.length,
        };
      });
    }

    return [];
  }, [events, drill, winW]);

  const totalWidth = useMemo(() => {
    if (nodes.length === 0) return winW;
    return Math.max(winW, Math.max(...nodes.map((node) => node.x)) + Math.max(260, winW * 0.16));
  }, [nodes, winW]);

  const maxScroll = Math.max(0, totalWidth - winW);

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
      currentScrollX.current += diff * 0.09;
      setScrollX(currentScrollX.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, []);

  useEffect(() => {
    targetScrollX.current = 0;
    currentScrollX.current = 0;
    setScrollX(0);
  }, [drill.level, drill.year, drill.month]);

  useEffect(() => {
    targetScrollX.current = Math.max(0, Math.min(targetScrollX.current, maxScroll));
    currentScrollX.current = Math.max(0, Math.min(currentScrollX.current, maxScroll));
    setScrollX((value) => Math.max(0, Math.min(value, maxScroll)));
  }, [maxScroll]);

  const moveTarget = useCallback((delta: number) => {
    targetScrollX.current = Math.max(0, Math.min(targetScrollX.current + delta, maxScroll));
    startAnim();
  }, [maxScroll, startAnim]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    moveTarget(Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY);
  }, [moveTarget]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = event.clientX;
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging.current) return;
    const delta = lastX.current - event.clientX;
    lastX.current = event.clientX;
    moveTarget(delta);
  }, [moveTarget]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const openNode = useCallback((node: RenderNode) => {
    if (node.eventCount === 0) return;
    if (node.isDrillable && drill.level === "year") {
      onDrillDown(node.year);
      return;
    }
    if (node.isDrillable && drill.level === "month") {
      onDrillDown(node.year, node.month);
      return;
    }
    onNodeClick(node.events[0]);
  }, [drill.level, onDrillDown, onNodeClick]);

  if (viewMode === "grid") {
    return <GridView events={events} onNodeClick={onNodeClick} highlightedId={highlightedId} />;
  }

  if (viewMode === "list") {
    return <ListView events={events} onNodeClick={onNodeClick} highlightedId={highlightedId} />;
  }

  const meta = levelMeta[drill.level];
  const midY = winH / 2;

  return (
    <div
      className="absolute inset-0 z-10 cursor-grab select-none active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <TimelineCanvas scrollX={scrollX} drill={drill} nodes={nodes} winW={winW} winH={winH} />

      <motion.div
        key={`title-${drill.level}-${drill.year}-${drill.month}`}
        initial={{ opacity: 0, y: -18, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="pointer-events-none absolute left-5 top-[104px] z-20 max-w-[calc(100vw-40px)] xl:left-[430px]"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cosmos-gold/20 bg-cosmos-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-cosmos-gold">
            {meta.code}
          </span>
          <span className="hidden h-px w-24 bg-gradient-to-r from-cosmos-gold/50 to-transparent md:block" />
        </div>
        <h2 className="mt-4 font-display text-4xl leading-none tracking-[-0.04em] aurora-text md:text-5xl">
          {drill.level === "year" ? meta.title : drill.level === "month" ? `${drill.year} · ${meta.title}` : `${drill.year}.${(drill.month ?? 0) + 1} · ${meta.title}`}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-cosmos-text-dim">{meta.subtitle}</p>
      </motion.div>

      <div className="pointer-events-none absolute inset-0" style={{ top: midY - 130 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`layer-${drill.level}-${drill.year}-${drill.month}`}
            initial={{ opacity: 0, scale: 0.96, filter: "blur(18px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.04, filter: "blur(18px)" }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {nodes.map((node, index) => {
              const nodeX = node.x - scrollX;
              const nodeY = 130 + node.y;
              if (nodeX < -180 || nodeX > winW + 180) return null;

              const hasEvents = node.eventCount > 0;
              const isHighlighted = highlightedId != null && node.events.some((event) => event.id === highlightedId);
              const isMajor = node.maxImpact >= 95;
              const isStrong = node.maxImpact >= 85;
              const nodeSize = drill.level === "year" ? (isMajor ? 20 : 15) : drill.level === "month" ? (isStrong ? 17 : 12) : (hasEvents ? 11 : 5);
              const cardWidth = drill.level === "day" ? 150 : drill.level === "month" ? 168 : 190;
              const cardOffset = node.y < 0 ? -106 : 28;
              const accent = isMajor
                ? "rgba(240,192,96,ALPHA)"
                : node.maxImpact >= 80
                  ? "rgba(91,141,239,ALPHA)"
                  : "rgba(139,92,246,ALPHA)";

              return (
                <motion.div
                  key={node.key}
                  initial={{ opacity: 0, y: node.y < 0 ? -28 : 28, scale: 0.72, rotateX: node.y < 0 ? 18 : -18 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  transition={{
                    delay: index * (drill.level === "day" ? 0.012 : 0.035),
                    duration: 0.52,
                    type: "spring",
                    stiffness: 210,
                    damping: 22,
                  }}
                  className="absolute pointer-events-auto"
                  style={{ left: nodeX, top: nodeY, transform: "translate(-50%, -50%)" }}
                >
                  {hasEvents && (
                    <>
                      <motion.div
                        className="absolute left-1/2 top-1/2 rounded-full border border-cosmos-gold/20"
                        style={{ width: nodeSize * 4.7, height: nodeSize * 4.7, marginLeft: nodeSize * -2.35, marginTop: nodeSize * -2.35 }}
                        animate={{ rotate: 360, scale: [1, 1.08, 1] }}
                        transition={{ rotate: { duration: 18 + index, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity } }}
                      />
                      {isStrong && (
                        <motion.div
                          className="absolute left-1/2 top-1/2 rounded-full border border-cosmos-blue/18"
                          style={{ width: nodeSize * 6.2, height: nodeSize * 6.2, marginLeft: nodeSize * -3.1, marginTop: nodeSize * -3.1 }}
                          animate={{ rotate: -360 }}
                          transition={{ duration: 24 + index * 0.5, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                    </>
                  )}

                  <button
                    onClick={() => openNode(node)}
                    onMouseEnter={() => {
                      if (!hasEvents) return;
                      setHoveredNode(node);
                      setTooltipPos({ x: nodeX, y: nodeY + cardOffset });
                    }}
                    onMouseLeave={() => setHoveredNode(null)}
                    aria-label={hasEvents ? `${node.label}: ${node.eventCount} 个事件` : `${node.label}: 无事件`}
                    className={`relative z-10 flex items-center justify-center rounded-full border transition-all duration-300 ${
                      hasEvents
                        ? "cursor-pointer border-cosmos-gold/35 hover:scale-125 hover:border-cosmos-gold/80"
                        : "cursor-default border-white/10 opacity-25"
                    }`}
                    style={{
                      width: nodeSize * 2,
                      height: nodeSize * 2,
                      background: hasEvents
                        ? `radial-gradient(circle at 34% 28%, ${accent.replace("ALPHA", "0.96")} 0%, ${accent.replace("ALPHA", "0.42")} 48%, rgba(3,4,10,0.12) 100%)`
                        : "rgba(255,255,255,0.06)",
                      boxShadow: hasEvents
                        ? isHighlighted
                          ? `0 0 ${nodeSize * 4}px ${accent.replace("ALPHA", "0.78")}, inset 0 0 ${nodeSize}px rgba(255,255,255,0.22)`
                          : `0 0 ${nodeSize * 2.8}px ${accent.replace("ALPHA", isStrong ? "0.42" : "0.18")}`
                        : "none",
                    }}
                  >
                    {hasEvents && <span className="h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.65)]" />}
                  </button>

                  <div
                    className="absolute left-1/2 z-0 -translate-x-1/2 pointer-events-none"
                    style={{ top: cardOffset, width: cardWidth }}
                  >
                    <div className={`rounded-2xl border px-4 py-3 backdrop-blur-xl transition-all duration-300 ${
                      hasEvents
                        ? "border-white/[0.09] bg-[#080a16]/72 shadow-[0_18px_55px_rgba(0,0,0,0.36)]"
                        : "border-white/[0.035] bg-white/[0.025]"
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className={`font-mono ${drill.level === "day" ? "text-xl" : "text-2xl"} leading-none ${hasEvents ? "text-cosmos-text" : "text-cosmos-text-dim/45"}`}>
                          {node.label}
                        </span>
                        {hasEvents && (
                          <span className="rounded-full bg-cosmos-gold/10 px-2 py-0.5 font-mono text-[9px] text-cosmos-gold">
                            {node.maxImpact}
                          </span>
                        )}
                      </div>
                      {node.subLabel && (
                        <p className={`mt-2 line-clamp-2 text-[10px] leading-4 ${hasEvents ? "text-cosmos-text-dim" : "text-cosmos-text-dim/35"}`}>
                          {node.subLabel}
                        </p>
                      )}
                      {hasEvents && (
                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${node.maxImpact}%` }}
                            transition={{ duration: 0.75, delay: 0.12 + index * 0.015 }}
                            className="h-full rounded-full bg-gradient-to-r from-cosmos-blue via-cosmos-gold to-cosmos-accent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {hoveredNode && hoveredNode.eventCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed z-50 w-[300px] max-w-[calc(100vw-32px)] rounded-3xl border border-white/[0.09] bg-[#070914]/88 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-2xl pointer-events-none"
            style={{
              left: Math.max(16, Math.min(tooltipPos.x - 150, winW - 316)),
              top: Math.max(100, Math.min(tooltipPos.y, winH - 230)),
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-gold">
                {hoveredNode.label} · {hoveredNode.eventCount} Events
              </p>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-cosmos-text-dim">
                {hoveredNode.maxImpact}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {hoveredNode.events.slice(0, 3).map((event) => (
                <div key={event.id} className="rounded-2xl bg-white/[0.04] px-3 py-2">
                  <p className="truncate text-xs text-cosmos-text">{event.title}</p>
                  <p className="mt-1 font-mono text-[9px] text-cosmos-text-dim">
                    {format(parseISO(event.event_date), "yyyy.MM.dd")}
                  </p>
                </div>
              ))}
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
