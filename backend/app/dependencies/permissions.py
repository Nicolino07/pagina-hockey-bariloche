from fastapi import Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.models.usuario import Usuario


def require_roles(*roles_permitidos: str):
    def role_checker(
        current_user: Usuario = Depends(get_current_user)
    ):
        if current_user.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permisos insuficientes"
            )
        return current_user

    return role_checker


# Aliases semánticos
require_admin = require_roles("ADMIN", "SUPERUSUARIO")
require_editor = require_roles("EDITOR", "ADMIN", "SUPERUSUARIO")
