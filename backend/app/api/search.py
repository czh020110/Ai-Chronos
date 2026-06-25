"""RAG hybrid search API endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy import text, func
from sqlalchemy.orm import Session

from ..db import Event, get_db
from ..schemas import SearchRequest, SearchResult, SearchEvent
from ..services.embedding import encode, rerank
from ..api.events import _to_response

router = APIRouter(tags=["search"])

RECALL_K = 50
RRF_K = 60
RERANK_TOP_N = 30


def _rrf_merge(
    semantic_ids: list[tuple[str, float]],
    keyword_ids: list[tuple[str, float]],
) -> list[tuple[str, float]]:
    """Reciprocal Rank Fusion: merge two ranked lists."""
    scores: dict[str, float] = {}
    for rank, (id_, _) in enumerate(semantic_ids):
        scores[id_] = scores.get(id_, 0) + 1.0 / (RRF_K + rank + 1)
    for rank, (id_, _) in enumerate(keyword_ids):
        scores[id_] = scores.get(id_, 0) + 1.0 / (RRF_K + rank + 1)
    merged = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return merged


def _semantic_recall(db: Session, query_embedding: list[float], limit: int) -> list[tuple[str, float]]:
    """Vector similarity recall using pgvector."""
    emb_str = "[" + ",".join(str(v) for v in query_embedding) + "]"
    rows = db.execute(
        text(
            "SELECT id, 1 - (embedding <=> :emb::vector) AS score "
            "FROM events "
            "WHERE embedding IS NOT NULL AND status = 'published' "
            "ORDER BY embedding <=> :emb::vector "
            "LIMIT :limit"
        ),
        {"emb": emb_str, "limit": limit},
    ).fetchall()
    return [(r[0], float(r[1])) for r in rows]


def _keyword_recall(db: Session, query: str, limit: int) -> list[tuple[str, float]]:
    """Full-text keyword recall using tsvector."""
    rows = db.execute(
        text(
            "SELECT id, ts_rank_cd(search_vector, plainto_tsquery('simple', :q)) AS score "
            "FROM events "
            "WHERE search_vector IS NOT NULL AND status = 'published' "
            "AND search_vector @@ plainto_tsquery('simple', :q) "
            "ORDER BY ts_rank_cd(search_vector, plainto_tsquery('simple', :q)) DESC "
            "LIMIT :limit"
        ),
        {"q": query, "limit": limit},
    ).fetchall()
    return [(r[0], float(r[1])) for r in rows]


@router.post("/search", response_model=SearchResult)
def search_events(body: SearchRequest, db: Session = Depends(get_db)):
    query = body.query
    mode = body.mode
    result_limit = body.limit

    # Step 1: Embed the query
    query_embedding = encode([query])[0]

    # Step 2: Recall candidates
    if mode == "semantic":
        candidates = _semantic_recall(db, query_embedding, RECALL_K)
    elif mode == "keyword":
        candidates = _keyword_recall(db, query, RECALL_K)
    else:  # hybrid
        semantic_ids = _semantic_recall(db, query_embedding, RECALL_K)
        keyword_ids = _keyword_recall(db, query, RECALL_K)
        candidates = _rrf_merge(semantic_ids, keyword_ids)

    total_candidates = len(candidates)
    if total_candidates == 0:
        return SearchResult(events=[], summary=None, total_candidates=0)

    # Step 3: Rerank top candidates
    top_ids = [id_ for id_, _ in candidates[:RERANK_TOP_N]]
    top_events = db.query(Event).filter(Event.id.in_(top_ids)).all()
    event_map = {e.id: e for e in top_events}

    # Build documents for reranking
    doc_texts = []
    ordered_ids = []
    for id_ in top_ids:
        ev = event_map.get(id_)
        if ev:
            doc_texts.append(f"{ev.title}. {ev.category}. {ev.content_md[:300]}")
            ordered_ids.append(id_)

    if doc_texts:
        rerank_scores = rerank(query, doc_texts)
        scored = list(zip(ordered_ids, rerank_scores))
        scored.sort(key=lambda x: x[1], reverse=True)
    else:
        scored = [(id_, 0) for id_ in top_ids]

    # Step 4: Build result with limit
    final_ids = [id_ for id_, _ in scored[:result_limit]]
    final_scores = [score for _, score in scored[:result_limit]]

    final_events = db.query(Event).filter(Event.id.in_(final_ids)).all()
    final_map = {e.id: e for e in final_events}

    # Preserve rerank order
    result_events: list[SearchEvent] = []
    for id_, score in scored[:result_limit]:
        ev = final_map.get(id_)
        if ev:
            resp = _to_response(ev)
            result_events.append(SearchEvent(**resp.model_dump(), score=score))

    return SearchResult(
        events=result_events,
        summary=None,  # LLM summary to be added later
        total_candidates=total_candidates,
    )
