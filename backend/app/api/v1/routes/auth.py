from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db_users, Base, engine_users
from app.models.user import User
from app.core.security import verify_password, create_access_token
from app.core.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Auth"])

# Ensure tables exist (safe to call multiple times)
Base.metadata.create_all(bind=engine_users)

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db_users)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": user.email}, settings.access_token_expire_minutes)
    return {"access_token": token, "token_type": "bearer"}
