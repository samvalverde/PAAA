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

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    user_type_id: Optional[int] = None
    school_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # Allow password updates

class UserOut(UserBase):
    id: int
    role: Optional[str] = None
        
    class Config:
        orm_mode = True
