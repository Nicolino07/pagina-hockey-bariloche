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


def crear_club(db: Session, club: ClubCreate) -> Club:
    nuevo = Club(**club.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def actualizar_club(
    db: Session,
    club: Club,
    data: ClubUpdate
) -> Club:
    valores = data.model_dump(exclude_unset=True)

    for campo, valor in valores.items():
        setattr(club, campo, valor)

    db.commit()
    db.refresh(club)
    return club


def eliminar_club(db: Session, club: Club):
    club.soft_delete()
    db.commit()

def restaurar_club(
    db: Session,
    club_id: int,
    usuario: str
) -> Club:
    club = (
        db.query(Club)
        .filter(Club.id_club == club_id)
        .one_or_none()
    )

    if not club:
        raise NotFoundError("Club no encontrado")

    if not club.is_deleted:
        raise NotFoundError("El club no está eliminado")

    club.restore(usuario=usuario)
    db.commit()
    db.refresh(club)

    return club