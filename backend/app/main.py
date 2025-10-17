from fastapi import FastAPI
from app.api.v1.routes import auth, users
from app.core.config import get_settings

settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0")

@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "service": settings.app_name}

app.include_router(auth.router)
app.include_router(users.router)
