"""Pipeline: collect -> clean -> import into database.

Usage (from project root):
    # Full pipeline: collect + clean + import as draft
    python -m backend.scripts.collect_pipeline

    # Import already-cleaned data as staged (for human-reviewed events)
    python -m backend.scripts.collect_pipeline --status staged

    # Batch transition draft events to published
    python -m backend.scripts.collect_pipeline --publish

    # Only import a specific clean file
    python -m backend.scripts.collect_pipeline --import data/collected_clean.json --status staged
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def _get_db_models():
    """Lazy import to avoid circular/relative import issues."""
    from backend.app.db import Base, SessionLocal, Event, engine
    return Base, SessionLocal, Event, engine


def import_events(path: str, default_status: str = "draft") -> None:
    """Import events from a JSON file into the database."""
    Base, SessionLocal, Event, engine = _get_db_models()

    Base.metadata.create_all(bind=engine)

    with open(path, encoding="utf-8") as f:
        events = json.load(f)

    db = SessionLocal()
    now = datetime.now(timezone.utc).isoformat()
    created = 0
    updated = 0
    skipped = 0

    try:
        for e in events:
            event_id = e.get("id", "")
            if not event_id:
                continue

            existing = db.query(Event).filter(Event.id == event_id).first()
            if existing:
                # Update fields but preserve status if already in a later stage
                existing.title = e["title"]
                existing.event_date = e["event_date"]
                existing.content_md = e["content_md"]
                existing.tags = ",".join(e["tags"]) if isinstance(e["tags"], list) else e["tags"]
                existing.source_urls = ",".join(e["source_urls"]) if isinstance(e["source_urls"], list) else e["source_urls"]
                existing.impact_score = e["impact_score"]
                existing.category = e["category"]
                existing.updated_at = now
                updated += 1
            else:
                row = Event(
                    id=event_id,
                    title=e["title"],
                    event_date=e["event_date"],
                    content_md=e["content_md"],
                    tags=",".join(e["tags"]) if isinstance(e["tags"], list) else e["tags"],
                    source_urls=",".join(e["source_urls"]) if isinstance(e["source_urls"], list) else e["source_urls"],
                    impact_score=e["impact_score"],
                    category=e["category"],
                    status=default_status,
                    created_at=now,
                    updated_at=now,
                )
                db.add(row)
                created += 1

        db.commit()
        print(f"Import complete: {created} created, {updated} updated, {skipped} skipped (status={default_status})")
    finally:
        db.close()


def batch_publish() -> None:
    """Transition all draft/staged events to published."""
    Base, SessionLocal, Event, engine = _get_db_models()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    now = datetime.now(timezone.utc).isoformat()

    try:
        # First stage draft -> staged
        draft_rows = db.query(Event).filter(Event.status == "draft").all()
        for row in draft_rows:
            row.status = "staged"
            row.updated_at = now
        db.commit()
        if draft_rows:
            print(f"Staged {len(draft_rows)} draft events")

        # Then staged -> published
        staged_rows = db.query(Event).filter(Event.status == "staged").all()
        for row in staged_rows:
            row.status = "published"
            row.updated_at = now
        db.commit()
        if staged_rows:
            print(f"Published {len(staged_rows)} staged events")

        # Summary
        from sqlalchemy import func
        counts = db.query(Event.status, func.count(Event.id)).group_by(Event.status).all()
        print("DB status summary:")
        for status, count in counts:
            print(f"  {status}: {count}")
    finally:
        db.close()


def run_collect() -> None:
    """Run Wikipedia collection."""
    from backend.scripts.collect_wikipedia import collect_all

    events = collect_all()
    out_path = DATA_DIR / "collected_wikipedia.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
    print(f"Collected {len(events)} events -> {out_path}")


def run_clean() -> None:
    """Run data cleaning pipeline."""
    from backend.scripts.clean_events import clean_all

    events = clean_all()
    out_path = DATA_DIR / "collected_clean.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
    print(f"Cleaned {len(events)} events -> {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="AI Chronos data pipeline")
    parser.add_argument("--status", default="draft", choices=["draft", "staged", "published"],
                        help="Default status for imported events (default: draft)")
    parser.add_argument("--import", dest="import_path", help="Import a specific JSON file")
    parser.add_argument("--publish", action="store_true", help="Batch publish all draft/staged events")
    parser.add_argument("--collect-only", action="store_true", help="Only run collection, no import")
    parser.add_argument("--clean-only", action="store_true", help="Only run cleaning, no import")

    args = parser.parse_args()

    if args.publish:
        batch_publish()
        return

    if args.import_path:
        import_events(args.import_path, args.status)
        return

    # Full pipeline
    print("=== Step 1: Collect ===")
    run_collect()

    if args.collect_only:
        return

    print("\n=== Step 2: Clean ===")
    run_clean()

    if args.clean_only:
        return

    print(f"\n=== Step 3: Import (status={args.status}) ===")
    clean_path = DATA_DIR / "collected_clean.json"
    import_events(str(clean_path), args.status)

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
