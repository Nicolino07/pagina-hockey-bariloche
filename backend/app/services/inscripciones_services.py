from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.inscripcion_torneo import InscripcionTorneo
from app.models.torneo import Torneo
from app.models.equipo import Equipo
from app.core.exceptions import ConflictError, NotFoundError, ValidationError


def inscribir_equipo_en_torneo(
    db: Session,
    id_torneo: int,
    id_equipo: int,
    current_user,
) -> InscripcionTorneo:

    torneo = db.get(Torneo, id_torneo)
    if not torneo:
        raise NotFoundError("El torneo no existe")

    equipo = db.get(Equipo, id_equipo)
    if not equipo:
        raise NotFoundError("El equipo no existe")

    # Regla CLAVE
    if equipo.genero != torneo.genero:
        raise ValidationError(
            "El género del equipo no coincide con el del torneo"
        )

    inscripcion = InscripcionTorneo(
        id_torneo=id_torneo,
        id_equipo=id_equipo,
        creado_por=current_user.username,
    )

    db.add(inscripcion)

    try:
        db.flush()
    except IntegrityError:
        raise ConflictError(
            "El equipo ya está inscripto en este torneo"
        )

    return inscripcion

def listar_inscripciones_por_torneo(
    db: Session,
    id_torneo: int,
) -> list[InscripcionTorneo]:

    torneo = db.get(Torneo, id_torneo)
    if not torneo:
        raise NotFoundError("El torneo no existe")

    return (
        db.query(InscripcionTorneo)
        .filter(
            InscripcionTorneo.id_torneo == id_torneo,
            InscripcionTorneo.borrado_en.is_(None),
        )
        .all()
    )
