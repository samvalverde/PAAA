import os
from pathlib import Path
from typing import Optional
from app.core.config import get_settings

settings = get_settings()

try:
    import boto3  # type: ignore
except Exception:  # pragma: no cover
    boto3 = None

LOCAL_STORAGE_DIR = Path("./storage")

def ensure_local_storage():
    LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

def upload_file(content: bytes, key: str) -> str:
    """Store file to MinIO if configured; else store locally."""
    if settings.minio_endpoint and boto3:
        s3 = boto3.client(
            "s3",
            endpoint_url=settings.minio_endpoint,
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
        )
        bucket = settings.minio_bucket or "paaa-bucket"
        s3.put_object(Bucket=bucket, Key=key, Body=content)
        return f"{settings.minio_endpoint}/{bucket}/{key}"
    # Fallback local
    ensure_local_storage()
    out = LOCAL_STORAGE_DIR / key
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(content)
    return str(out.resolve())

def read_file(key: str) -> Optional[bytes]:
    if settings.minio_endpoint and boto3:
        s3 = boto3.client(
            "s3",
            endpoint_url=settings.minio_endpoint,
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
        )
        bucket = settings.minio_bucket or "paaa-bucket"
        obj = s3.get_object(Bucket=bucket, Key=key)
        return obj["Body"].read()
    # Local
    path = LOCAL_STORAGE_DIR / key
    return path.read_bytes() if path.exists() else None
