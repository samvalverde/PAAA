from main import generar_pdf_general
import json

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
            "total_registros": 84
        },
        "tablas": {},
        "distribuciones": {
            "ipg07_other_9_como_se_clasifica_esta_organizacion_otro": {
                "nan": 83,
                "público y privado": 1
            },
            "ep01_14_con_base_en_los_cursos_y_actividades_de_aprendizaje_des": {
                "En alguna medida": 14,
                "En bastante medida": 46,
                "En total medida": 24
            }
        }
    }
}
"""

analisis_json = """
{
    "texto": "En el análisis de los egresados de la Administración de Tecnologías de la Información del Tecnológico de Costa Rica, se observa que la identificación de las organizaciones que han clasificado su actividad es limitada, con solo un egresado mencionando una clasificación específica, ya que 83 respuestas se reportaron como \\"nan\\". Esto sugiere una falta de claridad o diversidad en las organizaciones en las que estos egresados se desempeñan. En cuanto a la percepción sobre la contribución de los cursos y actividades de aprendizaje a las competencias definidas para su maestría, el 46% de los encuestados considera que estas contribuyeron \\"en bastante medida\\", mientras que el 24% opina que fue \\"en total medida\\" y un 14% que fue \\"en alguna medida\\". Estos resultados indican una evaluación mayormente positiva sobre la relevancia de la formación recibida, aunque también reflejan una oportunidad para mejorar la oferta académica en áreas clave que podrían beneficiar a los egresados en su desarrollo profesional."
}
"""

# Parsear a dict de Python
resultado_general = json.loads(resultados_json)
analisis = json.loads(analisis_json)

# Generar el PDF
generar_pdf_general(resultado_general, analisis["texto"], "reporte_general_demo.pdf")
