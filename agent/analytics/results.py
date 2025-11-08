from analytics.analytic_types.general_summary import generate_general_summary
from analytics.analytic_types.question_detail import generate_question_detail
from analytics.analytic_types.population_profile import generate_population_profile


'''
from analytic_types.question_detail import generate_question_detail
from analytic_types.group_comparison import generate_group_comparison
from analytic_types.population_profile import generate_population_profile
from analytic_types.data_quality import generate_data_quality
'''


def generate_results(poblacion: dict, distribuciones: list, tipo_analitica: str):
    """
    Orquesta la generación de resultados según el tipo de analítica.

    tipo_analitica puede ser:
      - "resumen_general"
      - "detalle_pregunta"
      - "comparacion_grupos"
      - "perfil_poblacion"
      - "calidad_datos"
    """

    # default por si viene None o vacío
    if not tipo_analitica:
        tipo_analitica = "resumen_general"

    match tipo_analitica:
        case "resumen_general":
            return generate_general_summary(poblacion, distribuciones)
    
        case "detalle_pregunta":
            return generate_question_detail(poblacion, distribuciones)
            pass

        case "comparacion_grupos":
            #return generate_group_comparison(poblacion, distribuciones)
            pass

        case "perfil_poblacion":
            return generate_population_profile(poblacion, distribuciones)


        case "calidad_datos":
            #return generate_data_quality(poblacion, distribuciones) #por como funciona el etl, no es necesario en realidad
            pass

        case _:
            raise ValueError(f"Tipo de analítica no soportado: {tipo_analitica}")