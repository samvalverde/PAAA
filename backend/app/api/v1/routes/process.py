from fastapi import APIRouter, Depends, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
from sqlalchemy.orm import Session, joinedload
from app.models.proc import Process
from app.models.audit import AuditLog
from app.models.actions import ActionType
from app.schemas.proc import ProcessOut, ProcessCreate, ProcessUpdate
from app.schemas.proc import ProcessOut
from app.core.database import get_db_users
from app.core.config import get_settings
from app.core.minio_client import upload_file_to_minio, download_file_from_minio, list_files_in_minio
from app.core.security import get_current_user
from datetime import datetime, timezone

router = APIRouter(tags=["Processes"])


def _log_audit_action(db: Session, action_name: str, description: str, user_id: int, school_id: int = None):
    """Helper function to log audit actions"""
    try:
        action_type = db.query(ActionType).filter(ActionType.name == action_name).first()
        if action_type:
            audit_log = AuditLog(
                user_id=user_id,
                action_type_id=action_type.id,
                school_id=school_id,
                description=description
            )
            db.add(audit_log)
            db.commit()
    except Exception as e:
        # Don't break main flow if audit logging fails
        print(f"Audit logging failed: {e}")


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
    # Validar archivo CSV o Excel
    if not file:
        raise HTTPException(status_code=400, detail="Debe adjuntar un archivo CSV o Excel")
    
    # Validar extensiones permitidas
    valid_extensions = ['.csv', '.xlsx', '.xls']
    file_extension = file.filename.lower()[file.filename.rfind('.'):]
    
    if file_extension not in valid_extensions:
        raise HTTPException(status_code=400, detail="El archivo debe ser formato CSV (.csv) o Excel (.xlsx, .xls)")

    # Crear path en MinIO según los requerimientos: school_name/{dataset_type}/filename
    bucket = "paaa-bucket"
    object_name = f"{career_name}/{dataset_type}/{file.filename}"

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

    # Log audit action
    _log_audit_action(
        db=db, 
        action_name="Create", 
        description=f"Process created: {process_name}",
        user_id=current_user.id,
        school_id=school_id
    )

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

@router.post("/upload-file")
def upload_file_only(
    school_name: str = Form(...),           # ej: "ATI"  
    dataset_type: str = Form(...),          # ej: "egresados"
    file: UploadFile = Form(...),
    db: Session = Depends(get_db_users),
    current_user = Depends(get_current_user)
):
    """
    Upload a file to MinIO without creating a new process.
    This endpoint is for adding files to existing project contexts.
    """
    # Validar archivo CSV o Excel
    if not file:
        raise HTTPException(status_code=400, detail="Debe adjuntar un archivo CSV o Excel")
    
    # Validar extensiones permitidas
    valid_extensions = ['.csv', '.xlsx', '.xls']
    file_extension = file.filename.lower()[file.filename.rfind('.'):]
    
    if file_extension not in valid_extensions:
        raise HTTPException(status_code=400, detail="El archivo debe ser formato CSV (.csv) o Excel (.xlsx, .xls)")

    # Crear path en MinIO: school_name/{dataset_type}/filename
    bucket = "paaa-bucket"
    object_name = f"{school_name}/{dataset_type}/{file.filename}"

    # Subir el archivo a MinIO
    upload_result = upload_file_to_minio(file, bucket, object_name)
    if upload_result["status"] != "ok":
        raise HTTPException(status_code=500, detail=f"Error al subir a MinIO: {upload_result['message']}")

    # Log audit action for file upload
    _log_audit_action(
        db=db,
        action_name="Create",
        description=f"File uploaded: {file.filename} to {school_name}/{dataset_type}",
        user_id=current_user.id
    )

    # Respuesta (sin crear proceso)
    return {
        "status": "ok",
        "message": "Archivo subido correctamente al bucket.",
        "minio_path": f"{bucket}/{object_name}",
        "file_info": {
            "filename": file.filename,
            "school_name": school_name,
            "dataset_type": dataset_type,
            "bucket": bucket,
            "object_name": object_name
        }
    }

@router.get("/all", response_model=list[ProcessOut])
def list_proc(db: Session = Depends(get_db_users), current_user = Depends(get_current_user)):
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

