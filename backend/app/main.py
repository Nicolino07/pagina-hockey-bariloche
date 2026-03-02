from fastapi import FastAPI
from sqlalchemy.exc import IntegrityError  
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.middleware import request_context_middleware
from app.core.exceptions import AppError
from app.core.exception_handlers import (
    app_error_handler,
    integrity_error_handler,
    unhandled_exception_handler,
)
from app.core.error_response import error_response

# Importa modelos para que SQLAlchemy los registre
from app import models  # noqa: F401

# =====================================================
# App
# =====================================================
limiter = Limiter(key_func=get_remote_address)

# Leemos el entorno
ENV = os.getenv("ENVIRONMENT", "development")
API_PREFIX = "/api"  # 🔥 Definimos el prefijo una vez

# Configuración de Swagger - TODO bajo /api
app = FastAPI(
    title="Hockey Bariloche API",
    version="1.1.0",
    docs_url=f"{API_PREFIX}/docs" if os.getenv("ENABLE_SWAGGER") == "True" else None,  # 🔥 Cambiado
    redoc_url=f"{API_PREFIX}/redoc" if os.getenv("ENABLE_SWAGGER") == "True" else None,  # 🔥 Cambiado
    openapi_url=f"{API_PREFIX}/openapi.json" if os.getenv("ENABLE_SWAGGER") == "True" else None,  # 🔥 Importante!
)

# CORS
origins_str = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173")
origins = [origin.strip() for origin in origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# Middleware
# =====================================================
app.middleware("http")(request_context_middleware)
app.state.limiter = limiter

# =====================================================
# Exception handlers globales
# =====================================================
async def rate_limit_handler(request, exc):
    return error_response(
        status_code=429,
        code="RATE_LIMIT_EXCEEDED",
        message="Demasiadas solicitudes",
    )

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# =====================================================
# Routers - Usamos el mismo prefijo
# =====================================================
from app.auth import router as auth
from app.routers import (
    clubes_router as clubes,
    equipos_router as equipos,
    personas_router as personas,
    planteles_router as planteles,
    torneos_router as torneos,
    inscripciones_torneos as inscripciones,
    partidos_router as partido,
    vistas_router as vistas,
    fichajes_router as fichajes,
    noticias_router as noticias,
    estadisticas_router as estadisticas,
)

@app.get(f"{API_PREFIX}/")  # 🔥 También movemos el root
def root():
    return {"message": "API Hockey Bariloche funcionando"}

# Todos los routers con el mismo prefijo
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(clubes, prefix=API_PREFIX)
app.include_router(equipos, prefix=API_PREFIX)
app.include_router(personas, prefix=API_PREFIX)
app.include_router(planteles, prefix=API_PREFIX)
app.include_router(torneos, prefix=API_PREFIX)
app.include_router(inscripciones.router, prefix=API_PREFIX)
app.include_router(partido, prefix=API_PREFIX)
app.include_router(vistas, prefix=API_PREFIX)
app.include_router(fichajes, prefix=API_PREFIX)
app.include_router(noticias, prefix=API_PREFIX)
app.include_router(estadisticas, prefix=API_PREFIX)