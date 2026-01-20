from fastapi import FastAPI
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.middleware import request_context_middleware
from app.core.exceptions import AppError
from app.core.exception_handlers import (
    app_error_handler,
    unhandled_exception_handler,
)
from app.core.error_response import error_response

# Importa modelos para que SQLAlchemy los registre
from app import models  # noqa: F401

# =====================================================
# App
# =====================================================
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Hockey Bariloche API",
    version="1.1.0",
)

# =====================================================
# Middleware
# =====================================================
app.middleware("http")(request_context_middleware)
app.state.limiter = limiter

# =====================================================
# Exception handlers globales
# =====================================================

# 🔹 Errores de dominio
app.add_exception_handler(AppError, app_error_handler)

# 🔹 Errores inesperados
app.add_exception_handler(Exception, unhandled_exception_handler)


async def rate_limit_handler(request, exc):
    return error_response(
        status_code=429,
        code="RATE_LIMIT_EXCEEDED",
        message="Demasiadas solicitudes",
    )


# =====================================================
# Routers
# =====================================================

from app.auth import router as auth
from app.routers import (
    clubes_router as clubes,
    equipos_router as equipos,
    personas_router as personas,
    planteles_router as planteles,
    torneos_router as torneos,
    inscripciones_torneos as inscripciones,
    partidos_router as partido
)


@app.get("/")
def root():
    return {"message": "API Hockey Bariloche funcionando"}


app.include_router(auth.router)
app.include_router(clubes)
app.include_router(equipos)
app.include_router(personas)
app.include_router(planteles)
app.include_router(torneos)
app.include_router(inscripciones.router)
app.include_router(partido)
