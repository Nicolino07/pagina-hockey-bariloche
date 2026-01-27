# backend/app/core/middleware.py
from fastapi import Request

async def request_context_middleware(request: Request, call_next):
    # contexto HTTP liviano
    request.state.ip = request.client.host if request.client else None
    request.state.user_agent = request.headers.get("user-agent")

    response = await call_next(request)
    return response
