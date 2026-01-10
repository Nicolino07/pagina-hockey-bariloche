from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.plantel import PlantelCreate, PlantelRead
from app.schemas.plantel_integrante import PlantelIntegranteCreate, PlantelIntegranteRead
from app.services import planteles_services

router = APIRouter(prefix="/planteles", tags=["Planteles"])


@router.post("/", response_model=PlantelRead)
def crear_plantel(
    data: PlantelCreate,
    db: Session = Depends(get_db)
):
    return planteles_services.crear_plantel(
        db, data.id_equipo, data.id_torneo
    )

@router.post("/{id_plantel}/integrantes", response_model=PlantelIntegranteRead)
def agregar_integrante(
    id_plantel: int,
    data: PlantelIntegranteCreate,
    db: Session = Depends(get_db)
):
    return planteles_services.agregar_integrante(db, id_plantel, data)


@router.delete("/integrantes/{id_integrante}")
def baja_integrante(
    id_integrante: int,
    db: Session = Depends(get_db)
):
    planteles_services.dar_baja_integrante(db, id_integrante)
    return {"ok": True}
