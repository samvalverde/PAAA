from pydantic import BaseModel
from datetime import datetime


class AuditBase(BaseModel):
    user_id: int | None = None
    action_type_id: int | None = None
    school_id: int | None = None
    description: str | None = None


class AuditCreate(AuditBase):
    pass


class AuditOut(AuditBase):
    id: int
    responsible: str | None = None
    unit: str | None = None
    action: str | None = None
    created_at: datetime

    class Config:
        orm_mode = True
