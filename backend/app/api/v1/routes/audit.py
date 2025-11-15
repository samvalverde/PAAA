from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db_users
from app.models.audit import AuditLog
from app.schemas.audit import AuditOut
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
