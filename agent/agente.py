import json
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
import os

def agente(enunciado, resultados, poblacion, escuela):
    OPENAI_API_KEY = load_openai_key()

    template = """Eres un importante estadístico que escribe en español y que debe realizar un análisis de una 
                    pregunta de encuesta aplicada a {poblacion} de la Escuela de {escuela} del 
                    Tecnológico de Costa Rica. La encuesta tiene como objetivo evaluar las condiciones de la ingeniería para la acreditación estatal.
                    Debes generar un único párrafo de análisis descriptivo, conciso y claro, usando los porcentajes provistos.

                    Enunciado: {enunciado}
                    Resultados: {resultados}
                    """

    prompt = PromptTemplate(
        template=template,
        input_variables=["enunciado", "resultados", "poblacion", "escuela"],
    )

    llm = ChatOpenAI(
        openai_api_key=OPENAI_API_KEY,
        model="gpt-4o-mini",   # usa 'model' en langchain_openai
    )

    chain = prompt | llm | StrOutputParser()

    # Serializa para evitar problemas de llaves y mejorar legibilidad
    res_str = json.dumps(resultados, ensure_ascii=False)
    pob_str = json.dumps(poblacion, ensure_ascii=False)

    return chain.invoke({
        "enunciado": enunciado,
        "resultados": res_str,
        "poblacion": pob_str,
        "escuela": escuela,
    })

def load_openai_key():
    key = os.getenv("OPENAI_API_KEY")
    if key:
        return key
    secret_path = "/run/secrets/openai_api_key"
    if os.path.exists(secret_path):
        with open(secret_path) as f:
            return f.read().strip()
    raise RuntimeError("No se encontró OPENAI_API_KEY (ni env ni secret)")
