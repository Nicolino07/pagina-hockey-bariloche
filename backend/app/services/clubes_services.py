from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.club import Club
from app.schemas.club import ClubCreate, ClubUpdate
from app.core.exceptions import NotFoundError, ConflictError


def listar_clubes(db: Session) -> list[Club]:
    stmt = select(Club)
    return db.scalars(stmt).all()


def obtener_club(db: Session, id_club: int) -> Club:
    club = db.get(Club, id_club)
    if not club:
        raise NotFoundError("Club no encontrado")
    return club


def crear_club(db: Session, data: ClubCreate, current_user) -> Club:
    club = Club(**data.model_dump())
    club.creado_por = current_user.username
    db.add(club)
    db.flush()  
    return club


def actualizar_club(
    db: Session,
    club_id: int,
    data: ClubUpdate,
    current_user,
) -> Club:
    club = obtener_club(db, club_id)

    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(club, campo, valor)

    club.actualizado_por = current_user.username
    return club


def dependencias_club(db: Session, club_id: int) -> dict:
    """Cuenta las dependencias que impiden eliminar un club.

    Un club con equipos o fichajes es historia real y no se borra. Solo se puede
    eliminar un club mal cargado (sin nada asociado). No borra nada.
    """
    from app.models.equipo import Equipo
    from app.models.fichaje_rol import FichajeRol

    club = obtener_club(db, club_id)
    equipos = db.query(Equipo).filter(Equipo.id_club == club_id).count()
    fichajes = db.query(FichajeRol).filter(FichajeRol.id_club == club_id).count()

    return {
        "id_club": club_id,
        "nombre": club.nombre,
        "equipos": equipos,
        "fichajes": fichajes,
        "puede_eliminar": equipos == 0 and fichajes == 0,
    }


def eliminar_club(db: Session, club_id: int, current_user) -> dict:
    """Elimina un club de forma DEFINITIVA (solo si está mal cargado / sin datos).

    Si tiene equipos o fichajes, se rechaza: los clubes reales no se borran.
    """
    from app.models.auditoria_log import AuditoriaLog

    dep = dependencias_club(db, club_id)
    if not dep["puede_eliminar"]:
        raise ConflictError(
            f"No se puede eliminar el club '{dep['nombre']}': tiene "
            f"{dep['equipos']} equipos y {dep['fichajes']} fichajes asociados. "
            "Los clubes con historia no se borran."
        )

    db.add(AuditoriaLog(
        tabla_afectada="club",
        id_registro=str(club_id),
        operacion="DELETE",
        valores_anteriores=dep,
        id_usuario=current_user.id_usuario,
    ))
    db.query(Club).filter(Club.id_club == club_id).delete(synchronize_session=False)
    return dep
