from __future__ import annotations
import re
from typing import Iterable, List
import pandas as pd

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def require_columns(df: pd.DataFrame, required: Iterable[str]) -> None:
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise KeyError(f"Faltan columnas requeridas: {missing}. Columnas presentes: {list[df.columns]}")

def assert_not_null(df: pd.DataFrame, cols: List[str]) -> None:
    for c in cols:
        if c not in df.columns:
            raise KeyError(f"La columna requerida '{c}' no existe en el DataFrame.")
        if df[c].isna().any():
            idx = df[df[c].isna()].index[:5].tolist()
            raise ValueError(f"La columna '{c}' tiene valores nulos. Ejemplos de índices: {idx}")

def validate_email_column(df: pd.DataFrame, col: str) -> None:
    if col not in df.columns:
        return
    bad = ~df[col].astype(str).str.match(EMAIL_RE, na=False)
    if bad.any():
        sample = df.loc[bad, col].head(5).tolist()
        raise ValueError(f"Correos con formato inválido en '{col}'. Ejemplos: {sample}")
