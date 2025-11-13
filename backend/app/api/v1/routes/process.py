from fastapi import APIRouter, Depends, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db_users
from app.models.proc import Process
from app.schemas.proc import ProcessOut
from app.core.minio_client import upload_file_to_minio, download_file_from_minio
from app.core.security import get_current_user
from datetime import datetime, timezone

router = APIRouter(tags=["Processes"])

@router.post("/create")
def create_process(
    process_name: str = Form(...),
    school_id: int = Form(...),
    career_name: str = Form(...),      # ej: "ATI"
    dataset_type: str = Form(...),     # ej: "egresados"
    file: UploadFile = Form(...),
    db: Session = Depends(get_db_users),
    current_user = Depends(get_current_user)
):
    # Validar archivo
    if not file:
        raise HTTPException(status_code=400, detail="Debe adjuntar un archivo .xlsx")

    # Crear path en MinIO
    bucket = "paaa"
    object_name = f"{career_name.upper()}/{dataset_type.upper()}/{file.filename}"

    # Subir el archivo a MinIO
    upload_result = upload_file_to_minio(file, bucket, object_name)
    if upload_result["status"] != "ok":
        raise HTTPException(status_code=500, detail=f"Error al subir a MinIO: {upload_result['message']}")

    # Crear registro en la DB (solo los campos que EXISTEN)
    new_process = Process(
        process_name=process_name,
        school_id=school_id,
        encargado_id=current_user.id,
        estado="Pendiente",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    db.add(new_process)
    db.commit()
    db.refresh(new_process)

    # Respuesta
    return {
        "status": "ok",
        "message": "Proceso creado y archivo subido correctamente.",
        "process": {
            "id": new_process.id,
            "process_name": new_process.process_name,
            "school_id": new_process.school_id,
            "encargado_id": new_process.encargado_id,
            "estado": new_process.estado,
            "created_at": new_process.created_at,
            "updated_at": new_process.updated_at
        },
        "minio_path": f"{bucket}/{object_name}"
    }

@router.get("/all", response_model=list[ProcessOut])
def list_proc(db: Session = Depends(get_db_users)):
    procesos = db.query(Process).options(joinedload(Process.encargado), joinedload(Process.school)).all()
    return [
        {
        "id": p.id,
        "process_name": p.process_name,
        "estado": p.estado,
        "encargado": p.encargado.username if p.encargado else None,
        "unidad": p.school.school_name if p.school else None,
        "school_id": p.school_id,
        "created_at": p.created_at,
        "updated_at": p.updated_at
        }
        for p in procesos
    ]

@router.get("/test")
def test():
    return[
        {"esto es un test": "si"}
    ]

@router.get("/{path:path}")
def get_file_from_minio(path: str):
    """
    Descarga un archivo desde MinIO a partir de su ruta (por ejemplo: ATI/EGRESADOS/egresados_2025010203.xlsx)
    """
    bucket = "paaa"
    file_data = download_file_from_minio(bucket, path)

    if not file_data:
        raise HTTPException(status_code=404, detail="Archivo no encontrado en MinIO")

    # Crear un stream para retornar el archivo
    file_like = BytesIO(file_data)
    filename = path.split("/")[-1]

    return StreamingResponse(
        file_like,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
