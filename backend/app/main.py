from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .api.events import router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Chronos API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")