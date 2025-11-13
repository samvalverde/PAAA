from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db_users
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.core.security import get_password_hash, get_current_user

router = APIRouter(tags=["Users"])

@router.post("/create", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db_users)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_pw,
        user_type_id=user.user_type_id,
        school_id=user.school_id,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db_users), current_user=Depends(get_current_user)):
    users = db.query(User).all()
    return users


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
        raise HTTPException(status_code=400, detail="Email already registered")
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
