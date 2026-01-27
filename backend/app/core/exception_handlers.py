from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import AppError
from app.core.error_response import error_response


# 🔹 Errores de dominio controlados (AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        },
    )


# 🔹 Errores de integridad de base de datos (constraints, FK, unique, etc.)
async def integrity_error_handler(
    request: Request,
    exc: IntegrityError,
):
    db = getattr(request.state, "db", None)
    if db:
        db.rollback()

    return error_response(
        status_code=409,
        code="DOMAIN_CONSTRAINT_VIOLATION",
        message="La operación viola una regla del sistema",
    )


# 🔹 Catch-all (esto NO debería recibir errores de negocio)
async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
):
    return error_response(
        status_code=500,
        code="INTERNAL_SERVER_ERROR",
        message="Error interno del servidor",
    )
