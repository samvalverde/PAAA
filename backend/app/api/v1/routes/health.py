from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db_users, get_db_data
from app.core.minio_client import get_minio_client

router = APIRouter(tags=["Health"])

@router.get("/db", tags=["Health"])
def check_users_db(db: Session = Depends(get_db_users)):
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "service": "database_users"}
    except Exception as e:
        return {"status": "error", "service": "database_users", "details": str(e)}

@router.get("/db_etl", tags=["Health"])
def check_data_db(db: Session = Depends(get_db_data)):
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "service": "database_etl"}
    except Exception as e:
        return {"status": "error", "service": "database_etl", "details": str(e)}

@router.get("/minio", tags=["Health"])
def check_minio(minio=Depends(get_minio_client)):
    try:
        minio.list_buckets()
        return {"status": "ok", "service": "minio"}
    except Exception as e:
        return {"status": "error", "service": "minio", "details": str(e)}
