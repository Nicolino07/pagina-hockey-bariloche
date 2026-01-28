# backend/app/routers/planteles.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from fastapi import Request, Response

from app.database import get_db
from app.schemas.plantel import PlantelCreate, PlantelRead
from app.schemas.plantel_integrante import (
    PlantelIntegranteCreate,
    PlantelIntegranteRead,
)
from app.services import planteles_services
from app.dependencies.permissions import require_admin, require_editor
from app.core.exceptions import NotFoundError

router = APIRouter(
    prefix="/planteles",
    tags=["Planteles - Integrantes"]
)

@router.options("/integrantes")
async def options_integrantes(request: Request):
    return Response(status_code=204)

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
        db,
        data.id_equipo,
        current_user,
    )

# 🔐 EDITOR / ADMIN
@router.post(
    "/integrantes",
    response_model=PlantelIntegranteRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_integrante(
    data: PlantelIntegranteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return planteles_services.crear_integrante(
        db=db,
        data=data,
        current_user=current_user,
    )



@router.get(
    "/activo/{id_equipo}",
    response_model=PlantelRead,
    status_code=status.HTTP_200_OK,
)
def obtener_plantel_activo(
    id_equipo: int,
    db: Session = Depends(get_db),
):
    plantel = planteles_services.obtener_plantel_activo_por_equipo(db, id_equipo)

    if not plantel:
        raise NotFoundError("El equipo no tiene plantel activo")

    return plantel

@router.get(
    "/{id_plantel}/integrantes",
    response_model=list[PlantelIntegranteRead],
)
def listar_integrantes(
    id_plantel: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return planteles_services.listar_integrantes_por_plantel(
        db=db,
        id_plantel=id_plantel,
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
    planteles_services.baja_integrante(
        db=db,
        id_integrante=id_integrante,
        current_user=current_user,
    )
