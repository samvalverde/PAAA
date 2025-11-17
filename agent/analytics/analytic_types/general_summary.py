from typing import Any, Dict, List
import os
import logging

import pandas as pd
from sqlalchemy import text

from etl.db import make_engine

# Set up logging
logger = logging.getLogger(__name__)


def _load_core_dataset(dataset_name: str, core_schema: str | None = None) -> pd.DataFrame:
    """
    Carga el dataset desde la base de datos del ETL, leyendo la tabla
    core.<dataset_name> (o el schema que se indique).

    Usa la misma conexión que el módulo etl (PG_DSN, etc.).
    """
    schema = core_schema or os.getenv("CORE_SCHEMA", "core")

    engine = make_engine()
    query = text(f'SELECT * FROM "{schema}"."{dataset_name}"')

    with engine.connect() as conn:
        df = pd.read_sql_query(query, conn)

    return df


def _apply_filters(df: pd.DataFrame, poblacion: Dict[str, Any]) -> pd.DataFrame:
    """
    Aplica 'programa' y 'filtros' de la población sobre el DataFrame.

    Soporta:
      - valor simple:  {"sexo": "F"}       -> df[df["sexo"] == "F"]
      - lista:         {"sexo": ["F","M"]} -> df[df["sexo"].isin(["F","M"])]
      - dict:          {"anio": {"gte": 2020, "lte": 2024}}
    """
    logger.info(f"Applying filters to dataframe. Available columns: {list(df.columns)}")
    
    # Filtro directo por programa si existe y la columna está en el DF
    programa = poblacion.get("programa")
    if programa is not None and "programa" in df.columns:
        logger.info(f"Filtering by programa: {programa}")
        df = df[df["programa"] == programa]

    filtros = poblacion.get("filtros", {}) or {}
    logger.info(f"Processing filters: {filtros}")
    
    for col, cond in filtros.items():
        logger.info(f"Processing filter for column '{col}' with condition: {cond}")
        if col not in df.columns:
            logger.warning(f"Column '{col}' not found in dataframe. Available columns: {list(df.columns)}")
            # Si la columna no existe, ignoramos ese filtro
            continue

        logger.info(f"Applying filter for column '{col}'")
        serie = df[col]
        
        # Special handling for year columns - convert to numeric if needed
        if 'ano' in col.lower() or 'year' in col.lower():
            logger.info(f"Detected year column '{col}', converting to numeric")
            # Convert to numeric, invalid parsing becomes NaN
            serie_numeric = pd.to_numeric(serie, errors='coerce')
            # Log data types and sample values for debugging
            logger.info(f"Original series dtype: {serie.dtype}, sample values: {serie.head().tolist()}")
            logger.info(f"Converted series dtype: {serie_numeric.dtype}, sample values: {serie_numeric.head().tolist()}")
            # Count non-null values
            logger.info(f"Non-null values after conversion: {serie_numeric.notna().sum()} out of {len(serie_numeric)}")
            serie = serie_numeric

        # 1) Valor simple -> igualdad
        if isinstance(cond, (str, int, float, bool)):
            logger.info(f"Applying simple equality filter: {col} == {cond}")
            df = df[serie == cond]

        # 2) Lista -> IN
        elif isinstance(cond, list):
            logger.info(f"Applying list filter: {col} IN {cond}")
            df = df[serie.isin(cond)]

        # 3) Dict de operadores
        elif isinstance(cond, dict):
            logger.info(f"Applying dict filter for {col}: {cond}")
            if "eq" in cond:
                logger.info(f"  - Equality: {col} == {cond['eq']}")
                df = df[serie == cond["eq"]]
            if "neq" in cond:
                logger.info(f"  - Not equal: {col} != {cond['neq']}")
                df = df[serie != cond["neq"]]
            if "gte" in cond:
                logger.info(f"  - Greater than or equal: {col} >= {cond['gte']}")
                # For year comparisons, ensure we have valid numeric values
                if 'ano' in col.lower() or 'year' in col.lower():
                    logger.info(f"  - Applying numeric filter, excluding NaN values")
                    df = df[serie >= cond["gte"]]
                else:
                    df = df[serie >= cond["gte"]]
            if "lte" in cond:
                logger.info(f"  - Less than or equal: {col} <= {cond['lte']}")
                # For year comparisons, ensure we have valid numeric values  
                if 'ano' in col.lower() or 'year' in col.lower():
                    logger.info(f"  - Applying numeric filter, excluding NaN values")
                    df = df[serie <= cond["lte"]]
                else:
                    df = df[serie <= cond["lte"]]
            if "gt" in cond:
                logger.info(f"  - Greater than: {col} > {cond['gt']}")
                df = df[serie > cond["gt"]]
            if "lt" in cond:
                logger.info(f"  - Less than: {col} < {cond['lt']}")
                df = df[serie < cond["lt"]]
            if "in" in cond:
                logger.info(f"  - In list: {col} IN {cond['in']}")
                df = df[serie.isin(cond["in"])]
        
        logger.info(f"After applying filter for {col}, dataframe has {len(df)} rows")

    logger.info(f"Final filtered dataframe has {len(df)} rows")
    return df


def _compute_nps(series: pd.Series) -> float:
    """
    Calcula NPS asumiendo escala 1–10 o 0–10.

    Regla estándar:
      - Detractores: <= 6
      - Neutros: 7–8
      - Promotores: 9–10

    Devuelve NPS en porcentaje (ej. 47.0).
    """
    s = pd.to_numeric(series, errors="coerce").dropna()
    if s.empty:
        return 0.0

    detractores = (s <= 6).sum()
    promotores = (s >= 9).sum()
    total = len(s)
    return (promotores - detractores) * 100.0 / total if total else 0.0


