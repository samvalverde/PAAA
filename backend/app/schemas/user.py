from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr
    phone_number: Optional[str] = None
    user_type_id: int  # FK a user_types.id
    school_id: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int

    class Config:
        orm_mode = True
