from typing import Any, Dict, List

import pandas as pd

from .general_summary import _load_core_dataset, _apply_filters, _compute_nps


def generate_question_detail(poblacion: Dict[str, Any],
                             distribuciones: List[str]) -> Dict[str, Any]:
    """
    Analítica de detalle para una pregunta / variable específica.

    Toma la primera variable de `distribuciones` como pregunta principal
    y genera:

      - KPIs: n total, n válidos, % respuesta, y si es numérica:
              media, mediana, desvío estándar, min, max, NPS (si escala 0–10/1–10).
      - Tablas:
          * numérica: tabla de cuartiles (25, 50, 75).
          * categórica: top categorías (conteo y porcentaje).
      - Distribuciones:
          * conteos por valor para la variable principal.

    Retorna un dict con:
      {
        "kpis": { ... },
        "tablas": { ... },
        "distribuciones": { variable: { valor: conteo, ... } }
      }
    """
    if not distribuciones:
        raise ValueError(
            "Para 'detalle_pregunta' se requiere al menos una variable en 'distribuciones'."
        )

    variable = distribuciones[0]

    dataset_name = poblacion.get("dataset")
    if not dataset_name:
        raise ValueError("La población no contiene el campo 'dataset'.")

    # 1) Cargar y filtrar datos desde la BD del ETL
    df = _load_core_dataset(dataset_name)
    df = _apply_filters(df, poblacion)

    n_total = len(df)
    if "n" not in poblacion:
        poblacion["n"] = n_total

    if variable not in df.columns:
        raise ValueError(
            f"La columna '{variable}' no existe en el dataset '{dataset_name}'."
        )

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

    tablas: Dict[str, Any] = {}

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
        tablas["cuartiles"] = [
            {"percentil": 25, "valor": float(qs.loc[0.25])},
            {"percentil": 50, "valor": float(qs.loc[0.5])},
            {"percentil": 75, "valor": float(qs.loc[0.75])},
        ]

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

        tablas[f"{variable}_top_categorias"] = filas_top

    # 4) Distribución completa de la pregunta
    distribuciones_resultado: Dict[str, Any] = {}

    vc_full = serie_original.value_counts(dropna=False).sort_index()
    dist: Dict[str, int] = {}
    for valor, conteo in vc_full.items():
        clave = "NA" if pd.isna(valor) else str(valor)
        dist[clave] = int(conteo)

    distribuciones_resultado[variable] = dist

    return {
        "kpis": kpis,
        "tablas": tablas,
        "distribuciones": distribuciones_resultado,
    }
