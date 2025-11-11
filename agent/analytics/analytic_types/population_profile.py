from typing import Any, Dict, List

import pandas as pd

from .general_summary import _load_core_dataset, _apply_filters


def _first_existing_column(df: pd.DataFrame, candidates: List[str]) -> str | None:
    """Devuelve el primer nombre de columna que exista en el DataFrame."""
    for c in candidates:
        if c in df.columns:
            return c
    return None


def _find_column_by_keywords(df: pd.DataFrame, keywords: List[str]) -> str | None:
    """
    Busca una columna cuyo nombre contenga *todas* las palabras clave.
    Ej.: keywords=["edad"] -> matchea "ig03_5_edad".
    """
    cols = [c for c in df.columns]
    for col in cols:
        name = col.lower()
        if all(kw.lower() in name for kw in keywords):
            return col
    return None


def _build_composition_table(
    df: pd.DataFrame,
    column: str,
    label_key: str,
    top_n: int | None = None,
) -> List[Dict[str, Any]]:
    """
    Construye una tabla de composición para una columna categórica.

    Devuelve una lista de filas con:
      { <label_key>: valor, "total": n, "porcentaje": % }
    """
    vc = df[column].value_counts(dropna=False)
    if top_n is not None:
        vc = vc.head(top_n)

    total = vc.sum()
    filas: List[Dict[str, Any]] = []

    for valor, conteo in vc.items():
        nombre = "Sin dato" if pd.isna(valor) else str(valor)
        porcentaje = float(conteo * 100.0 / total) if total else 0.0
        filas.append(
            {
                label_key: nombre,
                "total": int(conteo),
                "porcentaje": round(porcentaje, 1),
            }
        )

    return filas


def generate_population_profile(
    poblacion: Dict[str, Any],
    distribuciones: List[str],
) -> Dict[str, Any]:
    """
    Analítica de perfil de población.

    Describe la composición de la población filtrada usando variables
    demográficas / de contexto del ETL (las que en tu tabla tienen
    nombres tipo 'ig03_5_edad', 'ig01_3_sexo', 'ig02_2_ano_de_graduacion', etc.).

    Devuelve:
      {
        "kpis": { ... },
        "tablas": { ... },
        "distribuciones": { ... }
      }
    """
    dataset_name = poblacion.get("dataset")
    if not dataset_name:
        raise ValueError("La población no contiene el campo 'dataset'.")

    # 1) Cargar datos desde la BD del ETL (schema core) y aplicar filtros
    df = _load_core_dataset(dataset_name)
    df = _apply_filters(df, poblacion)

    n = len(df)
    if "n" not in poblacion:
        poblacion["n"] = n

    kpis: Dict[str, Any] = {
        "total_registros": n,
    }

    tablas: Dict[str, Any] = {}

    # 2) Detectar columnas relevantes usando candidatos + palabras clave

    # Edad: intenta nombres típicos y si no, cualquier columna que contenga "edad"
    edad_col = _first_existing_column(df, ["ipg_edad", "edad"])
    if not edad_col:
        edad_col = _find_column_by_keywords(df, ["edad"])

    # Sexo / género
    sexo_col = _first_existing_column(
        df,
        ["ipg_sexo", "sexo", "genero", "ipg_genero"],
    )
    if not sexo_col:
        sexo_col = _find_column_by_keywords(df, ["sexo"])

    # Programa / posgrado: primero 'programa' (columna creada por ETL),
    # y si no, la pregunta de "posgrado que usted cursó"
    programa_col = _first_existing_column(df, ["ipg_programa", "programa"])
    if not programa_col:
        programa_col = _find_column_by_keywords(df, ["posgrado", "curso"])

    # Año de graduación
    anio_col = _first_existing_column(
        df,
        ["ipg_anio_graduacion", "anio_graduacion"],
    )
    if not anio_col:
        # nombres tipo "ig02_2_ano_de_graduacion"
        anio_col = _find_column_by_keywords(df, ["ano_de_graduacion"])
        if not anio_col:
            anio_col = _find_column_by_keywords(df, ["año_de_graduacion"])

    # Provincia de residencia
    provincia_col = _first_existing_column(df, ["ipg_provincia", "provincia"])
    if not provincia_col:
        provincia_col = _find_column_by_keywords(df, ["provincia"])

    # 3) KPIs de edad (si existe)
    if edad_col and edad_col in df.columns:
        serie_edad = pd.to_numeric(df[edad_col], errors="coerce").dropna()
        n_edad = len(serie_edad)
        if n_edad > 0:
            kpis["edad_media"] = float(serie_edad.mean())
            kpis["edad_mediana"] = float(serie_edad.median())
            kpis["edad_min"] = float(serie_edad.min())
            kpis["edad_max"] = float(serie_edad.max())
            kpis["n_con_datos_edad"] = int(n_edad)

    # 4) KPIs de sexo (si existe)
    if sexo_col and sexo_col in df.columns:
        serie_sexo = df[sexo_col]
        n_sexo_validos = serie_sexo.notna().sum()
        if n_sexo_validos > 0:
            s_upper = serie_sexo.dropna().astype(str).str.upper()
            # Heurística simple: empieza con "F" = femenino
            mask_f = s_upper.str.startswith("F")
            propor_mujeres = float(mask_f.sum() * 100.0 / n_sexo_validos)
            kpis["porcentaje_mujeres_aprox"] = round(propor_mujeres, 1)
            kpis["n_con_datos_sexo"] = int(n_sexo_validos)

    # 5) Tablas de composición

    # Programas / posgrados
    if programa_col and programa_col in df.columns:
        tablas["programas"] = _build_composition_table(
            df, programa_col, "programa"
        )

    # Año de graduación
    if anio_col and anio_col in df.columns:
        tablas["anio_graduacion"] = _build_composition_table(
            df, anio_col, "anio"
        )

    # Sexo
    if sexo_col and sexo_col in df.columns:
        tablas["sexo"] = _build_composition_table(
            df, sexo_col, "sexo"
        )

    # Provincia
    if provincia_col and provincia_col in df.columns:
        tablas["provincia"] = _build_composition_table(
            df, provincia_col, "provincia"
        )

    # 6) Distribuciones

    distribuciones_resultado: Dict[str, Any] = {}

    # Distribuimos siempre edad y año si están, más lo que pida el cliente
    dist_cols: List[str] = []
    if edad_col:
        dist_cols.append(edad_col)
    if anio_col:
        dist_cols.append(anio_col)

    for col in distribuciones:
        if col not in dist_cols:
            dist_cols.append(col)

    for col in dist_cols:
        if col not in df.columns:
            continue

        vc = df[col].value_counts(dropna=False).sort_index()
        dist: Dict[str, int] = {}
        for valor, conteo in vc.items():
            clave = "NA" if pd.isna(valor) else str(valor)
            dist[clave] = int(conteo)
        distribuciones_resultado[col] = dist

    return {
        "kpis": kpis,
        "tablas": tablas,
        "distribuciones": distribuciones_resultado,
    }
