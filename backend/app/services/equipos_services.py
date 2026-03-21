from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.models.inscripcion_torneo import InscripcionTorneo
from app.models.torneo import Torneo
from app.schemas.equipo import EquipoCreate, EquipoUpdate
from app.core.exceptions import NotFoundError, ConflictError


def listar_equipos(
        db: Session, 
        nombre: str | None = None, 
        id_club: int | None = None,
        ) -> list[Equipo]:
    
    query = db.query(Equipo)

    query = db.query(Equipo).filter(Equipo.borrado_en.is_(None))

    if nombre:
        query = query.filter(Equipo.nombre.ilike(f"%{nombre}%"))

    if id_club:
        query = query.filter(Equipo.id_club == id_club)

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

    campos = data.model_dump(exclude_unset=True)

    # Si se intenta cambiar categoría o género (valores realmente distintos), verificar que no haya torneos activos
    categoria_cambia = "categoria" in campos and campos["categoria"] != equipo.categoria
    genero_cambia = "genero" in campos and campos["genero"] != equipo.genero
    if categoria_cambia or genero_cambia:
        inscripcion_activa = (
            db.query(InscripcionTorneo)
            .join(Torneo, InscripcionTorneo.id_torneo == Torneo.id_torneo)
            .filter(
                InscripcionTorneo.id_equipo == equipo_id,
                InscripcionTorneo.fecha_baja.is_(None),
                Torneo.activo.is_(True),
                Torneo.borrado_en.is_(None),
            )
            .first()
        )
        if inscripcion_activa:
            raise ConflictError(
                f"No se puede modificar la categoría o género del equipo '{equipo.nombre}' "
                "porque tiene inscripciones activas en torneos en curso."
            )

    for key, value in campos.items():
        setattr(equipo, key, value)

    equipo.actualizado_por = current_user.username

    return equipo


def eliminar_equipo(db: Session, equipo_id: int, current_user) -> None:
    """Elimina lógicamente un equipo. Bloquea si tiene inscripciones en torneos activos."""
    equipo = obtener_equipo(db, equipo_id)

    inscripcion_activa = (
        db.query(InscripcionTorneo)
        .join(Torneo, InscripcionTorneo.id_torneo == Torneo.id_torneo)
        .filter(
            InscripcionTorneo.id_equipo == equipo_id,
            InscripcionTorneo.fecha_baja.is_(None),
            Torneo.activo.is_(True),
            Torneo.borrado_en.is_(None),
        )
        .first()
    )

    if inscripcion_activa:
        raise ConflictError(
            f"El equipo '{equipo.nombre}' tiene inscripciones activas en torneos en curso. "
            "Finalizá los torneos antes de eliminar el equipo."
        )

    equipo.soft_delete(usuario=current_user.username)


def restaurar_equipo(db: Session, equipo_id: int, current_user) -> Equipo:
    equipo = db.get(Equipo, equipo_id)
    if not equipo:
        raise NotFoundError("Equipo no encontrado")

    equipo.restore(usuario=current_user.username)

    return equipo
