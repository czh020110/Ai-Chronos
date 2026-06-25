"""API schemas for AI Chronos events."""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class EventBase(BaseModel):
    title: str
    event_date: str  # YYYY-MM-DD
    content_md: str
    tags: list[str] = []
    source_urls: list[str] = []
    impact_score: int = Field(ge=1, le=10, default=6)
    category: str


class EventCreate(EventBase):
    """Schema for creating a new event. Status defaults to draft."""
    status: Literal["draft", "staged"] = "draft"


class EventUpdate(BaseModel):
    """Schema for updating an event. All fields optional."""
    title: str | None = None
    event_date: str | None = None
    content_md: str | None = None
    tags: list[str] | None = None
    source_urls: list[str] | None = None
    impact_score: int | None = Field(default=None, ge=1, le=10)
    category: str | None = None


class EventResponse(EventBase):
    id: str
    status: str

    model_config = {"from_attributes": True}


class EventTransition(BaseModel):
    """Request body for transitioning event status."""
    target: Literal["staged", "published", "disputed", "archived"]


class EventListParams(BaseModel):
    """Query parameters for listing/filtering events."""
    status: str | None = None
    category: str | None = None
    tag: str | None = None
    date_from: str | None = None  # YYYY-MM-DD
    date_to: str | None = None  # YYYY-MM-DD
    q: str | None = None  # search in title/content
    impact_min: int | None = Field(default=None, ge=1, le=10)
    limit: int = Field(default=100, ge=1, le=500)
    offset: int = Field(default=0, ge=0)


class StatsResponse(BaseModel):
    total: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    year_range: list[str]  # e.g. ["2017", "2025"]


class SearchRequest(BaseModel):
    """Request body for RAG hybrid search."""
    query: str
    limit: int = Field(default=20, ge=1, le=100)
    mode: Literal["hybrid", "semantic", "keyword"] = "hybrid"


class SearchEvent(EventResponse):
    """Event with search relevance score."""
    score: float = 0.0


class SearchResult(BaseModel):
    """Response from RAG hybrid search."""
    events: list[SearchEvent]
    summary: str | None = None
    total_candidates: int = 0
