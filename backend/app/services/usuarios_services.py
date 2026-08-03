from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from app.models.enums import TipoUsuario
from app.core.exceptions import NotFoundError, AuthorizationError

def cambiar_rol(db: Session, id_usuario: int, nuevo_tipo: str, current_user):
    user = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario
    ).first()

    if not user:
        raise NotFoundError("Usuario no encontrado")

    if user.tipo == TipoUsuario.SUPERUSUARIO and nuevo_tipo != TipoUsuario.SUPERUSUARIO:
        raise AuthorizationError("No se puede modificar el rol de un SUPERUSUARIO")

    user.tipo = nuevo_tipo
    user.actualizado_por = current_user.username

    db.commit()
    db.refresh(user)

    return user