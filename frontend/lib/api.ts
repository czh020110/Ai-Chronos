const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface AIEvent {
  id: string;
  title: string;
  event_date: string;
  content_md: string;
  tags: string[];
  source_urls: string[];
  impact_score: number;
  category: string;
  status: string;
}

export interface Stats {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  year_range: string[];
}

export interface EventListParams {
  status?: string;
  category?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  q?: string;
  impact_min?: number;
  limit?: number;
  offset?: number;
}

export interface SearchEvent extends AIEvent {
  score: number;
}

export interface SearchResult {
  events: SearchEvent[];
  summary: string | null;
  total_candidates: number;
}

export type SearchMode = "keyword" | "semantic" | "hybrid";

export async function fetchPublishedEvents(): Promise<AIEvent[]> {
  const res = await fetch(`${API_BASE}/api/events?status=published&limit=500`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchEvent(id: string): Promise<AIEvent> {
  const res = await fetch(`${API_BASE}/api/events/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchEvents(params: EventListParams = {}): Promise<AIEvent[]> {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.category) sp.set("category", params.category);
  if (params.tag) sp.set("tag", params.tag);
  if (params.date_from) sp.set("date_from", params.date_from);
  if (params.date_to) sp.set("date_to", params.date_to);
  if (params.q) sp.set("q", params.q);
  if (params.impact_min) sp.set("impact_min", String(params.impact_min));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.offset) sp.set("offset", String(params.offset));

  const res = await fetch(`${API_BASE}/api/events?${sp.toString()}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchSearch(
  query: string,
  limit: number = 20,
  mode: SearchMode = "hybrid",
): Promise<SearchResult> {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit, mode }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
