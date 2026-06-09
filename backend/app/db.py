from sqlalchemy import Column, String, Integer, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from pathlib import Path

from sqlalchemy import Column, String, Integer, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = Path(__file__).resolve().parent.parent.parent / "ai_chronos.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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