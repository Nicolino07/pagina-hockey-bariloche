from sqlalchemy.orm import Session
from fastapi import Request
from datetime import datetime

from app.models import Usuario, RefreshToken
from app.auth.security import (
    create_access_token,
    generate_refresh_token_value,
    hash_refresh_token,
    verify_password,
)
from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
)


def login_user(
    db: Session,
    username: str,
    password: str,
    request: Request,
):
    # 🔍 Buscar usuario
    user = (
        db.query(Usuario)
        .filter(Usuario.username == username)
        .first()
    )

    if not user or not user.activo:
        raise AuthenticationError("Usuario o contraseña incorrectos")

    # 🔐 Verificar contraseña
    if not verify_password(password, user.password_hash):
        raise AuthenticationError("Usuario o contraseña incorrectos")

    # 🔑 Access token (JWT corto)
    access_token = create_access_token({
        "sub": str(user.id_usuario),
        "username": user.username,
        "rol": user.tipo,
    })

    # 🔁 Refresh token (valor random, NO JWT)
    refresh_token_value = generate_refresh_token_value()

    db.add(RefreshToken(
        id_usuario=user.id_usuario,
        token_hash=hash_refresh_token(refresh_token_value),
        expires_at=datetime.utcnow() + settings.refresh_token_expire_timedelta,
        created_by_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        revoked=False,
    ))

    db.commit()

    # ⚠️ Se devuelve el valor del refresh token
    # → normalmente lo seteás como cookie HttpOnly en el router
    return access_token, refresh_token_value


def refresh_access_token(db: Session, request: Request):
    refresh_token_value = request.cookies.get("refresh_token")

    if not refresh_token_value:
        raise AuthenticationError("Refresh token requerido")

    token_hash = hash_refresh_token(refresh_token_value)

    token_db = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > datetime.utcnow(),
        )
        .first()
    )

    if not token_db:
        raise AuthenticationError("Refresh token inválido")

    user = db.query(Usuario).get(token_db.id_usuario)

    if not user or not user.activo:
        raise AuthenticationError("Usuario inválido")

    # 🔑 Nuevo access token
    access_token = create_access_token({
        "sub": str(user.id_usuario),
        "username": user.username,
        "rol": user.tipo,
    })

    # 🔄 Rotación de refresh token
    new_refresh_token = generate_refresh_token_value()

    token_db.revoked = True

    db.add(RefreshToken(
        id_usuario=user.id_usuario,
        token_hash=hash_refresh_token(new_refresh_token),
        expires_at=datetime.utcnow() + settings.refresh_token_expire_timedelta,
        revoked=False,
    ))

    db.commit()

    return access_token, new_refresh_token


def logout_user(db: Session, request: Request):
    refresh_token_value = request.cookies.get("refresh_token")

    # Logout idempotente
    if not refresh_token_value:
        return {"message": "Logged out"}

    token_hash = hash_refresh_token(refresh_token_value)

    token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
        )
        .first()
    )

    if token:
        token.revoked = True
        db.commit()

    return {"message": "Logged out"}
