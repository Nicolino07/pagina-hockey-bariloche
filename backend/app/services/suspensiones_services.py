# app/services/suspensiones_services.py
from datetime import date, datetime, time, timezone
from typing import Optional
from zoneinfo import ZoneInfo

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


# Fecha/horario de los partidos se cargan en hora local; `creado_en` es UTC.
_ZONA_LOCAL = ZoneInfo("America/Argentina/Buenos_Aires")

# Partidos que el equipo todavía va a jugar. BORRADOR entra también: es un
# partido del fixture sin fecha asignada; sin él, en un torneo cuyo fixture
# está sin programar la suspensión nunca consigue partido a cumplir.
_ESTADOS_PENDIENTES = [
    EstadoPartido.PENDIENTE,
    EstadoPartido.REPROGRAMADO,
    EstadoPartido.SUSPENDIDO,
    EstadoPartido.BORRADOR,
]


def equipos_persona_en_torneo(db: Session, id_persona: int, id_torneo: int) -> list[int]:
    """Equipos con los que una persona está (o estuvo) en un torneo.

    Une dos fuentes:
    - planteles vigentes del torneo (plantel activo, no borrado, integrante sin
      baja, equipo inscripto sin baja). Los planteles históricos cerrados
      (`activo = false`) no cuentan: sus integrantes nunca reciben
      `fecha_baja` y hacían que se resolviera un equipo equivocado.
    - equipos con los que la persona efectivamente figuró en una planilla de
      ese torneo, para no perder el historial si después le dan de baja.

    Puede devolver más de un equipo (ej. alguien en el cuerpo técnico de la
    A y de la B del mismo club).
    """
    from app.models.plantel import Plantel
    from app.models.plantel_integrante import PlantelIntegrante
    from app.models.inscripcion_torneo import InscripcionTorneo
    from app.models.participan_partido import ParticipanPartido
    from app.models.partido import Partido

    vigentes = (
        db.query(Plantel.id_equipo)
        .join(PlantelIntegrante, PlantelIntegrante.id_plantel == Plantel.id_plantel)
        .join(InscripcionTorneo, InscripcionTorneo.id_equipo == Plantel.id_equipo)
        .filter(
            PlantelIntegrante.id_persona == id_persona,
            PlantelIntegrante.fecha_baja.is_(None),
            Plantel.activo.is_(True),
            Plantel.borrado_en.is_(None),
            or_(Plantel.id_torneo == id_torneo, Plantel.id_torneo.is_(None)),
            InscripcionTorneo.id_torneo == id_torneo,
            InscripcionTorneo.fecha_baja.is_(None),
        )
    )
    jugados = (
        db.query(Plantel.id_equipo)
        .join(PlantelIntegrante, PlantelIntegrante.id_plantel == Plantel.id_plantel)
        .join(ParticipanPartido, ParticipanPartido.id_plantel_integrante == PlantelIntegrante.id_plantel_integrante)
        .join(Partido, Partido.id_partido == ParticipanPartido.id_partido)
        .filter(
            PlantelIntegrante.id_persona == id_persona,
            Partido.id_torneo == id_torneo,
        )
    )
    return sorted({row[0] for row in vigentes.union(jugados).all()})


def _momento_partido(partido) -> tuple[date, time]:
    """Momento real de un partido para ordenarlo cronológicamente. Los que no
    tienen fecha u horario van al final."""
    return (partido.fecha or date.max, partido.horario or time.max)


def _momento_local(instante_utc: datetime) -> tuple[date, time]:
    """Convierte un timestamp UTC naive (como `creado_en`) a hora local."""
    local = instante_utc.replace(tzinfo=timezone.utc).astimezone(_ZONA_LOCAL)
    return (local.date(), local.time().replace(tzinfo=None))


