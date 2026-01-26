# app/services/vistas_services.py

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from app.models import Plantel, PlantelIntegrante, Persona, Equipo
from app.schemas.vistas import PlantelActivoIntegrante, PersonaConRol
from app.models.enums import RolPersonaTipo

def obtener_plantel_activo_por_equipo(
    db: Session, 
    id_equipo: int,
    solo_activos: bool = True,
    rol_filtro: Optional[RolPersonaTipo] = None,
) -> List[PlantelActivoIntegrante]:

    """
    Obtiene todos los integrantes del plantel activo de un equipo
    
    Args:
        db: Sesión de base de datos
        id_equipo: ID del equipo
        solo_activos: Si True, solo devuelve integrantes sin fecha_baja
        rol_filtro: Filtra por rol específico (ej: "JUGADOR", "ENTRENADOR")
    
    Returns:
        Lista de integrantes del plantel
    """
    query = (
        db.query(
            Plantel.id_equipo.label("id_equipo"),
            Plantel.id_plantel.label("id_plantel"),
            PlantelIntegrante.id_plantel_integrante,
            PlantelIntegrante.rol_en_plantel,
            PlantelIntegrante.numero_camiseta,
            PlantelIntegrante.fecha_alta,
            PlantelIntegrante.fecha_baja,
            Persona.id_persona,
            Persona.nombre,
            Persona.apellido,
            Persona.documento,
        )
        .join(Plantel, Plantel.id_plantel == PlantelIntegrante.id_plantel)
        .join(Persona, Persona.id_persona == PlantelIntegrante.id_persona)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.activo.is_(True),
        )
    )
    
    # Filtrar por activos/inactivos
    if solo_activos:
        query = query.filter(PlantelIntegrante.fecha_baja.is_(None))
    
    # Filtrar por rol específico si se proporciona
    if rol_filtro:
        query = query.filter(PlantelIntegrante.rol_en_plantel == rol_filtro)
    
    resultados = (
        query.order_by(
            PlantelIntegrante.rol_en_plantel,
            Persona.apellido,
            Persona.nombre,
        )
        .all()
    )
    
    # Convertir a objetos Pydantic
    return [
        PlantelActivoIntegrante(**dict(row._asdict())) 
        for row in resultados
    ]


def obtener_personas_con_roles(
    db: Session,
    id_persona: Optional[int] = None,
    rol_actual: Optional[RolPersonaTipo] = None,
    solo_activos: bool = True,
) -> List[PersonaConRol]:

    """
    Obtiene personas con sus roles utilizando la vista vw_persona_roles
    
    Args:
        db: Sesión de base de datos
        id_persona: Filtrar por ID de persona específica
        rol_actual: Filtrar por rol específico
        solo_activos: Si True, solo personas con roles activos
    
    Returns:
        Lista de personas con sus roles
    """
    # Usando la vista directamente
    from sqlalchemy import text
    
    sql = """
    SELECT 
        id_persona,
        nombre,
        apellido,
        documento,
        rol,
        fecha_desde,
        fecha_hasta
    FROM vw_persona_roles
    WHERE 1=1
    """
    
    params = {}
    
    if id_persona:
        sql += " AND id_persona = :id_persona"
        params['id_persona'] = id_persona
    
    if rol_actual:
        sql += " AND rol = :rol_actual"
        params['rol_actual'] = rol_actual
    
    if solo_activos:
        sql += " AND (fecha_hasta IS NULL OR fecha_hasta >= CURRENT_DATE)"
    
    sql += " ORDER BY apellido, nombre"
    
    resultados = db.execute(text(sql), params).fetchall()
    
    return [
        PersonaConRol(
            id_persona=row.id_persona,
            nombre=row.nombre,
            apellido=row.apellido,
            documento=row.documento,
            rol=row.rol,
            fecha_desde=row.fecha_desde,
            fecha_hasta=row.fecha_hasta
        )
        for row in resultados
    ]


