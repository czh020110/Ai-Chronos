"""Embedding and reranking service using sentence-transformers."""

from __future__ import annotations

from functools import lru_cache

from app.config import settings


@lru_cache(maxsize=1)
def _get_embedding_model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(settings.EMBEDDING_MODEL)


@lru_cache(maxsize=1)
def _get_reranker_model():
    from sentence_transformers import CrossEncoder
    return CrossEncoder(settings.RERANKER_MODEL)


def encode(texts: list[str]) -> list[list[float]]:
    """Encode texts into embedding vectors."""
    model = _get_embedding_model()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.tolist()


def rerank(query: str, documents: list[str]) -> list[float]:
    """Score query-document pairs using cross-encoder reranker."""
    if not documents:
        return []
    model = _get_reranker_model()
    pairs = [(query, doc) for doc in documents]
    scores = model.predict(pairs, show_progress_bar=False)
    return scores.tolist()
