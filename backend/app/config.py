"""Application configuration via pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://chronos:chronos@localhost:5432/ai_chronos"
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    RERANKER_MODEL: str = "BAAI/bge-reranker-v2-m3"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
