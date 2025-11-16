import tempfile
import os
import io
from typing import List, Dict, Any

from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Import PDF generators from backend services
from app.services.pdf_generator import generar_pdf_general, generar_pdf_detalles, _es_question_detail

router = APIRouter()


@router.post("/pdf")
def generate_pdf(payload: dict = Body(...)):
    """
    Genera un PDF a partir de los resultados de análisis.

    - Si el payload contiene `conjuntos` (lista de tuples [resultado_json, analisis_str]),
      se usa `generar_pdf_detalles`.
    - En caso contrario, se espera `resultado` (o `resultados`) y `analisis` (string)
      y se usa `generar_pdf_general`.

    Devuelve el PDF como attachment.
    """

    tmpf = None
    try:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmpf = tmp.name
        tmp.close()

        # Detalles (varias preguntas)
        if "conjuntos" in payload:
            conjuntos = payload.get("conjuntos") or []
            # Expecting each item as [resultado_json, analisis_str] or dict with keys
            # Ensure proper format
            generar_pdf_detalles(conjuntos, tmpf)

        else:
            resultado = payload.get("resultado") or payload.get("resultados") or {}
            analisis = payload.get("analisis") or ""
            generar_pdf_general(resultado, analisis, tmpf)

        # Read file and return
        with open(tmpf, "rb") as f:
            data = f.read()

        return StreamingResponse(io.BytesIO(data), media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=reporte.pdf"})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            if tmpf and os.path.exists(tmpf):
                os.remove(tmpf)
        except Exception:
            pass
