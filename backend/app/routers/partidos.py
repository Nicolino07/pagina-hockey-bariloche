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
from app.dependencies.permissions import require_editor, require_superuser
from app.schemas.partido import PartidoBase, PartidoDetalle
from app.schemas.planilla_partido import PlanillaPartidoCreate, PartidoEdicionResponse

from app.services.partidos_services import (
    crear_planilla_partido,
    get_partido_by_id,
    get_ultimos_partidos,
    get_historial_por_equipo,
    get_partido_edicion,
    actualizar_planilla_partido,
    eliminar_partido_service,
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


# 🔐 SUPERUSUARIO
@router.delete("/{id_partido}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_partido(
    id_partido: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_superuser),
):
    """
    Elimina un partido y todos sus datos asociados (goles, tarjetas, participantes).
    Si estaba TERMINADO, recalcula la tabla de posiciones del torneo. Requiere rol SUPERUSUARIO.
    """
    eliminar_partido_service(db, id_partido)


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


# 🔐 EDITOR / ADMIN / SUPERUSUARIO
@router.get("/planilla/{id_partido}/editar", response_model=PartidoEdicionResponse)
def obtener_planilla_para_editar(
    id_partido: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """
    Obtiene los datos estructurados de un partido para precarga en modo edición.
    Incluye participantes (separados local/visitante), goles y tarjetas.
    Requiere rol EDITOR o superior.
    """
    return get_partido_edicion(db, id_partido)


@router.put("/planilla/{id_partido}", response_model=PartidoBase)
def actualizar_planilla(
    id_partido: int,
    data: PlanillaPartidoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """
    Actualiza la planilla completa de un partido existente.
    Borra y recrea participantes, goles y tarjetas.
    Mantiene el id_partido para preservar referencias (como fixture_partido).
    Requiere rol EDITOR o superior.
    """
    return actualizar_planilla_partido(db, id_partido, data, current_user)