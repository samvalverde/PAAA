from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import get_settings

settings = get_settings()

# Users DB (auth, RBAC)
engine_users = create_engine(
    settings.database_url_users, connect_args={"check_same_thread": False} if settings.database_url_users.startswith("sqlite") else {}
)
SessionUsers = sessionmaker(autocommit=False, autoflush=False, bind=engine_users)

# Data DB (processed analytics data)
engine_data = create_engine(
    settings.database_url_data, connect_args={"check_same_thread": False} if settings.database_url_data.startswith("sqlite") else {}
)
SessionData = sessionmaker(autocommit=False, autoflush=False, bind=engine_data)

Base = declarative_base()

def get_db_users():
    db = SessionUsers()
    try:
        yield db
    finally:
        db.close()

def get_db_data():
    db = SessionData()
    try:
        yield db
    finally:
        db.close()
