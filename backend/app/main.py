from fastapi import FastAPI
from app.api.v1.routes import auth, users
from app.core.config import get_settings
from fastapi.middleware.cors import CORSMiddleware

settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0")

origins = [
    "http://localhost:5173",  # frontend local
    "http://127.0.0.1:5173",
    # más adelante: dominio en producción (ej. https://paaa.itcr.ac.cr)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,              # quién puede hacer requests
    allow_credentials=True,
    allow_methods=["*"],                # qué métodos (GET, POST, etc.)
    allow_headers=["*"],                # qué headers se permiten
)

# Rutas
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])

@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "service": settings.app_name}

@app.get("/")
def root():
    return {"message": "Backend API running successfully."}