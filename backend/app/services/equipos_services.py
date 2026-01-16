from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.schemas.equipo import EquipoCreate, EquipoUpdate
from app.core.exceptions import NotFoundError


def listar_equipos(db: Session, nombre: str | None = None):
    query = db.query(Equipo)

    if nombre:
        query = query.filter(Equipo.nombre.ilike(f"%{nombre}%"))

    return query.all()


def obtener_equipo(db: Session, equipo_id: int) -> Equipo:
    equipo = db.query(Equipo).filter(Equipo.id_equipo == equipo_id).first()
    if not equipo:
        raise NotFoundError("Equipo no encontrado")

    return equipo


def crear_equipo(db: Session, data: EquipoCreate) -> Equipo:
    equipo = Equipo(**data.model_dump())
    db.add(equipo)
    db.commit()
    db.refresh(equipo)
    return equipo


def actualizar_equipo(
    db: Session,
    equipo_id: int,
    data: EquipoUpdate,
) -> Equipo:
    equipo = obtener_equipo(db, equipo_id)

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(equipo, key, value)

    db.commit()
    db.refresh(equipo)
    return equipo


def eliminar_equipo(db: Session, equipo_id: int) -> None:
    equipo = obtener_equipo(db, equipo_id)
    db.delete(equipo)
    db.commit()
