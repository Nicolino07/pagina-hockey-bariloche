# app/services/suspensiones_services.py
from datetime import date, datetime
from typing import Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.enums import (
    EstadoSuspension,
    EstadoPartido,
    OrigenSuspension,
    TipoSuspension,
    EstadoTarjeta,
    TipoTarjeta,
    RolPersonaTipo,
)
from app.models.suspension import Suspension
from app.schemas.suspension import SuspensionCreate


def resolver_equipo_persona_en_torneo(db: Session, id_persona: int, id_torneo: int) -> Optional[int]:
    """Resuelve el equipo con el que una persona está inscripta en un torneo dado.

    Cadena: PlantelIntegrante (activo) -> Plantel.id_equipo -> InscripcionTorneo(id_torneo).
    Devuelve None si la persona no tiene un plantel activo inscripto en ese torneo.
    """
    from app.models.plantel import Plantel
    from app.models.plantel_integrante import PlantelIntegrante
    from app.models.inscripcion_torneo import InscripcionTorneo

    resultado = (
        db.query(Plantel.id_equipo)
        .join(PlantelIntegrante, PlantelIntegrante.id_plantel == Plantel.id_plantel)
        .join(InscripcionTorneo, InscripcionTorneo.id_equipo == Plantel.id_equipo)
        .filter(
            PlantelIntegrante.id_persona == id_persona,
            PlantelIntegrante.fecha_baja.is_(None),
            InscripcionTorneo.id_torneo == id_torneo,
        )
        .first()
    )
    return resultado[0] if resultado else None


def _contar_tarjetas_validas(db: Session, id_persona: int, id_torneo: int) -> tuple[int, int]:
    """Cuenta amarillas y rojas VALIDAS de una persona en un torneo."""
    from app.models.tarjeta import Tarjeta
    from app.models.participan_partido import ParticipanPartido
    from app.models.plantel_integrante import PlantelIntegrante
    from app.models.partido import Partido

    base = (
        db.query(Tarjeta)
        .join(ParticipanPartido, ParticipanPartido.id_participante_partido == Tarjeta.id_participante_partido)
        .join(PlantelIntegrante, PlantelIntegrante.id_plantel_integrante == ParticipanPartido.id_plantel_integrante)
        .join(Partido, Partido.id_partido == Tarjeta.id_partido)
        .filter(
            PlantelIntegrante.id_persona == id_persona,
            Partido.id_torneo == id_torneo,
            Tarjeta.estado_tarjeta == EstadoTarjeta.VALIDA,
        )
    )
    total_amarillas = base.filter(Tarjeta.tipo == TipoTarjeta.AMARILLA).count()
    total_rojas = base.filter(Tarjeta.tipo == TipoTarjeta.ROJA).count()
    return total_amarillas, total_rojas


def _reconciliar_origen(
    db: Session,
    id_persona: int,
    id_torneo: int,
    origen: OrigenSuspension,
    esperadas: int,
    current_user,
    motivo: str,
) -> None:
    """Crea o anula suspensiones automáticas de un origen puntual hasta que
    la cantidad ACTIVA+CUMPLIDA coincida con `esperadas`. Nunca toca las CUMPLIDA."""
    existentes = (
        db.query(Suspension)
        .filter(
            Suspension.id_persona == id_persona,
            Suspension.id_torneo == id_torneo,
            Suspension.origen == origen,
            Suspension.estado_suspension != EstadoSuspension.ANULADA,
        )
        .order_by(Suspension.creado_en.asc(), Suspension.id_suspension.asc())
        .all()
    )
    actuales = len(existentes)

    if esperadas > actuales:
        for _ in range(esperadas - actuales):
            db.add(
                Suspension(
                    id_persona=id_persona,
                    id_torneo=id_torneo,
                    origen=origen,
                    tipo_suspension=TipoSuspension.POR_PARTIDOS,
                    motivo=motivo,
                    fechas_suspension=1,
                    creado_por=current_user.username if current_user else None,
                )
            )
        db.flush()
    elif esperadas < actuales:
        activas = [s for s in existentes if s.estado_suspension == EstadoSuspension.ACTIVA]
        a_anular = sorted(activas, key=lambda s: (s.creado_en, s.id_suspension), reverse=True)
        for s in a_anular[: actuales - esperadas]:
            s.estado_suspension = EstadoSuspension.ANULADA
            s.anulada_en = datetime.utcnow()
            s.anulada_por = current_user.username if current_user else None
            s.motivo_anulacion = "Recalculado automáticamente tras edición de tarjetas"
        db.flush()


