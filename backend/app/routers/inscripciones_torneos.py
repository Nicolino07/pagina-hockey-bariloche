from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.permissions import require_admin
from app.models.usuario import Usuario
from app.schemas.inscripcion_torneo import (
    InscripcionTorneo,
    InscripcionTorneoCreate,
)
from app.services import inscripciones_services


router = APIRouter(
    prefix="/torneos/{id_torneo}/inscripciones",
    tags=["Inscripciones Torneo"],
)


@router.get("/", response_model=list[InscripcionTorneo])
def listar_inscripciones(
    id_torneo: int,
    db: Session = Depends(get_db),
):
    return inscripciones_services.listar_inscripciones_por_torneo(
        db, id_torneo
    )

@router.post(
    "/",
    response_model=InscripcionTorneo,
    status_code=status.HTTP_201_CREATED,
)
def inscribir_equipo(
    id_torneo: int,
    data: InscripcionTorneoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    return inscripciones_services.inscribir_equipo_en_torneo(
        db=db,
        id_torneo=id_torneo,
        id_equipo=data.id_equipo,
        current_user=current_user,
    )


@router.delete("/{id_inscripcion}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_inscripcion(
    id_torneo: int,
    id_inscripcion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    inscripciones_services.eliminar_inscripcion(
        db, id_torneo, id_inscripcion
    )
