from langchain import hub
from langchain.prompts import PromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_openai import ChatOpenAI
from pydantic import validator


# Ensure no duplicate validator functions
@validator("BaseLanguageModel", allow_reuse=True)
def set_verbose(cls, v):
    return v


local_llm = "llama3"
# Prompt
# import langchain

# langchain.verbose = True


# RESPONSE

def agente(enunciado, resultados, poblacion):
    #Acá tomariamos el key de un secret
    OPENAI_API_KEY = "secretillo jj"
    print("python")
    print(enunciado)
    # if not isinstance(resultados, list):
    #     raise TypeError("resultados must be a list")
    resultados2 = resultados  # "\n".join(resultados)
    print(resultados2)
    prompt = PromptTemplate(
        template=f"""Eres un importante estadístico que escribe en español y que debe realizar un análisis de una 
        pregunta de encuesta aplicada a {poblacion} de la Escuela de Administración de Tecnologías de la Información del 
        Tecnológico de Costa Rica. La encuesta tiene como objetivo evaluar las 
        condiciones de la ingeniería para la acreditación estatal. 
        En esta ocasión debes generar un único párrafo de análisis descriptivo, conciso y claro, para una de 
        las preguntas del cuestionario, para la cual tienes los datos de las respuestas de los encuestados que están expresados en porcentajes. 
          
        En el párrafo debes describir generalmente los datos y varias conclusiones.

      Enunciado de la pregunta de la encuesta: {{question}}
      Resultados: {{resultados}}
     """,
        input_variables=["question", "resultados"],
    )
    # Load model
    llm = ChatOpenAI(
        openai_api_key=OPENAI_API_KEY,
        model_name="gpt-4o-mini",
    )

    # Chain
    rag_chain = prompt | llm | StrOutputParser()

    generation = rag_chain.invoke({"question": enunciado, "resultados": resultados2})
    return generation
