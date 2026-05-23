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
export type ViewMode = "timeline" | "grid" | "list";

export interface DrillState {
  level: ZoomLevel;
  year: number | null;
  month: number | null;
}
