from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "NewsIQ"
    database_url: str = "sqlite:///./news_iq.db"
    openai_api_key: str = ""
    news_api_key: str = ""
    vector_store_dir: str = "./storage/vector_store"
    chunk_size: int = 600
    chunk_overlap: int = 120
    ingestion_batch_size: int = 20
    hacker_news_limit: int = 30

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def vector_store_path(self) -> Path:
        path = Path(self.vector_store_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()
