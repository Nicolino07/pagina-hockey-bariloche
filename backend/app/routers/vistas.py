# app/routers/vistas.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import date, datetime

from app.database import get_db
from app.schemas.vistas import (
    PlantelActivoIntegrante, 
    PersonasArbitro, 
    PosicionSchema, 
    TarjetaDetalle,
    TarjetaAcumulada,
    GoleadorTorneo
)



router = APIRouter(
    prefix="/vistas",
    tags=["Vistas"],
    responses={
        404: {"description": "Recurso no encontrado"},
        500: {"description": "Error interno del servidor"}
    }
)


@router.get(
    "/plantel-activo/{id_equipo}",
    response_model=List[PlantelActivoIntegrante],
    summary="Obtener plantel activo de un equipo",
    description="Devuelve el plantel activo actual. Si el plantel existe pero no tiene jugadores, devuelve una fila con datos de persona nulos.",
)
def obtener_plantel_activo_por_equipo(
    id_equipo: int,
    rol: Optional[str] = Query(None, description="Filtrar por rol (JUGADOR, ENTRENADOR, etc.)"),
    db: Session = Depends(get_db),
):
    try:
        # Usamos la nueva vista maestra
        # Filtramos por plantel_activo = true y que no esté borrado
        query = """
            SELECT *
            FROM vw_plantel_detallado
            WHERE id_equipo = :id_equipo 
            AND plantel_activo = true
        """
        params = {"id_equipo": id_equipo}

        if rol:
            query += " AND (rol_en_plantel = :rol OR rol_en_plantel IS NULL)"
            params["rol"] = rol

        query += " ORDER BY rol_en_plantel, apellido_persona, nombre_persona"
        
        result = db.execute(text(query), params)
        resultados = result.mappings().all()

        # Si no hay absolutamente nada, el equipo ni siquiera tiene un plantel creado
        if not resultados:
            return []

        return resultados
        
    except Exception as e:
        print(f"Error en DB: {e}") # Debug para consola
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener el plantel detallado: {str(e)}"
        )
    
@router.get(
    "/persona-arbitro/",
    response_model=List[PersonasArbitro],
    summary="Obtener arbitros activos",
    description="Devuelve todos los arbitros activos",
)
def obtener_arbitros(
    db: Session = Depends(get_db),
):
    # Aquí debes consultar la vista de la base de datos
    # Asumiendo que tu vista se llama "vista_arbitros_activos"
    arbitros = db.execute(
        text("SELECT * FROM vista_arbitros_activos")
    ).fetchall()
    
    # O si usas SQLAlchemy ORM con un modelo mapeado a la vista:
    # arbitros = db.query(VistaArbitros).all()
    
    return arbitros

@router.get("/torneos/{id_torneo}/posiciones", response_model=List[PosicionSchema])
def get_tabla_posiciones(id_torneo: int, db: Session = Depends(get_db)):
    try:
        # Consultamos la vista directamente
        query = text("""
            SELECT * FROM vw_tabla_posiciones 
            WHERE id_torneo = :id_torneo
        """)
        
        result = db.execute(query, {"id_torneo": id_torneo}).mappings().all()
        
        if not result:
            return [] # O podrías lanzar una 404 si el torneo no existe
            
        return result
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener la tabla")
    

@router.get("/tarjetas/", response_model=List[TarjetaDetalle])
def get_tarjetas_filtradas(
    id_torneo: Optional[int] = None,
    id_equipo: Optional[int] = None,
    id_persona: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Base de la consulta
    query_str = "SELECT * FROM vw_tarjetas_detalle_torneo WHERE 1=1"
    params = {}

    # Filtros dinámicos
    if id_torneo:
        query_str += " AND id_torneo = :id_torneo"
        params["id_torneo"] = id_torneo
    
    if id_equipo:
        query_str += " AND id_equipo = :id_equipo"
        params["id_equipo"] = id_equipo

    if id_persona:
        query_str += " AND id_persona = :id_persona"
        params["id_persona"] = id_persona

    # Orden predeterminado por fecha de partido
    query_str += " ORDER BY fecha_partido DESC"

    result = db.execute(text(query_str), params).mappings().all()
    return result


@router.get("/tarjetas-acumuladas", response_model=List[TarjetaAcumulada])
def get_tarjetas_acumuladas(
    id_torneo: Optional[int] = None,
    id_equipo: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query_str = "SELECT * FROM vw_tarjetas_acumuladas_torneo WHERE 1=1"
    params = {}

    if id_torneo:
        query_str += " AND id_torneo = :id_torneo"
        params["id_torneo"] = id_torneo
    
    if id_equipo:
        query_str += " AND id_equipo = :id_equipo"
        params["id_equipo"] = id_equipo

    # Ordenamos por las más graves primero
    query_str += " ORDER BY total_rojas DESC, total_amarillas DESC"

    result = db.execute(text(query_str), params).mappings().all()
    return result


@router.get("/goleadores/{id_torneo}", response_model=List[GoleadorTorneo])
def get_goleadores_torneo(id_torneo: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT * FROM v_goleadores_torneo 
        WHERE id_torneo = :id_torneo 
        ORDER BY goles_netos_en_torneo DESC
        LIMIT 10
    """)
    result = db.execute(query, {"id_torneo": id_torneo}).mappings().all()
    return result