def generate_general_summary(poblacion: Dict[str, Any],
                             distribuciones: List[str]) -> Dict[str, Any]:
    """
    Genera un resumen general de la población filtrada leyendo directamente
    de la base del ETL (schema core).

    Espera que `poblacion` tenga al menos:
      - dataset: nombre de la tabla en el schema core (ej. "egresados")
      - opcional: programa
      - opcional: filtros {columna: valor / lista / {gte,lte,...}}

    `distribuciones` es una lista de nombres de columnas para las que se
    quiere la distribución (conteos por valor).

    Devuelve un dict con:
    {
        "kpis": { ... },
        "tablas": { ... },
        "distribuciones": { ... }
    }
    """
    dataset_name = poblacion.get("dataset")
    if not dataset_name:
        raise ValueError("La población no contiene el campo 'dataset'.")

    # 1) Cargar datos desde core.<dataset_name> y aplicar filtros
    df = _load_core_dataset(dataset_name)
    logger.info(f"Loaded dataset {dataset_name} with {len(df)} rows and columns: {list(df.columns)}")
    
    df = _apply_filters(df, poblacion)
    logger.info(f"After filtering: {len(df)} rows remaining")

    # Actualizamos n en la población si no viene; esto se devuelve al cliente
    n = len(df)
    if "n" not in poblacion:
        poblacion["n"] = n

    # 2) KPIs básicos
    kpis: Dict[str, Any] = {
        "total_registros": n
    }

    # Pregunta de satisfacción "estrella" si existe
    sat_col = "ep07_18_en_general_cual_es_su_grado_de_satisfaccion_en_relacion"
    if sat_col in df.columns:
        logger.info(f"Found satisfaction column {sat_col}")
        # Para satisfacción categórica, convertir a escala numérica
        sat_series = df[sat_col].dropna()
        # Mapping de respuestas categóricas a escala numérica (1-5)
        satisfaction_mapping = {
            "Insatisfecho (a)": 1,
            "Algo satisfecho (a)": 2,
            "Satisfecho (a)": 3,
            "Muy satisfecho (a)": 4,
            "Extremadamente satisfecho (a)": 5
        }
        sat_vals = sat_series.map(satisfaction_mapping)
        if sat_vals.notna().any():
            kpis["satisfaccion_media"] = float(sat_vals.mean(skipna=True))
            # Para NPS con escala 1-5, ajustar criterios: 1-2=detractores, 3=neutros, 4-5=promotores
            detractores = (sat_vals <= 2).sum()
            promotores = (sat_vals >= 4).sum()
            total = sat_vals.notna().sum()
            kpis["nps"] = float((promotores - detractores) * 100.0 / total) if total else 0.0
    else:
        logger.info(f"Satisfaction column {sat_col} not found in columns: {list(df.columns)}")

    # 3) Tablas de composición
    tablas: Dict[str, Any] = {}

    # Tabla de posgrados usando el nombre correcto de columna
    posgrado_col = "ig01_1_el_posgrado_que_usted_curso_es"
    if posgrado_col in df.columns:
        logger.info(f"Found posgrado column {posgrado_col}")
        vc = df[posgrado_col].value_counts(dropna=False)
        total_posgrados = vc.sum()
        filas_posgrados = []
        for nombre, conteo in vc.items():
            if pd.isna(nombre):
                nombre = "Sin especificar"
            porcentaje = (conteo * 100.0 / total_posgrados) if total_posgrados else 0.0
            filas_posgrados.append({
                "posgrado": str(nombre),
                "total": int(conteo),
                "porcentaje": round(porcentaje, 1),
            })
        tablas["posgrados"] = filas_posgrados
    else:
        logger.info("Posgrado column not found")

    # Tabla de programa (si existe la columna programa)
    if "programa" in df.columns:
        logger.info("Found programa column")
        vc = df["programa"].value_counts(dropna=False)
        total_programas = vc.sum()
        filas_programas = []
        for nombre, conteo in vc.items():
            if pd.isna(nombre):
                nombre = "Sin especificar"
            porcentaje = (conteo * 100.0 / total_programas) if total_programas else 0.0
            filas_programas.append({
                "programa": str(nombre),
                "total": int(conteo),
                "porcentaje": round(porcentaje, 1),
            })
        tablas["programas"] = filas_programas

    ## Aca se puede expandir mas tablas si se quiere

    # 4) Distribuciones solicitadas
    distribuciones_resultado: Dict[str, Any] = {}
    logger.info(f"Processing distributions for: {distribuciones}")
    for variable in distribuciones:
        if variable not in df.columns:
            # Si el cliente pide una distribución de una columna que no existe,
            # simplemente la ignoramos.
            logger.warning(f"Distribution column '{variable}' not found in dataset columns: {list(df.columns)}")
            continue

        logger.info(f"Processing distribution for {variable}")
        vc = df[variable].value_counts(dropna=False).sort_index()
        dist = {}
        for valor, conteo in vc.items():
            clave = "NA" if pd.isna(valor) else str(valor)
            dist[clave] = int(conteo)
        distribuciones_resultado[variable] = dist

    logger.info(f"Final result: kpis={kpis}, distribuciones={distribuciones_resultado}")
    return {
        "kpis": kpis,
        "tablas": tablas,
        "distribuciones": distribuciones_resultado,
    }
