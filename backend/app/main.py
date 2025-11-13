from fastapi import FastAPI
from app.api.v1.routes import auth, users, health, statistics, proc
from app.core.config import get_settings
from fastapi.middleware.cors import CORSMiddleware

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

# Rutas
app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Auth"]
)
app.include_router(
    users.router,
    prefix="/api/v1/users",
    tags=["Users"]
)
app.include_router(
    health.router,
    prefix="/api/v1/health",
    tags=["Health"]
)
app.include_router(
    statistics.router,
    prefix="/api/v1/stats",
    tags=["Statistics"]
)
app.include_router(
    proc.router,
    prefix="/api/v1/proc",
    tags=["Processes"]
)