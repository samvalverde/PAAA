from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "PAAA Backend"
    database_url_users: str
    database_url_data: str
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_bucket: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"

def get_settings():
    return Settings()