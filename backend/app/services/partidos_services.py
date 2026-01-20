from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
from sqlalchemy import text

from app.models.partido import Partido
from app.models.participan_partido import ParticipanPartido
from app.models.gol import Gol
from app.models.plantel_integrante import PlantelIntegrante


def crear_planilla_partido(db: Session, data, current_user):
    try:
        # =========================
        # 1️⃣ Crear partido
        # =========================
        partido = Partido(**data.partido)
        partido.estado_partido = "BORRADOR"
        partido.creado_por = current_user.username

        db.add(partido)
        db.flush()  # tenemos id_partido

        # =========================
        # 2️⃣ Crear participantes
        # =========================
        participantes_map = {}  # id_plantel_integrante -> id_participante_partido

        ids_participantes = (
            data.participantes.local + data.participantes.visitante
        )

        for id_pi in ids_participantes:
            # validar que exista el integrante
            integrante = db.get(PlantelIntegrante, id_pi)
            if not integrante:
                raise HTTPException(
                    400, f"Plantel integrante {id_pi} inexistente"
                )

            pp = ParticipanPartido(
                id_partido=partido.id_partido,
                id_plantel_integrante=id_pi,
                creado_por=current_user.username,
            )
            db.add(pp)
            db.flush()

            participantes_map[id_pi] = pp.id_participante_partido

        # =========================
        # 3️⃣ Cargar goles
        # =========================
        for g in data.goles:
            id_pp = participantes_map.get(g.id_plantel_integrante)
            if not id_pp:
                raise HTTPException(
                    400,
                    f"El jugador {g.id_plantel_integrante} no participa del partido",
                )

            db.add(
                Gol(
                    id_partido=partido.id_partido,
                    id_participante_partido=id_pp,
                    minuto=g.minuto,
                    cuarto=g.cuarto,
                    creado_por=current_user.username,
                )
            )

        # se dispara el triggers para recalcular posiciones. 
        partido.estado_partido = "TERMINADO"
        db.flush()

        db.commit()
        return partido

    except SQLAlchemyError:
        db.rollback()
        raise
