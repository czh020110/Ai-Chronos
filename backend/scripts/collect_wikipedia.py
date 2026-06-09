"""Collect AI milestone events from Wikipedia timeline pages.

Usage (from project root):
    python -m backend.scripts.collect_wikipedia
"""

import json
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup, Tag

WIKI_PAGES = [
    "https://en.wikipedia.org/wiki/Timeline_of_artificial_intelligence",
    "https://en.wikipedia.org/wiki/History_of_artificial_intelligence",
]

# Only collect events from these decades
TARGET_DECADES = {"2010s", "2020s"}

# AI/LLM keywords for relevance filtering
AI_KEYWORDS = re.compile(
    r"\b(?:AI|artificial.intelligence|machine.learning|deep.learning|neural|LLM|language.model|"
    r"GPT|BERT|transformer|diffusion|generative|computer.vision|NLP|reinforcement.learning|"
    r"AlphaGo|AlphaFold|ChatGPT|Copilot|Midjourney|Stable.Diffusion|DALL|Sora|Gemini|"
    r"Claude|LLaMA|open.source.model|AGI|robotics|autonomous|TensorFlow|PyTorch)\b",
    re.IGNORECASE,
)

# Category mapping heuristics
CATEGORY_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b(?:paper|arxiv|published|research|proposed|introduced)\b", re.I), "论文发布"),
    (re.compile(r"\b(?:released|launch|announced|unveiled|debuted|shipped)\b", re.I), "模型发布"),
    (re.compile(r"\b(?:product|platform|service|tool|copilot|assistant)\b", re.I), "产品发布"),
    (re.compile(r"\b(?:regulation|law|act|policy|ban|governance|compliance)\b", re.I), "政策法规"),
    (re.compile(r"\b(?:breakthrough|solved|milestone|first|record|beat|defeated)\b", re.I), "科学突破"),
    (re.compile(r"\b(?:open.?source|open.?sourced|free|public|community)\b", re.I), "开源发布"),
]

IMPACT_PATTERNS: list[tuple[re.Pattern, int]] = [
    (re.compile(r"\b(?:transformer|GPT-4|ChatGPT|AlphaFold|AlphaGo)\b", re.I), 10),
    (re.compile(r"\b(?:BERT|LLaMA|Stable.Diffusion|Gemini|Sora|GPT-3)\b", re.I), 9),
    (re.compile(r"\b(?:DALL|Midjourney|Claude|diffusion.model)\b", re.I), 8),
    (re.compile(r"\b(?:released|launch|breakthrough)\b", re.I), 7),
]

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def fetch_page(url: str) -> str:
    headers = {"User-Agent": "AI-Chronos-Bot/0.1 (research; educational use)"}
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.text


def _find_decade_sections(soup: BeautifulSoup) -> list[tuple[str, "Tag"]]:
    """Return (decade_name, heading_tag) for target decades."""
    results = []
    for h in soup.find_all(["h2", "h3"]):
        headline = h.find("span", class_="mw-headline")
        if headline:
            text = headline.get_text(strip=True)
            if text in TARGET_DECADES:
                results.append((text, h))
    return results


def parse_wikitables(html: str) -> list[dict]:
    """Parse wikitable tables from a Wikipedia page, yielding raw events."""
    soup = BeautifulSoup(html, "lxml")
    events = []

    for decade_name, heading in _find_decade_sections(soup):
        table = heading.find_next("table", class_="wikitable")
        if not table:
            continue

        current_year = None
        for row in table.find_all("tr")[1:]:
            cols = row.find_all(["th", "td"])
            if len(cols) < 2:
                continue

            year_text = cols[0].get_text(strip=True)
            desc_text = cols[1].get_text(strip=True)

            if year_text:
                year_match = re.search(r"\d{4}", year_text)
                if year_match:
                    current_year = int(year_match.group())

            if current_year and desc_text:
                events.append({
                    "year": current_year,
                    "description": desc_text,
                    "source_url": "",
                })

    return events


def parse_history_lists(html: str) -> list[dict]:
    """Parse list items from History of AI page under target decades."""
    soup = BeautifulSoup(html, "lxml")
    events = []

    for h in soup.find_all(["h2", "h3"]):
        headline = h.find("span", class_="mw-headline")
        if not headline:
            continue
        text = headline.get_text(strip=True)
        # Match sections like "2010s", "2020s", or sections containing recent AI
        if not any(d in text for d in TARGET_DECADES) and "Deep" not in text:
            continue

        for sibling in h.find_next_siblings():
            if sibling.name in ("h2", "h3"):
                break
            if sibling.name == "ul":
                for li in sibling.find_all("li", recursive=False):
                    line = li.get_text(strip=True)
                    year_match = re.search(r"\b(20[12]\d)\b", line)
                    if year_match:
                        events.append({
                            "year": int(year_match.group(1)),
                            "description": line,
                            "source_url": "",
                        })

    return events


