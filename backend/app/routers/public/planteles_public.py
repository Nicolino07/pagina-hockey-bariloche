from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.plantel import Plantel, PlantelIntegrante
from app.schemas.plantel import (
    PlantelResponse,
    PlantelIntegranteResponse
)


router = APIRouter(prefix="/public/plantel", tags=["Plantel Público"])


# ============================
#  PLANTELES
# ============================


@router.get("/", response_model=list[PlantelResponse])
def listar_planteles(db: Session = Depends(get_db)):
    return db.query(Plantel).all()


# ============================
#  INTEGRANTES DEL PLANTEL
# ============================


@router.get("/{id_plantel}/integrantes", response_model=list[PlantelIntegranteResponse])
def listar_integrantes(id_plantel: int, db: Session = Depends(get_db)):
    return (
        db.query(PlantelIntegrante)
        .filter(PlantelIntegrante.id_plantel == id_plantel)
        .all()
    )

