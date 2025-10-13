from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, Iterable, Optional
import pandas as pd

from .io import read_dataframe
from .validators import require_columns, assert_not_null, validate_email_column
from .utils import normalize_columns, coerce_types, drop_duplicates_by_keys, rename_aliases
from .db import make_engine, upsert_dataframe, ensure_schema

@dataclass
class SurveyETL:
    """
    ETL genérico para planillas tipo encuesta/datos del proyecto PAAA.
    Nombre mantenido como SurveyETL por compatibilidad con tu código.
    """
    # Fuente: ruta local (CSV/Excel) o URL estilo s3://bucket/key (MinIO/S3)
    source: str

    # Conexión a Postgres: usar PG_DSN o (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)
    pg_dsn: Optional[str] = None

    # Nombre base de tablas destino
    dataset_name: str = "estudiantes"

    # Columnas clave para UPSERT (llave natural/compuesta)
    key_columns: Iterable[str] = field(default_factory=lambda: ("id_estudiante", "periodo"))

    # Dtypes destino (pandas dtypes)
    dtypes: Optional[Dict[str, str]] = None

    # Columnas que deben existir sí o sí en el DataFrame
    required_columns: Iterable[str] = field(default_factory=lambda: ("id_estudiante", "nombre", "email", "periodo"))

    # Schemas/capas
    raw_schema: str = "raw"
    core_schema: str = "core"

    # Si quieres guardar copia cruda además del core
    write_raw: bool = True

    def run(self) -> None:
        """Orquesta: extract → transform → load."""
        df = self.extract()
        df_t = self.transform(df)
        self.load(df, df_t)

    # --------------------------- EXTRACT ---------------------------
    def extract(self) -> pd.DataFrame:
        """Lee el archivo/objeto y devuelve un DataFrame crudo."""
        df = read_dataframe(self.source)
        if df.empty:
            raise ValueError(f"La fuente '{self.source}' está vacía o no se pudo leer.")
        return df

    # --------------------------- TRANSFORM -------------------------
# --------------------------- TRANSFORM ---------------------------
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Limpieza + tipado + validaciones de negocio mínimas."""
        # 1) normalizar headers + alias (correo -> email, semestre -> periodo, etc.)
        df = df.rename(columns=normalize_columns)
        df = rename_aliases(df)

        # 2) asegurar columnas requeridas (ya en nombres canónicos)
        require_columns(df, self.required_columns)

        # 3) tipar columnas si se indicó
        if self.dtypes:
            df = coerce_types(df, self.dtypes)

        # 4) trims y limpieza básica de strings
        for c in df.select_dtypes(include=["object", "string"]).columns:
            df[c] = df[c].astype(str).str.strip()

        # 5) validaciones puntuales
        assert_not_null(df, list(self.key_columns))
        if "email" in df.columns:
            validate_email_column(df, "email")

        # 6) deduplicados por llave (mantiene la primera aparición)
        df = drop_duplicates_by_keys(df, list(self.key_columns))

        return df


    # --------------------------- LOAD ------------------------------
    def load(self, df_raw: pd.DataFrame, df_core: pd.DataFrame) -> None:
        """Crea schemas si no existen, guarda raw (opcional) y hace UPSERT a core."""
        engine = make_engine(self.pg_dsn)

        # Asegurar schemas
        with engine.begin() as conn:
            ensure_schema(conn, self.raw_schema)
            ensure_schema(conn, self.core_schema)

        # Guardar copia cruda
        if self.write_raw:
            df_raw.to_sql(
                name=self.dataset_name,
                con=engine,
                schema=self.raw_schema,
                if_exists="append",
                index=False,
                method="multi",
                chunksize=1000,
            )

        # UPSERT a core
        with engine.begin() as conn:
            upsert_dataframe(
                conn=conn,
                df=df_core,
                table=self.dataset_name,
                key_columns=list(self.key_columns),
                schema=self.core_schema,
                create_if_missing=True,
            )
