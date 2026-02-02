# app/routers/vistas.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import date, datetime

from app.database import get_db
from app.schemas.vistas import PlantelActivoIntegrante, PersonaConRol
from app.services import vistas_services
from app.models.vistas import ClubPersonaRol
from app.schemas.vistas import ClubPersonaRolOut

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
    description="Devuelve todos los integrantes activos del plantel actual de un equipo específico",
)
def obtener_plantel_activo_por_equipo(
    id_equipo: int,
    rol: Optional[str] = Query(
        None, 
        description="Filtrar por rol específico (ej: 'JUGADOR', 'ENTRENADOR')"
    ),
    activos: bool = Query(
        True, 
        description="Si True, solo muestra integrantes activos (sin fecha de baja)"
    ),
    db: Session = Depends(get_db),
):
    """
    Obtiene el plantel activo de un equipo con filtros opcionales por rol y estado.
    
    - **id_equipo**: ID del equipo
    - **rol**: Filtrar por rol específico
    - **activos**: Mostrar solo integrantes activos
    """
    try:
        if rol:
            result = db.execute(
                text("""
                    SELECT *
                    FROM vw_plantel_activo_integrantes
                    WHERE id_equipo = :id_equipo 
                    AND rol_en_plantel = :rol
                    ORDER BY rol_en_plantel, apellido, nombre
                """),
                {"id_equipo": id_equipo, "rol": rol},
            )
        else:
            result = db.execute(
                text("""
                    SELECT *
                    FROM vw_plantel_activo_integrantes
                    WHERE id_equipo = :id_equipo
                    ORDER BY rol_en_plantel, apellido, nombre
                """),
                {"id_equipo": id_equipo},
            )
        
        resultados = result.mappings().all()
        
        # Filtrar por activos si se solicita
        if activos:
            resultados = [r for r in resultados if r['fecha_baja'] is None]
        
        return resultados
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener el plantel: {str(e)}"
        )


@router.get(
    "/personas-con-roles",
    response_model=List[PersonaConRol],
    summary="Obtener personas con sus roles",
    description="Devuelve todas las personas con sus roles asignados",
)
def obtener_personas_con_roles(
    persona_id: Optional[int] = Query(
        None, 
        alias="id_persona",
        description="Filtrar por ID de persona específica"
    ),
    rol: Optional[str] = Query(
        None, 
        description="Filtrar por rol específico"
    ),
    solo_activos: bool = Query(
        True, 
        description="Mostrar solo personas con roles activos"
    ),
    db: Session = Depends(get_db),
):
    """
    Obtiene personas con sus roles utilizando la vista vw_persona_roles.
    
    - **persona_id**: Filtrar por persona específica
    - **rol**: Filtrar por rol específico
    - **solo_activos**: Mostrar solo roles activos
    """
    try:
        # Construir la consulta dinámicamente
        sql = "SELECT * FROM vw_persona_roles WHERE 1=1"
        params = {}
        
        if persona_id:
            sql += " AND id_persona = :persona_id"
            params['persona_id'] = persona_id
        
        if rol:
            sql += " AND rol = :rol"
            params['rol'] = rol
        
        if solo_activos:
            sql += " AND (fecha_hasta IS NULL OR fecha_hasta >= CURRENT_DATE)"
        
        sql += " ORDER BY apellido, nombre"
        
        result = db.execute(text(sql), params)
        return result.mappings().all()
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener personas con roles: {str(e)}"
        )


@router.get(
    "/buscar-jugadores",
    response_model=List[PlantelActivoIntegrante],
    summary="Buscar jugadores",
    description="Busca jugadores por nombre, apellido o documento",
)


def buscar_jugadores(
    q: str = Query(
        ..., 
        min_length=2,
        description="Texto a buscar en nombre, apellido o documento"
    ),
    id_equipo: Optional[int] = Query(
        None, 
        description="Filtrar por equipo específico"
    ),
    limit: int = Query(
        20, 
        ge=1, 
        le=100,
        description="Límite de resultados (1-100)"
    ),
    db: Session = Depends(get_db),
):
    """
    Busca jugadores activos por nombre, apellido o documento.
    
    - **q**: Texto a buscar (mínimo 2 caracteres)
    - **id_equipo**: Filtrar por equipo específico
    - **limit**: Número máximo de resultados
    """
    try:
        sql = """
            SELECT *
            FROM vw_plantel_activo_integrantes
            WHERE rol_en_plantel = 'JUGADOR'
            AND fecha_baja IS NULL
            AND (nombre ILIKE :q OR apellido ILIKE :q OR documento::TEXT ILIKE :q)
        """
        params = {"q": f"%{q}%"}
        
        if id_equipo:
            sql += " AND id_equipo = :id_equipo"
            params['id_equipo'] = id_equipo
        
        sql += " ORDER BY apellido, nombre LIMIT :limit"
        params['limit'] = limit
        
        result = db.execute(text(sql), params)
        return result.mappings().all()
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la búsqueda: {str(e)}"
        )


