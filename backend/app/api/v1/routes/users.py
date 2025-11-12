from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db_users, Base, engine_users
from app.schemas.user import UserCreate, UserOut
from app.models.user import User
from app.core.security import get_password_hash, get_current_user

router = APIRouter()

@router.get("/me", tags=["Users"])
def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "is_active": True,
        "role": current_user.user_type.type_name if current_user.user_type else None
    }

@router.post("/", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db_users)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = (
        db.query(User)
        .options(joinedload(User.user_type))
        .filter((User.email == payload.email) | (User.username == payload.username))
        .first()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db_users)):
    users = db.query(User).options(joinedload(User.user_type)).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "is_active": True,
            "username": u.username,
            "phone": u.phone_number,
            "role": u.user_type.type_name if u.user_type else None
        }
        for u in users
    ]
