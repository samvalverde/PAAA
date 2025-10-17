# etl/survey_etl.py
from __future__ import annotations
from typing import Dict, Iterable, Tuple
import pandas as pd

from .io import read_dataframe
from .utils import normalize_columns, rename_aliases, coerce_types, drop_duplicates_by_keys
from .validators import assert_not_null, validate_email_column
from .db import make_engine, ensure_schemas, write_raw_dataframe, upsert_dataframe

class SurveyETL:
    def __init__(
        self,
        source: str,
        dataset_name: str,
        key_columns: Tuple[str, ...],
        required_columns: Iterable[str] = (),
        dtypes: Dict[str, str] | None = None,
        static_columns: Dict[str, object] | None = None,
        write_raw: bool = True,
        raw_schema: str = "raw",
        core_schema: str = "core",
        pg_dsn: str | None = None,
    ):
        self.source = source
        self.dataset_name = dataset_name
        self.key_columns = tuple(key_columns)
        self.required_columns = tuple(required_columns) if required_columns else tuple(key_columns)
        self.dtypes = dtypes or {}
        self.static_columns = static_columns or {}
        self.write_raw = write_raw
        self.raw_schema = raw_schema
        self.core_schema = core_schema
        self.pg_dsn = pg_dsn

    # ------------------------- EXTRACT -------------------------
    def extract(self) -> pd.DataFrame:
        return read_dataframe(self.source)

    # ------------------------ TRANSFORM ------------------------
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        # 1) headers
        df = df.rename(columns=normalize_columns)
        df = rename_aliases(df)

        # 2) columnas estáticas (programa, version, file_id, etc.)
        for k, v in self.static_columns.items():
            if k not in df.columns:
                df[k] = v

        # 3) requeridas
        missing = [c for c in self.required_columns if c not in df.columns]
        if missing:
            raise KeyError(f"Faltan columnas requeridas: {missing}")

        # 4) tipos
        if self.dtypes:
            df = coerce_types(df, self.dtypes)

        # 5) limpieza strings
        for c in df.select_dtypes(include=["object", "string"]).columns:
            df[c] = df[c].astype(str).str.strip()

        # 6) validaciones básicas
        assert_not_null(df, list(self.key_columns))
        if "email" in df.columns:
            validate_email_column(df, "email")

        # 7) dedupe por llave
        df = drop_duplicates_by_keys(df, list(self.key_columns))
        return df

    # -------------------------- LOAD --------------------------
    def load(self, df_raw: pd.DataFrame, df_core: pd.DataFrame) -> None:
        engine = make_engine(self.pg_dsn)
        with engine.begin() as conn:
            ensure_schemas(conn, self.raw_schema, self.core_schema)

            # RAW (append-only)
            if self.write_raw:
                write_raw_dataframe(conn, df_raw, self.raw_schema, self.dataset_name)

            # CORE (UPSERT por llaves)
            upsert_dataframe(
                conn,
                df_core,
                schema=self.core_schema,
                table=self.dataset_name,
                key_columns=self.key_columns,
            )

    # -------------------------- RUN ---------------------------
    def run(self) -> None:
        df = self.extract()
        df_t = self.transform(df)
        self.load(df, df_t)
