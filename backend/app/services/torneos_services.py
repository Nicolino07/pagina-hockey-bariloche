# app/services/torneos_services.py
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.models.torneo import Torneo
from app.schemas.torneo import TorneoCreate
from app.models.enums import CategoriaTipo, GeneroTipo
from app.core.exceptions import NotFoundError, ConflictError


def crear_torneo(
    db: Session,
    data: TorneoCreate,
    current_user,
) -> Torneo:
    """Crea un nuevo torneo"""
    # Validar que el torneo no exista ya
    torneo_existente = db.query(Torneo).filter(
        Torneo.nombre == data.nombre,
        Torneo.categoria == data.categoria,
        Torneo.genero == data.genero,
        Torneo.division == data.division,
        Torneo.borrado_en.is_(None)  # Solo buscar torneos no eliminados
    ).first()

    if torneo_existente:
        raise ConflictError(
            "Ya existe un torneo activo con ese nombre, categoría, división y género"
        )

    # Validar coincidencia con el torneo base (si se indicó)
    cat_str = data.categoria.value if hasattr(data.categoria, "value") else data.categoria
    gen_str = data.genero.value if hasattr(data.genero, "value") else data.genero
    torneo_base_id = getattr(data, "torneo_base_id", None)
    base = None
    if torneo_base_id:
        base = db.get(Torneo, torneo_base_id)
        if not base or base.borrado_en is not None:
            raise NotFoundError("El torneo base no existe")
        if base.categoria.value != cat_str or base.genero.value != gen_str:
            raise ConflictError(
                "El torneo base debe coincidir en categoría y género con el torneo que se crea."
            )

    # Crear el torneo
    from app.models.enums import TipoTorneo
    torneo = Torneo(
        nombre=data.nombre,
        categoria=CategoriaTipo(data.categoria) if isinstance(data.categoria, str) else data.categoria,
        genero=GeneroTipo(data.genero) if isinstance(data.genero, str) else data.genero,
        tipo=TipoTorneo(data.tipo) if isinstance(data.tipo, str) else data.tipo,
        division=data.division,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        activo=data.activo if hasattr(data, 'activo') else True,
        torneo_base_id=torneo_base_id,
        creado_por=current_user.username
    )

    db.add(torneo)
    db.flush()  # necesitamos id_torneo para las inscripciones

    # Con torneo base: inscribir automáticamente todos sus equipos activos.
    if base is not None:
        from app.models.inscripcion_torneo import InscripcionTorneo
        equipos_base = (
            db.query(InscripcionTorneo.id_equipo)
            .filter(
                InscripcionTorneo.id_torneo == base.id_torneo,
                InscripcionTorneo.fecha_baja.is_(None),
            )
            .all()
        )
        for (id_equipo,) in equipos_base:
            db.add(InscripcionTorneo(
                id_torneo=torneo.id_torneo,
                id_equipo=id_equipo,
                creado_por=current_user.username,
            ))

    db.commit()
    db.refresh(torneo)

    return torneo


def obtener_torneo_activo(db: Session, id_torneo: int) -> Torneo:
    """Obtiene un torneo activo y no eliminado"""
    torneo = db.query(Torneo).filter(
        Torneo.id_torneo == id_torneo,
        Torneo.borrado_en.is_(None)  # No eliminado
    ).first()
    
    if not torneo:
        raise NotFoundError("Torneo no encontrado")
    
    return torneo


def soft_delete_torneo(
    db: Session, 
    id_torneo: int, 
    current_user
) -> Torneo:
    """Realiza soft delete de un torneo"""
    torneo = obtener_torneo_activo(db, id_torneo)
    
    # Verificar si el torneo puede ser eliminado
    if torneo.fases:
        raise ConflictError(
            "No se puede eliminar un torneo que ya tiene fases. "
            "Primero elimine las fases asociadas."
        )
    
    # Usar el método del mixin
    torneo.soft_delete(usuario=current_user.username)
    
    db.commit()
    db.refresh(torneo)
    return torneo


