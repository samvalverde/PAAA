from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db_users, Base, engine_users
from app.schemas.user import UserCreate, UserOut
from app.models.user import User
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])

# Ensure tables exist
Base.metadata.create_all(bind=engine_users)

@router.post("/", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db_users)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(email=payload.email, hashed_password=get_password_hash(payload.password), role=payload.role, is_active=payload.is_active)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db_users)):
    return db.query(User).all()
