"""Events API endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db import SessionLocal, Event, get_db
from ..schemas import (
    EventCreate,
    EventResponse,
    EventTransition,
    EventUpdate,
    StatsResponse,
)

router = APIRouter(tags=["events"])

VALID_TRANSITIONS: dict[str, tuple[str, ...]] = {
    "draft": ("staged",),
    "staged": ("published",),
    "published": ("disputed",),
    "disputed": ("published", "archived"),
    "archived": (),
}


def _to_response(row: Event) -> EventResponse:
    # Prefer array columns; fall back to comma-split for legacy data
    tags = row.tags_arr if row.tags_arr is not None else (row.tags.split(",") if row.tags else [])
    source_urls = row.source_urls_arr if row.source_urls_arr is not None else (row.source_urls.split(",") if row.source_urls else [])
    return EventResponse(
        id=row.id,
        title=row.title,
        event_date=row.event_date,
        content_md=row.content_md,
        tags=tags,
        source_urls=source_urls,
        impact_score=row.impact_score,
        category=row.category,
        status=row.status,
    )


@router.get("/events", response_model=list[EventResponse])
def list_events(
    status: str | None = Query(default="published", description="Filter by status"),
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    q: str | None = Query(default=None, description="Search in title/content"),
    impact_min: int | None = Query(default=None, ge=1, le=10),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Event)

    if status:
        query = query.filter(Event.status == status)
    if category:
        query = query.filter(Event.category == category)
    if tag:
        # Use array column for tag filtering when available
        query = query.filter(Event.tags_arr.contains([tag]) | Event.tags.contains(tag))
    if date_from:
        query = query.filter(Event.event_date >= date_from)
    if date_to:
        query = query.filter(Event.event_date <= date_to)
    if impact_min:
        query = query.filter(Event.impact_score >= impact_min)
    if q:
        query = query.filter(
            (Event.title.contains(q)) | (Event.content_md.contains(q))
        )

    rows = (
        query.order_by(Event.event_date)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_to_response(r) for r in rows]


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    row = db.query(Event).filter(Event.id == event_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    return _to_response(row)


@router.post("/events", response_model=EventResponse, status_code=201)
def create_event(body: EventCreate, db: Session = Depends(get_db)):
    event_id = uuid.uuid4().hex[:12]
    row = Event(
        id=event_id,
        title=body.title,
        event_date=body.event_date,
        content_md=body.content_md,
        tags=",".join(body.tags),
        source_urls=",".join(body.source_urls),
        tags_arr=body.tags,
        source_urls_arr=body.source_urls,
        impact_score=body.impact_score,
        category=body.category,
        status=body.status,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.patch("/events/{event_id}", response_model=EventResponse)
def update_event(event_id: str, body: EventUpdate, db: Session = Depends(get_db)):
    row = db.query(Event).filter(Event.id == event_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        if field in ("tags", "source_urls") and isinstance(value, list):
            setattr(row, field, ",".join(value))
            setattr(row, f"{field}_arr", value)
        else:
            setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.post("/events/{event_id}/transition", response_model=EventResponse)
def transition_event(event_id: str, body: EventTransition, db: Session = Depends(get_db)):
    row = db.query(Event).filter(Event.id == event_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")

    allowed = VALID_TRANSITIONS.get(row.status, ())
    if body.target not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{row.status}' to '{body.target}'. "
                   f"Allowed: {allowed}",
        )

    row.status = body.target
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func

    total = db.query(func.count(Event.id)).scalar() or 0

    by_status = dict(
        db.query(Event.status, func.count(Event.id))
        .group_by(Event.status)
        .all()
    )

    by_category = dict(
        db.query(Event.category, func.count(Event.id))
        .group_by(Event.category)
        .all()
    )

    years = [
        r[0]
        for r in db.query(func.substr(Event.event_date, 1, 4))
        .distinct()
        .order_by(func.substr(Event.event_date, 1, 4))
        .all()
        if r[0]
    ]

    return StatsResponse(
        total=total,
        by_status=by_status,
        by_category=by_category,
        year_range=years,
    )
