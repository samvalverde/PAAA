# app/minio_utils.py
from __future__ import annotations
import os
from pathlib import Path
from typing import Optional
from minio import Minio

def get_minio() -> Minio:
    endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
    access   = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    secret   = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    secure   = os.getenv("MINIO_SECURE", "false").lower() == "true"
    return Minio(endpoint, access_key=access, secret_key=secret, secure=secure)

def pick_object(client: Minio, bucket: str, prefix: str,
                version: Optional[str] = None,
                filename: Optional[str] = None) -> str:
    """
    Devuelve el object_name a descargar:
      - si filename, busca match exacto
      - si version, busca objetos que contengan "version" en el nombre y elige el más reciente
      - si nada, elige el más reciente por last_modified
    """
    candidates = list(client.list_objects(bucket, prefix=prefix, recursive=True))
    if not candidates:
        raise FileNotFoundError(f"No hay objetos bajo s3://{bucket}/{prefix}")

    # filename exacto
    if filename:
        for obj in candidates:
            name = obj.object_name
            if name.endswith(filename) or Path(name).name == filename:
                return obj.object_name
        raise FileNotFoundError(f"No se encontró filename '{filename}' bajo {prefix}")

    # filtrar por version en el nombre
    if version:
        vers = [o for o in candidates if version in o.object_name]
        if vers:
            vers.sort(key=lambda o: o.last_modified, reverse=True)
            return vers[0].object_name

    # más reciente
    candidates.sort(key=lambda o: o.last_modified, reverse=True)
    return candidates[0].object_name

def download_object(client: Minio, bucket: str, object_name: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    client.fget_object(bucket, object_name, str(dest))
    return dest
