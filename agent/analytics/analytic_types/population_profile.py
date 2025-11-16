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

    # Edad: buscar la columna específica de edad
    edad_col = _first_existing_column(df, ["ipg03_5_edad"])
    if not edad_col:
        edad_col = _find_column_by_keywords(df, ["edad"])

    # Sexo / género: buscar la columna específica de sexo
    sexo_col = _first_existing_column(df, ["ipg01_3_sexo"])
    if not sexo_col:
        sexo_col = _find_column_by_keywords(df, ["sexo"])

    # Programa / posgrado: primero 'programa' (columna creada por ETL),
    # y si no, la pregunta de "posgrado que usted cursó"
    programa_col = _first_existing_column(df, ["programa"])
    posgrado_col = _first_existing_column(df, ["ig01_1_el_posgrado_que_usted_curso_es"])
    if not programa_col and not posgrado_col:
        posgrado_col = _find_column_by_keywords(df, ["posgrado", "curso"])

    # Año de graduación: buscar la columna específica
    anio_col = _first_existing_column(df, ["ig02_2_ano_de_graduacion"])
    if not anio_col:
        anio_col = _find_column_by_keywords(df, ["ano_de_graduacion", "año_de_graduacion"])

    # Provincia de residencia: buscar la columna específica
    provincia_col = _first_existing_column(df, ["ipg04_6_provincia_de_residencia_actual"])
    if not provincia_col:
        provincia_col = _find_column_by_keywords(df, ["provincia"])

    # Estado civil: buscar la columna específica
    estado_civil_col = _first_existing_column(df, ["ipg02_4_estado_civil"])

    # Condición laboral: buscar la columna específica  
    condicion_laboral_col = _first_existing_column(df, ["ipg05_7_cual_es_su_condicion_laboral_actual"])

    # 3) KPIs de edad (datos categóricos)
    if edad_col and edad_col in df.columns:
        serie_edad = df[edad_col].dropna()
        n_edad = len(serie_edad)
        if n_edad > 0:
            # Para datos categóricos de edad, solo contamos las categorías
            vc_edad = serie_edad.value_counts()
            categoria_mas_comun = vc_edad.index[0] if len(vc_edad) > 0 else "Sin datos"
            kpis["categoria_edad_mas_comun"] = str(categoria_mas_comun)
            kpis["n_con_datos_edad"] = int(n_edad)
            kpis["categorias_edad_disponibles"] = list(vc_edad.index.astype(str))

    # 4) KPIs de sexo 
    if sexo_col and sexo_col in df.columns:
        serie_sexo = df[sexo_col].dropna()
        n_sexo_validos = len(serie_sexo)
        if n_sexo_validos > 0:
            vc_sexo = serie_sexo.value_counts()
            # Calcular porcentajes por género
            hombres = vc_sexo.get("Hombre", 0)
            mujeres = vc_sexo.get("Mujer", 0)
            
            if hombres + mujeres > 0:
                kpis["porcentaje_hombres"] = round(hombres * 100.0 / (hombres + mujeres), 1)
                kpis["porcentaje_mujeres"] = round(mujeres * 100.0 / (hombres + mujeres), 1)
            kpis["n_con_datos_sexo"] = int(n_sexo_validos)

    # 5) Tablas de composición

    # Programas (si existe la columna programa)
    if programa_col and programa_col in df.columns:
        tablas["programas"] = _build_composition_table(
            df, programa_col, "programa"
        )

    # Posgrados (tipos específicos de posgrado)
    if posgrado_col and posgrado_col in df.columns:
        tablas["posgrados"] = _build_composition_table(
            df, posgrado_col, "posgrado"
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

    # Edad (categórica)
    if edad_col and edad_col in df.columns:
        tablas["edad"] = _build_composition_table(
            df, edad_col, "grupo_edad"
        )

    # Provincia
    if provincia_col and provincia_col in df.columns:
        tablas["provincia"] = _build_composition_table(
            df, provincia_col, "provincia"
        )

    # Estado civil
    if estado_civil_col and estado_civil_col in df.columns:
        tablas["estado_civil"] = _build_composition_table(
            df, estado_civil_col, "estado_civil"
        )

    # Condición laboral
    if condicion_laboral_col and condicion_laboral_col in df.columns:
        tablas["condicion_laboral"] = _build_composition_table(
            df, condicion_laboral_col, "condicion_laboral"
        )

    # 6) Distribuciones

    distribuciones_resultado: Dict[str, Any] = {}

    # Distribuimos automáticamente las columnas principales del perfil demográfico
    dist_cols: List[str] = []
    
    # Agregar columnas principales si existen
    for col in [edad_col, sexo_col, anio_col, provincia_col, estado_civil_col, condicion_laboral_col]:
        if col and col not in dist_cols:
            dist_cols.append(col)
    
    # Agregar columnas adicionales solicitadas
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