def _partidos_origen_tarjetas(db: Session, id_persona: int, id_torneo: int) -> tuple[list[int], list[int]]:
    """Partidos que originan suspensiones automáticas de una persona en un
    torneo, en orden cronológico: el de cada 3ª amarilla acumulada (3ª, 6ª, ...)
    y el de cada roja. Solo cuentan tarjetas VALIDA."""
    from app.models.tarjeta import Tarjeta
    from app.models.participan_partido import ParticipanPartido
    from app.models.plantel_integrante import PlantelIntegrante
    from app.models.partido import Partido

    filas = (
        db.query(Tarjeta.tipo, Partido.id_partido)
        .join(ParticipanPartido, ParticipanPartido.id_participante_partido == Tarjeta.id_participante_partido)
        .join(PlantelIntegrante, PlantelIntegrante.id_plantel_integrante == ParticipanPartido.id_plantel_integrante)
        .join(Partido, Partido.id_partido == Tarjeta.id_partido)
        .filter(
            PlantelIntegrante.id_persona == id_persona,
            Partido.id_torneo == id_torneo,
            Tarjeta.estado_tarjeta == EstadoTarjeta.VALIDA,
            Tarjeta.tipo.in_([TipoTarjeta.AMARILLA, TipoTarjeta.ROJA]),
        )
        .order_by(
            Partido.fecha.asc().nulls_last(),
            Partido.horario.asc().nulls_last(),
            Partido.id_partido.asc(),
            Tarjeta.cuarto.asc().nulls_last(),
            Tarjeta.minuto.asc().nulls_last(),
            Tarjeta.id_tarjeta.asc(),
        )
        .all()
    )
    amarillas = [id_partido for tipo, id_partido in filas if tipo == TipoTarjeta.AMARILLA]
    rojas = [id_partido for tipo, id_partido in filas if tipo == TipoTarjeta.ROJA]
    return amarillas[2::3], rojas


def _reconciliar_origen(
    db: Session,
    id_persona: int,
    id_torneo: int,
    origen: OrigenSuspension,
    partidos_origen: list[int],
    current_user,
    motivo: str,
) -> None:
    """Deja exactamente una suspensión automática (no anulada) de `origen` por
    cada partido de `partidos_origen`, emparejando por `id_partido_origen`.

    - Las que ya tienen su partido de origen en la lista se conservan.
    - Las viejas sin partido de origen (anteriores a este cambio) reciben los
      partidos sobrantes, en orden de creación.
    - Las que quedan sin emparejar (su tarjeta se anuló o se borró) se anulan.
    - Los partidos sin suspensión generan una nueva.
    """
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

    sin_suspension = list(partidos_origen)
    sin_emparejar: list[Suspension] = []
    for s in existentes:
        if s.id_partido_origen is not None and s.id_partido_origen in sin_suspension:
            sin_suspension.remove(s.id_partido_origen)
        else:
            sin_emparejar.append(s)

    for s in list(sin_emparejar):
        if s.id_partido_origen is None and sin_suspension:
            s.id_partido_origen = sin_suspension.pop(0)
            sin_emparejar.remove(s)

    usuario = current_user.username if current_user else None
    for s in sin_emparejar:
        s.estado_suspension = EstadoSuspension.ANULADA
        s.anulada_en = datetime.utcnow()
        s.anulada_por = usuario
        s.motivo_anulacion = "Recalculado automáticamente tras edición de tarjetas"

    for id_partido in sin_suspension:
        db.add(
            Suspension(
                id_persona=id_persona,
                id_torneo=id_torneo,
                id_partido_origen=id_partido,
                origen=origen,
                tipo_suspension=TipoSuspension.POR_PARTIDOS,
                motivo=motivo,
                fechas_suspension=1,
                creado_por=usuario,
            )
        )
    db.flush()


