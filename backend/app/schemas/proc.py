from pydantic import BaseModel
from datetime import datetime


class ProcessBase(BaseModel):
    process_name: str
    estado: str

    # "estado": p.estado,
    # "encargado": p.encargado.username if p.encargado else None,
    # "unidad": p.school.school_name if p.school else None,
    # "school_id": p.school_id,
    # "created_at": p.created_at,
    # "updated_at": p.updated_at

class ProcessOut(ProcessBase):
    id: int
    process_name: str
    estado: str
    encargado: str | None = None
    unidad: str | None = None
    school_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        orm_mode = True
