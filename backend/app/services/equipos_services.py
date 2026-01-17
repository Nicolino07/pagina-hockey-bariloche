from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.schemas.equipo import EquipoCreate, EquipoUpdate
from app.core.exceptions import NotFoundError


def listar_equipos(db: Session, nombre: str | None = None) -> list[Equipo]:
    query = db.query(Equipo)

    if nombre:
        query = query.filter(Equipo.nombre.ilike(f"%{nombre}%"))

    return query.all()


def obtener_equipo(db: Session, equipo_id: int) -> Equipo:
    equipo = db.query(Equipo).filter(Equipo.id_equipo == equipo_id).first()
    if not equipo:
        raise NotFoundError("Equipo no encontrado")

    return equipo


def crear_equipo(db: Session, data: EquipoCreate, current_user) -> Equipo:
    equipo = Equipo(**data.model_dump())
    equipo.creado_por = current_user.username

    db.add(equipo)
    db.flush()  # 🔥 necesario para id_equipo / creado_en

    return equipo


def actualizar_equipo(
    db: Session,
    equipo_id: int,
    data: EquipoUpdate,
    current_user,
) -> Equipo:
    equipo = obtener_equipo(db, equipo_id)

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(equipo, key, value)

    equipo.actualizado_por = current_user.username

    return equipo


def eliminar_equipo(db: Session, equipo_id: int, current_user) -> None:
    equipo = obtener_equipo(db, equipo_id)
    equipo.soft_delete(usuario=current_user.username)


def restaurar_equipo(db: Session, equipo_id: int, current_user) -> Equipo:
    equipo = db.get(Equipo, equipo_id)
    if not equipo:
        raise NotFoundError("Equipo no encontrado")

    equipo.restore(usuario=current_user.username)

    return equipo
