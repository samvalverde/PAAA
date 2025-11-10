from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.database import get_db_users
from app.models.user import User
from app.core.config import get_settings
from app.core.security import get_current_user
import logging

router = APIRouter()
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)

# --- Password helpers ---
def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password verification error"
        )

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=30))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")

# --- Auth routes ---
@router.post("/login", tags=["Auth"])
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db_users)):
    user = (
        db.query(User)
        .filter((User.email == username) | (User.username == username))
        .first()
    )

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user.password_hash:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User has no password set")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.user_type.type_name,
            "username": user.username,
            "school_id": user.school_id
        },
        expires_delta=expires
    )

    
    print(f"Auth successful for: {user.email} | role={user.user_type.type_name}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", tags=["Auth"])
def register(email: str = Form(...), username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db_users)):
    from app.core.security import get_password_hash
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = get_password_hash(password)
    new_user = User(email=email, username=username, password_hash=hashed, user_type_id=3)  # default: visor
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": f"User {username} created successfully"}

@router.post("/refresh", tags=["Auth"])
def refresh_token(current_user = Depends(get_current_user)):
    access_token = create_access_token(data={"sub": current_user.email, "role": current_user.user_type.type_name})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Dev/test helper ---
@router.post("/hash", tags=["Auth"])
def generate_hash(password: str = Form(...)):
    from app.core.security import get_password_hash
    hashed = get_password_hash(password)
    return {"password": password, "hash": hashed}
