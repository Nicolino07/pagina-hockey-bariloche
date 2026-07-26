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


def dependencias_equipo(db: Session, equipo_id: int) -> dict:
    """Cuenta las dependencias que impiden eliminar un equipo.

    Un equipo con planteles, inscripciones, partidos o posiciones es historia real
    y no se borra. Solo se puede eliminar un equipo mal cargado. No borra nada.
    """
    from app.models.plantel import Plantel
    from app.models.partido import Partido
    from app.models.posicion import Posicion
    from sqlalchemy import or_

    equipo = obtener_equipo(db, equipo_id)

    planteles = db.query(Plantel).filter(Plantel.id_equipo == equipo_id).count()
    inscripciones = db.query(InscripcionTorneo).filter(
        InscripcionTorneo.id_equipo == equipo_id
    ).count()
    partidos = db.query(Partido).filter(
        or_(
            Partido.id_equipo_local == equipo_id,
            Partido.id_equipo_visitante == equipo_id,
        )
    ).count()
    posiciones = db.query(Posicion).filter(Posicion.id_equipo == equipo_id).count()

    return {
        "id_equipo": equipo_id,
        "nombre": equipo.nombre,
        "planteles": planteles,
        "inscripciones": inscripciones,
        "partidos": partidos,
        "posiciones": posiciones,
        "puede_eliminar": (
            planteles == 0 and inscripciones == 0
            and partidos == 0 and posiciones == 0
        ),
    }


def eliminar_equipo(db: Session, equipo_id: int, current_user) -> dict:
    """Elimina un equipo de forma DEFINITIVA (solo si está mal cargado / sin datos).

    Si tiene planteles, inscripciones, partidos o posiciones, se rechaza: los
    equipos con historia no se borran.
    """
    from app.models.auditoria_log import AuditoriaLog

    dep = dependencias_equipo(db, equipo_id)
    if not dep["puede_eliminar"]:
        raise ConflictError(
            f"No se puede eliminar el equipo '{dep['nombre']}': tiene "
            f"{dep['planteles']} planteles, {dep['inscripciones']} inscripciones, "
            f"{dep['partidos']} partidos y {dep['posiciones']} posiciones asociadas. "
            "Los equipos con historia no se borran."
        )

    db.add(AuditoriaLog(
        tabla_afectada="equipo",
        id_registro=str(equipo_id),
        operacion="DELETE",
        valores_anteriores=dep,
        id_usuario=current_user.id_usuario,
    ))
    db.query(Equipo).filter(Equipo.id_equipo == equipo_id).delete(synchronize_session=False)
    return dep
