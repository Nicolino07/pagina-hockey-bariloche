from fastapi import Request
from app.core.context import request_ctx


async def request_context_middleware(request: Request, call_next):
    request_ctx.set({
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent")
    })

    response = await call_next(request)
    return response
