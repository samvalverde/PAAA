from asyncio.log import logger
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.database import get_db_users
from app.models.user import User

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
pwd_context = None

def get_pwd_context():
    global pwd_context
    if pwd_context is None:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_pwd_context().verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return get_pwd_context().hash(password)

# --- Token creation ---
def create_access_token(data: dict, expires_minutes: int | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

# --- Token validation + user lookup ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db_users)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user