def recalcular_suspensiones_automaticas_persona(
    db: Session,
    id_persona: int,
    id_torneo: int,
    current_user,
) -> None:
    """Reconcilia (idempotente) las suspensiones automáticas de una persona en un
    torneo según sus tarjetas válidas: cada 3 amarillas acumuladas = 1 fecha,
    cada roja = 1 fecha. Se llama tras crear/editar tarjetas."""
    origen_amarillas, origen_rojas = _partidos_origen_tarjetas(db, id_persona, id_torneo)

    _reconciliar_origen(
        db, id_persona, id_torneo,
        OrigenSuspension.AUTOMATICA_AMARILLAS,
        origen_amarillas,
        current_user,
        motivo="3 tarjetas amarillas acumuladas en el torneo",
    )
    _reconciliar_origen(
        db, id_persona, id_torneo,
        OrigenSuspension.AUTOMATICA_ROJA,
        origen_rojas,
        current_user,
        motivo="Tarjeta roja",
    )

    recalcular_cola_suspensiones(db, id_persona, id_torneo, current_user)


def recalcular_cola_suspensiones(
    db: Session,
    id_persona: int,
    id_torneo: Optional[int],
    current_user=None,
) -> None:
    """Recalcula desde cero el cumplimiento de las suspensiones POR_PARTIDOS
    (ACTIVA y CUMPLIDA) de una persona en un torneo, mirando la historia real
    de partidos en orden cronológico (fecha y hora, no número de fecha ni
    orden de carga de planillas).

    Para cada suspensión, en orden de cola (la sancionada primero cumple
    primero), se recorren los partidos de los equipos de la persona en el
    torneo posteriores al momento de la sanción:
    - partido TERMINADO en el que la persona no figura en la planilla: fecha
      cumplida;
    - partido TERMINADO en el que figura: jugó estando suspendida, no cuenta;
    - partido pendiente: queda reservado y el primero es `id_partido_a_cumplir`.
    Un partido cuenta para una sola suspensión.

    El momento de la sanción es el partido de origen para las automáticas
    (la suspensión rige desde que se sacó la tarjeta, aunque la planilla se
    cargue después que la del partido siguiente). Para las manuales es la
    creación, o el partido de origen si es posterior: un partido jugado antes
    de que el tribunal resolviera no cuenta.

    Si `id_torneo` es None (suspensión manual sin torneo de origen) no hay
    partidos que resolver."""
    if id_torneo is None:
        return

    from app.models.partido import Partido
    from app.models.participan_partido import ParticipanPartido
    from app.models.plantel_integrante import PlantelIntegrante

    suspensiones = (
        db.query(Suspension)
        .filter(
            Suspension.id_persona == id_persona,
            Suspension.id_torneo == id_torneo,
            Suspension.estado_suspension != EstadoSuspension.ANULADA,
            Suspension.tipo_suspension == TipoSuspension.POR_PARTIDOS,
        )
        .all()
    )
    if not suspensiones:
        return

    ids_equipo = equipos_persona_en_torneo(db, id_persona, id_torneo)
    if not ids_equipo:
        # Sin equipo no hay forma de saber qué partidos le tocaban. No se
        # toca lo ya cumplido; solo se libera el partido reservado.
        for s in suspensiones:
            if s.estado_suspension == EstadoSuspension.ACTIVA:
                s.id_partido_a_cumplir = None
        return

    partidos = sorted(
        db.query(Partido)
        .filter(
            Partido.id_torneo == id_torneo,
            Partido.estado_partido.in_([EstadoPartido.TERMINADO, *_ESTADOS_PENDIENTES]),
            or_(Partido.id_equipo_local.in_(ids_equipo), Partido.id_equipo_visitante.in_(ids_equipo)),
        )
        .all(),
        key=lambda p: (*_momento_partido(p), p.numero_fecha or 0, p.id_partido),
    )
    partidos_por_id = {p.id_partido: p for p in partidos}

    jugados = {
        row[0] for row in db.query(ParticipanPartido.id_partido)
        .join(PlantelIntegrante, PlantelIntegrante.id_plantel_integrante == ParticipanPartido.id_plantel_integrante)
        .join(Partido, Partido.id_partido == ParticipanPartido.id_partido)
        .filter(PlantelIntegrante.id_persona == id_persona, Partido.id_torneo == id_torneo)
        .all()
    }

    def momento_sancion(s: Suspension) -> tuple[date, time]:
        momento = None
        if s.id_partido_origen is not None:
            origen = partidos_por_id.get(s.id_partido_origen) or db.get(Partido, s.id_partido_origen)
            if origen is not None:
                momento = _momento_partido(origen)
        if (s.origen == OrigenSuspension.MANUAL or momento is None) and s.creado_en is not None:
            creacion = _momento_local(s.creado_en)
            momento = max(momento, creacion) if momento else creacion
        return momento or (date.min, time.min)

    def es_terminado(p) -> bool:
        return str(getattr(p.estado_partido, "value", p.estado_partido)) == EstadoPartido.TERMINADO.value

    cola = sorted(
        ((momento_sancion(s), s) for s in suspensiones),
        key=lambda par: (par[0], par[1].creado_en or datetime.min, par[1].id_suspension or 0),
    )

    usuario = current_user.username if current_user else None
    asignados: set[int] = set()
    for momento, s in cola:
        fechas = s.fechas_suspension or 0
        posteriores = [
            p for p in partidos
            if _momento_partido(p) > momento
            and p.id_partido != s.id_partido_origen
            and p.id_partido not in asignados
        ]

        cumplidos = [p.id_partido for p in posteriores if es_terminado(p) and p.id_partido not in jugados][:fechas]
        reservados = [p.id_partido for p in posteriores if not es_terminado(p)][: fechas - len(cumplidos)]
        asignados.update(cumplidos, reservados)

        if len(cumplidos) >= fechas:
            estado = EstadoSuspension.CUMPLIDA
            a_cumplir = cumplidos[-1] if cumplidos else None
        else:
            estado = EstadoSuspension.ACTIVA
            a_cumplir = reservados[0] if reservados else None

        cambio = (
            s.cumplidas != len(cumplidos)
            or list(s.partidos_cumplidos or []) != cumplidos
            or s.estado_suspension != estado
        )
        s.cumplidas = len(cumplidos)
        s.partidos_cumplidos = cumplidos
        s.estado_suspension = estado
        s.id_partido_a_cumplir = a_cumplir
        if cambio and usuario:
            s.actualizado_por = usuario

    db.flush()


