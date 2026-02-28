from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from app.core.exceptions import NotFoundError

def cambiar_rol(db: Session, id_usuario: int, nuevo_tipo: str, current_user):
    user = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario
    ).first()

    if not user:
        raise NotFoundError("Usuario no encontrado")

    user.tipo = nuevo_tipo
    user.actualizado_por = current_user.username

    db.commit()
    db.refresh(user)

    return user