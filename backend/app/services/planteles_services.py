import logging
from fastapi import HTTPException
from app.models.equipo import Equipo
from backend.app.models.plantel import PlantelEquipo
from app.models.inscripcion_torneo import InscripcionTorneo


def agregar_jugador_a_equipo(db, id_equipo, id_jugador):
    equipo = db.query(Equipo).get(id_equipo)
    if not equipo:
        raise HTTPException(404, "Equipo no encontrado")

    # ¿El jugador ya está en el plantel?
    existe = db.query(PlantelEquipo).filter_by(
        id_equipo=id_equipo,
        id_jugador=id_jugador
    ).first()
    if existe:
        raise HTTPException(400, "El jugador ya está en el plantel")

    # ¿El jugador está inscripto en otro equipo del mismo torneo?
    # Aquí cruzamos plantel → equipo → inscripciones → torneo
    otros_planteles = (
        db.query(PlantelEquipo)
        .join(Equipo)
        .join(InscripcionTorneo)
        .filter(PlantelEquipo.id_jugador == id_jugador)
        .filter(InscripcionTorneo.id_torneo.in_(
            db.query(InscripcionTorneo.id_torneo)
            .filter_by(id_equipo=id_equipo)
        ))
        .all()
    )

    if otros_planteles:
        raise HTTPException(400, "El jugador ya participa en otro equipo del torneo")

    registro = PlantelEquipo(id_equipo=id_equipo, id_jugador=id_jugador)
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro
