from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.plantel import PlantelCreate, PlantelRead
from app.schemas.plantel_integrante import (
    PlantelIntegranteCreate,
    PlantelIntegranteRead,
)
from app.services import planteles_services
from app.dependencies.permissions import require_admin, require_editor

router = APIRouter(prefix="/planteles", tags=["Planteles"])


# 🔐 ADMIN
@router.post(
    "/",
    response_model=PlantelRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_plantel(
    data: PlantelCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return planteles_services.crear_plantel(
        db, data.id_equipo, data.id_torneo
    )


# 🔐 EDITOR / ADMIN
@router.post(
    "/{id_plantel}/integrantes",
    response_model=PlantelIntegranteRead,
    status_code=status.HTTP_201_CREATED,
)
def agregar_integrante(
    id_plantel: int,
    data: PlantelIntegranteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return planteles_services.agregar_integrante(
        db, id_plantel, data
    )


# 🔐 EDITOR / ADMIN
@router.delete(
    "/integrantes/{id_integrante}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def baja_integrante(
    id_integrante: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    planteles_services.dar_baja_integrante(db, id_integrante)
