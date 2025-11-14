from fastapi import FastAPI
from app.api.v1.routes import auth, users, health, statistics, process, audit
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
    prefix="/api/v1/stats",
    tags=["Statistics"]
)

# ============================ PROCESSES ============================
app.include_router(
    process.router,
    prefix="/api/v1/process",
    tags=["Processes"]
)

# ============================ REPORTS ============================
# (Por implementar)

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