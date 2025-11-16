from fastapi import FastAPI
from app.api.v1.routes import auth, users, health, statistics, process, audit
from app.api.v1.routes import reports
from app.core.config import get_settings
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from app.core.database import SessionUsers
from app.core.security import get_password_hash
from app.models.user import User
 
settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0")

origins = [
    "http://localhost:5173",  # frontend local
    "http://127.0.0.1:5173",
    # más adelante: dominio en producción (ej. https://paaa.itcr.ac.cr)
    "http://localhost:5174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,              # quién puede hacer requests
    allow_credentials=True,
    allow_methods=["*"],                # qué métodos (GET, POST, etc.)
    allow_headers=["*"],                # qué headers se permiten
)

# ============================ Rutas ============================

# ============================ AUTH ============================
app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Auth"]
)

# ============================ USERS ============================
app.include_router(
    users.router,
    prefix="/api/v1/users",
    tags=["Users"]
)

# ============================ HEALTH ============================
app.include_router(
    health.router,
    prefix="/api/v1/health",
    tags=["Health"]
)
 
# ============================ STATISTICS ============================
app.include_router(
    statistics.router,
    prefix="/api/v1/statistics",
    tags=["Statistics"]
)

# ============================ PROCESSES ============================
app.include_router(
    process.router,
    prefix="/api/v1/process",
    tags=["Processes"]
)

# ============================ REPORTS ============================
app.include_router(
    reports.router,
    prefix="/api/v1/reports",
    tags=["Reports"]
)

# ============================ AUDITS ============================

app.include_router(
    audit.router,
    prefix="/api/v1/audit",
    tags=["Audit"]
)

# ============================ Root Endpoint ============================
@app.get("/")
def read_root():
    return {"message": "Welcome to the PAAA API"}


@app.on_event("startup")
def ensure_legacy_passwords():
    """Detecta usuarios con el hash placeholder usado en los scripts iniciales
    y los actualiza con un hash generado por la función actual `get_password_hash`.
    Esto evita que los usuarios seed no puedan autenticarse si el hash embebido
    no es compatible con la implementación de passlib en el contenedor.
    """
    logger = logging.getLogger("paaa.ensure_legacy_passwords")

    # Allow multiple legacy hashes via env var (comma separated)
    legacy_hashes_env = os.environ.get("LEGACY_PASSWORD_HASHES")
    if legacy_hashes_env:
        legacy_hashes = [h.strip() for h in legacy_hashes_env.split(",") if h.strip()]
    else:
        # Default: the single legacy hash used in seed scripts
        legacy_hashes = ["$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G"]

    # Plaintext password to assign to legacy accounts (default: changeme)
    new_plain = os.environ.get("LEGACY_PASSWORD_PLAINTEXT", "changeme")
    new_hash = get_password_hash(new_plain)

    db = SessionUsers()
    try:
        users = db.query(User).filter(User.password_hash.in_(legacy_hashes)).all()
        if not users:
            logger.debug("No legacy password hashes found.")
            return
        for u in users:
            u.password_hash = new_hash
            db.add(u)
        db.commit()
        logger.info("Updated %d legacy user password(s) to runtime hash.", len(users))
    except Exception as e:
        logger.exception("Error updating legacy passwords: %s", e)
    finally:
        db.close()