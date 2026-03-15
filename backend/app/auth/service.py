# app/auth/service.py
# Este archivo contiene la lógica de negocio relacionada con autenticación, generación de tokens y gestión de sesiones.
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
    username: str, # Este 'username' viene del Form de FastAPI, pero contendrá el EMAIL
    password: str,
    request: Request,
):
    # 🔍 1. Buscar usuario por EMAIL (cambiamos el filtro aquí)
    user = (
        db.query(Usuario)
        .filter(Usuario.email == username) # Comparamos contra la columna email
        .first()
    )

    if not user:
        raise AuthenticationError("Email o contraseña incorrectos")

    if not user.activo:
        raise AuthenticationError("Tu cuenta no está activa. Contacta al administrador.")

    # 🔐 2. Verificar contraseña
    if not verify_password(password, user.password_hash):
        raise AuthenticationError("Email o contraseña incorrectos")

    # 🔑 3. Access token (JWT)
    # Importante: El payload ahora lleva el email para que el frontend lo reconozca
    access_token = create_access_token({
        "sub": str(user.id_usuario),
        "username": user.email, # Enviamos el email como username en el token
        "rol": user.tipo,
    })

    # 🔁 4. Refresh token (valor random)
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

    return access_token, refresh_token_value


def refresh_access_token(db: Session, request: Request):
    refresh_token_value = request.cookies.get("refresh_token")

    if not refresh_token_value:
        raise AuthenticationError("Refresh token requerido")

    token_hash = hash_refresh_token(refresh_token_value)

    token_db = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash
    ).first()

    if not token_db:
        raise AuthenticationError("Refresh token inválido")

    # 🚨 Reuse attack detection
    if token_db.revoked:
        # Revocar todos los tokens del usuario
        db.query(RefreshToken).filter(
            RefreshToken.id_usuario == token_db.id_usuario
        ).update({
            "revoked": True,
            "revoked_at": datetime.utcnow()
        })
        db.commit()
        raise AuthenticationError("Token comprometido")

    if token_db.expires_at <= datetime.utcnow():
        raise AuthenticationError("Refresh token expirado")

    if not token_db:
        raise AuthenticationError("Refresh token inválido")

    user = db.query(Usuario).get(token_db.id_usuario)

    if not user or not user.activo:
        raise AuthenticationError("Usuario inválido")

    # 🔑 Nuevo access token
    access_token = create_access_token({
        "sub": str(user.id_usuario),
        "username": user.email, 
        "rol": user.tipo,
    })

    # 🔄 Rotación de refresh token
    new_refresh_token = generate_refresh_token_value()

    token_db.revoked = True
    token_db.revoked_at = datetime.utcnow()

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
        try:
            token.revoked = True
            token.revoked_at = datetime.utcnow()
            db.commit()
        except Exception:
            db.rollback()

    return {"message": "Logged out"}
