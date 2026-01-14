
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.club import Club
from app.schemas.club import ClubCreate, ClubUpdate


def listar_clubes(db: Session) -> list[Club]:
    stmt = select(Club)
    return db.scalars(stmt).all()


def obtener_club(db: Session, id_club: int) -> Club | None:
    return db.get(Club, id_club)


def crear_club(db: Session, data: ClubCreate) -> Club:
    club = Club(**data.model_dump())
    db.add(club)
    db.commit()
    db.refresh(club)
    return club


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

def restaurar_club(db: Session, club: Club):
    club.restore()
    db.commit()
