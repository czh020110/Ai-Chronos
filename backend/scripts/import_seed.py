"""Import seed events from JSON into the database.

Usage (from project root):
    python -m backend.scripts.import_seed data/events.seed.json
"""

import json
import sys
from datetime import datetime, timezone

from ..db import Base, SessionLocal, Event, engine


def import_seed(path: str) -> None:
    Base.metadata.create_all(bind=engine)

    with open(path, encoding="utf-8") as f:
        events = json.load(f)

    db = SessionLocal()
    try:
        for e in events:
            existing = db.query(Event).filter(Event.id == e["id"]).first()
            now = datetime.now(timezone.utc).isoformat()
            if existing:
                existing.title = e["title"]
                existing.event_date = e["event_date"]
                existing.content_md = e["content_md"]
                existing.tags = ",".join(e["tags"])
                existing.source_urls = ",".join(e["source_urls"])
                existing.impact_score = e["impact_score"]
                existing.category = e["category"]
                existing.status = "published"
                existing.updated_at = now
            else:
                row = Event(
                    id=e["id"],
                    title=e["title"],
                    event_date=e["event_date"],
                    content_md=e["content_md"],
                    tags=",".join(e["tags"]),
                    source_urls=",".join(e["source_urls"]),
                    impact_score=e["impact_score"],
                    category=e["category"],
                    status="published",
                    created_at=now,
                    updated_at=now,
                )
                db.add(row)
        db.commit()
        print(f"Imported {len(events)} events")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m backend.scripts.import_seed <path-to-seed.json>")
        sys.exit(1)
    import_seed(sys.argv[1])