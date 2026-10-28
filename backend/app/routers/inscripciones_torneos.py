"""
Rutas para la gestión de inscripciones de equipos en torneos.
- Listar inscripciones: acceso público.
- Inscribir y dar de baja equipos: rol ADMIN o superior.
Las rutas se montan bajo /torneos/{id_torneo}/inscripciones.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.permissions import require_admin
from app.models.usuario import Usuario
from app.schemas.inscripcion_torneo import (
    InscripcionTorneoAction,
    InscripcionTorneoCreate,
)
from app.services import inscripciones_services
from app.schemas.vistas import InscripcionTorneoDetalle

router = APIRouter(
    prefix="/torneos/{id_torneo}/inscripciones",
    tags=["Inscripciones Torneo"],
)

# 🔓 Público
@router.get(
    "/",
    response_model=list[InscripcionTorneoDetalle]
)
def listar_inscripciones(
    id_torneo: int,
    db: Session = Depends(get_db),
):
    """Devuelve todos los equipos inscriptos en un torneo específico. Acceso público."""
    return inscripciones_services.listar_inscripciones_por_torneo(
        db, id_torneo
    )


# 🔐 ADMIN / SUPERUSUARIO
@router.post(
    "/",
    response_model=InscripcionTorneoAction,
    status_code=status.HTTP_201_CREATED,
)
def inscribir_equipo(
    id_torneo: int,
    data: InscripcionTorneoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Inscribe un equipo en el torneo indicado. Requiere rol ADMIN o superior."""
    return inscripciones_services.inscribir_equipo_en_torneo(
        db=db,
        id_torneo=id_torneo,
        id_equipo=data.id_equipo,
        current_user=current_user,
    )

# 🔐 ADMIN / SUPERUSUARIO
@router.delete(
    "/{id_equipo}/BAJA",
    status_code=status.HTTP_204_NO_CONTENT,
)
def dar_de_baja_inscripcion(
    id_torneo: int,
    id_equipo: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Da de baja la inscripción de un equipo en el torneo. Requiere rol ADMIN o superior."""
    inscripciones_services.dar_de_baja_inscripcion(
        db=db,
        id_torneo=id_torneo,
        id_equipo=id_equipo,
        current_user=current_user,
    )
    db.commit()
