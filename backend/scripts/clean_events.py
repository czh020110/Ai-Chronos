"""Clean and deduplicate collected events.

Usage (from project root):
    python -m backend.scripts.clean_events
"""

import json
import re
from datetime import datetime
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data"

VALID_CATEGORIES = {"论文发布", "模型发布", "产品发布", "政策法规", "科学突破", "开源发布"}

VALID_STATUSES = ("draft", "staged", "published", "disputed", "archived")

STATUS_TRANSITIONS: dict[str, tuple[str, ...]] = {
    "draft": ("staged",),
    "staged": ("published",),
    "published": ("disputed",),
    "disputed": ("published", "archived"),
    "archived": (),
}


def validate_event(event: dict) -> list[str]:
    """Return list of validation errors for an event."""
    errors = []
    required = ["title", "event_date", "content_md", "tags", "source_urls", "impact_score", "category"]
    for field in required:
        if field not in event or not event[field]:
            errors.append(f"missing or empty field: {field}")

    # Validate date format
    if "event_date" in event:
        try:
            datetime.strptime(event["event_date"], "%Y-%m-%d")
        except ValueError:
            errors.append(f"invalid date format: {event['event_date']}")

    # Validate category
    if event.get("category") not in VALID_CATEGORIES:
        errors.append(f"invalid category: {event.get('category')}")

    # Validate impact_score range
    if "impact_score" in event and not (1 <= event["impact_score"] <= 10):
        errors.append(f"impact_score out of range [1,10]: {event['impact_score']}")

    # Validate tags is list
    if "tags" in event and not isinstance(event["tags"], list):
        errors.append("tags must be a list")

    # Validate source_urls is list
    if "source_urls" in event and not isinstance(event["source_urls"], list):
        errors.append("source_urls must be a list")

    return errors


def normalize_title(title: str) -> str:
    """Normalize title for dedup comparison."""
    t = title.lower()
    t = re.sub(r"[^\w\s]", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    # Remove common prefixes
    for prefix in ["openai releases ", "google releases ", "meta releases ", "anthropic releases "]:
        t = t.removeprefix(prefix)
    return t


def title_similarity(a: str, b: str) -> float:
    """Simple word-overlap similarity between two normalized titles."""
    words_a = set(normalize_title(a).split())
    words_b = set(normalize_title(b).split())
    if not words_a or not words_b:
        return 0.0
    intersection = words_a & words_b
    return len(intersection) / max(len(words_a), len(words_b))


def deduplicate(events: list[dict]) -> list[dict]:
    """Remove near-duplicate events based on title similarity + same date."""
    kept: list[dict] = []
    for event in events:
        is_dup = False
        for existing in kept:
            if event["event_date"] == existing["event_date"]:
                sim = title_similarity(event["title"], existing["title"])
                if sim > 0.6:
                    is_dup = True
                    # Merge tags and source_urls into the kept event
                    existing["tags"] = list(set(existing["tags"] + event["tags"]))
                    existing["source_urls"] = list(set(existing["source_urls"] + event["source_urls"]))
                    break
        if not is_dup:
            kept.append(event)
    return kept


def ensure_id(event: dict, index: int) -> dict:
    """Ensure event has a stable ID."""
    if "id" not in event or not event["id"]:
        slug = re.sub(r"[^a-z0-9]+", "-", event["title"].lower()).strip("-")[:40]
        event["id"] = f"event-{slug}-{event['event_date']}"
    return event


def clean_all() -> list[dict]:
    """Load, validate, deduplicate, and clean all collected events."""
    all_events: list[dict] = []

    # Load from all collected sources
    for filename in ["collected_wikipedia.json", "collected_manual.json", "events.seed.json"]:
        path = OUTPUT_DIR / filename
        if path.exists():
            with open(path, encoding="utf-8") as f:
                events = json.load(f)
            print(f"Loaded {len(events)} events from {filename}")
            all_events.extend(events)

    print(f"\nTotal raw events: {len(all_events)}")

    # Validate
    error_count = 0
    for event in all_events:
        errors = validate_event(event)
        if errors:
            error_count += 1
            print(f"  Validation error in '{event.get('title', '?')[:50]}': {errors}")

    # Ensure IDs
    for i, event in enumerate(all_events):
        ensure_id(event, i)

    # Deduplicate
    before_dedup = len(all_events)
    all_events = deduplicate(all_events)
    print(f"Deduplication: {before_dedup} -> {len(all_events)} events")

    # Sort by date
    all_events.sort(key=lambda e: e["event_date"])

    # Final validation
    valid = []
    for event in all_events:
        if not validate_event(event):
            valid.append(event)
        else:
            print(f"  Skipped invalid event: {event.get('title', '?')[:50]}")

    print(f"Final: {len(valid)} valid events")
    return valid


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    events = clean_all()
    out_path = OUTPUT_DIR / "collected_clean.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(events)} events to {out_path}")


if __name__ == "__main__":
    main()