def is_ai_relevant(desc: str) -> bool:
    return bool(AI_KEYWORDS.search(desc))


def guess_category(desc: str) -> str:
    for pattern, cat in CATEGORY_PATTERNS:
        if pattern.search(desc):
            return cat
    return "模型发布"


def guess_impact(desc: str) -> int:
    for pattern, score in IMPACT_PATTERNS:
        if pattern.search(desc):
            return score
    return 6


def extract_title(desc: str) -> str:
    """Extract a short title from a long description."""
    # Try first sentence
    sentence = re.split(r"[.!?]", desc, maxsplit=1)[0].strip()
    if len(sentence) > 80:
        sentence = sentence[:77] + "..."
    return sentence


def extract_date(desc: str, year: int) -> str:
    """Try to extract a more precise date, fallback to year-01-01."""
    month_map = {
        "january": "01", "february": "02", "march": "03", "april": "04",
        "may": "05", "june": "06", "july": "07", "august": "08",
        "september": "09", "october": "10", "november": "11", "december": "12",
    }
    for name, num in month_map.items():
        m = re.search(rf"\b{name}\s+(\d{{1,2}})?\b", desc, re.I)
        if m:
            day = m.group(1).zfill(2) if m.group(1) else "01"
            return f"{year}-{num}-{day}"
    return f"{year}-01-01"


def extract_tags(desc: str) -> list[str]:
    """Extract relevant tags from description."""
    tag_map = {
        "OpenAI": r"\bOpenAI\b",
        "Google": r"\bGoogle\b",
        "DeepMind": r"\bDeepMind\b",
        "Meta": r"\bMeta\b",
        "Microsoft": r"\bMicrosoft\b",
        "Anthropic": r"\bAnthropic\b",
        "LLM": r"\b(?:LLM|language.model)\b",
        "多模态": r"\b(?:multimodal|vision|image)\b",
        "开源": r"\b(?:open.?source|open.?sourced)\b",
        "里程碑": r"\b(?:breakthrough|milestone|first|record)\b",
        "图像生成": r"\b(?:diffusion|DALL|Midjourney|Stable.Diffusion|image.generation)\b",
        "视频生成": r"\b(?:video.generation|Sora)\b",
        "科学AI": r"\b(?:AlphaFold|protein|scientific)\b",
        "AI编程": r"\b(?:Copilot|code.generation|programming)\b",
        "对话AI": r"\b(?:chatbot|ChatGPT|assistant|conversation)\b",
        "Transformer": r"\bTransformer\b",
    }
    tags = []
    for tag, pattern in tag_map.items():
        if re.search(pattern, desc, re.I):
            tags.append(tag)
    return tags or ["AI"]


def normalize_event(raw: dict, source_url: str) -> dict | None:
    """Convert a raw event dict into the normalized event format."""
    desc = raw["description"]
    year = raw["year"]

    if not is_ai_relevant(desc):
        return None

    title = extract_title(desc)
    event_date = extract_date(desc, year)
    tags = extract_tags(desc)
    category = guess_category(desc)
    impact_score = guess_impact(desc)

    # Generate a stable ID from title + date
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:40]
    event_id = f"wiki-{slug}-{event_date}"

    # Build content_md from description
    content_md = f"## {title}\n\n{desc}"

    return {
        "id": event_id,
        "title": title,
        "event_date": event_date,
        "content_md": content_md,
        "tags": tags,
        "source_urls": [source_url] if source_url else [],
        "impact_score": impact_score,
        "category": category,
    }


def collect_all() -> list[dict]:
    """Collect events from all configured Wikipedia pages."""
    all_raw: list[dict] = []

    for url in WIKI_PAGES:
        print(f"Fetching {url}...")
        html = fetch_page(url)
        time.sleep(1.5)

        if "Timeline" in url:
            raw_events = parse_wikitables(html)
        else:
            raw_events = parse_history_lists(html)

        print(f"  Found {len(raw_events)} raw entries")
        for r in raw_events:
            r["source_url"] = url
        all_raw.extend(raw_events)

    # Normalize and filter
    normalized = []
    seen_ids = set()
    for raw in all_raw:
        event = normalize_event(raw, raw.get("source_url", ""))
        if event and event["id"] not in seen_ids:
            seen_ids.add(event["id"])
            normalized.append(event)

    print(f"Collected {len(normalized)} AI-relevant events (filtered from {len(all_raw)} raw)")
    return normalized


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    events = collect_all()
    out_path = OUTPUT_DIR / "collected_wikipedia.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(events)} events to {out_path}")


if __name__ == "__main__":
    main()