def buscar_jugadores_por_nombre(
    db: Session,
    nombre_busqueda: str,
    id_equipo: Optional[int] = None,
    limit: int = 20
) -> List[PlantelActivoIntegrante]:
    """
    Busca jugadores por nombre o apellido
    
    Args:
        db: Sesión de base de datos
        nombre_busqueda: Texto para buscar en nombre o apellido
        id_equipo: Filtrar por equipo específico (opcional)
        limit: Límite de resultados
    
    Returns:
        Lista de jugadores encontrados
    """
    query = (
        db.query(
            Plantel.id_equipo,
            Plantel.id_plantel,
            PlantelIntegrante.id_plantel_integrante,
            PlantelIntegrante.rol_en_plantel,
            PlantelIntegrante.numero_camiseta,
            PlantelIntegrante.fecha_alta,
            PlantelIntegrante.fecha_baja,
            Persona.id_persona,
            Persona.nombre,
            Persona.apellido,
            Persona.documento,
        )
        .join(Plantel, Plantel.id_plantel == PlantelIntegrante.id_plantel)
        .join(Persona, Persona.id_persona == PlantelIntegrante.id_persona)
        .filter(
            Plantel.activo.is_(True),
            PlantelIntegrante.fecha_baja.is_(None),
            PlantelIntegrante.rol_en_plantel == "JUGADOR",
            or_(
                Persona.nombre.ilike(f"%{nombre_busqueda}%"),
                Persona.apellido.ilike(f"%{nombre_busqueda}%"),
                Persona.documento.ilike(f"%{nombre_busqueda}%")
            )
        )
    )
    
    if id_equipo:
        query = query.filter(Plantel.id_equipo == id_equipo)
    
    resultados = (
        query.order_by(
            Persona.apellido,
            Persona.nombre
        )
        .limit(limit)
        .all()
    )
    
    return [
        PlantelActivoIntegrante(**dict(row._asdict()))
        for row in resultados
    ]


def obtener_estadisticas_plantel(
    db: Session,
    id_equipo: int
) -> Dict[str, Any]:
    """
    Obtiene estadísticas del plantel activo
    
    Args:
        db: Sesión de base de datos
        id_equipo: ID del equipo
    
    Returns:
        Diccionario con estadísticas del plantel
    """
    # Contar integrantes por rol
    stats_query = (
        db.query(
            PlantelIntegrante.rol_en_plantel,
            func.count(PlantelIntegrante.id_plantel_integrante).label("cantidad")
        )
        .join(Plantel, Plantel.id_plantel == PlantelIntegrante.id_plantel)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.activo.is_(True),
            PlantelIntegrante.fecha_baja.is_(None)
        )
        .group_by(PlantelIntegrante.rol_en_plantel)
        .all()
    )
    
    # Obtener información del equipo
    equipo = db.query(Equipo).filter(Equipo.id_equipo == id_equipo).first()
    
    # Obtener plantel activo
    plantel_activo = (
        db.query(Plantel)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.activo.is_(True)
        )
        .first()
    )
    
    # Convertir estadísticas a diccionario
    stats_dict = {
        "total_integrantes": 0,
        "por_rol": {},
        "equipo": None,
        "plantel_activo": None
    }
    
    for rol, cantidad in stats_query:
        stats_dict["por_rol"][rol] = cantidad
        stats_dict["total_integrantes"] += cantidad
    
    if equipo:
        stats_dict["equipo"] = {
            "id_equipo": equipo.id_equipo,
            "nombre": equipo.nombre,
            "categoria": equipo.categoria
        }
    
    if plantel_activo:
        stats_dict["plantel_activo"] = {
            "id_plantel": plantel_activo.id_plantel,
            "temporada": plantel_activo.temporada,
            "fecha_inicio": plantel_activo.fecha_inicio,
            "fecha_fin": plantel_activo.fecha_fin
        }
    
    return stats_dict


def obtener_integrantes_por_fecha(
    db: Session,
    id_equipo: int,
    fecha_consulta: date = None
) -> List[PlantelActivoIntegrante]:
    """
    Obtiene integrantes del plantel para una fecha específica
    
    Args:
        db: Sesión de base de datos
        id_equipo: ID del equipo
        fecha_consulta: Fecha para la consulta (default: hoy)
    
    Returns:
        Lista de integrantes activos en esa fecha
    """
    if fecha_consulta is None:
        fecha_consulta = date.today()
    
    query = (
        db.query(
            Plantel.id_equipo,
            Plantel.id_plantel,
            PlantelIntegrante.id_plantel_integrante,
            PlantelIntegrante.rol_en_plantel,
            PlantelIntegrante.numero_camiseta,
            PlantelIntegrante.fecha_alta,
            PlantelIntegrante.fecha_baja,
            Persona.id_persona,
            Persona.nombre,
            Persona.apellido,
            Persona.documento,
        )
        .join(Plantel, Plantel.id_plantel == PlantelIntegrante.id_plantel)
        .join(Persona, Persona.id_persona == PlantelIntegrante.id_persona)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.activo.is_(True),
            # Filtrar por fecha: activos en la fecha de consulta
            PlantelIntegrante.fecha_alta <= fecha_consulta,
            or_(
                PlantelIntegrante.fecha_baja.is_(None),
                PlantelIntegrante.fecha_baja >= fecha_consulta
            )
        )
        .order_by(
            PlantelIntegrante.rol_en_plantel,
            Persona.apellido,
            Persona.nombre
        )
    )
    
    resultados = query.all()
    
    return [
        PlantelActivoIntegrante(**dict(row._asdict()))
        for row in resultados
    ]


# Alias para mantener compatibilidad con código existente
plantel_activo_por_equipo = obtener_plantel_activo_por_equipo