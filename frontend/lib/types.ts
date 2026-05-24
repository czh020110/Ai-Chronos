export interface AIEvent {
  id: string;
  title: string;
  event_date: string;
  content_md: string;
  tags: TagType[];
  source_urls: string[];
  impact_score: number;
  category: EventCategory;
  status: EventStatus;
}

export type TagType = "论文" | "模型" | "新闻" | "工具" | "开源" | "商业";
export type EventCategory = "paper" | "model" | "news" | "tool";
export type EventStatus = "published" | "disputed" | "draft";
export type ZoomLevel = "year" | "month" | "day";
export type TimelineScale = "year" | "month" | "day";
export type TimelineUnit = "year" | "month" | "day";
export type ViewMode = "timeline" | "grid" | "list";
export type ThemeMode = "night" | "day";

export interface TimelineFocus {
  key: string;
  unit: TimelineUnit;
  unitLabel: string;
  label: string;
  subLabel?: string;
  eventCount: number;
  maxImpact: number;
  events: AIEvent[];
}

export interface DrillState {
  level: ZoomLevel;
  year: number | null;
  month: number | null;
}
