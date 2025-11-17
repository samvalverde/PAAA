from typing import Any, Dict, List

import pandas as pd

from .general_summary import _load_core_dataset, _apply_filters, _compute_nps


def generate_question_detail(poblacion: Dict[str, Any],
                             distribuciones: List[str]) -> Dict[str, Any]:
    """
    Analítica de detalle para una o más preguntas / variables específicas.

    Genera KPIs y distribuciones detalladas para cada variable en 'distribuciones'.
    
    Args:
        poblacion (dict): Con campos 'dataset', 'programa', 'filtros', etc.
        distribuciones (list): Lista de nombres de columnas a analizar.

    Returns:
        dict: Con análisis detallado de cada variable especificada.
        {
            "kpis": { variable1: {...}, variable2: {...} },
            "tablas": { variable1_cuartiles: [...], variable2_top_categorias: [...] },
            "distribuciones": { variable1: {...}, variable2: {...} }
        }
    """
    if not distribuciones:
        raise ValueError(
            "Para 'detalle_pregunta' se requiere al menos una variable en 'distribuciones'."
        )

    dataset_name = poblacion.get("dataset")
    if not dataset_name:
        raise ValueError("La población no contiene el campo 'dataset'.")

    # 1) Cargar y filtrar datos desde la BD del ETL
    df = _load_core_dataset(dataset_name)
    df = _apply_filters(df, poblacion)

    n_total = len(df)
    if "n" not in poblacion:
        poblacion["n"] = n_total

    # Process each variable in distribuciones
    all_kpis: Dict[str, Any] = {}
    all_tablas: Dict[str, Any] = {}
    distribuciones_resultado: Dict[str, Any] = {}

    for variable in distribuciones:
        if variable not in df.columns:
            # Skip missing columns but continue processing others
            continue

        serie_original = df[variable]

        # 2) Detectar si podemos tratarla como numérica
        serie_numerica = pd.to_numeric(serie_original, errors="coerce")
        es_numerica = serie_numerica.notna().sum() > 0

        kpis: Dict[str, Any] = {
            "variable": variable,
            "n_total_poblacion": n_total,
        }

        # Conteo de respuestas válidas (no nulas)
        if es_numerica:
            serie_valida = serie_numerica.dropna()
        else:
            serie_valida = serie_original.dropna()

        n_validos = len(serie_valida)
        kpis["n_respuestas_validas"] = n_validos
        kpis["porcentaje_respuesta"] = (
            float(n_validos * 100.0 / n_total) if n_total else 0.0
        )
        kpis["es_numerica"] = bool(es_numerica)

        # 3) KPIs y tablas según tipo
        if es_numerica and n_validos > 0:
            s = serie_valida.astype(float)

            kpis["media"] = float(s.mean())
            kpis["mediana"] = float(s.median())
            kpis["desviacion_estandar"] = float(s.std())
            kpis["min"] = float(s.min())
            kpis["max"] = float(s.max())

            # Cuartiles
            qs = s.quantile([0.25, 0.5, 0.75])
            cuartiles = [
                {"percentil": 25, "valor": float(qs.loc[0.25])},
                {"percentil": 50, "valor": float(qs.loc[0.5])},
                {"percentil": 75, "valor": float(qs.loc[0.75])},
            ]
            all_tablas[f"{variable}_cuartiles"] = cuartiles

            # NPS solo si parece escala 0–10 o 1–10
            min_val, max_val = s.min(), s.max()
            if 0 <= min_val <= 1 and max_val <= 10:
                kpis["nps"] = float(_compute_nps(s))

        else:
            # Tratamos la variable como categórica
            # Top categorías (por defecto top 10)
            vc = serie_original.value_counts(dropna=False).head(10)
            total_resp = vc.sum()
            filas_top: List[Dict[str, Any]] = []
            for valor, conteo in vc.items():
                nombre = "Sin respuesta" if pd.isna(valor) else str(valor)
                porcentaje = (
                    float(conteo * 100.0 / total_resp) if total_resp else 0.0
                )
                filas_top.append(
                    {
                        "categoria": nombre,
                        "total": int(conteo),
                        "porcentaje": round(porcentaje, 1),
                    }
                )

            all_tablas[f"{variable}_top_categorias"] = filas_top

        # Store KPIs for this variable
        all_kpis[variable] = kpis

        # 4) Distribución completa de la pregunta
        vc_full = serie_original.value_counts(dropna=False).sort_index()
        dist: Dict[str, int] = {}
        for valor, conteo in vc_full.items():
            clave = "NA" if pd.isna(valor) else str(valor)
            dist[clave] = int(conteo)

        distribuciones_resultado[variable] = dist

    return {
        "kpis": all_kpis,
        "tablas": all_tablas,
        "distribuciones": distribuciones_resultado,
    }
