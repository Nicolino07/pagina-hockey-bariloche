from fastapi.responses import JSONResponse


def error_response(
    *,
    status_code: int,
    message: str,
    code: str,
    detail: dict | None = None,
):
    payload = {
        "error": {
            "code": code,
            "message": message,
        }
    }

    if detail:
        payload["error"]["detail"] = detail

    return JSONResponse(
        status_code=status_code,
        content=payload,
    )
