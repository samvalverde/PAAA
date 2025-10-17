# etl/db.py
from __future__ import annotations

import os
from hashlib import sha1
from typing import Iterable

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine, Connection


# -------------------------------------------------------------------
# Conexión
# -------------------------------------------------------------------
def make_engine(pg_dsn: str | None = None) -> Engine:
    """
    Crea un Engine de SQLAlchemy 2.0.
    - Si pg_dsn es None, lo toma de PG_DSN o compone uno con PGHOST/PGPORT/...
    """
    dsn = (
        pg_dsn
        or os.getenv("PG_DSN")
        or "postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{db}".format(
            user=os.getenv("PGUSER", "postgres"),
            pwd=os.getenv("PGPASSWORD", "postgres"),
            host=os.getenv("PGHOST", "localhost"),
            port=os.getenv("PGPORT", "5432"),
            db=os.getenv("PGDATABASE", "postgres"),
        )
    )
    return create_engine(dsn, future=True)


# -------------------------------------------------------------------
# Schemas / utilidades
# -------------------------------------------------------------------
def ensure_schema(conn: Connection, schema: str) -> None:
    conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))


def _table_exists(conn: Connection, schema: str, table: str) -> bool:
    sql = """
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = :schema AND table_name = :table
    """
    res = conn.execute(text(sql), {"schema": schema, "table": table}).scalar()
    return bool(res)


def _safe_index_name(schema: str, table: str, cols: list[str]) -> str:
    """
    Genera un nombre de índice (<= 63 bytes en PG).
    """
    base = f'ux_{schema}_{table}_' + "_".join(cols)
    return base if len(base) <= 60 else f'ux_{schema}_{table}_{sha1(base.encode()).hexdigest()[:8]}'


def ensure_unique_index(conn: Connection, schema: str, table: str, key_columns: list[str]) -> None:
    """
    Crea un índice UNIQUE en (key_columns) si no existe.
    Requisito para que ON CONFLICT (...) funcione.
    """
    if not key_columns:
        raise ValueError("key_columns no puede ser vacío.")
    idx_name = _safe_index_name(schema, table, key_columns)
    cols_csv = ", ".join(f'"{c}"' for c in key_columns)
    sql = f'CREATE UNIQUE INDEX IF NOT EXISTS "{idx_name}" ON "{schema}"."{table}" ({cols_csv})'
    conn.execute(text(sql))


def _create_table_from_dataframe(conn: Connection, df: pd.DataFrame, schema: str, table: str) -> None:
    """
    Crea la tabla destino con el layout del DataFrame (sin constraints).
    Usa df.head(0) para crear solo la estructura.
    """
    df.head(0).to_sql(name=table, con=conn, schema=schema, index=False, if_exists="fail", method=None)


# -------------------------------------------------------------------
# UPSERT (INSERT ... ON CONFLICT DO UPDATE)
# -------------------------------------------------------------------
def upsert_dataframe(
    conn: Connection,
    df: pd.DataFrame,
    schema: str,
    table: str,
    key_columns: Iterable[str],
    create_if_missing: bool = True,
    chunksize: int | None = 5000,
) -> None:
    """
    Inserta df en schema.table realizando UPSERT por key_columns.

    Estrategia:
      1) crear tabla si no existe (opcional)
      2) garantizar índice UNIQUE sobre las llaves
      3) volcar df a tabla temporal persistente (_tmp_*)
      4) INSERT ... SELECT ... ON CONFLICT (keys) DO UPDATE / DO NOTHING
      5) DROP TABLE temp
    """
    from uuid import uuid4

    key_columns = list(key_columns)
    if not key_columns:
        raise ValueError("key_columns no puede ser vacío.")

    # 1) crear tabla si falta
    if not _table_exists(conn, schema, table):
        if not create_if_missing:
            raise RuntimeError(f'La tabla "{schema}"."{table}" no existe y create_if_missing=False.')
        _create_table_from_dataframe(conn, df, schema, table)

    # 2) índice UNIQUE para ON CONFLICT
    ensure_unique_index(conn, schema, table, key_columns)

    # 3) escribir DataFrame en temporal
    tmp = f"_tmp_{table}_{uuid4().hex[:8]}"
    df.to_sql(
        name=tmp,
        con=conn,
        schema=schema,
        index=False,
        if_exists="replace",
        method="multi",
        chunksize=chunksize,
    )

    # 4) construir UPSERT
    cols = list(df.columns)
    cols_csv = ", ".join(f'"{c}"' for c in cols)
    keys_csv = ", ".join(f'"{k}"' for k in key_columns)

    # actualizar todas las columnas excepto las llaves
    update_cols = [c for c in cols if c not in key_columns]
    if update_cols:
        set_clause = ", ".join(f'"{c}" = EXCLUDED."{c}"' for c in update_cols)
        upsert_sql = f'''
            INSERT INTO "{schema}"."{table}" ({cols_csv})
            SELECT {cols_csv} FROM "{schema}"."{tmp}"
            ON CONFLICT ({keys_csv})
            DO UPDATE SET {set_clause}
        '''
    else:
        # si solo hay llaves, no hay nada que actualizar
        upsert_sql = f'''
            INSERT INTO "{schema}"."{table}" ({cols_csv})
            SELECT {cols_csv} FROM "{schema}"."{tmp}"
            ON CONFLICT ({keys_csv}) DO NOTHING
        '''

    conn.execute(text(upsert_sql))

    # 5) limpiar temporal
    conn.execute(text(f'DROP TABLE IF EXISTS "{schema}"."{tmp}"'))


# -------------------------------------------------------------------
# API de alto nivel
# -------------------------------------------------------------------
def ensure_schemas(conn: Connection, raw_schema: str, core_schema: str) -> None:
    ensure_schema(conn, raw_schema)
    ensure_schema(conn, core_schema)


def write_raw_dataframe(conn: Connection, df: pd.DataFrame, schema: str, table: str, chunksize: int | None = 5000) -> None:
    """
    Guarda DataFrame tal cual en schema.table (append-only).
    """
    df.to_sql(
        name=table,
        con=conn,
        schema=schema,
        index=False,
        if_exists="append",
        method="multi",
        chunksize=chunksize,
    )
