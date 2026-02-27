from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models.partido import Partido
from app.models.gol import Gol
from app.models.tarjeta import Tarjeta

router = APIRouter(prefix="/stats", tags=["Estadísticas"])

@router.get("/global")
def obtener_estadisticas_globales(
    anio: int = Query(None),
    torneo_id: int = Query(None),
    db: Session = Depends(get_db)
):
    # Query base para partidos
    query_partidos = db.query(Partido).filter(Partido.estado_partido == 'TERMINADO')
    query_goles = db.query(Gol)
    
    # Filtro por Año
    if anio:
        query_partidos = query_partidos.filter(extract('year', Partido.fecha) == anio)
        # Para goles, filtramos los que pertenecen a esos partidos
        query_goles = query_goles.join(Partido).filter(extract('year', Partido.fecha) == anio)

    # Filtro por Torneo
    if torneo_id:
        query_partidos = query_partidos.filter(Partido.id_torneo == torneo_id)
        query_goles = query_goles.filter(Gol.id_partido.in_(
            db.query(Partido.id_partido).filter(Partido.id_torneo == torneo_id)
        ))

    return {
        "partidos_totales": query_partidos.count(),
        "goles_totales": query_goles.count(),
        # Puedes agregar más contadores fácilmente:
        "tarjetas_totales": db.query(Tarjeta).count() if not torneo_id else "..." 
    }