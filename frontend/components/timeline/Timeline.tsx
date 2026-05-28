"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AIEvent,
  ThemeMode,
  TimelineBucket,
  TimelineFocus,
  TimelineScale,
  TimelineUnit,
  ViewMode,
} from "@/lib/types";
import { format, parseISO, getDaysInMonth } from "date-fns";

interface TimelineProps {
  events: AIEvent[];
  timelineScale: TimelineScale;
  viewMode: ViewMode;
  onTimelineScaleChange: (scale: TimelineScale) => void;
  onFocusChange: (focus: TimelineFocus | null) => void;
  onNodeClick: (bucket: TimelineBucket) => void;
  highlightedId: string | null;
  theme: ThemeMode;
}

type TimeUnit = TimelineUnit;

interface RenderNode {
  key: string;
  yearIndex: number;
  angle: number;
  radius: number;
  label: string;
  subLabel?: string;
  unit: TimeUnit;
  year: number;
  month?: number;
  day?: number;
  dayProgress?: number;
  events: AIEvent[];
  maxImpact: number;
  eventCount: number;
}

interface LayoutMetrics {
  monthReveal: number;
  dayReveal: number;
  yearGap: number;
  monthGap: number;
  daySpread: number;
}

type SelectionAnchor = Pick<RenderNode, "key" | "unit" | "year" | "month" | "day">;

const monthNames = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
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
    subtitle: "年份主星保持存在并平滑拉开，月份星球沿中轨浮现。",
    code: "Y + M",
  },
  {
    key: "day",
    label: "年 + 月 + 日",
    title: "全息日迹",
    subtitle: "在外轨展开日级星点，形成三层同心螺旋的完整视图。",
    code: "Y + M + D",
  },
];

const unitCopy: Record<TimeUnit, string> = {
  year: "年份主星",
  month: "月份星球",
  day: "日级星点",
};

const SCALE_INDEX: Record<TimelineScale, number> = {
  year: 0,
  month: 1,
  day: 2,
};

const ORBIT_RADIUS: Record<TimeUnit, number> = {
  year: 104,
  month: 168,
  day: 236,
};

const ANGLE_STEP: Record<TimeUnit, number> = {
  year: 0.92,
  month: 0.58,
  day: 0.58,
};

const YEAR_GAP = {
  compact: 320,
  expandedMonth: 940,
  expandedDay: 1060,
};

const MONTH_GAP = {
  month: 84,
  day: 94,
};

const DAY_SPREAD_RATIO = 0.88;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function eventImpact(events: AIEvent[]) {
  return events.length > 0
    ? Math.max(...events.map((event) => event.impact_score))
    : 0;
}

