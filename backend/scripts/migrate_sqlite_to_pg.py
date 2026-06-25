"""Migrate events from SQLite to PostgreSQL with embedding generation."""

import json
import sqlite3
import sys
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.db import Event, Base, ensure_pgvector_extension

SQLITE_PATH = Path(__file__).resolve().parent.parent / "ai_chronos.db"


def load_sqlite_events() -> list[dict]:
    conn = sqlite3.connect(str(SQLITE_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM events ORDER BY event_date").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def generate_embeddings(texts: list[str], model_name: str = "BAAI/bge-m3") -> list[list[float]]:
    from sentence_transformers import SentenceTransformer
    print(f"Loading embedding model: {model_name}...")
    model = SentenceTransformer(model_name)
    print(f"Encoding {len(texts)} texts...")
    embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)
    return embeddings.tolist()


def migrate():
    # Load from SQLite
    sqlite_events = load_sqlite_events()
    print(f"Loaded {len(sqlite_events)} events from SQLite")

    if not sqlite_events:
        print("No events to migrate.")
        return

    # Prepare texts for embedding
    texts = []
    for ev in sqlite_events:
        combined = f"{ev['title']}. {ev['category']}. {ev['tags']}. {ev['content_md'][:500]}"
        texts.append(combined)

    # Generate embeddings
    embeddings = generate_embeddings(texts)

    # Connect to PostgreSQL
    pg_engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=pg_engine)

    # Create tables and extension
    with Session() as db:
        ensure_pgvector_extension(db)
    Base.metadata.create_all(bind=pg_engine)

    # Insert events
    with Session() as db:
        for ev, emb in zip(sqlite_events, embeddings):
            tags_list = ev["tags"].split(",") if ev["tags"] else []
            urls_list = ev["source_urls"].split(",") if ev["source_urls"] else []

            row = Event(
                id=ev["id"],
                title=ev["title"],
                event_date=ev["event_date"],
                content_md=ev["content_md"],
                tags=ev["tags"],
                source_urls=ev["source_urls"],
                impact_score=ev["impact_score"],
                category=ev["category"],
                status=ev["status"],
                created_at=ev["created_at"],
                updated_at=ev["updated_at"],
                tags_arr=tags_list,
                source_urls_arr=urls_list,
                embedding=emb,
            )
            db.merge(row)

        db.commit()

        # Build tsvector for full-text search
        db.execute(
            text(
                "UPDATE events SET search_vector = "
                "to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content_md,'')) "
                "WHERE search_vector IS NULL"
            )
        )
        db.commit()

    # Verify
    with Session() as db:
        count = db.query(Event).count()
        with_emb = db.query(Event).filter(Event.embedding.isnot(None)).count()
        with_sv = db.query(Event).filter(Event.search_vector.isnot(None)).count()
        print(f"Migration complete: {count} events in PostgreSQL")
        print(f"  With embedding: {with_emb}")
        print(f"  With search_vector: {with_sv}")


if __name__ == "__main__":
    migrate()
