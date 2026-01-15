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

MAX_INTENTOS_FALLIDOS = 5
BLOQUEO_MINUTOS = 15


def login_user(
    db: Session,
    username: str,
    password: str,
    request: Request
):
    user = db.query(Usuario).filter(
        Usuario.username == username,
        Usuario.activo.is_(True),
        Usuario.borrado_en.is_(None)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    # ⛔ Usuario bloqueado
    if user.bloqueado_hasta and user.bloqueado_hasta > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario bloqueado temporalmente"
        )

    # ❌ Password incorrecto
    if not verify_password(password, user.password_hash):
        user.intentos_fallidos += 1

        if (
            user.intentos_fallidos >= MAX_INTENTOS_FALLIDOS
            and not user.bloqueado_hasta
        ):
            user.bloqueado_hasta = datetime.utcnow() + timedelta(
                minutes=BLOQUEO_MINUTOS
            )

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    # ✅ Login OK
    user.intentos_fallidos = 0
    user.bloqueado_hasta = None
    user.ultimo_login = datetime.utcnow()

    # 🔒 Revocar TODOS los refresh tokens previos
    db.query(RefreshToken).filter(
        RefreshToken.id_usuario == user.id_usuario,
        RefreshToken.revoked.is_(False)
    ).update(
        {
            "revoked": True,
            "revoked_at": datetime.utcnow()
        },
        synchronize_session=False
    )

    db.commit()

    # 🔑 Access token
    access_token = create_access_token({
        "sub": str(user.id_usuario),
        "username": user.username,
        "rol": user.tipo,
        "type": "access"
    })

    # 🔁 Refresh token (nuevo)
    refresh_token = generate_refresh_token()

    db_refresh = RefreshToken(
        id_usuario=user.id_usuario,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=refresh_expiration(),
        created_by_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        revoked=False
    )

    db.add(db_refresh)
    db.commit()

    return access_token, refresh_token


def logout_user(db: Session, request: Request):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        return  # logout idempotente

    token_hash = hash_refresh_token(refresh_token)

    rt = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked.is_(False)
    ).first()

    if rt:
        rt.revoked = True
        rt.revoked_at = datetime.utcnow()
        db.commit()


def refresh_access_token(db: Session, request: Request):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token requerido"
        )

    token_hash = hash_refresh_token(refresh_token)

    # 🔎 1) Reuse attack detection (token ya revocado)
    reused = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked.is_(True)
    ).first()

    if reused:
        # 🚨 Revoke all tokens for this user
        db.query(RefreshToken).filter(
            RefreshToken.id_usuario == reused.id_usuario,
            RefreshToken.revoked.is_(False)
        ).update(
            {
                "revoked": True,
                "revoked_at": datetime.utcnow()
            },
            synchronize_session=False
        )
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token reutilizado detectado"
        )

    # 🔎 2) Valid token
    rt = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked.is_(False),
        RefreshToken.expires_at > datetime.utcnow()
    ).first()

    if not rt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado"
        )

    user = db.query(Usuario).filter(
        Usuario.id_usuario == rt.id_usuario,
        Usuario.activo.is_(True),
        Usuario.borrado_en.is_(None)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inválido"
        )

    # 🔁 Rotación correcta: revocar + crear nuevo
    rt.revoked = True
    rt.revoked_at = datetime.utcnow()

    new_refresh_token = generate_refresh_token()

    db.add(RefreshToken(
        id_usuario=user.id_usuario,
        token_hash=hash_refresh_token(new_refresh_token),
        expires_at=refresh_expiration(),
        created_by_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        revoked=False
    ))

    # 🔑 Nuevo access token
    access_token = create_access_token({
        "sub": str(user.id_usuario),
        "username": user.username,
        "rol": user.tipo,
        "type": "access"
    })

    db.commit()

    return access_token, new_refresh_token