function bucketFromNode(node: RenderNode): TimelineBucket {
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

function getLayoutMetrics(scaleBlend: number): LayoutMetrics {
  const monthReveal = clamp(scaleBlend, 0, 1);
  const dayReveal = clamp(scaleBlend - 1, 0, 1);

  const yearGapFromMonth = lerp(
    YEAR_GAP.compact,
    YEAR_GAP.expandedMonth,
    monthReveal,
  );
  const yearGap = lerp(yearGapFromMonth, YEAR_GAP.expandedDay, dayReveal);
  const monthGapFromMonth = lerp(0, MONTH_GAP.month, monthReveal);
  const monthGap = lerp(monthGapFromMonth, MONTH_GAP.day, dayReveal);
  const daySpread = monthGap * DAY_SPREAD_RATIO * dayReveal;

  return {
    monthReveal,
    dayReveal,
    yearGap,
    monthGap,
    daySpread,
  };
}

function getUnitReveal(unit: TimeUnit, layout: LayoutMetrics) {
  if (unit === "year") return 1;
  if (unit === "month") return layout.monthReveal;
  return layout.dayReveal;
}

function isUnitActiveForScale(unit: TimeUnit, timelineScale: TimelineScale) {
  if (timelineScale === "year") return unit === "year";
  if (timelineScale === "month") return unit === "year" || unit === "month";
  return true;
}

function computeNodeWorldX(
  node: RenderNode,
  leftPad: number,
  layout: LayoutMetrics,
) {
  const groupStartX = leftPad + node.yearIndex * layout.yearGap;

  if (node.unit === "year") {
    return groupStartX + 5.5 * layout.monthGap * layout.monthReveal;
  }

  if (node.unit === "month") {
    return groupStartX + (node.month ?? 0) * layout.monthGap;
  }

  return (
    groupStartX +
    (node.month ?? 0) * layout.monthGap +
    (node.dayProgress ?? 0) * layout.daySpread
  );
}

function sortNodesByTargetX(
  nodes: RenderNode[],
  leftPad: number,
  layout: LayoutMetrics,
) {
  return [...nodes].sort((a, b) => {
    const diff = computeNodeWorldX(a, leftPad, layout) - computeNodeWorldX(b, leftPad, layout);
    if (diff !== 0) return diff;
    return a.unit.localeCompare(b.unit);
  });
}

function TimelineCanvas({
  scrollX,
  globalRotation,
  layout,
  winW,
  winH,
  theme,
}: {
  scrollX: number;
  globalRotation: number;
  layout: LayoutMetrics;
  winW: number;
  winH: number;
  theme: ThemeMode;
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
    const isDay = theme === "day";

    ctx.clearRect(0, 0, width, height);

    const horizon = ctx.createLinearGradient(0, axisY - 260, 0, axisY + 260);
    horizon.addColorStop(0, isDay ? "rgba(255,255,255,0)" : "rgba(91,141,239,0)");
    horizon.addColorStop(0.38, isDay ? "rgba(104,145,210,0.045)" : "rgba(91,141,239,0.05)");
    horizon.addColorStop(0.5, isDay ? "rgba(156,111,58,0.07)" : "rgba(240,192,96,0.12)");
    horizon.addColorStop(0.62, isDay ? "rgba(130,121,176,0.04)" : "rgba(139,92,246,0.055)");
    horizon.addColorStop(1, isDay ? "rgba(255,255,255,0)" : "rgba(91,141,239,0)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, axisY - 260, width, 520);

    ctx.save();
    ctx.strokeStyle = isDay ? "rgba(98,92,82,0.22)" : "rgba(240,192,96,0.34)";
    ctx.lineWidth = isDay ? 1.15 : 1;
    ctx.shadowBlur = isDay ? 0 : 18;
    ctx.shadowColor = isDay ? "rgba(98,92,82,0)" : "rgba(240,192,96,0.28)";
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
    ctx.stroke();
    ctx.restore();

    const tracks = [
      {
        radius: ORBIT_RADIUS.year,
        opacity: 1,
        step: ANGLE_STEP.year / Math.max(layout.yearGap, 1),
        rgb: isDay ? "150,113,62" : "240,192,96",
        frontAlpha: isDay ? 0.2 : 0.24,
        backAlpha: isDay ? 0.1 : 0.12,
        frontBlur: isDay ? 0 : 20,
        backBlur: isDay ? 0 : 12,
        frontWidth: isDay ? 1.1 : 1.2,
        backWidth: isDay ? 0.78 : 0.9,
      },
      {
        radius: ORBIT_RADIUS.month,
        opacity: layout.monthReveal,
        step: ANGLE_STEP.month / Math.max(layout.monthGap, 1),
        rgb: isDay ? "82,119,179" : "91,141,239",
        frontAlpha: isDay ? 0.18 : 0.22,
        backAlpha: isDay ? 0.08 : 0.1,
        frontBlur: isDay ? 0 : 18,
        backBlur: isDay ? 0 : 10,
        frontWidth: isDay ? 1 : 1.1,
        backWidth: isDay ? 0.72 : 0.8,
      },
      {
        radius: ORBIT_RADIUS.day,
        opacity: layout.dayReveal,
        step:
          ANGLE_STEP.day /
          Math.max(layout.daySpread > 0 ? layout.daySpread : layout.monthGap, 1),
        rgb: isDay ? "118,109,170" : "139,92,246",
        frontAlpha: isDay ? 0.12 : 0.18,
        backAlpha: isDay ? 0.055 : 0.08,
        frontBlur: isDay ? 0 : 16,
        backBlur: isDay ? 0 : 9,
        frontWidth: isDay ? 0.82 : 0.95,
        backWidth: isDay ? 0.58 : 0.7,
      },
    ];

    ctx.save();
    ctx.globalCompositeOperation = isDay ? "source-over" : "screen";

    for (const track of tracks) {
      if (track.opacity <= 0.01) continue;

      for (const rail of [0, Math.PI]) {
        ctx.beginPath();

        for (let x = -120; x <= width + 120; x += 18) {
          const worldX = x + scrollX;
          const phase = worldX * track.step + rail + globalRotation;
          const y = axisY + Math.sin(phase) * track.radius;
          if (x === -120) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const alpha =
          (rail === 0 ? track.frontAlpha : track.backAlpha) * track.opacity;
        const blur = rail === 0 ? track.frontBlur : track.backBlur;
        const lineWidth = rail === 0 ? track.frontWidth : track.backWidth;

        ctx.strokeStyle = `rgba(${track.rgb}, ${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.shadowBlur = blur * track.opacity;
        ctx.shadowColor = `rgba(${track.rgb}, ${alpha + 0.06})`;
        ctx.stroke();
      }
    }

    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = isDay ? "source-over" : "screen";
    const centerGlow = ctx.createRadialGradient(
      width / 2,
      axisY,
      0,
      width / 2,
      axisY,
      190,
    );
    if (isDay) {
      centerGlow.addColorStop(0, "rgba(255,255,255,0.04)");
      centerGlow.addColorStop(0.28, "rgba(156,111,58,0.035)");
      centerGlow.addColorStop(0.6, "rgba(82,119,179,0.025)");
      centerGlow.addColorStop(1, "rgba(255,255,255,0)");
    } else {
      centerGlow.addColorStop(0, "rgba(255,236,180,0.28)");
      centerGlow.addColorStop(0.2, "rgba(240,192,96,0.13)");
      centerGlow.addColorStop(0.56, "rgba(91,141,239,0.05)");
      centerGlow.addColorStop(0.82, "rgba(139,92,246,0.04)");
      centerGlow.addColorStop(1, "rgba(255,255,255,0)");
    }
    ctx.fillStyle = centerGlow;
    ctx.fillRect(width / 2 - 220, axisY - 220, 440, 440);
    ctx.restore();
  }, [scrollX, globalRotation, layout, winW, winH, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

function GridView({
  buckets,
  onNodeClick,
  highlightedId,
  theme,
}: {
  buckets: RenderNode[];
  onNodeClick: (bucket: TimelineBucket) => void;
  highlightedId: string | null;
  theme: ThemeMode;
}) {
  const isDay = theme === "day";

  return (
    <div className="absolute inset-x-0 bottom-0 top-24 z-20 overflow-y-auto px-5 pb-28 2xl:right-[335px]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {buckets.map((bucket, index) => {
          const topEvent = bucket.events[0];
          const isHighlighted = topEvent ? highlightedId === topEvent.id : false;

          return (
            <motion.button
              key={bucket.key}
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                boxShadow:
                  isHighlighted
                    ? isDay
                      ? "0 0 0 1px rgba(162,118,46,0.28), 0 14px 34px rgba(132,104,68,0.1)"
                      : "0 0 0 1px rgba(240,192,96,0.5), 0 22px 70px rgba(212,168,83,0.16)"
                    : isDay
                      ? "0 10px 28px rgba(84,75,62,0.08)"
                      : "0 22px 70px rgba(0,0,0,0.32)",
              }}
              transition={{
                delay: index * 0.025,
                duration: 0.42,
                ease: "easeOut",
              }}
              onClick={() => onNodeClick(bucketFromNode(bucket))}
              className="group chronos-panel min-h-[190px] p-5 text-left transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-cosmos-text-dim">
                    {unitCopy[bucket.unit]}
                  </span>
                  <span className="rounded-full border border-cosmos-gold/20 bg-cosmos-gold/10 px-2 py-0.5 font-mono text-[10px] text-cosmos-gold">
                    {bucket.maxImpact}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl leading-tight text-cosmos-text transition-colors group-hover:text-cosmos-gold">
                  {bucket.label}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-cosmos-text-dim">
                  {bucket.subLabel}
                </p>
                <div className="mt-auto pt-5">
                  <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${bucket.maxImpact}%` }}
                      transition={{ duration: 0.8, delay: index * 0.02 }}
                      className="h-full rounded-full bg-gradient-to-r from-cosmos-blue via-cosmos-gold to-cosmos-accent"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-white/10 bg-cosmos-surface/55 px-2 py-0.5 text-[10px] text-cosmos-text-dim">
                      {bucket.eventCount} 个事件
                    </span>
                    {topEvent?.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-cosmos-surface/55 px-2 py-0.5 text-[10px] text-cosmos-text-dim"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ListView({
  buckets,
  onNodeClick,
  highlightedId,
}: {
  buckets: RenderNode[];
  onNodeClick: (bucket: TimelineBucket) => void;
  highlightedId: string | null;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 top-24 z-20 overflow-y-auto px-5 pb-28 2xl:right-[355px]">
      <div className="mx-auto max-w-4xl space-y-3">
        {buckets.map((bucket, index) => {
          const topEvent = bucket.events[0];
          const isHighlighted = topEvent ? highlightedId === topEvent.id : false;

          return (
            <motion.button
              key={bucket.key}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.018, duration: 0.36 }}
              onClick={() => onNodeClick(bucketFromNode(bucket))}
              className={`group grid w-full grid-cols-[88px_1fr_auto] items-center gap-5 rounded-2xl border px-5 py-4 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cosmos-gold/25 ${
                isHighlighted
                  ? "border-cosmos-gold/45 bg-cosmos-gold/10 shadow-[0_0_34px_rgba(212,168,83,0.18)]"
                  : "border-cosmos-border/30 bg-white/[0.035]"
              }`}
            >
              <div className="font-mono text-right">
                <span className="block text-sm text-cosmos-gold">
                  {bucket.label}
                </span>
                <span className="text-[10px] tracking-[0.16em] text-cosmos-text-dim">
                  {unitCopy[bucket.unit]}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm text-cosmos-text transition-colors group-hover:text-cosmos-gold">
                  {bucket.subLabel ?? bucket.label}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] text-cosmos-text-dim">
                    {bucket.eventCount} 个事件
                  </span>
                  {topEvent?.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] text-cosmos-text-dim"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-cosmos-surface/55 px-2.5 py-1 font-mono text-[10px] text-cosmos-text-dim">
                {bucket.maxImpact}
              </span>
            </motion.button>
          );
        })}
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
  theme,
}: TimelineProps) {
  const [scrollX, setScrollX] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<RenderNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [winW, setWinW] = useState(1200);
  const [winH, setWinH] = useState(800);
  const [globalRotation, setGlobalRotation] = useState(0);
  const [scaleBlend, setScaleBlend] = useState(SCALE_INDEX[timelineScale]);
  const isDay = theme === "day";
  const lastFocusKey = useRef<string | null>(null);
  const selectionAnchorRef = useRef<SelectionAnchor | null>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const dragDelta = useRef(0);
  const animRef = useRef<number | null>(null);
  const targetScrollX = useRef(0);
  const currentScrollX = useRef(0);
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);
  const targetScaleBlend = useRef(SCALE_INDEX[timelineScale]);
  const currentScaleBlend = useRef(SCALE_INDEX[timelineScale]);
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
    const years = events.map((event) =>
      parseISO(event.event_date).getFullYear(),
    );
    const min = Math.min(...years);
    const max = Math.max(...years);
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }, [events]);

  const leftPad = winW / 2;
  const layoutMetrics = useMemo(() => getLayoutMetrics(scaleBlend), [scaleBlend]);
  const targetLayoutMetrics = useMemo(
    () => getLayoutMetrics(SCALE_INDEX[timelineScale]),
    [timelineScale],
  );

  const allNodes = useMemo<RenderNode[]>(() => {
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

    const renderNodes: RenderNode[] = [];

    for (const [yearIndex, year] of yearRange.entries()) {
      const yearEvents = (byYear.get(year) ?? []).sort(
        (a, b) => b.impact_score - a.impact_score,
      );

      renderNodes.push({
        key: `year-${year}`,
        yearIndex,
        angle: yearIndex * ANGLE_STEP.year,
        radius: ORBIT_RADIUS.year,
        label: String(year),
        subLabel:
          yearEvents.length > 0 ? `${yearEvents.length} 个事件` : "低活动年",
        unit: "year",
        year,
        events: yearEvents,
        maxImpact: eventImpact(yearEvents),
        eventCount: yearEvents.length,
      });

      for (let month = 0; month < 12; month += 1) {
        const monthEvents = (byMonth.get(`${year}-${month}`) ?? []).sort(
          (a, b) => b.impact_score - a.impact_score,
        );

        renderNodes.push({
          key: `month-${year}-${month}`,
          yearIndex,
          angle: (yearIndex * 12 + month) * ANGLE_STEP.month,
          radius: ORBIT_RADIUS.month,
          label: monthNames[month],
          subLabel:
            monthEvents.length > 0
              ? `${year} 年 ${monthNames[month]} · ${monthEvents.length} 个事件`
              : `${year} 年 ${monthNames[month]} · 暂无事件`,
          unit: "month",
          year,
          month,
          events: monthEvents,
          maxImpact: eventImpact(monthEvents),
          eventCount: monthEvents.length,
        });
      }
    }

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
        const dayProgress =
          daysInMonth <= 1 ? 0 : (day - 1) / Math.max(daysInMonth - 1, 1);

        renderNodes.push({
          key: `day-${key}`,
          yearIndex,
          angle: (yearIndex * 12 + month + dayProgress) * ANGLE_STEP.day,
          radius: ORBIT_RADIUS.day,
          label: String(day).padStart(2, "0"),
          subLabel: dayEvents[0]?.title,
          unit: "day",
          year,
          month,
          day,
          dayProgress,
          events: dayEvents.sort((a, b) => b.impact_score - a.impact_score),
          maxImpact: eventImpact(dayEvents),
          eventCount: dayEvents.length,
        });
      });

    return renderNodes;
  }, [events, yearRange]);

  const activeNodes = useMemo(() => {
    return sortNodesByTargetX(
      allNodes.filter((node) => isUnitActiveForScale(node.unit, timelineScale)),
      leftPad,
      targetLayoutMetrics,
    );
  }, [allNodes, timelineScale, leftPad, targetLayoutMetrics]);

  const totalWidth = useMemo(() => {
    const activeWorldXs = allNodes
      .filter((node) => getUnitReveal(node.unit, layoutMetrics) > 0.05)
      .map((node) => computeNodeWorldX(node, leftPad, layoutMetrics));

    if (activeWorldXs.length === 0) return winW;

    return Math.max(winW, Math.max(...activeWorldXs) + winW / 2);
  }, [allNodes, layoutMetrics, leftPad, winW]);

  const maxScroll = Math.max(0, totalWidth - winW);
  const focusedNode = activeNodes[selectedIndex] ?? null;

  const startAnim = useCallback(() => {
    if (animRef.current) return;

    const animate = () => {
      const scrollDiff = targetScrollX.current - currentScrollX.current;
      const rotDiff = targetRotation.current - currentRotation.current;
      const blendDiff = targetScaleBlend.current - currentScaleBlend.current;

      if (
        Math.abs(scrollDiff) < 0.22 &&
        Math.abs(rotDiff) < 0.0005 &&
        Math.abs(blendDiff) < 0.001
      ) {
        currentScrollX.current = targetScrollX.current;
        currentRotation.current = targetRotation.current;
        currentScaleBlend.current = targetScaleBlend.current;
        setScrollX(targetScrollX.current);
        setGlobalRotation(targetRotation.current);
        setScaleBlend(targetScaleBlend.current);
        animRef.current = null;
        return;
      }

      currentScrollX.current += scrollDiff * 0.2;
      currentRotation.current += rotDiff * 0.2;
      currentScaleBlend.current += blendDiff * 0.18;

      setScrollX(currentScrollX.current);
      setGlobalRotation(currentRotation.current);
      setScaleBlend(currentScaleBlend.current);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, []);

  const stepFocus = useCallback(
    (direction: number) => {
      if (activeNodes.length === 0) return;
      setSelectedIndex((index) =>
        Math.max(0, Math.min(index + direction, activeNodes.length - 1)),
      );
    },
    [activeNodes.length],
  );

  const selectNode = useCallback(
    (node: RenderNode) => {
      const nextIndex = activeNodes.findIndex((item) => item.key === node.key);
      if (nextIndex >= 0) setSelectedIndex(nextIndex);
    },
    [activeNodes],
  );

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, []);

  useEffect(() => {
    targetScaleBlend.current = SCALE_INDEX[timelineScale];
    startAnim();
  }, [timelineScale, startAnim]);

  useEffect(() => {
    if (!focusedNode) return;
    selectionAnchorRef.current = {
      key: focusedNode.key,
      unit: focusedNode.unit,
      year: focusedNode.year,
      month: focusedNode.month,
      day: focusedNode.day,
    };
  }, [focusedNode]);

  useEffect(() => {
    if (activeNodes.length === 0) return;

    const anchor = selectionAnchorRef.current;
    const fallbackIndex = activeNodes.findIndex((node) => node.eventCount > 0);

    if (!anchor) {
      setSelectedIndex(fallbackIndex >= 0 ? fallbackIndex : 0);
      lastFocusKey.current = null;
      return;
    }

    const candidateKeys: string[] = [];

    if (timelineScale === "year") {
      candidateKeys.push(`year-${anchor.year}`);
    }

    if (timelineScale === "month") {
      if (anchor.unit === "year") candidateKeys.push(anchor.key);
      if (anchor.month != null) candidateKeys.push(`month-${anchor.year}-${anchor.month}`);
      candidateKeys.push(`year-${anchor.year}`);
    }

    if (timelineScale === "day") {
      candidateKeys.push(anchor.key);
      if (anchor.month != null) candidateKeys.push(`month-${anchor.year}-${anchor.month}`);
      candidateKeys.push(`year-${anchor.year}`);
    }

    const nextIndex = [...new Set(candidateKeys)]
      .map((key) => activeNodes.findIndex((node) => node.key === key))
      .find((index) => index >= 0);

    setSelectedIndex(nextIndex ?? (fallbackIndex >= 0 ? fallbackIndex : 0));
    lastFocusKey.current = null;
  }, [activeNodes, timelineScale]);

  useEffect(() => {
    if (activeNodes.length === 0) return;
    setSelectedIndex((index) => Math.max(0, Math.min(index, activeNodes.length - 1)));
  }, [activeNodes.length]);

  useEffect(() => {
    if (!focusedNode) return;

    const focusedWorldX = computeNodeWorldX(focusedNode, leftPad, layoutMetrics);
    const nextTarget = Math.max(0, Math.min(focusedWorldX - winW / 2, maxScroll));
    targetScrollX.current = nextTarget;

    const rawTarget = -focusedNode.angle;
    const diff = rawTarget - currentRotation.current;
    const twoPi = 2 * Math.PI;
    const wrappedDiff = diff - Math.round(diff / twoPi) * twoPi;
    targetRotation.current = currentRotation.current + wrappedDiff;

    startAnim();
  }, [focusedNode, layoutMetrics, leftPad, maxScroll, startAnim, winW]);

  useEffect(() => {
    targetScrollX.current = Math.max(0, Math.min(targetScrollX.current, maxScroll));
    currentScrollX.current = Math.max(0, Math.min(currentScrollX.current, maxScroll));
    setScrollX((value) => Math.max(0, Math.min(value, maxScroll)));
  }, [maxScroll]);

  const onFocusChangeRef = useRef(onFocusChange);

  useEffect(() => {
    onFocusChangeRef.current = onFocusChange;
  }, [onFocusChange]);

  useEffect(() => {
    if (!focusedNode) {
      if (lastFocusKey.current !== null) {
        lastFocusKey.current = null;
        onFocusChangeRef.current(null);
      }
      return;
    }

    if (lastFocusKey.current === focusedNode.key) return;
    lastFocusKey.current = focusedNode.key;
    onFocusChangeRef.current(focusFromNode(focusedNode));
  }, [focusedNode]);

  useEffect(() => {
    if (viewMode !== "timeline") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }
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
    if (viewMode !== "timeline") onFocusChangeRef.current(null);
  }, [viewMode]);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      const now = Date.now();
      if (now < wheelLockedUntil.current) return;
      const dir = event.deltaY > 0 ? 1 : -1;
      stepFocus(dir);
      wheelLockedUntil.current = now + 0;
    },
    [stepFocus],
  );

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = event.clientX;
    dragDelta.current = 0;
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDragging.current) return;
      const delta = lastX.current - event.clientX;
      lastX.current = event.clientX;
      dragDelta.current += delta;
      if (Math.abs(dragDelta.current) < 86) return;
      stepFocus(dragDelta.current > 0 ? 1 : -1);
      dragDelta.current = 0;
    },
    [stepFocus],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    dragDelta.current = 0;
  }, []);

  const openNode = useCallback(
    (node: RenderNode) => {
      selectNode(node);
      if (node.eventCount === 0) return;
      onNodeClick(focusFromNode(node));
    },
    [onNodeClick, selectNode],
  );

  const meta =
    scaleOptions.find((option) => option.key === timelineScale) ??
    scaleOptions[1];
  const axisY = Math.max(350, winH * 0.6);

  const visibleNodes = useMemo(() => {
    return allNodes
      .map((node) => {
        const reveal = getUnitReveal(node.unit, layoutMetrics);
        const worldX = computeNodeWorldX(node, leftPad, layoutMetrics);
        const angle = node.angle + globalRotation;
        return {
          node,
          reveal,
          nodeX: worldX - scrollX,
          renderY: Math.sin(angle) * node.radius,
          renderZ: Math.cos(angle),
        };
      })
      .filter(
        ({ nodeX, reveal }) => reveal > 0.01 && nodeX > -340 && nodeX < winW + 340,
      )
      .sort((a, b) => a.renderZ - b.renderZ);
  }, [allNodes, globalRotation, layoutMetrics, leftPad, scrollX, winW]);

  if (viewMode === "grid") {
    return (
      <GridView
        buckets={activeNodes}
        onNodeClick={onNodeClick}
        highlightedId={highlightedId}
        theme={theme}
      />
    );
  }

  if (viewMode === "list") {
    return (
      <ListView
        buckets={activeNodes}
        onNodeClick={onNodeClick}
        highlightedId={highlightedId}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 z-10 cursor-grab select-none active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <TimelineCanvas
        scrollX={scrollX}
        globalRotation={globalRotation}
        layout={layoutMetrics}
        winW={winW}
        winH={winH}
        theme={theme}
      />

      <motion.div
        initial={{ opacity: 0, y: -16, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="pointer-events-auto absolute left-5 right-5 top-[96px] z-40 md:left-6 md:right-[330px] 2xl:right-[360px]"
      >
        <div className={`flex flex-col gap-3 rounded-[28px] border p-3 backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-between lg:p-4 ${
          isDay
            ? "border-cosmos-border/55 bg-cosmos-card/88 shadow-[0_16px_46px_rgba(84,75,62,0.09)]"
            : "border-cosmos-border/35 bg-cosmos-surface/72 shadow-[0_0_42px_rgba(255,255,255,0.08)]"
        }`}>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-cosmos-gold/20 bg-cosmos-gold/10 px-3 py-1 font-display text-[10px] uppercase tracking-[0.18em] text-cosmos-gold">
                {meta.code}
              </span>
              <span className="hidden h-px w-16 bg-gradient-to-r from-cosmos-gold/50 to-transparent md:block" />
            </div>
            <h2 className={`mt-2 font-display text-2xl font-semibold leading-tight tracking-[-0.03em] md:text-3xl ${
              isDay ? "text-cosmos-text" : "aurora-text"
            }`}>
              {meta.title}
            </h2>
            <p className="mt-1 max-w-2xl font-display text-xs leading-5 tracking-wide text-cosmos-text-dim md:text-sm md:leading-6">
              {meta.subtitle}
            </p>
          </div>

          <div className={`grid shrink-0 grid-cols-3 gap-2 rounded-[24px] border p-1.5 ${
            isDay
              ? "border-cosmos-border/50 bg-white/78 shadow-[inset_0_0_18px_rgba(90,80,64,0.06)]"
              : "border-cosmos-border/35 bg-cosmos-card/60 shadow-[inset_0_0_24px_rgba(255,255,255,0.03)]"
          }`}>
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
                      : "text-cosmos-text-dim hover:bg-cosmos-surface/60 hover:text-cosmos-text"
                  }`}
                >
                  <span
                    className={`absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-cosmos-gold/70 to-transparent transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-70"}`}
                  />
                  <span className="relative block font-display text-[10px] uppercase tracking-[0.16em]">
                    {option.code}
                  </span>
                  <span className="relative mt-1 block whitespace-nowrap font-display text-xs tracking-wider">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ perspective: 1100 }}
      >
        <div className="absolute bottom-0 left-0 top-[170px] z-[70] w-[18vw] bg-gradient-to-r from-cosmos-bg via-cosmos-bg/45 to-transparent" />
        <div className="absolute bottom-0 right-0 top-[170px] z-[70] w-[18vw] bg-gradient-to-l from-cosmos-bg via-cosmos-bg/45 to-transparent" />
        <div className={`absolute left-1/2 top-[18vh] z-30 h-[70vh] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cosmos-gold/40 to-transparent ${
          isDay ? "shadow-none" : "shadow-[0_0_14px_rgba(240,192,96,0.35)]"
        }`} />
        <div
          className={`absolute left-1/2 z-30 h-24 w-[220px] -translate-x-1/2 -translate-y-1/2 ${
            isDay
              ? "bg-[radial-gradient(ellipse_at_center,rgba(166,128,69,0.08)_0%,rgba(104,145,210,0.035)_36%,transparent_72%)]"
              : "bg-[radial-gradient(ellipse_at_center,rgba(255,238,190,0.42)_0%,rgba(240,192,96,0.14)_24%,rgba(91,141,239,0.07)_48%,transparent_72%)] blur-sm"
          }`}
          style={{ top: axisY }}
        />

        {visibleNodes.map(({ node, reveal, nodeX, renderY, renderZ }) => {
          const depth = (renderZ + 1) / 2;
          const hasEvents = node.eventCount > 0;
          const isFocused = focusedNode?.key === node.key;
          const isHighlighted =
            highlightedId != null &&
            node.events.some((event) => event.id === highlightedId);
          const density = Math.min(1, node.eventCount / 4);
          const isMajor = node.maxImpact >= 95;
          const isStrong = node.maxImpact >= 85 || node.eventCount >= 2;
          const baseSize =
            node.unit === "year" ? 40 : node.unit === "month" ? 20 : 11;
          const depthSize =
            node.unit === "year" ? 14 : node.unit === "month" ? 8 : 4;
          const visibilityScale = 0.72 + reveal * 0.28;
          const nodeSize =
            (baseSize +
              density * depthSize +
              depth * (node.unit === "year" ? 10 : node.unit === "month" ? 6 : 3)) *
            visibilityScale;
          const nodeY = axisY + renderY;
          const scale =
            (0.66 + depth * 0.5 + (isFocused ? 0.24 : 0)) * visibilityScale;
          const labelOffset = renderY < 0 ? -50 : 38;
          const labelWidth =
            node.unit === "year" ? 150 : node.unit === "month" ? 112 : 78;
          const showLabelCard =
            reveal > 0.35 && (isFocused || hasEvents || node.unit === "year");
          const accent =
            node.unit === "year"
              ? "rgba(240,192,96,ALPHA)"
              : node.unit === "month"
                ? "rgba(91,141,239,ALPHA)"
                : "rgba(139,92,246,ALPHA)";
          const idleOpacity =
            (isFocused
              ? 1
              : node.unit !== "year" && !hasEvents
                ? 0.18 + depth * 0.22
                : 0.58 + depth * 0.3) * reveal;
          const interactive =
            isUnitActiveForScale(node.unit, timelineScale) &&
            (node.unit === "year" || reveal > 0.55);

          return (
            <motion.div
              key={node.key}
              initial={false}
              animate={{ opacity: idleOpacity }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="absolute"
              style={{
                left: nodeX,
                top: nodeY,
                pointerEvents: interactive ? "auto" : "none",
                zIndex: Math.round(20 + depth * 60 + (isFocused ? 90 : 0)),
                transform: `translate(-50%, -50%) translateZ(${renderZ * 130}px) scale(${scale})`,
                filter: `blur(${Math.max(
                  0,
                  (isDay ? (1 - depth) * 0.25 : (1 - depth) * 0.8) - (isFocused ? 1 : 0),
                )}px)`,
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
                  animate={{
                    rotate: 360,
                    opacity: isFocused
                      ? [0.42, 0.82, 0.42]
                      : [0.18, 0.34, 0.18],
                  }}
                  transition={{
                    rotate: {
                      duration: node.unit === "year" ? 30 : 22,
                      repeat: Infinity,
                      ease: "linear",
                    },
                    opacity: {
                      duration: 3.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                />
              )}

              <button
                onClick={() => openNode(node)}
                onMouseEnter={() => {
                  setHoveredNode(node);
                  setTooltipPos({ x: nodeX, y: nodeY + labelOffset });
                }}
                onMouseLeave={() => setHoveredNode(null)}
                aria-label={
                  hasEvents
                    ? `${node.label}: ${node.eventCount} 个事件`
                    : `${node.label}: 无事件`
                }
                className={`relative z-10 flex items-center justify-center rounded-full border transition-transform duration-300 ${
                  interactive && hasEvents
                    ? "cursor-pointer hover:scale-110"
                    : interactive
                      ? "cursor-pointer hover:scale-105"
                      : "cursor-default"
                } ${
                  node.unit === "year"
                    ? isDay
                      ? "border-cosmos-gold/46"
                      : "border-cosmos-gold/45"
                    : node.unit === "month"
                      ? isDay
                        ? "border-cosmos-blue/42"
                        : "border-cosmos-blue/36"
                      : isDay
                        ? "border-cosmos-purple/36"
                        : "border-cosmos-purple/42"
                }`}
                style={{
                  width: nodeSize,
                  height: nodeSize,
                  background: isDay
                    ? hasEvents
                      ? `radial-gradient(circle at 32% 24%, rgba(255,255,255,1) 0%, ${accent.replace("ALPHA", isMajor ? "0.72" : "0.5")} 20%, rgba(255,255,255,0.82) 55%, ${accent.replace("ALPHA", "0.22")} 100%)`
                      : node.unit === "month"
                        ? "radial-gradient(circle at 35% 25%, rgba(255,255,255,1), rgba(76,118,188,0.32) 58%, rgba(224,231,242,0.95) 100%)"
                        : "radial-gradient(circle at 35% 25%, rgba(255,255,255,1), rgba(154,111,53,0.3) 58%, rgba(232,224,212,0.98) 100%)"
                    : hasEvents
                      ? `radial-gradient(circle at 30% 24%, rgba(255,255,255,0.96) 0%, ${accent.replace("ALPHA", isMajor ? "0.9" : "0.68")} 18%, ${accent.replace("ALPHA", "0.32")} 58%, rgba(3,4,10,0.36) 100%)`
                      : node.unit === "month"
                        ? "radial-gradient(circle at 35% 25%, rgba(91,141,239,0.24), rgba(255,255,255,0.035) 70%)"
                        : "rgba(255,255,255,0.055)",
                  boxShadow: isDay
                    ? hasEvents
                      ? isFocused || isHighlighted
                        ? `0 0 ${nodeSize * 0.72}px ${accent.replace("ALPHA", "0.28")}, 0 10px 22px rgba(80,72,62,0.16), inset 0 0 ${nodeSize * 0.18}px rgba(255,255,255,0.58)`
                        : `0 0 ${nodeSize * (isStrong ? 0.48 : 0.28)}px ${accent.replace("ALPHA", isStrong ? "0.16" : "0.08")}, 0 8px 18px rgba(80,72,62,0.14), inset 0 1px 0 rgba(255,255,255,0.56)`
                      : "0 10px 20px rgba(80,72,62,0.2), inset 0 1px 0 rgba(255,255,255,0.78)"
                    : hasEvents
                      ? isFocused || isHighlighted
                        ? `0 0 ${nodeSize * 1.75}px ${accent.replace("ALPHA", "0.72")}, inset 0 0 ${nodeSize * 0.45}px rgba(255,255,255,0.28)`
                        : `0 0 ${nodeSize * (isStrong ? 0.92 : 0.58)}px ${accent.replace("ALPHA", isStrong ? "0.32" : "0.18")}, inset -8px -10px ${nodeSize * 0.35}px rgba(0,0,0,0.32)`
                      : "inset -6px -8px 14px rgba(0,0,0,0.26)",
                }}
              >
                {hasEvents && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white/85 shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
                )}
              </button>

              <div
                className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2"
                style={{ top: labelOffset, width: labelWidth, opacity: reveal }}
              >
                {showLabelCard ? (
                  <div
                    className={`rounded-2xl border px-3 py-2 text-center backdrop-blur-xl transition-all duration-300 ${
                      isDay
                        ? isFocused
                          ? "border-cosmos-gold/38 bg-white/92 shadow-[0_18px_42px_rgba(95,76,45,0.22)]"
                          : hasEvents
                            ? "border-cosmos-border/48 bg-white/86 shadow-[0_14px_34px_rgba(80,72,62,0.18)]"
                            : "border-cosmos-border/34 bg-white/64 shadow-[0_10px_24px_rgba(80,72,62,0.1)]"
                        : isFocused
                          ? "border-cosmos-gold/40 shadow-[0_20px_58px_rgba(0,0,0,0.62),0_0_40px_rgba(212,168,83,0.14),inset_0_1px_0_rgba(255,255,255,0.1)]"
                          : hasEvents
                            ? "border-cosmos-border/32 shadow-[0_14px_40px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.06)]"
                            : "border-cosmos-border/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    }`}
                    style={
                      isDay
                        ? undefined
                        : {
                            backgroundColor: isFocused
                              ? "rgba(10, 13, 31, 0.96)"
                              : hasEvents
                                ? "rgba(7, 10, 24, 0.88)"
                                : "rgba(6, 8, 18, 0.72)",
                          }
                    }
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`font-mono leading-none ${node.unit === "year" ? "text-lg" : node.unit === "month" ? "text-sm" : "text-[11px]"} ${
                          hasEvents || node.unit === "year"
                            ? "text-cosmos-text"
                            : isDay
                              ? "text-cosmos-text-dim/70"
                              : "text-cosmos-text-dim/45"
                        }`}
                      >
                        {node.label}
                      </span>
                      {hasEvents && node.unit !== "day" && (
                        <span className="rounded-full bg-cosmos-gold/10 px-1.5 py-0.5 font-mono text-[9px] text-cosmos-gold">
                          {node.eventCount}
                        </span>
                      )}
                    </div>
                    {isFocused && node.subLabel && (
                      <p className="mt-1 truncate text-[9px] text-cosmos-text-dim">
                        {node.subLabel}
                      </p>
                    )}
                    {hasEvents && (
                      <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-cosmos-surface/65">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cosmos-blue via-cosmos-gold to-cosmos-accent"
                          style={{ width: `${node.maxImpact}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="font-mono text-[11px] text-cosmos-text-dim/40">
                    {node.label}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none fixed z-50 w-[300px] max-w-[calc(100vw-32px)] rounded-3xl border border-white/[0.09] bg-cosmos-surface/90 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-2xl"
            style={{
              left: Math.max(16, Math.min(tooltipPos.x - 150, winW - 316)),
              top: Math.max(100, Math.min(tooltipPos.y, winH - 230)),
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cosmos-gold">
                {unitCopy[hoveredNode.unit]} · {hoveredNode.label}
              </p>
              <span className="rounded-full bg-cosmos-surface/60 px-2 py-0.5 font-mono text-[10px] text-cosmos-text-dim">
                {hoveredNode.eventCount} Events
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {hoveredNode.events.length > 0 ? (
                hoveredNode.events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl bg-cosmos-surface/55 px-3 py-2"
                  >
                    <p className="truncate text-xs text-cosmos-text">
                      {event.title}
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-cosmos-text-dim">
                      {format(parseISO(event.event_date), "yyyy.MM.dd")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-cosmos-surface/55 px-3 py-2 text-xs text-cosmos-text-dim">
                  当前星球暂无事件
                </p>
              )}
            </div>
            {hoveredNode.events.length > 3 && (
              <p className="mt-2 text-[10px] text-cosmos-text-dim">
                +{hoveredNode.events.length - 3} 更多事件
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
