from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Request
from datetime import datetime, timedelta

from app.models import Usuario, RefreshToken
from app.auth.security import (
    verify_password,
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_expiration
)




def login_user(
    db: Session,
    username: str,
    password: str,
    request: Request
):
    user = db.query(Usuario).filter(
        Usuario.username == username,
        Usuario.activo == True
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    if user.bloqueado_hasta and user.bloqueado_hasta > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario bloqueado temporalmente"
        )

    if not verify_password(password, user.password_hash):
        user.intentos_fallidos += 1

    if user.intentos_fallidos >= 5 and not user.bloqueado_hasta:
        user.bloqueado_hasta = datetime.utcnow() + timedelta(minutes=15)

    db.commit()
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas"
    )

    # 🔓 Login OK
    user.intentos_fallidos = 0
    user.bloqueado_hasta = None
    user.ultimo_login = datetime.utcnow()


    # 🔑 Access token
    access_token = create_access_token({
        "sub": str(user.id_usuario),
        "username": user.username,
        "rol": user.rol
    })

    # 🔁 Refresh token
    refresh_token = generate_refresh_token()

    db_refresh = RefreshToken(
        id_usuario=user.id_usuario,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=refresh_expiration(),
        created_by_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )

    db.add(db_refresh)
    db.commit()

    return access_token, refresh_token


def logout_user(db: Session, request: Request):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        return  # logout idempotente

    token_hash = hash_refresh_token(refresh_token)

    db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash
    ).delete()

    db.commit()


def refresh_access_token(db: Session, request: Request):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token requerido")

    token_hash = hash_refresh_token(refresh_token)

    rt = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash
    ).first()

    if not rt or rt.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    user = db.query(Usuario).filter(
        Usuario.id_usuario == rt.id_usuario,
        Usuario.activo == True
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Usuario inválido")

    # 🔁 ROTACIÓN DE REFRESH TOKEN (RECOMENDADO)
    new_refresh = generate_refresh_token()
    rt.token_hash = hash_refresh_token(new_refresh)
    rt.expires_at = refresh_expiration()

    access_token = create_access_token({
        "sub": str(user.id_usuario),
        "username": user.username,
        "rol": user.rol
    })

    db.commit()

    return access_token, new_refresh