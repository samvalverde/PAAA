from __future__ import annotations
from typing import Any, Dict, Optional, Literal
from pydantic import BaseModel, Field
import os
import re
import shutil
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from agente import agente as run_llm_agent 
from carga import cargar_archivo                     # módulo de carga genérico
from etl.db import make_engine                      # conexión a Postgres
from .minio_utils import get_minio, pick_object, download_object  # utilidades MinIO
from analytics.results import generate_results

# -----------------------------------------------------------------------------
# Config & App
# -----------------------------------------------------------------------------
app = FastAPI(title="PAAA ETL API", version="0.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MINIO_BUCKET = os.getenv("MINIO_BUCKET", "paaa")

# Add explicit OPTIONS handler for CORS preflight
@app.options("/{full_path:path}")
async def options_handler():
    return {"message": "OK"}


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def infer_version_from_filename(name: str) -> str:
    """
    Extrae una 'versión' del nombre si aparece algo tipo:
      - v2, v2.0, v2025.10.13
      - 2025-10-13, 20251013, 2025_10_13
    Si no encuentra nada, retorna 'v1.0'.
    """
    m = re.search(r'(v\d+(?:\.\d+)*|\d{4}[-_.]?\d{2}[-_.]?\d{2})', name.lower())
    return m.group(1) if m else "v1.0"


def _normalize_dataset(ds: str) -> str:
    ds_norm = ds.strip().lower()
    if ds_norm not in {"egresados", "profesores"}:
        raise HTTPException(400, detail="dataset debe ser 'egresados' o 'profesores'")
    return ds_norm

class Poblacion(BaseModel):
    dataset: Literal["egresados", "profesores"]
    programa: str = Field(..., description="Código del programa, p.ej. ATI, TURISMO")
    filtros: Optional[Dict[str, Any]] = Field(default=None, description="Filtros aplicados (opcional)")
    n: Optional[int] = Field(default=None, description="Tamaño muestral tras filtros (opcional)")

class NarrativaRequest(BaseModel):
    enunciado: str = Field(..., description="Objetivo/consigna en lenguaje natural")
    resultados: Dict[str, Any] = Field(..., description="KPIs/tablas ya calculadas")
    poblacion: Poblacion
    escuela: str = Field(..., description="Nombre de la escuela")

class NarrativaResponse(BaseModel):
    
    texto: Optional[str] = None




# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/carga/{dataset}")
async def carga_dataset(
    dataset: str,
    programa: str = Form(..., description="Código del programa, p.ej. ATI, TURISMO"),
    version: str = Form("v1.0"),
    file: UploadFile = File(...),
):
    """
    Sube un archivo vía HTTP y ejecuta el ETL:
      - dataset: egresados | profesores
      - programa: código de carrera (ATI, TURISMO, ...)
      - version: etiqueta de versión (opcional)
    """
    ds = _normalize_dataset(dataset)

    if not file.filename:
        raise HTTPException(400, "Archivo inválido")

    local_path = UPLOAD_DIR / f"{programa.lower()}_{ds}_{file.filename}"
    try:
        with local_path.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(500, detail=f"No se pudo guardar el archivo: {e}")

    try:
        result = cargar_archivo(programa=programa, dataset=ds, version=version, file_path=local_path)
        return JSONResponse(result, status_code=201)
    except Exception as e:
        raise HTTPException(400, detail=str(e))


@app.post("/carga/{dataset}/minio")
def carga_desde_minio(
    dataset: str,
    programa: str = Form(..., description="Código del programa, p.ej. ATI, TURISMO"),
    version: Optional[str] = Form(None, description="Opcional: 'v2.0' o '2025-06-22'"),
    filename: Optional[str] = Form(None, description="Opcional: nombre exacto en MinIO"),
):
    """
    Descarga un archivo desde MinIO (bucket configurado) y ejecuta el ETL.
    Convención de ruta en MinIO:
      s3://<BUCKET>/<PROGRAMA>/<DATASET>/**/<archivo>
    Si no se indica 'version' ni 'filename', toma el objeto más reciente bajo el prefijo.
    """
    ds = _normalize_dataset(dataset)

    client = get_minio()
    prefix = f"{programa}/{ds}/"  # convención: programa/dataset/...

    try:
        object_name = pick_object(client, MINIO_BUCKET, prefix, version=version, filename=filename)
    except FileNotFoundError as e:
        raise HTTPException(404, detail=str(e))
    except Exception as e:
        raise HTTPException(400, detail=f"Error listando objetos en MinIO: {e}")

    local_path = UPLOAD_DIR / Path(object_name).name
    try:
        download_object(client, MINIO_BUCKET, object_name, local_path)
    except Exception as e:
        raise HTTPException(400, detail=f"No se pudo descargar de MinIO: {e}")

    used_version = version or infer_version_from_filename(local_path.name)

    try:
        result = cargar_archivo(programa=programa, dataset=ds, version=used_version, file_path=local_path)
        result.update({"bucket": MINIO_BUCKET, "object_name": object_name})
        return JSONResponse(result, status_code=201)
    except Exception as e:
        raise HTTPException(400, detail=str(e))


@app.get("/analisis/posgrados")
def analisis_posgrados(
    programa: str = Query(..., description="Código del programa (ATI, TURISMO, ...)"),
):
    """
    Conteo de posgrados (columna ig01_1_el_posgrado_que_usted_curso_es) en core.egresados
    filtrado por programa.
    """
    sql = """
    SELECT
      NULLIF(BTRIM(ig01_1_el_posgrado_que_usted_curso_es), '') AS posgrado,
      COUNT(*) AS total
    FROM core.egresados
    WHERE programa = :programa
    GROUP BY posgrado
    ORDER BY total DESC, posgrado;
    """
    try:
        engine = make_engine()
        with engine.begin() as conn:
            rows = [dict(r._mapping) for r in conn.execute(text(sql), {"programa": programa})]
        return {"programa": programa, "rows": rows}
    except Exception as e:
        raise HTTPException(500, detail=str(e))
    
@app.post("/agente/redactar", response_model=NarrativaResponse)
def agente_redactar(payload: NarrativaRequest):
    """
    Construye el prompt (ENUNCIADO, RESULTADOS, POBLACIÓN) y lo pasa a tu agente.

    """
    try:
        # Tu agente actual devuelve un string tipo: "Acá iria el prompt {enunciado}, {resultados}, {poblacion}, {escuela}"
        result_str = run_llm_agent(
            payload.enunciado,
            payload.resultados,
            payload.escuela,
            payload.poblacion.model_dump(),
        )



        is_only_prompt = result_str.startswith("Acá iria el prompt")

        return NarrativaResponse(
            texto=None if is_only_prompt else result_str,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@app.post("/agente/resultados")
def agente_resultados(payload: dict):
    """
    Construye la sección 'resultados' para el agente.

    Espera un body así (ejemplo):

    {
      "poblacion": {
        "dataset": "egresados",
        "programa": "ATI",
        "filtros": {
          "anio_graduacion": { "gte": 2020, "lte": 2024 },
          "sexo": "F"
        }
      },
      "distribuciones": ["sexo", "anio_graduacion"]
    }

    Devuelve algo de esta forma:

    {
      "poblacion": { ... },
      "resultados": {
        "kpis": { ... },
        "tablas": { ... },
        "distribuciones": { ... }
      }
    }

    """
    try:
        poblacion = payload.get("poblacion")
        if not poblacion:
            raise HTTPException(status_code=400, detail="Falta 'poblacion' en el body")

        distribuciones = payload.get("distribuciones") or []
        tipo_analitica = payload.get("tipo_analitica")

        resultados = generate_results(poblacion, distribuciones, tipo_analitica)

        return {
            "poblacion": poblacion,
            "resultados": resultados
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


