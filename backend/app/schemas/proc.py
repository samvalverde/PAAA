from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ProcessBase(BaseModel):
    process_name: str
    school_id: Optional[int] = None

class ProcessCreate(ProcessBase):
    # Additional fields needed for process creation via form
    career_name: Optional[str] = None  # e.g., "ATI", "TURISMO"
    dataset_type: Optional[str] = None  # e.g., "egresados", "profesores"
    encargado_user_id: Optional[int] = None  # User in charge of the process

class ProcessUpdate(BaseModel):
    process_name: Optional[str] = None
    school_id: Optional[int] = None
    encargado_id: Optional[int] = None
    estado: Optional[str] = None

class ProcessOut(ProcessBase):
    id: int
    estado: str
    encargado: str | None = None
    encargado_id: int | None = None
    unidad: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        orm_mode = True
