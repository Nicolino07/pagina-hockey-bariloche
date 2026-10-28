"""
Rutas para la designación de árbitros.

Toda la sección es exclusiva del rol ADMIN_ARBITROS (más el superusuario como
llave maestra), a través de la dependencia require_arbitros.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.permissions import require_arbitros
from app.schemas.partido import (
    ArbitroDisponible,
    DesignarArbitrosRequest,
    PartidoDesignable,
)
from app.services.arbitros_services import (
    designar_arbitros,
    listar_arbitros_para_partido,
    listar_partidos_designables,
)

router = APIRouter(
    prefix="/arbitros",
    tags=["Árbitros"],
)


@router.get("/partidos-designables", response_model=List[PartidoDesignable])
def partidos_designables(
    torneo_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_arbitros),
):
    """
    Lista los partidos en estado BORRADOR/PENDIENTE candidatos a designación.
    Se puede filtrar por torneo con `torneo_id`. Requiere rol ADMIN_ARBITROS.
    """
    return listar_partidos_designables(db, torneo_id=torneo_id)


@router.get(
    "/partidos/{id_partido}/disponibles",
    response_model=List[ArbitroDisponible],
)
def arbitros_disponibles(
    id_partido: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_arbitros),
):
    """
    Lista las personas con rol ARBITRO vigente y si están disponibles para
    arbitrar el partido, con el motivo cuando no lo están. Requiere rol ADMIN_ARBITROS.
    """
    return listar_arbitros_para_partido(db, id_partido)


@router.put("/partidos/{id_partido}")
def designar(
    id_partido: int,
    data: DesignarArbitrosRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_arbitros),
):
    """
    Designa (o quita, enviando null) los árbitros de un partido.
    Valida las reglas de club propio y torneo propio. Requiere rol ADMIN_ARBITROS.
    """
    partido = designar_arbitros(db, id_partido, data, current_user)
    return {
        "id_partido": partido.id_partido,
        "id_arbitro1": partido.id_arbitro1,
        "id_arbitro2": partido.id_arbitro2,
    }
