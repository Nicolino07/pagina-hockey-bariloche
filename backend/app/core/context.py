from contextvars import ContextVar

current_user_ctx = ContextVar("current_user", default=None)


request_ctx = ContextVar(
    "request_ctx",
    default={
        "ip": None,
        "user_agent": None
    }
)
