
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.exceptions import AppError
from app.core.error_response import error_response


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


async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
):
    return error_response(
        status_code=500,
        code="INTERNAL_SERVER_ERROR",
        message="Error interno del servidor",
    )