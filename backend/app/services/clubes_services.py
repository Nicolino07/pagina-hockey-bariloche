
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.club import Club
from app.schemas.club import ClubCreate, ClubUpdate


def listar_clubes(db: Session) -> list[Club]:
    stmt = select(Club)
    return db.scalars(stmt).all()


def obtener_club(db: Session, id_club: int) -> Club | None:
    return db.get(Club, id_club)


def crear_club(db: Session, club: ClubCreate):
    nuevo = Club(**club.model_dump())
    db.add(nuevo)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un club con ese nombre en esa ciudad"
        )

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

def restaurar_club(db: Session, club: Club):
    club.restore()
    db.commit()
