from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.plantel import Plantel
from app.models.plantel_integrante import PlantelIntegrante
from app.schemas.plantel_integrante import PlantelIntegranteCreate



def crear_plantel(db: Session, id_equipo: int, id_torneo: int) -> Plantel:
    existente = (
        db.query(Plantel)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.id_torneo == id_torneo
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un plantel para ese equipo y torneo"
        )

    plantel = Plantel(
        id_equipo=id_equipo,
        id_torneo=id_torneo
    )

    db.add(plantel)
    db.commit()
    db.refresh(plantel)
    return plantel


def agregar_integrante(
    db: Session,
    id_plantel: int,
    data: PlantelIntegranteCreate
) -> PlantelIntegrante:

    # Validar que no esté activo ya
    existente = (
        db.query(PlantelIntegrante)
        .filter(
            PlantelIntegrante.id_plantel == id_plantel,
            PlantelIntegrante.id_persona == data.id_persona,
            PlantelIntegrante.rol_en_plantel == data.rol_en_plantel,
            PlantelIntegrante.fecha_baja.is_(None)
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=400,
            detail="La persona ya está activa en el plantel con ese rol"
        )

    integrante = PlantelIntegrante(
        id_plantel=id_plantel,
        id_persona=data.id_persona,
        rol_en_plantel=data.rol_en_plantel,
        numero_camiseta=data.numero_camiseta
    )

    db.add(integrante)
    db.commit()
    db.refresh(integrante)
    return integrante


def dar_baja_integrante(db: Session, id_integrante: int):
    integrante = db.get(PlantelIntegrante, id_integrante)

    if not integrante or integrante.fecha_baja is not None:
        raise HTTPException(404, "Integrante no encontrado o ya dado de baja")

    integrante.fecha_baja = date.today()
    db.commit()


def obtener_plantel(db: Session, id_plantel: int) -> Plantel:
    plantel = db.get(Plantel, id_plantel)
    if not plantel:
        raise HTTPException(404, "Plantel no encontrado")
    return plantel
