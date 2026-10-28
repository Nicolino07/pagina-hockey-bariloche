from fastapi import Depends
from app.dependencies.auth import get_current_user
from app.models.usuario import Usuario
from app.core.exceptions import AuthorizationError
from app.models.enums import TipoUsuario  # 👈 donde vivan tus enums

def require_roles(*roles_permitidos: TipoUsuario):
    def role_checker(
        current_user: Usuario = Depends(get_current_user),
    ) -> Usuario:

        if current_user.tipo not in roles_permitidos:
            raise AuthorizationError(
                f"Permisos insuficientes para rol {current_user.tipo}")

        return current_user

    return role_checker

require_superuser = require_roles(
    TipoUsuario.SUPERUSUARIO
)

require_admin = require_roles(
    TipoUsuario.ADMIN,
    TipoUsuario.SUPERUSUARIO,
)

require_editor = require_roles(
    TipoUsuario.EDITOR,
    TipoUsuario.ADMIN,
    TipoUsuario.SUPERUSUARIO,
)

require_lector = require_roles(
    TipoUsuario.LECTOR,
    TipoUsuario.EDITOR,
    TipoUsuario.ADMIN,
    TipoUsuario.SUPERUSUARIO,
)

# Designación de árbitros: exclusivo del admin de árbitros
# (más el superusuario como llave maestra del sistema).
require_arbitros = require_roles(
    TipoUsuario.ADMIN_ARBITROS,
    TipoUsuario.SUPERUSUARIO,
)
