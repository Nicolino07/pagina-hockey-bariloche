from fastapi import Depends
from app.dependencies.auth import get_current_user
from app.models.usuario import Usuario
from app.core.exceptions import AuthorizationError


def require_roles(*roles_permitidos: str):
    def role_checker(
        current_user: Usuario = Depends(get_current_user),
    ) -> Usuario:
        if current_user.tipo not in roles_permitidos:
            raise AuthorizationError()
        return current_user

    return role_checker


# Aliases semánticos
require_admin = require_roles("ADMIN", "SUPERUSUARIO")
require_editor = require_roles("EDITOR", "ADMIN", "SUPERUSUARIO")
