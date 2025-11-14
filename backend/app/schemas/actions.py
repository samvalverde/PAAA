from pydantic import BaseModel
from datetime import datetime

class ActionBase(BaseModel):
    user_id: int
    process_id: int | None = None
    action_type_id: int


class ActionOut(ActionBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True

class ActionTypeBase(BaseModel):
    name: str
    description: str | None = None

class ActionTypeOut(ActionTypeBase):
    id: int

    class Config:
        orm_mode = True