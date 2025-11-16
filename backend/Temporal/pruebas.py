from main import generar_pdf_detalles
import json

# JSON de resultados (igual que te lo da el API, con false)
resultados_json = """
{
    "poblacion": {
        "dataset": "egresados",
        "programa": "ATI",
        "filtros": {
            "anio_graduacion": {
                "gte": 2020,
                "lte": 2024
            }
        },
        "n": 84
    },
    "resultados": {
        "kpis": {
            "variable": "ipg02_4_estado_civil",
            "n_total_poblacion": 84,
            "n_respuestas_validas": 84,
            "porcentaje_respuesta": 100.0,
            "es_numerica": false
        },
        "tablas": {
            "ipg02_4_estado_civil_top_categorias": [
                {
                    "categoria": "Casado(a), unión de hecho",
                    "total": 49,
                    "porcentaje": 58.3
                },
                {
                    "categoria": "Soltero(a)",
                    "total": 31,
                    "porcentaje": 36.9
                },
                {
                    "categoria": "Otro",
                    "total": 4,
                    "porcentaje": 4.8
                }
            ]
        },
        "distribuciones": {
            "ipg02_4_estado_civil": {
                "Casado(a), unión de hecho": 49,
                "Otro": 4,
                "Soltero(a)": 31
            }
        }
    }
}
"""

# JSON de análisis, también tal cual del API
analisis_json = """
{
    "texto": "El análisis del estado civil de los egresados de la Administración de Tecnologías de la Información del Tecnológico de Costa Rica revela que de las 84 respuestas válidas, el 58.3% se encuentra en la categoría de \\"Casado(a), unión de hecho\\", lo que indica una prevalencia significativa de este estado civil entre los encuestados. Por otro lado, el 36.9% de los egresados se identifican como \\"Soltero(a)\\", mientras que un pequeño 4.8% optó por clasificar su estado como \\"Otro\\". Estos resultados reflejan una tendencia hacia la formación de parejas estables en este grupo, lo que podría tener implicaciones en su proyecto de vida y, potencialmente, en su desempeño profesional postgraduación."
}
"""

# Parseamos ambos JSON a dict de Python
resultados = json.loads(resultados_json)
analisis = json.loads(analisis_json)

# Armamos la lista de (json_resultado, texto_analisis)
conjuntos = [
    (resultados, analisis["texto"])
]

# Generamos el PDF
generar_pdf_detalles(conjuntos, "reporte_detalle_demo.pdf")
