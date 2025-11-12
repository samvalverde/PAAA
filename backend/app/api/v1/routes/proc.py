from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, func
from typing import Optional, List, Dict, Any
from datetime import date
from app.core.database import get_db_users
from app.schemas.proc import ProcessOut
from app.models.prc import Process

router = APIRouter()

@router.get("/", response_model=list[ProcessOut])
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
        "encargado_id": p.encargado_id,
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