from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.club import Club
from app.schemas.club import ClubCreate, ClubUpdate
from app.core.exceptions import NotFoundError


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


def eliminar_club(db: Session, club_id: int, current_user) -> None:
    club = obtener_club(db, club_id)
    club.soft_delete(usuario=current_user.username)


def restaurar_club(db: Session, club_id: int, current_user) -> Club:
    club = obtener_club(db, club_id)
    club.restore(usuario=current_user.username)
    return club
