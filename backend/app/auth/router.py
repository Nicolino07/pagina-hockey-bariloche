import os
from fastapi import APIRouter, Depends, Response, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginRequest
from app.auth.service import login_user, logout_user, refresh_access_token
from slowapi import Limiter
from slowapi.util import get_remote_address


router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    access_token, refresh_token = login_user(
        db,
        data.username,
        data.password,
        request
    )

    # 🍪 Cookie HttpOnly
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=bool(os.getenv("COOKIE_SECURE", "false").lower() == "true"),       # HTTPS en prod
        samesite="strict",
        max_age=60 * 60 * 24 * 14
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    logout_user(db, request)

    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=bool(os.getenv("COOKIE_SECURE", "false").lower() == "true"),
        samesite="strict"
    )

@router.post("/refresh")
@limiter.limit("10/minute")
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    access_token, new_refresh = refresh_access_token(db, request)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=bool(os.getenv("COOKIE_SECURE", "false").lower() == "true"),
        samesite="strict",
        max_age=60 * 60 * 24 * 30
    )

    return {"access_token": access_token}