@router.get(
    "/equipo/{id_equipo}/estadisticas",
    summary="Estadísticas del plantel",
    description="Obtiene estadísticas del plantel activo de un equipo",
)
def obtener_estadisticas_plantel(
    id_equipo: int,
    db: Session = Depends(get_db),
):
    """
    Devuelve estadísticas del plantel activo de un equipo.
    
    - **id_equipo**: ID del equipo
    """
    try:
        # Obtener total por roles
        sql_roles = """
            SELECT 
                rol_en_plantel,
                COUNT(*) as cantidad
            FROM vw_plantel_activo_integrantes
            WHERE id_equipo = :id_equipo
            AND fecha_baja IS NULL
            GROUP BY rol_en_plantel
            ORDER BY cantidad DESC
        """
        
        result_roles = db.execute(text(sql_roles), {"id_equipo": id_equipo})
        roles_stats = result_roles.mappings().all()
        
        # Obtener información general
        sql_general = """
            SELECT 
                COUNT(DISTINCT id_persona) as total_personas,
                COUNT(*) as total_integrantes,
                MIN(fecha_alta) as fecha_primer_alta,
                MAX(fecha_alta) as fecha_ultima_alta
            FROM vw_plantel_activo_integrantes
            WHERE id_equipo = :id_equipo
            AND fecha_baja IS NULL
        """
        
        result_general = db.execute(text(sql_general), {"id_equipo": id_equipo})
        general_stats = result_general.mappings().first()
        
        return {
            "id_equipo": id_equipo,
            "estadisticas_generales": general_stats,
            "distribucion_por_rol": roles_stats,
            "fecha_consulta": date.today().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )


@router.get(
    "/plantel/{id_equipo}/fecha",
    response_model=List[PlantelActivoIntegrante],
    summary="Plantel en fecha específica",
    description="Obtiene el plantel de un equipo en una fecha específica",
)
def obtener_plantel_por_fecha(
    id_equipo: int,
    fecha: date = Query(
        ..., 
        description="Fecha para consultar el plantel (formato: YYYY-MM-DD)"
    ),
    db: Session = Depends(get_db),
):
    """
    Obtiene los integrantes del plantel que estaban activos en una fecha específica.
    
    - **id_equipo**: ID del equipo
    - **fecha**: Fecha de consulta
    """
    try:
        sql = """
            SELECT *
            FROM vw_plantel_activo_integrantes
            WHERE id_equipo = :id_equipo
            AND fecha_alta <= :fecha
            AND (fecha_baja IS NULL OR fecha_baja >= :fecha)
            ORDER BY rol_en_plantel, apellido, nombre
        """
        
        result = db.execute(
            text(sql), 
            {"id_equipo": id_equipo, "fecha": fecha}
        )
        
        return result.mappings().all()
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener plantel por fecha: {str(e)}"
        )


@router.get(
    "/persona/{id_persona}/historial-equipos",
    summary="Historial de equipos de una persona",
    description="Obtiene el historial de equipos en los que ha estado una persona",
)
def obtener_historial_equipos_persona(
    id_persona: int,
    db: Session = Depends(get_db),
):
    """
    Devuelve el historial completo de equipos en los que ha participado una persona.
    
    - **id_persona**: ID de la persona
    """
    try:
        sql = """
            SELECT 
                DISTINCT id_equipo,
                nombre_equipo,
                categoria,
                MIN(fecha_alta) as primera_fecha,
                MAX(COALESCE(fecha_baja, CURRENT_DATE)) as ultima_fecha,
                STRING_AGG(DISTINCT rol_en_plantel, ', ') as roles_ejercidos
            FROM vw_plantel_activo_integrantes
            WHERE id_persona = :id_persona
            GROUP BY id_equipo, nombre_equipo, categoria
            ORDER BY primera_fecha DESC
        """
        
        result = db.execute(text(sql), {"id_persona": id_persona})
        historial = result.mappings().all()
        
        if not historial:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Persona con ID {id_persona} no encontrada o sin historial"
            )
        
        return {
            "id_persona": id_persona,
            "total_equipos": len(historial),
            "historial": historial
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener historial: {str(e)}"
        )


# Endpoint para probar la conexión a vistas
@router.get(
    "/health-check",
    summary="Verificar estado de las vistas",
    description="Verifica que todas las vistas estén accesibles y funcionando"
)
def health_check_vistas(db: Session = Depends(get_db)):
    """
    Realiza un check de salud de todas las vistas del sistema.
    """
    vistas_a_verificar = [
        "vw_plantel_activo_integrantes",
        "vw_persona_roles"
    ]
    
    resultados = {}
    
    for vista in vistas_a_verificar:
        try:
            db.execute(text(f"SELECT 1 FROM {vista} LIMIT 1"))
            resultados[vista] = {
                "status": "OK",
                "message": "Vista accesible"
            }
        except Exception as e:
            resultados[vista] = {
                "status": "ERROR",
                "message": str(e)
            }
    
    return {
        "timestamp": datetime.now().isoformat(),
        "vistas": resultados,
        "status": "OK" if all(r["status"] == "OK" for r in resultados.values()) else "ERROR"
    }


@router.get(
    "/club/{id_club}/personas",
    response_model=list[ClubPersonaRolOut]
)
def obtener_personas_club(
    id_club: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(ClubPersonaRol)
        .filter(ClubPersonaRol.id_club == id_club)
        .order_by(ClubPersonaRol.apellido)
        .all()
    )
