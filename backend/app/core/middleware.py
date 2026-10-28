# backend/app/core/middleware.py
from fastapi import Request

from app.core.rate_limit import client_ip

async def request_context_middleware(request: Request, call_next):
    # contexto HTTP liviano
    request.state.ip = client_ip(request)
    request.state.user_agent = request.headers.get("user-agent")

    response = await call_next(request)
    return response
