"""
Rutas para la gestión de partidos del torneo.
- Lectura de partidos recientes e historial por equipo: acceso público.
- Carga de planilla completa: rol EDITOR o superior.
- Eliminación de partidos en borrador: rol ADMIN o superior.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.dependencies.permissions import require_admin, require_editor
from app.models.partido import Partido
from app.schemas.partido import PartidoBase, PartidoDetalle
from app.schemas.planilla_partido import PlanillaPartidoCreate

from app.services.partidos_services import (
    crear_planilla_partido,
    get_partido_by_id,
    get_ultimos_partidos,
    get_historial_por_equipo,
)

router = APIRouter(
    prefix="/partidos",
    tags=["Partidos"],
)


@router.get("/recientes")
def listar_partidos_recientes(
    torneo_id: int = Query(None),
    db: Session = Depends(get_db)
):
    """
    Devuelve los partidos más recientes.
    Se puede filtrar por torneo con el parámetro `torneo_id`. Acceso público.
    """
    partidos = get_ultimos_partidos(db, torneo_id=torneo_id)
    return partidos

@router.get("/{partido_id}")
def detalle_partido(partido_id: int, db: Session = Depends(get_db)):
    """Devuelve el detalle completo de un partido por su ID. Acceso público."""
    partido = get_partido_by_id(db, partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    return partido

# 🔐 EDITOR / ADMIN / SUPERUSUARIO
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
    """
    Carga la planilla completa de un partido (resultado, goles, tarjetas).
    Requiere rol EDITOR o superior.
    """
    return crear_planilla_partido(db, data, current_user)


# 🔐 ADMIN / SUPERUSUARIO
@router.delete("/{id_partido}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_partido(
    id_partido: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """
    Elimina un partido siempre que esté en estado BORRADOR.
    No se permite eliminar partidos ya terminados. Requiere rol ADMIN o superior.
    """
    partido = db.get(Partido, id_partido)
    if not partido:
        raise HTTPException(404, "Partido no encontrado")

    if partido.estado_partido != "BORRADOR":
        raise HTTPException(
            400, "No se puede eliminar un partido terminado"
        )

    db.delete(partido)
    db.commit()


@router.get("/equipos/{id_equipo}", response_model=List[PartidoDetalle])
def listar_historial_equipo(
    id_equipo: int,
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    """
    Devuelve los últimos N partidos disputados por un equipo.
    El parámetro `limit` controla la cantidad de resultados (por defecto 10).
    Acceso público.
    """
    partidos = get_historial_por_equipo(db, id_equipo=id_equipo, limit=limit)
    if not partidos:
        return []
    return partidos