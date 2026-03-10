"""
Rutas para la gestión de planteles e integrantes de equipos.
- Lectura de plantel activo e integrantes: acceso público.
- Creación de plantel: rol ADMIN o superior.
- Alta/baja de integrantes: rol EDITOR o superior.
"""
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
from app.dependencies.permissions import require_admin

router = APIRouter(
    prefix="/planteles",
    tags=["Planteles - Integrantes"]
)

# 🔐 ADMIN / SUPERUSUARIO
@router.options("/integrantes")
async def options_integrantes(request: Request):
    """Responde a solicitudes OPTIONS de preflight CORS para la ruta de integrantes."""
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
    """Crea un nuevo plantel para un equipo. Requiere rol ADMIN o superior."""
    return planteles_services.crear_plantel(
        db=db,
        data=data,
        current_user=current_user,
    )


# 🔐 ADMIN / SUPERUSUARIO
@router.post(
    "/integrantes",
    response_model=PlantelIntegranteRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_integrante(
    data: PlantelIntegranteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Agrega un integrante al plantel activo de un equipo. Requiere rol EDITOR o superior."""
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
    """Devuelve el plantel activo de un equipo por su ID. Acceso público."""
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
):
    """Devuelve la lista de integrantes de un plantel específico. Acceso público."""
    return planteles_services.listar_integrantes_por_plantel(
        db=db,
        id_plantel=id_plantel,
    )


# 🔐 ADMIN / SUPERUSUARIO
@router.delete(
    "/integrantes/{id_integrante}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def baja_integrante(
    id_integrante: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Da de baja a un integrante del plantel. Requiere rol EDITOR o superior."""
    planteles_services.baja_integrante(
        db=db,
        id_integrante=id_integrante,
        current_user=current_user,
    )
