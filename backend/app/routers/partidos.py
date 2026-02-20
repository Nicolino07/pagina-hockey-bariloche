from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.permissions import require_admin, require_editor
from app.models.partido import Partido
from app.schemas.partido import PartidoBase
from app.schemas.planilla_partido import PlanillaPartidoCreate
from app.services.partidos_services import crear_planilla_partido, get_partido_by_id, get_ultimos_partidos

router = APIRouter(
    prefix="/partidos",
    tags=["Partidos"],
)


@router.get("/recientes")
def listar_partidos_recientes(
    torneo_id: int = Query(None), 
    db: Session = Depends(get_db)
):
    partidos = get_ultimos_partidos(db, torneo_id=torneo_id)
    return partidos

@router.get("/{partido_id}")
def detalle_partido(partido_id: int, db: Session = Depends(get_db)):
    partido = get_partido_by_id(db, partido_id)
    if not partido:
        return {"error": "Partido no encontrado"}, 404
    return partido

# 🔐 ADMIN/ EDITOR – carga de planilla completa
@router.post(
    "/planilla",
    response_model=PartidoBase,
    status_code=status.HTTP_201_CREATED,
)
def crear_planilla(
    data: PlanillaPartidoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
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