def recalcular_suspensiones_automaticas_persona(
    db: Session,
    id_persona: int,
    id_torneo: int,
    current_user,
) -> None:
    """Reconcilia (idempotente) las suspensiones automáticas de una persona en un
    torneo según el total de tarjetas válidas: cada 3 amarillas acumuladas = 1
    fecha, cada roja = 1 fecha. Se llama tras crear/editar tarjetas."""
    total_amarillas, total_rojas = _contar_tarjetas_validas(db, id_persona, id_torneo)

    _reconciliar_origen(
        db, id_persona, id_torneo,
        OrigenSuspension.AUTOMATICA_AMARILLAS,
        total_amarillas // 3,
        current_user,
        motivo="3 tarjetas amarillas acumuladas en el torneo",
    )
    _reconciliar_origen(
        db, id_persona, id_torneo,
        OrigenSuspension.AUTOMATICA_ROJA,
        total_rojas,
        current_user,
        motivo="Tarjeta roja",
    )

    recalcular_cola_suspensiones(db, id_persona, id_torneo)


def recalcular_cola_suspensiones(db: Session, id_persona: int, id_torneo: Optional[int]) -> None:
    """Asigna `id_partido_a_cumplir` a las suspensiones ACTIVA (POR_PARTIDOS) de
    una persona en un torneo, en orden de cola (la sancionada primero cumple
    primero), repartiendo los próximos partidos pendientes del equipo en orden
    cronológico real (no por número de fecha, para respetar reprogramaciones).

    Si `id_torneo` es None (suspensión manual sin torneo de origen) no hay
    partidos que resolver: la suspensión queda sin `id_partido_a_cumplir`."""
    if id_torneo is None:
        return

    from app.models.partido import Partido

    suspensiones = (
        db.query(Suspension)
        .filter(
            Suspension.id_persona == id_persona,
            Suspension.id_torneo == id_torneo,
            Suspension.estado_suspension == EstadoSuspension.ACTIVA,
            Suspension.tipo_suspension == TipoSuspension.POR_PARTIDOS,
        )
        .order_by(Suspension.creado_en.asc(), Suspension.id_suspension.asc())
        .all()
    )
    if not suspensiones:
        return

    id_equipo = resolver_equipo_persona_en_torneo(db, id_persona, id_torneo)
    if id_equipo is None:
        for s in suspensiones:
            s.id_partido_a_cumplir = None
        return

    disponibles = (
        db.query(Partido)
        .filter(
            Partido.id_torneo == id_torneo,
            Partido.estado_partido.in_(
                [EstadoPartido.PENDIENTE, EstadoPartido.REPROGRAMADO, EstadoPartido.SUSPENDIDO]
            ),
            or_(Partido.id_equipo_local == id_equipo, Partido.id_equipo_visitante == id_equipo),
        )
        .order_by(
            Partido.fecha.asc().nulls_last(),
            Partido.horario.asc().nulls_last(),
            Partido.numero_fecha.asc().nulls_last(),
        )
        .all()
    )

    for s in suspensiones:
        restantes = (s.fechas_suspension or 0) - s.cumplidas
        if restantes <= 0:
            s.id_partido_a_cumplir = None
            continue
        tomados = disponibles[:restantes]
        disponibles = disponibles[restantes:]
        s.id_partido_a_cumplir = tomados[0].id_partido if tomados else None


def procesar_cumplimiento_suspensiones_partido(db: Session, partido, current_user) -> None:
    """Marca como cumplida una fecha de suspensión para cada persona que tenía
    este partido asignado como su próximo partido a cumplir. Se llama cuando
    el partido pasa a TERMINADO."""
    suspensiones = (
        db.query(Suspension)
        .filter(
            Suspension.estado_suspension == EstadoSuspension.ACTIVA,
            Suspension.id_partido_a_cumplir == partido.id_partido,
        )
        .all()
    )
    if not suspensiones:
        return

    personas_afectadas: set[int] = set()
    for s in suspensiones:
        s.cumplidas += 1
        s.partidos_cumplidos = (s.partidos_cumplidos or []) + [partido.id_partido]
        s.actualizado_por = current_user.username if current_user else None
        if s.fechas_suspension is not None and s.cumplidas >= s.fechas_suspension:
            s.estado_suspension = EstadoSuspension.CUMPLIDA
        personas_afectadas.add(s.id_persona)

    db.flush()
    for id_persona in personas_afectadas:
        recalcular_cola_suspensiones(db, id_persona, partido.id_torneo)


def recalcular_cola_por_equipos_en_torneo(db: Session, id_torneo: int, ids_equipo: list[int]) -> None:
    """Recalcula la cola de todas las personas con suspensión ACTIVA POR_PARTIDOS
    en ese torneo cuyo equipo resuelto esté entre `ids_equipo`. Se usa cuando un
    partido se reprograma (cambia fecha/horario/estado) y puede alterar el orden
    cronológico real de los próximos partidos de esos equipos."""
    personas = (
        db.query(Suspension.id_persona)
        .filter(
            Suspension.id_torneo == id_torneo,
            Suspension.estado_suspension == EstadoSuspension.ACTIVA,
            Suspension.tipo_suspension == TipoSuspension.POR_PARTIDOS,
        )
        .distinct()
        .all()
    )
    for (id_persona,) in personas:
        if resolver_equipo_persona_en_torneo(db, id_persona, id_torneo) in ids_equipo:
            recalcular_cola_suspensiones(db, id_persona, id_torneo)


def crear_suspension_manual(db: Session, data: SuspensionCreate, current_user) -> Suspension:
    """Crea una suspensión manual (por N fechas o hasta una fecha calendario)."""
    try:
        suspension = Suspension(
            id_persona=data.id_persona,
            id_torneo=data.id_torneo,
            id_partido_origen=data.id_partido_origen,
            origen=OrigenSuspension.MANUAL,
            tipo_suspension=data.tipo_suspension,
            motivo=data.motivo,
            fechas_suspension=data.fechas_suspension,
            fecha_fin_suspension=data.fecha_fin_suspension,
            creado_por=current_user.username if current_user else None,
        )
        db.add(suspension)
        db.flush()
        recalcular_cola_suspensiones(db, suspension.id_persona, suspension.id_torneo)
        db.commit()
        db.refresh(suspension)
        return suspension
    except Exception:
        db.rollback()
        raise


def anular_suspension(db: Session, id_suspension: int, motivo_anulacion: str, current_user) -> Suspension:
    """Anula una suspensión (no se borra, queda con estado ANULADA) y recalcula
    la cola de esa persona/torneo para liberar el partido que tenía reservado."""
    suspension = db.query(Suspension).filter(Suspension.id_suspension == id_suspension).first()
    if not suspension:
        raise NotFoundError("Suspensión no encontrada")

    try:
        suspension.estado_suspension = EstadoSuspension.ANULADA
        suspension.anulada_en = datetime.utcnow()
        suspension.anulada_por = current_user.username if current_user else None
        suspension.motivo_anulacion = motivo_anulacion
        db.flush()
        recalcular_cola_suspensiones(db, suspension.id_persona, suspension.id_torneo)
        db.commit()
        db.refresh(suspension)
        return suspension
    except Exception:
        db.rollback()
        raise


def listar_suspensiones_activas_por_personas(
    db: Session,
    ids_persona: list[int],
    id_torneo: Optional[int] = None,
    rol: Optional[RolPersonaTipo] = None,
    tipo_suspension: Optional[TipoSuspension] = None,
) -> dict[int, list[Suspension]]:
    """Lookup en bloque de suspensiones ACTIVA (vigentes) por persona, con
    alcance consciente de torneo/rol:

    - Sin `id_torneo` ni `rol`: uso informativo/bulk (listados de plantel,
      planilla impresa). No filtra por alcance: trae toda suspensión activa
      (de cualquier torneo o global); quien consuma la respuesta decide qué
      mostrar usando `id_torneo`/`roles_afectados` de cada una.
    - Con `id_torneo` + `rol`: chequeo estricto para un partido/rol concreto
      (planilla de jugadores, designación de árbitros): matchea suspensiones
      de ESE torneo, o globales cuyo `roles_afectados` sea NULL o incluya
      `rol`.
    - Con `rol` + `tipo_suspension` y sin `id_torneo`: chequeo de alta a
      plantel (roles sin designación por partido), solo mira suspensiones
      globales del tipo pedido (ej. POR_FECHA).
    """
    if not ids_persona:
        return {}

    hoy = date.today()
    vigencia = or_(
        and_(
            Suspension.tipo_suspension == TipoSuspension.POR_PARTIDOS,
            Suspension.cumplidas < Suspension.fechas_suspension,
        ),
        and_(
            Suspension.tipo_suspension == TipoSuspension.POR_FECHA,
            Suspension.fecha_fin_suspension >= hoy,
        ),
    )

    query = (
        db.query(Suspension)
        .filter(
            Suspension.id_persona.in_(ids_persona),
            Suspension.estado_suspension == EstadoSuspension.ACTIVA,
            vigencia,
        )
    )

    if id_torneo is not None or rol is not None:
        alcance_global = Suspension.id_torneo.is_(None)
        if rol is not None:
            alcance_global = and_(
                alcance_global,
                or_(
                    Suspension.roles_afectados.is_(None),
                    Suspension.roles_afectados.any(rol),
                ),
            )
        if id_torneo is not None:
            alcance = or_(Suspension.id_torneo == id_torneo, alcance_global)
        else:
            alcance = alcance_global
        query = query.filter(alcance)

    if tipo_suspension is not None:
        query = query.filter(Suspension.tipo_suspension == tipo_suspension)

    resultado: dict[int, list[Suspension]] = {}
    for s in query.all():
        resultado.setdefault(s.id_persona, []).append(s)
    return resultado
