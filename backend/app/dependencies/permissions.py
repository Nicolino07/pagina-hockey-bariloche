from fastapi import Depends, HTTPException, status
from typing import List

from app.dependencies.auth import get_current_user
from app.models.usuario import Usuario


def require_roles(*roles_permitidos: List[str]):
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


# 🎯 Alias semántico
require_admin = require_roles("admin")