@router.get("/id/{process_id}", response_model=ProcessOut)
def get_process_by_id(
    process_id: int,
    db: Session = Depends(get_db_users),
    current_user = Depends(get_current_user)
):
    process = db.query(Process).options(
        joinedload(Process.encargado), 
        joinedload(Process.school)
    ).filter(Process.id == process_id).first()
    
    if not process:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    
    return {
        "id": process.id,
        "process_name": process.process_name,
        "estado": process.estado,
        "encargado": process.encargado.username if process.encargado else None,
        "encargado_id": process.encargado_id,
        "unidad": process.school.school_name if process.school else None,
        "school_id": process.school_id,
        "created_at": process.created_at,
        "updated_at": process.updated_at
    }

@router.put("/id/{process_id}", response_model=ProcessOut)
def update_process(
    process_id: int,
    process_data: ProcessUpdate,
    db: Session = Depends(get_db_users),
    current_user = Depends(get_current_user)
):
    # Get the existing process
    process = db.query(Process).filter(Process.id == process_id).first()
    
    if not process:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    
    # Update only the fields that are provided
    update_data = process_data.dict(exclude_unset=True)
    
    # Update the process fields
    for field, value in update_data.items():
        setattr(process, field, value)
    
    # Update the timestamp
    process.updated_at = datetime.now(timezone.utc)
    
    # Commit the changes
    db.commit()
    db.refresh(process)
    
    # Log audit action
    _log_audit_action(
        db=db,
        action_name="Update",
        description=f"Process updated: {process.process_name}",
        user_id=current_user.id,
        school_id=process.school_id
    )
    
    # Return the updated process with relationships
    updated_process = db.query(Process).options(
        joinedload(Process.encargado), 
        joinedload(Process.school)
    ).filter(Process.id == process_id).first()
    
    return {
        "id": updated_process.id,
        "process_name": updated_process.process_name,
        "estado": updated_process.estado,
        "encargado": updated_process.encargado.username if updated_process.encargado else None,
        "encargado_id": updated_process.encargado_id,
        "unidad": updated_process.school.school_name if updated_process.school else None,
        "school_id": updated_process.school_id,
        "created_at": updated_process.created_at,
        "updated_at": updated_process.updated_at
    }

@router.get("/id/{process_id}/files")
def get_process_files(
    process_id: int,
    db: Session = Depends(get_db_users),
    current_user = Depends(get_current_user)
):
    """Get files from MinIO for a specific process based on its school"""
    # Get the process with school information
    process = db.query(Process).options(joinedload(Process.school)).filter(Process.id == process_id).first()
    
    if not process:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    
    if not process.school:
        raise HTTPException(status_code=400, detail="El proceso no tiene una escuela asignada")
    
    # Get school name and construct MinIO prefix
    school_name = process.school.school_name
    bucket = "paaa-bucket"
    
    # List files in both egresados and profesores folders
    egresados_files = list_files_in_minio(bucket, f"{school_name}/egresados/")
    profesores_files = list_files_in_minio(bucket, f"{school_name}/profesores/")
    
    # Combine and format the files
    all_files = []
    
    # Add egresados files
    for file in egresados_files:
        # Extract filename from key (remove folder path)
        filename = file['key'].split('/')[-1]
        if filename:  # Make sure it's not empty (avoid directory entries)
            all_files.append({
                "id": f"egresados_{filename}",
                "name": filename,
                "type": "egresados",
                "size": file['size'],
                "last_modified": file['last_modified'],
                "content_type": file['content_type'],
                "path": file['key']
            })
    
    # Add profesores files  
    for file in profesores_files:
        # Extract filename from key (remove folder path)
        filename = file['key'].split('/')[-1]
        if filename:  # Make sure it's not empty (avoid directory entries)
            all_files.append({
                "id": f"profesores_{filename}",
                "name": filename,
                "type": "profesores", 
                "size": file['size'],
                "last_modified": file['last_modified'],
                "content_type": file['content_type'],
                "path": file['key']
            })
    
    return {
        "school_name": school_name,
        "files": all_files
    }

@router.get("/{path:path}")
def get_file_from_minio(path: str, current_user = Depends(get_current_user)):
    """
    Descarga un archivo desde MinIO a partir de su ruta (por ejemplo: ATI/egresados/egresados_2025010203.xlsx)
    """
    bucket = "paaa-bucket"
    file_data = download_file_from_minio(bucket, path)

    if not file_data:
        raise HTTPException(status_code=404, detail="Archivo no encontrado en MinIO")

    # Crear un stream para retornar el archivo
    file_like = BytesIO(file_data)
    filename = path.split("/")[-1]

    # Determine media type based on file extension
    if filename.lower().endswith('.csv'):
        media_type = "text/csv"
    elif filename.lower().endswith(('.xlsx', '.xls')):
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        media_type = "application/octet-stream"

    return StreamingResponse(
        file_like,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
