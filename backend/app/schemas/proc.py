from pydantic import BaseModel
from datetime import datetime


class ProcessBase(BaseModel):
    process_name: str
    estado: str

class ProcessOut(ProcessBase):
    id: int
    school_id: int
    encargado_id: int
    encargado: str | None = None
    unidad: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        orm_mode = True
