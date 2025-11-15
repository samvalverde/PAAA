from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db_users
from app.models.audit import AuditLog
from app.models.actions import ActionType
from app.schemas.audit import AuditOut, AuditCreate
from app.core.security import get_current_user

router = APIRouter()


def _serialize_audit(a: AuditLog) -> dict:
    return {
        "id": a.id,
        "user_id": a.user_id,
        "action_type_id": a.action_type_id,
        "school_id": a.school_id,
        "description": a.description,
        "responsible": a.user.username if a.user else None,
        "unit": a.school.school_name if a.school else None,
        "action": a.action_type.name if a.action_type else None,
        "created_at": a.created_at,
    }


@router.get("/all", response_model=list[AuditOut])
def get_all_audits(
    db: Session = Depends(get_db_users),
    current_user = Depends(get_current_user)
):
    """Devuelve todos los registros de la tabla `audit_log`."""
    audits = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user), joinedload(AuditLog.action_type), joinedload(AuditLog.school))
        .order_by(AuditLog.id.desc())
        .all()
    )
    return [_serialize_audit(a) for a in audits]


@router.get("/{user_id}", response_model=list[AuditOut])
def get_audits_by_user(
    user_id: int, 
    db: Session = Depends(get_db_users),
    current_user = Depends(get_current_user)
):
    """Devuelve todos los registros de auditoría para un usuario específico."""
    audits = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user), joinedload(AuditLog.action_type), joinedload(AuditLog.school))
        .filter(AuditLog.user_id == user_id)
        .order_by(AuditLog.id.desc())
        .all()
    )
    return [_serialize_audit(a) for a in audits]


@router.post("/log", response_model=AuditOut)
def log_audit_action(
    audit: AuditCreate,
    db: Session = Depends(get_db_users),
    current_user = Depends(get_current_user)
):
    """
    Registra una nueva acción en el audit_log.
    
    Body esperado:
    {
        "user_id": 1,                    // Optional, usa current_user si no se proporciona
        "action_type_id": 2,             // ID del tipo de acción (Create, Read, Update, Delete, etc.)
        "school_id": 3,                  // Optional, ID de la escuela relacionada
        "description": "Usuario creó un nuevo proceso"  // Descripción de la acción
    }
    """
    # Si no se proporciona user_id, usar el usuario actual
    if audit.user_id is None:
        audit.user_id = current_user.id
    
    # Crear el registro de auditoría
    db_audit = AuditLog(
        user_id=audit.user_id,
        action_type_id=audit.action_type_id,
        school_id=audit.school_id,
        description=audit.description
    )
    
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    
    # Cargar relaciones para el response
    db_audit = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user), joinedload(AuditLog.action_type), joinedload(AuditLog.school))
        .filter(AuditLog.id == db_audit.id)
        .first()
    )
    
    return _serialize_audit(db_audit)


@router.post("/log-by-name", response_model=AuditOut)
def log_audit_action_by_name(
    audit_data: dict,
    db: Session = Depends(get_db_users),
    current_user = Depends(get_current_user)
):
    """
    Registra una nueva acción en el audit_log usando el nombre del action_type.
    
    Body esperado:
    {
        "action_type_name": "Create",    // Nombre del tipo de acción
        "school_id": 3,                  // Optional, ID de la escuela
        "description": "Usuario creó un nuevo proceso"
    }
    """
    action_type_name = audit_data.get("action_type_name")
    if not action_type_name:
        raise HTTPException(status_code=400, detail="action_type_name is required")
    
    # Buscar el ActionType por nombre
    action_type = db.query(ActionType).filter(ActionType.name == action_type_name).first()
    if not action_type:
        raise HTTPException(status_code=404, detail=f"ActionType '{action_type_name}' not found")
    
    # Crear el registro de auditoría
    db_audit = AuditLog(
        user_id=audit_data.get("user_id") or current_user.id,
        action_type_id=action_type.id,
        school_id=audit_data.get("school_id"),
        description=audit_data.get("description")
    )
    
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    
    # Cargar relaciones para el response
    db_audit = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user), joinedload(AuditLog.action_type), joinedload(AuditLog.school))
        .filter(AuditLog.id == db_audit.id)
        .first()
    )
    
    return _serialize_audit(db_audit)


@router.get("/action-types")
def get_action_types(
    db: Session = Depends(get_db_users),
    current_user = Depends(get_current_user)
):
    """
    Devuelve todos los tipos de acción disponibles.
    """
    action_types = db.query(ActionType).all()
    return [{"id": at.id, "name": at.name} for at in action_types]
