from __future__ import annotations
import io
import os
import pathlib
import pandas as pd
from urllib.parse import urlparse

def _read_local(path: str) -> pd.DataFrame:
    ext = pathlib.Path(path).suffix.lower()
    if ext in [".csv"]:
        return pd.read_csv(path)
    if ext in [".xlsx", ".xlsm", ".xls"]:
        return pd.read_excel(path)
    raise ValueError(f"Extensión no soportada para '{path}'")

def _read_minio(url: str) -> pd.DataFrame:
    """Lectura sencilla desde MinIO/S3 usando credenciales de entorno."""
    try:
        from minio import Minio
    except Exception as e:
        raise RuntimeError("Para leer minio:// necesitas instalar 'minio' en Poetry") from e

    u = urlparse(url)
    bucket = u.netloc
    key = u.path.lstrip("/")

    endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
    access = os.getenv("MINIO_ACCESS_KEY")
    secret = os.getenv("MINIO_SECRET_KEY")
    secure = os.getenv("MINIO_SECURE", "false").lower() == "true"

    client = Minio(endpoint, access_key=access, secret_key=secret, secure=secure)
    resp = client.get_object(bucket, key)
    data = resp.read()  # bytes

    ext = pathlib.Path(key).suffix.lower()
    if ext in [".csv"]:
        return pd.read_csv(io.BytesIO(data))
    if ext in [".xlsx", ".xlsm", ".xls"]:
        return pd.read_excel(io.BytesIO(data))
    raise ValueError(f"Extensión no soportada para '{url}'")

def read_dataframe(source: str) -> pd.DataFrame:
    """Lee DataFrame desde ruta local o minio/s3."""
    if source.startswith(("minio://", "s3://")):
        return _read_minio(source)
    return _read_local(source)
