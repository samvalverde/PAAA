from pydantic import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "PAAA Backend"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # DBs
    database_url_users: str = "sqlite:///./data/users.db"
    database_url_data: str = "sqlite:///./data/data.db"

    # MinIO (optional; if not set, backend will use local storage folder)
    minio_endpoint: str | None = None
    minio_access_key: str | None = None
    minio_secret_key: str | None = None
    minio_bucket: str | None = None

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore
