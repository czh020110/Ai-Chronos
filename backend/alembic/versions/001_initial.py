"""${message}

Revision ID: 001
Revises:
Create Date: 2026-06-25
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, TSVECTOR
from pgvector.sqlalchemy import Vector

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "events",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("event_date", sa.String(), nullable=False),
        sa.Column("content_md", sa.Text(), nullable=False),
        sa.Column("tags", sa.Text(), nullable=False),
        sa.Column("source_urls", sa.Text(), nullable=False),
        sa.Column("impact_score", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=False),
        sa.Column("tags_arr", ARRAY(sa.Text()), nullable=True),
        sa.Column("source_urls_arr", ARRAY(sa.Text()), nullable=True),
        sa.Column("embedding", Vector(1024), nullable=True),
        sa.Column("search_vector", TSVECTOR, nullable=True),
    )

    # HNSW index for vector similarity search
    op.execute(
        "CREATE INDEX ix_events_embedding ON events "
        "USING hnsw (embedding vector_cosine_ops) "
        "WITH (m = 16, ef_construction = 64)"
    )

    # GIN index for full-text search
    op.execute(
        "CREATE INDEX ix_events_search_vector ON events "
        "USING gin (search_vector)"
    )

    # B-tree index for date ordering
    op.create_index("ix_events_event_date", "events", ["event_date"])


def downgrade() -> None:
    op.drop_index("ix_events_event_date", table_name="events")
    op.execute("DROP INDEX IF EXISTS ix_events_search_vector")
    op.execute("DROP INDEX IF EXISTS ix_events_embedding")
    op.drop_table("events")
