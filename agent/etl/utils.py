# etl/utils.py
from __future__ import annotations
import re, unicodedata
from typing import Dict
import pandas as pd

__ALL__ = [
    "normalize_columns", "rename_aliases",
    "coerce_types", "drop_duplicates_by_keys",
    "ALIAS_MAP_DEFAULT",
]

def _strip_diacritics(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

def normalize_columns(col: str) -> str:
    c = _strip_diacritics(str(col)).strip().lower()
    c = re.sub(r"[^\w]+", "_", c)
    c = re.sub(r"_+", "_", c).strip("_")
    return c

ALIAS_MAP_DEFAULT: Dict[str, list[str]] = {
    # correo
    "email": [
        "email","e_mail","mail",
        "correo","correo_electronico","correo_institucional","correo_personal",
    ],
    # periodo/semestre (por si aplica)
    "periodo": ["periodo","periodo_academico","semestre","ciclo","anio","ano"],
    # ids
    "id_estudiante": ["id_estudiante","carne","carnet","cedula","cedula_estudiante","id"],
    "id_profesor":   ["id_profesor","codigo","id","cedula","cedula_profesor"],
}

def rename_aliases(df: pd.DataFrame, alias_map: Dict[str, list[str]] = ALIAS_MAP_DEFAULT) -> pd.DataFrame:
    mapping = {}
    cols = set(df.columns)
    for canon, cands in alias_map.items():
        for cand in cands:
            if cand in cols:
                mapping[cand] = canon
    return df.rename(columns=mapping) if mapping else df

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
                pass
    return df

def drop_duplicates_by_keys(df: pd.DataFrame, key_cols):
    return df.drop_duplicates(subset=list(key_cols), keep="first", ignore_index=True)
