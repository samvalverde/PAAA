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

class ProcessOut(ProcessBase):
    id: int
    estado: str
    encargado: str | None = None
    unidad: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        orm_mode = True
