# backend/app/dependencies/auth.py
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database import get_db
from app.models import Usuario
from app.core.config import settings
from app.core.audit_context import set_audit_context

security = HTTPBearer(auto_error=False)


def _decode_user_id(credentials: HTTPAuthorizationCredentials) -> int:
    """Decodifica el token JWT y devuelve el id de usuario."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    user_id = _decode_user_id(credentials)

    user = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == user_id, Usuario.activo.is_(True))
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no válido")

    # Setea el contexto en la misma sesión que usará el router para las operaciones
    request.state.user_id = user.id_usuario
    set_audit_context(
        db,
        user_id=user.id_usuario,
        username=user.username,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return user