def finalizar_torneo(
    db: Session, 
    id_torneo: int, 
    current_user,
    fecha_fin: Optional[date] = None
) -> Torneo:
    """Finaliza un torneo (marca como inactivo)"""
    torneo = obtener_torneo_activo(db, id_torneo)
    
    if not torneo.activo:
        raise ConflictError("El torneo ya está finalizado")
    
    # Finalizar torneo
    torneo.activo = False
    torneo.actualizado_por = current_user.username
    
    # Establecer fecha_fin
    if fecha_fin:
        if fecha_fin < torneo.fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio")
        torneo.fecha_fin = fecha_fin
    elif not torneo.fecha_fin:
        torneo.fecha_fin = date.today()
    
    db.commit()
    db.refresh(torneo)
    return torneo


def restaurar_torneo(
    db: Session, 
    id_torneo: int, 
    current_user
) -> Torneo:
    """Restaura un torneo eliminado (soft delete)"""
    torneo = db.query(Torneo).filter(
        Torneo.id_torneo == id_torneo,
        Torneo.borrado_en.is_not(None)  # Solo torneos eliminados
    ).first()
    
    if not torneo:
        raise NotFoundError("Torneo no encontrado o no está eliminado")
    
    # Usar el método del mixin
    torneo.restore(usuario=current_user.username)
    
    db.commit()
    db.refresh(torneo)
    return torneo


def actualizar_torneo(
    db: Session,
    id_torneo: int,
    data: TorneoCreate,
    current_user
) -> Torneo:
    """Actualiza un torneo existente"""
    torneo = obtener_torneo_activo(db, id_torneo)
    
    # Verificar unicidad si se cambia el nombre, categoría, división o género
    if (data.nombre != torneo.nombre or
        data.categoria != torneo.categoria.value or
        data.genero != torneo.genero.value or
        data.division != torneo.division):

        torneo_existente = db.query(Torneo).filter(
            Torneo.nombre == data.nombre,
            Torneo.categoria == CategoriaTipo(data.categoria) if isinstance(data.categoria, str) else data.categoria,
            Torneo.genero == GeneroTipo(data.genero) if isinstance(data.genero, str) else data.genero,
            Torneo.division == data.division,
            Torneo.borrado_en.is_(None),
            Torneo.id_torneo != id_torneo
        ).first()

        if torneo_existente:
            raise ConflictError(
                "Ya existe otro torneo activo con ese nombre, categoría, división y género"
            )
    
    # Actualizar campos
    from app.models.enums import TipoTorneo
    torneo.nombre = data.nombre
    torneo.categoria = CategoriaTipo(data.categoria) if isinstance(data.categoria, str) else data.categoria
    torneo.division = data.division
    torneo.genero = GeneroTipo(data.genero) if isinstance(data.genero, str) else data.genero
    torneo.tipo = TipoTorneo(data.tipo) if isinstance(data.tipo, str) else data.tipo
    torneo.fecha_inicio = data.fecha_inicio
    torneo.fecha_fin = data.fecha_fin
    torneo.torneo_base_id = data.torneo_base_id if hasattr(data, 'torneo_base_id') else None
    torneo.actualizado_por = current_user.username
    
    # Si se marca como inactivo y no tiene fecha_fin, establecerla
    if hasattr(data, 'activo') and not data.activo and not torneo.fecha_fin:
        torneo.fecha_fin = date.today()
    
    db.commit()
    db.refresh(torneo)
    return torneo


def listar_torneos(
    db: Session,
    solo_activos: bool = True,
    incluir_eliminados: bool = False
):
    """Lista torneos con diferentes filtros"""
    query = db.query(Torneo)
    
    if not incluir_eliminados:
        query = query.filter(Torneo.borrado_en.is_(None))
    
    if solo_activos:
        query = query.filter(Torneo.activo == True)
    
    return query.order_by(Torneo.fecha_inicio.desc()).all()