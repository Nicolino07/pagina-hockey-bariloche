import os
from fastapi import APIRouter, Depends, Response, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.auth.service import login_user, logout_user, refresh_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,               # 👈 primero
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    print("LOGIN REQUEST")
    access_token, refresh_token = login_user(
        db,
        form_data.username,
        form_data.password,
        request
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=bool(os.getenv("COOKIE_SECURE", "false").lower() == "true"),
        samesite="strict",
        max_age=60 * 60 * 24 * 14
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }