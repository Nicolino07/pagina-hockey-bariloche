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
        es_competitiva=data.es_competitiva if hasattr(data, 'es_competitiva') else True,
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


def calcular_impacto_eliminacion(db: Session, id_torneo: int) -> dict:
    """Cuenta los datos que se borrarían junto con el torneo.

    Sirve para mostrarle al usuario el "radio de impacto" antes de confirmar
    una eliminación definitiva (que es irreversible). No borra nada.
    """
    from app.models.fase import Fase
    from app.models.partido import Partido
    from app.models.gol import Gol
    from app.models.tarjeta import Tarjeta
    from app.models.inscripcion_torneo import InscripcionTorneo

    torneo = obtener_torneo_activo(db, id_torneo)

    partidos_ids = [
        pid for (pid,) in db.query(Partido.id_partido)
        .filter(Partido.id_torneo == id_torneo)
        .all()
    ]

    if partidos_ids:
        goles = db.query(Gol).filter(Gol.id_partido.in_(partidos_ids)).count()
        tarjetas = db.query(Tarjeta).filter(Tarjeta.id_partido.in_(partidos_ids)).count()
    else:
        goles = 0
        tarjetas = 0

    return {
        "id_torneo": torneo.id_torneo,
        "nombre": torneo.nombre,
        "finalizado": not torneo.activo,
        "fases": db.query(Fase).filter(Fase.id_torneo == id_torneo).count(),
        "partidos": len(partidos_ids),
        "goles": goles,
        "tarjetas": tarjetas,
        "inscripciones": db.query(InscripcionTorneo)
        .filter(InscripcionTorneo.id_torneo == id_torneo)
        .count(),
    }


def eliminar_torneo_definitivo(
    db: Session,
    id_torneo: int,
    current_user,
) -> dict:
    """Elimina un torneo de forma DEFINITIVA (borrado físico con cascada).

    Reservado para datos mal cargados o descartados: al borrar el torneo se
    borran también sus partidos, goles, tarjetas, inscripciones, posiciones y
    suspensiones, liberando los constraints (UNIQUE/RESTRICT) que el soft delete
    dejaba trabados. Los torneos reales no se borran: se finalizan.

    El borrado se hace en orden explícito dentro de una transacción para respetar
    los FK RESTRICT/NO ACTION que la base usa como red de seguridad. Deja registro
    en auditoria_log. Devuelve el radio de impacto de lo que se borró.
    """
    from sqlalchemy import or_
    from app.models.suspension import Suspension
    from app.models.partido import Partido
    from app.models.posicion import Posicion
    from app.models.inscripcion_torneo import InscripcionTorneo
    from app.models.auditoria_log import AuditoriaLog

    torneo = obtener_torneo_activo(db, id_torneo)

    # Speed bump: un torneo finalizado casi siempre es historia real. Obligamos a
    # reabrirlo primero, para que borrarlo sea una decisión consciente y no un click.
    if not torneo.activo:
        raise ConflictError(
            "El torneo está finalizado. Reabrilo antes de eliminarlo, "
            "para confirmar que realmente querés borrar su historial."
        )

    # Radio de impacto (para auditoría y respuesta) antes de tocar nada.
    impacto = calcular_impacto_eliminacion(db, id_torneo)

    partidos_ids = [
        pid for (pid,) in db.query(Partido.id_partido)
        .filter(Partido.id_torneo == id_torneo)
        .all()
    ]

    try:
        # 1) Suspensiones: referencian torneo y partido (NO ACTION), bloquean todo.
        cond = Suspension.id_torneo == id_torneo
        if partidos_ids:
            cond = or_(cond, Suspension.id_partido_origen.in_(partidos_ids))
        db.query(Suspension).filter(cond).delete(synchronize_session=False)

        # 2) Partidos: goles, tarjetas y participantes caen por CASCADE en la DB.
        #    Los borramos primero para liberar el RESTRICT partido -> inscripcion.
        db.query(Partido).filter(
            Partido.id_torneo == id_torneo
        ).delete(synchronize_session=False)

        # 3) Posiciones (FK a torneo sin cascada).
        db.query(Posicion).filter(
            Posicion.id_torneo == id_torneo
        ).delete(synchronize_session=False)

        # 4) Inscripciones (RESTRICT hacia torneo): ya sin partidos que las referencien.
        db.query(InscripcionTorneo).filter(
            InscripcionTorneo.id_torneo == id_torneo
        ).delete(synchronize_session=False)

        # 5) Registro de auditoría antes de borrar el torneo.
        db.add(AuditoriaLog(
            tabla_afectada="torneo",
            id_registro=str(id_torneo),
            operacion="DELETE",
            valores_anteriores=impacto,
            id_usuario=current_user.id_usuario,
        ))

        # 6) Torneo: usamos delete() masivo (no db.delete(objeto)) para que la
        #    cascada la maneje la BASE. Con el borrado por ORM, SQLAlchemy no sabe
        #    del ON DELETE CASCADE e intenta nulificar id_torneo en los hijos
        #    (fase, fixture_fecha, fixture_playoff_ronda) -> NotNullViolation.
        #    Fases y fixtures caen por CASCADE a nivel base.
        db.query(Torneo).filter(
            Torneo.id_torneo == id_torneo
        ).delete(synchronize_session=False)

        db.commit()
    except Exception:
        db.rollback()
        raise

    return impacto


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

    # Las nóminas del torneo pasan a ser un hecho histórico: se cierran para
    # que no puedan editarse después de haberse jugado.
    from app.services.planteles_services import cerrar_planteles_de_torneo
    cerrar_planteles_de_torneo(db, id_torneo, current_user)

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
    if hasattr(data, 'es_competitiva'):
        torneo.es_competitiva = data.es_competitiva
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