from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine, ensure_pgvector_extension, SessionLocal
from .api.events import router as events_router
from .api.search import router as search_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure pgvector extension and create tables
    from sqlalchemy import text
    with SessionLocal() as db:
        ensure_pgvector_extension(db)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AI Chronos API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router, prefix="/api")
app.include_router(search_router, prefix="/api")
