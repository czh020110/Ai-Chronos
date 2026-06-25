"""Database models and session management."""

from typing import Generator

from sqlalchemy import Column, String, Integer, Text, create_engine, text
from sqlalchemy.dialects.postgresql import ARRAY, TSVECTOR
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pgvector.sqlalchemy import Vector

from .config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    event_date = Column(String, nullable=False)
    content_md = Column(Text, nullable=False)
    tags = Column(Text, nullable=False)
    source_urls = Column(Text, nullable=False)
    impact_score = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, nullable=False, default="draft")
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

    # PostgreSQL-native columns
    tags_arr = Column(ARRAY(Text), nullable=True)
    source_urls_arr = Column(ARRAY(Text), nullable=True)
    embedding = Column(Vector(1024), nullable=True)
    search_vector = Column(TSVECTOR, nullable=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_pgvector_extension(db: Session) -> None:
    db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    db.commit()
