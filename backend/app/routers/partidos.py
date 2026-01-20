from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.permissions import require_admin
from app.models.partido import Partido
from app.schemas.partido import (
    PartidoOut,
    PlanillaPartidoCreate,
)
from app.services.partidos_services import crear_planilla_partido


router = APIRouter(
    prefix="/partidos",
    tags=["Partidos"],
)

# 🔓 Público
@router.get("/", response_model=list[PartidoOut])
def listar_partidos(db: Session = Depends(get_db)):
    return db.query(Partido).all()

@router.get("/{id_partido}", response_model=PartidoOut)
def obtener_partido(id_partido: int, db: Session = Depends(get_db)):
    partido = db.get(Partido, id_partido)
    if not partido:
        raise HTTPException(404, "Partido no encontrado")
    return partido

# 🔐 ADMIN / SUPERUSUARIO
@router.post(
    "/planilla",
    response_model=PartidoOut,
    status_code=status.HTTP_201_CREATED,
)
def crear_planilla(
    data: PlanillaPartidoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return crear_planilla_partido(db, data, current_user)


@router.delete("/{id_partido}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_partido(
    id_partido: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    partido = db.get(Partido, id_partido)
    if not partido:
        raise HTTPException(404, "Partido no encontrado")

    if partido.estado_partido != "BORRADOR":
        raise HTTPException(
            400, "No se puede eliminar un partido terminado"
        )

    db.delete(partido)
    db.commit()