def procesar_cumplimiento_suspensiones_partido(db: Session, partido, current_user) -> None:
    """Recalcula el cumplimiento de suspensiones de las personas de los dos
    equipos de un partido que pasó a TERMINADO (o cuya planilla se editó).
    La cola se recalcula desde la historia completa, así que da igual en qué
    orden se carguen las planillas."""
    ids_equipo = [e for e in (partido.id_equipo_local, partido.id_equipo_visitante) if e is not None]
    if ids_equipo:
        recalcular_cola_por_equipos_en_torneo(db, partido.id_torneo, ids_equipo, current_user)


def recalcular_cola_por_equipos_en_torneo(
    db: Session,
    id_torneo: int,
    ids_equipo: Optional[list[int]] = None,
    current_user=None,
) -> None:
    """Recalcula la cola de todas las personas con suspensiones POR_PARTIDOS no
    anuladas en ese torneo que pertenezcan a alguno de `ids_equipo` (todas si
    es None). Se usa cuando un partido se juega, se crea, se borra o se
    reprograma, porque cambia la historia o el orden de los partidos."""
    personas = (
        db.query(Suspension.id_persona)
        .filter(
            Suspension.id_torneo == id_torneo,
            Suspension.estado_suspension != EstadoSuspension.ANULADA,
            Suspension.tipo_suspension == TipoSuspension.POR_PARTIDOS,
        )
        .distinct()
        .all()
    )
    for (id_persona,) in personas:
        if ids_equipo is None or set(equipos_persona_en_torneo(db, id_persona, id_torneo)) & set(ids_equipo):
            recalcular_cola_suspensiones(db, id_persona, id_torneo, current_user)


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
        recalcular_cola_suspensiones(db, suspension.id_persona, suspension.id_torneo, current_user)
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
        recalcular_cola_suspensiones(db, suspension.id_persona, suspension.id_torneo, current_user)
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
