from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from app.models.inscripcion_torneo import InscripcionTorneo
from app.models.torneo import Torneo
from app.models.equipo import Equipo
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from datetime import datetime

def inscribir_equipo_en_torneo(
    db: Session,
    id_torneo: int,
    id_equipo: int,
    current_user,
) -> InscripcionTorneo:

    inscripcion_activa = (
        db.query(InscripcionTorneo)
        .filter(
            InscripcionTorneo.id_torneo == id_torneo,
            InscripcionTorneo.id_equipo == id_equipo,
            InscripcionTorneo.fecha_baja.is_(None),
        )
        .first()
    )

    if inscripcion_activa:
        raise ValidationError("El equipo ya está inscripto en el torneo")

    inscripcion_baja = (
        db.query(InscripcionTorneo)
        .filter(
            InscripcionTorneo.id_torneo == id_torneo,
            InscripcionTorneo.id_equipo == id_equipo,
            InscripcionTorneo.fecha_baja.isnot(None),
        )
        .first()
    )

    # 🟡 Reactivar
    if inscripcion_baja:
        inscripcion_baja.fecha_baja = None
        inscripcion_baja.actualizado_en = datetime.utcnow()
        inscripcion_baja.actualizado_por = current_user.username

        db.commit()
        db.refresh(inscripcion_baja)
        return inscripcion_baja

    # 🔵 Crear nueva
    nueva = InscripcionTorneo(
        id_torneo=id_torneo,
        id_equipo=id_equipo,
        creado_por=current_user.username,
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return nueva



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
            InscripcionTorneo.fecha_baja.is_(None),
        
        )
        .all()
    )




def dar_de_baja_inscripcion(
    db: Session,
    id_torneo: int,
    id_equipo: int,
    current_user,
) -> InscripcionTorneo:

    inscripcion = (
        db.query(InscripcionTorneo)
        .filter(
            InscripcionTorneo.id_torneo == id_torneo,
            InscripcionTorneo.id_equipo == id_equipo,
            InscripcionTorneo.fecha_baja.is_(None),  # 👈 clave
        )
        .first()
    )

    if not inscripcion:
        raise NotFoundError(
            "La inscripción no existe o ya fue dada de baja"
        )

    inscripcion.fecha_baja = datetime.utcnow()
    inscripcion.actualizado_en = datetime.utcnow()
    inscripcion.actualizado_por = current_user.username

    db.commit()        # 👈 importante
    db.refresh(inscripcion)

    return inscripcion



def listar_inscripciones_por_torneo(db, id_torneo: int):
    query = text("""
        SELECT *
        FROM vw_inscripciones_torneo_detalle
        WHERE id_torneo = :id_torneo
        ORDER BY nombre_club, nombre_equipo
    """)

    result = db.execute(query, {"id_torneo": id_torneo})
    return result.mappings().all()
