# carga.py
from __future__ import annotations
from pathlib import Path
from typing import Dict, List, Tuple
import os

from etl import SurveyETL
from etl.io import read_dataframe
from etl.utils import normalize_columns, rename_aliases

# Prioridad de llaves por dataset
KEY_CANDIDATES: Dict[str, List[str]] = {
    "egresados":  ["email", "id_id_de_respuesta", "token", "seed_semilla"],
    "profesores": ["email", "id_id_de_respuesta", "token", "seed_semilla"],
}

# Tipado base (se puede ampliar)
DTYPES_BASE: Dict[str, Dict[str, str]] = {
    "egresados":  {"programa": "string", "email": "string", "id_id_de_respuesta": "string", "version": "string"},
    "profesores": {"programa": "string", "email": "string", "id_id_de_respuesta": "string", "version": "string"},
}

def preflight_and_choose_key(src: Path, dataset: str) -> Tuple[str, list[str]]:
    df0 = read_dataframe(str(src)).head(0)
    df0 = df0.rename(columns=normalize_columns)
    df0 = rename_aliases(df0)
    cols = list(df0.columns)

    for k in KEY_CANDIDATES[dataset]:
        if k in df0.columns:
            return k, cols

    raise KeyError(f"[{dataset}] No se encontró llave entre {KEY_CANDIDATES[dataset]} | cols: {cols}")

def cargar_archivo(programa: str, dataset: str, version: str, file_path: Path) -> dict:
    """
    Carga un archivo XLSX/CSV a la BD ETL:
      - añade columnas estáticas (programa, version)
      - normaliza encabezados y alias
      - hace UPSERT a core.<dataset> y append a raw.<dataset>
    """
    dataset = dataset.lower().strip()
    if dataset not in ("egresados", "profesores"):
        raise ValueError("dataset debe ser 'egresados' o 'profesores'")

    key_col, _ = preflight_and_choose_key(file_path, dataset)

    etl = SurveyETL(
        source=str(file_path),
        dataset_name=dataset,                    # tablas únicas: core.egresados / core.profesores
        key_columns=("programa", key_col),       # clave compuesta
        required_columns=("programa", key_col),
        dtypes=DTYPES_BASE.get(dataset, {}),
        static_columns={"programa": programa, "version": version},
        write_raw=True,
    )
    etl.run()
    return {
        "programa": programa,
        "dataset": dataset,
        "version": version,
        "key": ["programa", key_col],
        "source": str(file_path),
        "status": "ok",
    }
