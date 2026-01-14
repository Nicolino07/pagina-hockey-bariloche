from fastapi import FastAPI
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.database import engine
from app.models import Base          # ← Base único
from app import models               # ← registra todos los modelos
from app.core.middleware import request_context_middleware



# =====================================================
# App
# =====================================================
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Hockey Bariloche API",
    version="1.1.0",
)

app.middleware("http")(request_context_middleware)
app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    lambda request, exc: JSONResponse(
        status_code=429,
        content={"detail": "Demasiadas solicitudes"},
    ),
)

# =====================================================
# Routers
# =====================================================
from app.routers import (
    clubes_router as clubes,
    equipos_router as equipos,
    personas_router as personas,
    planteles_router as planteles,
    torneos_router as torneos,
)

@app.get("/")
def root():
    return {"message": "API Hockey Bariloche funcionando"}

app.include_router(clubes)
app.include_router(equipos)
app.include_router(personas)
app.include_router(planteles)
app.include_router(torneos)
