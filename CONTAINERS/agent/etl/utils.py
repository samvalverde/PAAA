# etl/utils.py
from __future__ import annotations
import re, unicodedata
from typing import Dict
import pandas as pd

__ALL__ = ["normalize_columns", "coerce_types", "drop_duplicates_by_keys", "rename_aliases", "ALIAS_MAP_DEFAULT"]

def _strip_diacritics(s: str) -> str:
    # 'electrónico' -> 'electronico'
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

def normalize_columns(col: str) -> str:
    """
    snake_case predecible:
    - quita tildes
    - lower + trim
    - reemplaza no-alfanum por _
    - colapsa __ y recorta _ al borde
    """
    c = _strip_diacritics(str(col)).strip().lower()
    c = re.sub(r"[^\w]+", "_", c, flags=re.U)
    c = re.sub(r"_+", "_", c).strip("_")
    return c

def coerce_types(df: pd.DataFrame, dtypes: Dict[str, str]) -> pd.DataFrame:
    for col, dt in dtypes.items():
        if col not in df.columns:
            continue
        if dt.startswith("datetime"):
            df[col] = pd.to_datetime(df[col], errors="coerce")
        elif dt.lower() == "string":
            df[col] = df[col].astype("string").str.strip()
        else:
            try:
                df[col] = df[col].astype(dt)
            except Exception:
                df[col] = pd.to_numeric(df[col], errors="ignore")
    return df

def drop_duplicates_by_keys(df: pd.DataFrame, key_cols):
    return df.drop_duplicates(subset=list(key_cols), keep="first", ignore_index=True)

# --- NUEVO: alias -> canon ---
ALIAS_MAP_DEFAULT: Dict[str, list[str]] = {
    # email
    "email": [
        "email", "e_mail", "mail",
        "correo", "correo_electronico", "correo_institucional", "correo_personal",
    ],
    # periodo/semestre
    "periodo": ["periodo", "periodo_academico", "semestre", "ciclo", "anio", "ano"],
    # ids comunes (por si aparecen)
    "id_estudiante": ["id_estudiante", "carne", "carnet", "cedula", "cedula_estudiante", "id"],
    "id_profesor":   ["id_profesor", "codigo", "id", "cedula", "cedula_profesor"],
}

def rename_aliases(df: pd.DataFrame, alias_map: Dict[str, list[str]] = ALIAS_MAP_DEFAULT) -> pd.DataFrame:
    # df ya debe venir con columnas normalizadas (normalize_columns)
    mapping: Dict[str, str] = {}
    cols = set(df.columns)
    for canon, cands in alias_map.items():
        for cand in cands:
            if cand in cols:
                mapping[cand] = canon
    if mapping:
        df = df.rename(columns=mapping)
    return df
