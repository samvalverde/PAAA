#!/usr/bin/env python3
# al inicio de agent/estudiantes-ati.py
from agente import agente
from pathlib import Path
import pandas as pd

from etl import SurveyETL
from charts import bar_pct


# === CONFIG ===
INPUTS_DIR = Path("inputs")
DATOS_DIR = Path("datos")
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

POBLACION = "estudiantes"  # puedes cambiar a "profesores" o "egresados"

# Mapa de preguntas -> columnas / tipo
# !!!!Ajustar estos nombres según los Excel reales
Q_MAP = {
    "p1": {"type": "categorical", "col": "p1_satisfaccion_general"},
    "p2": {"type": "multi", "col": "p2_"},  # prefijo: detecta todas que empiecen con p2_
}

# Orden lógico de opciones (para las gráficas)
ORDER_MAP = {
    "p1": ["muy satisfecho", "satisfecho", "neutral", "insatisfecho", "muy insatisfecho"],
    "p2": ["si", "parcialmente", "no"],
}


def main():
    print("=== Iniciando ETL para estudiantes ===")

    etl = SurveyETL(inputs_dir=INPUTS_DIR, datos_dir=DATOS_DIR)

    # Metadatos
    try:
        meta = etl.load_metadata("MetaDatos_ati.xlsx")
        print(f"✓ Metadatos cargados ({len(meta)} filas)")
    except FileNotFoundError:
        print("⚠️ No se encontró MetaDatos_ati.xlsx, seguimos sin metadatos")
        meta = None

    # Respuestas
    responses = etl.load_responses(("*.xlsx",))
    print(f"✓ Respuestas cargadas ({len(responses)} filas)")

    # Stats
    stats = etl.question_stats(Q_MAP, order_map=ORDER_MAP)
    stats.to_csv(OUTPUT_DIR / "porcentajes_por_pregunta.csv", index=False)
    print(f"✓ Stats exportados a {OUTPUT_DIR/'porcentajes_por_pregunta.csv'}")

    # Gráficas + análisis del agente
    textos = []
    for q in stats["question"].unique():
        # Gráfica
        bar_pct(stats, question=q, outfile=OUTPUT_DIR / f"{q}.png")
        print(f"  → Gráfica guardada: {q}.png")

        # Texto para el agente
        qdf = stats[stats["question"] == q][["option", "pct"]]
        resultados_txt = "\n".join(f"{opt}: {pct:.2f}%" for opt, pct in qdf.itertuples(index=False))
        if meta is not None and "code" in meta and "question_text" in meta and (meta["code"] == q).any():
            enunciado = meta.loc[meta["code"] == q, "question_text"].iloc[0]
        else:
            enunciado = q

        parrafo = agente(enunciado=enunciado, resultados=resultados_txt, poblacion=POBLACION)
        textos.append({"question": q, "enunciado": enunciado, "analisis": parrafo})

    pd.DataFrame(textos).to_csv(OUTPUT_DIR / "analisis_llm.csv", index=False)
    print(f"✓ Análisis LLM exportados a {OUTPUT_DIR/'analisis_llm.csv'}")

    print("=== Proceso completado ===")


if __name__ == "__main__":
    main()
