import os
from fastapi import APIRouter, Depends, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.auth.service import login_user, logout_user, refresh_access_token
from app.dependencies.permissions import get_current_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
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


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    access_token, new_refresh_token = refresh_access_token(db, request)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=60 * 60 * 24 * 7,
    )

    return {"access_token": access_token}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    logout_user(db, request)
    response.delete_cookie("refresh_token")
    return {"ok": True}


@router.get("/me")
def me(user: Usuario = Depends(get_current_user)):
    return {
        "id": user.id_usuario,
        "email": user.email,
        "rol": user.tipo
    }
