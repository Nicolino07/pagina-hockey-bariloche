import logging

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DataError
from fastapi import HTTPException
from sqlalchemy import or_, text
from psycopg2.errors import (
    UniqueViolation,
    ForeignKeyViolation,
    CheckViolation,
    RaiseException,
)


from app.models.partido import Partido, PartidoDetallado
from app.models.participan_partido import ParticipanPartido
from app.models.gol import Gol
from app.models.tarjeta import Tarjeta
from app.models.penal_definicion import PenalDefinicion
from app.models.plantel_integrante import PlantelIntegrante
from app.models.inscripcion_torneo import InscripcionTorneo
from app.models.enums import EstadoPartido, MotivoPuntos, RolPersonaTipo
from app.core.exceptions import AppError, ConfirmacionRequeridaError

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Traducción de errores de base de datos a mensajes claros para el usuario
# ---------------------------------------------------------------------------

# Mensajes por nombre de constraint violada (UNIQUE / CHECK / FK).
_MENSAJES_CONSTRAINT: dict[str, str] = {
    "partido_unq_equipo_fecha": (
        "Ya existe un partido cargado para estos equipos en esa fecha y torneo. "
        "Si querés cargar la planilla de un partido programado, entrá desde el fixture; "
        "si querés corregir uno ya cargado, editalo en vez de crearlo de nuevo."
    ),
    "unq_jugador_partido": (
        "Un jugador figura dos veces en la misma planilla. "
        "Revisá que no esté repetido en la lista de participantes."
    ),
    "participan_partido_numero_camiseta_check": (
        "El número de camiseta debe ser mayor que 0. "
        "Revisá los números cargados en la lista de jugadores."
    ),
    "chk_arbitros_distintos": "El árbitro 1 y el árbitro 2 no pueden ser la misma persona.",
    "chk_capitanes_distintos": "El capitán local y el capitán visitante no pueden ser la misma persona.",
    "gol_minuto_check": "El minuto de un gol no puede ser negativo.",
    "gol_cuarto_check": "El cuarto de un gol debe estar entre 1 y 4.",
    "tarjeta_cuarto_check": "El cuarto de una tarjeta debe estar entre 1 y 4.",
    "partido_goles_local_manual_check": "El resultado manual no puede ser negativo.",
    "partido_goles_visitante_manual_check": "El resultado manual no puede ser negativo.",
    "chk_goles_defecto_local_no_negativo": "Los goles otorgados por defecto no pueden ser negativos.",
    "chk_goles_defecto_visitante_no_negativo": "Los goles otorgados por defecto no pueden ser negativos.",
}


def _mensaje_de_trigger(orig) -> str | None:
    """
    Devuelve el mensaje de un RAISE EXCEPTION de PL/pgSQL, o None si el error
    no proviene de un trigger.

    Los triggers del esquema levantan sus errores con
    `USING ERRCODE = 'check_violation'`, así que psycopg2 los entrega como
    CheckViolation y no como RaiseException. Lo que los distingue de una
    violación de CHECK real es el `context`, que apunta a la función PL/pgSQL,
    y la ausencia de `constraint_name`.
    """
    diag = getattr(orig, "diag", None)
    if diag is None:
        return None

    es_trigger = isinstance(orig, RaiseException) or (
        "PL/pgSQL function" in (getattr(diag, "context", None) or "")
    )
    if not es_trigger:
        return None

    mensaje = getattr(diag, "message_primary", None)
    return mensaje.strip() if mensaje else None


def _traducir_error_bd(e: Exception, accion: str) -> HTTPException:
    """
    Convierte una excepción de base de datos en un HTTPException con un mensaje
    entendible para quien carga la planilla.

    Deja siempre el error original en el log (con traceback) para poder
    diagnosticar los casos que no tengan una traducción específica.

    Args:
        e: excepción capturada (normalmente una SQLAlchemyError).
        accion: descripción corta de la operación, usada en el log ("crear planilla").

    Returns:
        El HTTPException a relanzar.
    """
    logger.exception("Error al %s", accion)

    orig = getattr(e, "orig", None)

    # 1) Validaciones de negocio escritas en triggers: su mensaje ya está
    #    redactado en español y para el usuario final, así que se usa tal cual.
    mensaje_trigger = _mensaje_de_trigger(orig)
    if mensaje_trigger:
        return HTTPException(status_code=400, detail=mensaje_trigger)

    # 2) Constraints declarativas con traducción propia.
    nombre = getattr(getattr(orig, "diag", None), "constraint_name", None)
    if nombre and nombre in _MENSAJES_CONSTRAINT:
        codigo = 409 if isinstance(orig, UniqueViolation) else 400
        return HTTPException(status_code=codigo, detail=_MENSAJES_CONSTRAINT[nombre])

    # 3) Fallbacks por tipo de violación.
    if isinstance(orig, UniqueViolation):
        return HTTPException(
            status_code=409,
            detail="Ya existe un registro con esos datos (partido o jugador duplicado).",
        )
    if isinstance(orig, ForeignKeyViolation):
        return HTTPException(
            status_code=400,
            detail="Uno de los datos referenciados no existe (equipo, inscripción, árbitro, etc.).",
        )
    if isinstance(orig, CheckViolation):
        return HTTPException(
            status_code=400,
            detail=f"Un dato de la planilla no es válido{f' ({nombre})' if nombre else ''}.",
        )
    if isinstance(e, DataError):
        return HTTPException(
            status_code=400,
            detail="Alguno de los valores cargados tiene un formato inválido (número de camiseta, minuto u hora).",
        )

    return HTTPException(
        status_code=500,
        detail="Error interno al guardar la planilla. Avisá al administrador con la fecha y hora del intento.",
    )


def _validar_jugador_no_suspendido(db: Session, integrante: PlantelIntegrante, id_torneo: int, forzar: bool) -> None:
    if forzar:
        return
    from app.services.suspensiones_services import listar_suspensiones_activas_por_personas
    suspensiones = listar_suspensiones_activas_por_personas(
        db, [integrante.id_persona], id_torneo=id_torneo, rol=RolPersonaTipo.JUGADOR
    )
    activas = suspensiones.get(integrante.id_persona)
    if activas:
        s = activas[0]
        raise ConfirmacionRequeridaError(
            f"El jugador está suspendido ({s.motivo}) y no puede participar. "
            "Confirmá para incluirlo de todas formas."
        )


def _validar_arbitros_planilla(db: Session, partido, forzar: bool) -> None:
    """
    Pre-valida los árbitros designados en la planilla.

    Las reglas de árbitros son de advertencia, no de bloqueo: si `forzar` es
    True el admin ya confirmó el override y no se valida nada. Si es False y
    algún árbitro no está habilitado, se lanza ConfirmacionRequeridaError para
    que el frontend ofrezca confirmar.

    La base ya no valida esto (el trigger se eliminó en la migración 0038):
    la regla vive acá.
    """
    if forzar:
        return

    ids = [a for a in (partido.id_arbitro1, partido.id_arbitro2) if a is not None]
    if not ids:
        return

    from app.services.arbitros_services import _validar_arbitro

    es_competitiva = db.execute(
        text("SELECT es_competitiva FROM torneo WHERE id_torneo = :id_torneo"),
        {"id_torneo": partido.id_torneo},
    ).scalar()

    for id_persona in ids:
        try:
            _validar_arbitro(db, partido.id_partido, id_persona, es_competitiva)
        except AppError as exc:
            # _validar_arbitro redacta el motivo para un flujo que bloquea
            # ("No se puede designar: ..."). Acá es una advertencia, así que se
            # deja solo el motivo y se ofrece confirmar.
            motivo = exc.message.replace("No se puede designar:", "").strip()
            raise ConfirmacionRequeridaError(
                f"Advertencia: {motivo}\n\n¿Designarlo igual?"
            ) from exc


def crear_planilla_partido(db: Session, data, current_user):
    try:
        # =========================
        # 1️⃣ Obtener o crear el partido
        # =========================
        # Si el partido viene de un fixture ya materializado, se reutiliza ese
        # mismo partido (preserva los árbitros designados) en vez de crear otro.
        partido = None
        if data.id_fixture_partido:
            # El id del fixture es el id del partido (unificación).
            partido = db.get(Partido, data.id_fixture_partido)

        campos = data.partido.dict()
        if partido is not None:
            arb1_prev, arb2_prev = partido.id_arbitro1, partido.id_arbitro2
            for k, v in campos.items():
                setattr(partido, k, v)
            # No pisar la designación de árbitros si la planilla no la trae.
            if campos.get("id_arbitro1") is None:
                partido.id_arbitro1 = arb1_prev
            if campos.get("id_arbitro2") is None:
                partido.id_arbitro2 = arb2_prev
            partido.actualizado_por = current_user.username
            # Limpiar participaciones previas por si es una recarga.
            db.query(ParticipanPartido).filter(
                ParticipanPartido.id_partido == partido.id_partido
            ).delete()
            db.flush()
        else:
            partido = Partido(**campos)
            partido.estado_partido = "BORRADOR"
            partido.creado_por = current_user.username
            db.add(partido)
            db.flush()  # tenemos id_partido

        _validar_arbitros_planilla(db, partido, data.forzar)

        # =========================
        # 2️⃣ Crear participantes
        # =========================
        participantes_map = {}  # id_plantel_integrante -> id_participante_partido

        # Combinamos ambas listas de objetos (ParticipanteConCamiseta)
        todos_los_participantes = data.participantes.local + data.participantes.visitante

        for p in todos_los_participantes:
            # 💡 CAMBIO: Ahora p es un objeto, extraemos sus atributos
            id_pi = p.id_plantel_integrante
            camiseta = p.numero_camiseta

            # validar que exista el integrante
            integrante = db.get(PlantelIntegrante, id_pi)
            if not integrante:
                raise HTTPException(
                    400, f"Plantel integrante {id_pi} inexistente"
                )
            _validar_jugador_no_suspendido(db, integrante, partido.id_torneo, data.forzar)

            pp = ParticipanPartido(
                id_partido=partido.id_partido,
                id_plantel_integrante=id_pi,
                numero_camiseta=camiseta, 
                creado_por=current_user.username,
            )
            db.add(pp)
            db.flush()

            participantes_map[id_pi] = pp.id_participante_partido

        # =========================
        # 3️⃣ Cargar goles
        # =========================
        # (Este bloque no cambia porque g.id_plantel_integrante sigue siendo un ID)
        for g in data.goles:
            id_pp = participantes_map.get(g.id_plantel_integrante)
            if not id_pp:
                raise HTTPException(
                    400,
                    f"El jugador {g.id_plantel_integrante} no participa del partido",
                )

            db.add(
                Gol(
                    id_partido=partido.id_partido,
                    id_participante_partido=id_pp,
                    minuto=g.minuto,
                    cuarto=g.cuarto,
                    referencia_gol=g.referencia_gol,
                    es_autogol=g.es_autogol,
                    creado_por=current_user.username,
                )
            )

        # =========================
        # 4️⃣ Cargar tarjetas
        # =========================
        for t in data.tarjetas:
            id_pp = participantes_map.get(t.id_plantel_integrante)
            if not id_pp:
                raise HTTPException(
                    400,
                    f"El jugador {t.id_plantel_integrante} no participa del partido",
                )

            db.add(
                Tarjeta(
                    id_partido=partido.id_partido,
                    id_participante_partido=id_pp,
                    tipo=t.tipo,
                    minuto=t.minuto,
                    cuarto=t.cuarto,
                    observaciones=t.observaciones,
                    creado_por=current_user.username,
                )
            )

        # Disparo de triggers y fin.
        # El estado y las tarjetas tienen que estar en la base ANTES de
        # recalcular suspensiones:
        #   - la sesión es autoflush=False, así que sin este flush el conteo de
        #     tarjetas no ve las que se acaban de cargar (contaba de menos y no
        #     llegaba a las 3 amarillas);
        #   - si el partido sigue PENDIENTE, la cola lo elige como "próximo
        #     partido a cumplir" y la sanción se daría por cumplida en el mismo
        #     partido en que se sacó la tarjeta.
        partido.estado_partido = "TERMINADO"
        db.flush()

        # =========================
        # 4️⃣b Recalcular suspensiones automáticas por tarjetas
        # =========================
        ids_pi_con_tarjeta = {t.id_plantel_integrante for t in data.tarjetas}
        if ids_pi_con_tarjeta:
            from app.services.suspensiones_services import recalcular_suspensiones_automaticas_persona
            ids_persona_afectadas = {
                row[0] for row in db.query(PlantelIntegrante.id_persona)
                .filter(PlantelIntegrante.id_plantel_integrante.in_(ids_pi_con_tarjeta))
                .all()
            }
            for id_persona in ids_persona_afectadas:
                recalcular_suspensiones_automaticas_persona(db, id_persona, partido.id_torneo, current_user)

        # Cumplimiento de suspensiones que apuntaban a este partido
        from app.services.suspensiones_services import procesar_cumplimiento_suspensiones_partido
        procesar_cumplimiento_suspensiones_partido(db, partido, current_user)

        # =========================
        # 5️⃣ Vincular fixture si viene
        # =========================
        # Si es un partido de playoff, avanzar el ganador a la ronda siguiente.
        if partido.id_fixture_playoff_ronda:
            db.flush()
            from app.services.playoff_services import avanzar_ganador
            avanzar_ganador(db, partido.id_partido, current_user.username)

        db.commit()
        return partido

    except (HTTPException, AppError):
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise _traducir_error_bd(e, "crear planilla")
    





def get_ultimos_partidos(db: Session, torneo_id: int = None, limit: int = 200):
    query = db.query(PartidoDetallado)

    if torneo_id:
        query = query.filter(PartidoDetallado.id_torneo == torneo_id)

    # Ordenamos por fecha y hora descendente para ver lo más reciente primero
    return query.order_by(PartidoDetallado.fecha.desc(), PartidoDetallado.horario.desc()).limit(limit).all()

def get_partido_by_id(db: Session, partido_id: int):
    return db.query(PartidoDetallado).filter(PartidoDetallado.id_partido == partido_id).first()



def get_historial_por_equipo(db: Session, id_equipo: int, limit: int = 10):
    """
    Obtiene los últimos partidos de un equipo específico usando la vista detallada.
    """
    # Filtramos la vista donde el equipo sea local O visitante
    # Nota: Asegúrate de que los nombres de las columnas coincidan con tu modelo PartidoDetallado
    return (
        db.query(PartidoDetallado)
        .filter(
            or_(
                # Ajusta estos nombres según los atributos de tu clase PartidoDetallado
                # Si tu vista tiene id_equipo_local/visitante, úsalos así:
                PartidoDetallado.id_equipo_local == id_equipo,
                PartidoDetallado.id_equipo_visitante == id_equipo
            )
        )
        .order_by(PartidoDetallado.fecha.desc(), PartidoDetallado.horario.desc())
        .limit(limit)
        .all()
    )


def get_partido_edicion(db: Session, id_partido: int):
    """
    Obtiene los datos estructurados de un partido para precarga en modo edición.
    Separa participantes en local/visitante y estructura goles/tarjetas.
    """
    from sqlalchemy import and_
    from app.models.equipo import Equipo
    from app.models.inscripcion_torneo import InscripcionTorneo

    partido = db.get(Partido, id_partido)
    if not partido:
        raise HTTPException(404, "Partido no encontrado")

    # Obtener el equipo local/visitante para separar participantes.
    # Si el partido no tiene inscripción (espejo del fixture aún no jugado),
    # se usa el equipo directo.
    insc_local = db.get(InscripcionTorneo, partido.id_inscripcion_local) if partido.id_inscripcion_local else None
    insc_visitante = db.get(InscripcionTorneo, partido.id_inscripcion_visitante) if partido.id_inscripcion_visitante else None

    id_equipo_local = insc_local.id_equipo if insc_local else partido.id_equipo_local
    id_equipo_visitante = insc_visitante.id_equipo if insc_visitante else partido.id_equipo_visitante

    # Separar participantes en local/visitante basándose en el equipo del plantel integrante
    participantes_local = []
    participantes_visitante = []

    for pp in partido.participantes:
        pi = pp.plantel_integrante
        participante_data = {
            "id_plantel_integrante": pp.id_plantel_integrante,
            "numero_camiseta": str(pp.numero_camiseta) if pp.numero_camiseta else None
        }

        # Comparar el equipo del plantel integrante con el equipo local/visitante
        # PlantelIntegrante -> plantel -> id_equipo
        pi_equipo = pi.plantel.id_equipo if pi.plantel else None
        if pi_equipo == id_equipo_local:
            participantes_local.append(participante_data)
        elif pi_equipo == id_equipo_visitante:
            participantes_visitante.append(participante_data)

    # Estructurar goles - necesita buscar el ParticipanPartido para obtener id_plantel_integrante
    goles = []
    for gol in partido.goles:
        pp = db.get(ParticipanPartido, gol.id_participante_partido)
        if pp:
            goles.append({
                "id_plantel_integrante": pp.id_plantel_integrante,
                "minuto": gol.minuto,
                "cuarto": gol.cuarto,
                "referencia_gol": gol.referencia_gol.value if hasattr(gol.referencia_gol, 'value') else str(gol.referencia_gol),
                "es_autogol": gol.es_autogol
            })

    # Estructurar tarjetas - necesita buscar el ParticipanPartido para obtener id_plantel_integrante
    tarjetas = []
    for tarjeta in partido.tarjetas:
        pp = db.get(ParticipanPartido, tarjeta.id_participante_partido)
        if pp:
            tarjetas.append({
                "id_plantel_integrante": pp.id_plantel_integrante,
                "tipo": tarjeta.tipo.value if hasattr(tarjeta.tipo, 'value') else str(tarjeta.tipo),
                "minuto": tarjeta.minuto,
                "cuarto": tarjeta.cuarto,
                "observaciones": tarjeta.observaciones
            })

    # Estructurar penales de la tanda. Van aparte de los goles a propósito:
    # no suman al marcador ni al ranking.
    penales = []
    for penal in sorted(
        partido.penales,
        key=lambda x: (x.orden is None, x.orden or 0, x.id_penal_definicion),
    ):
        pp = db.get(ParticipanPartido, penal.id_participante_partido)
        if pp:
            penales.append({
                "id_plantel_integrante": pp.id_plantel_integrante,
                "convertido": penal.convertido,
                "orden": penal.orden,
            })

    # El id del fixture es el mismo id del partido (unificación).
    id_fixture_partido = id_partido

    return {
        "id_partido": partido.id_partido,
        "id_torneo": partido.id_torneo,
        "id_fase": partido.id_fase,
        "fecha": partido.fecha,
        "horario": partido.horario,
        "id_inscripcion_local": partido.id_inscripcion_local,
        "id_inscripcion_visitante": partido.id_inscripcion_visitante,
        "id_arbitro1": partido.id_arbitro1,
        "id_arbitro2": partido.id_arbitro2,
        "id_capitan_local": partido.id_capitan_local,
        "id_capitan_visitante": partido.id_capitan_visitante,
        "juez_mesa_local": partido.juez_mesa_local,
        "juez_mesa_visitante": partido.juez_mesa_visitante,
        "ubicacion": partido.ubicacion,
        "observaciones": partido.observaciones,
        "numero_fecha": partido.numero_fecha,
        "goles_local_manual": partido.goles_local_manual,
        "goles_visitante_manual": partido.goles_visitante_manual,
        "participantes_local": participantes_local,
        "participantes_visitante": participantes_visitante,
        "goles": goles,
        "tarjetas": tarjetas,
        "penales": penales,
        "id_fixture_partido": id_fixture_partido
    }


def eliminar_partido_service(db: Session, id_partido: int):
    """
    Elimina un partido y todos sus datos asociados (goles, tarjetas, participantes).
    Si el partido estaba TERMINADO, recalcula la tabla de posiciones del torneo.
    """
    partido = db.get(Partido, id_partido)
    if not partido:
        raise HTTPException(404, "Partido no encontrado")

    era_terminado = partido.estado_partido == "TERMINADO"
    id_torneo = partido.id_torneo

    db.delete(partido)
    db.flush()

    if era_terminado:
        db.execute(text("SELECT recalcular_tabla_posiciones(:id_torneo)"), {"id_torneo": id_torneo})

    db.commit()


def actualizar_planilla_partido(db: Session, id_partido: int, data, current_user):
    """
    Actualiza un partido existente borrando y recreando sus participantes, goles y tarjetas.
    Mantiene el id_partido para preservar FKs como fixture_partido.id_partido_real.
    """
    try:
        # =========================
        # 1️⃣ Validar y actualizar partido
        # =========================
        partido = db.get(Partido, id_partido)
        if not partido:
            raise HTTPException(404, "Partido no encontrado")

        # Actualizar campos del partido
        partido.id_torneo = data.partido.id_torneo
        partido.id_fase = data.partido.id_fase
        partido.fecha = data.partido.fecha
        partido.horario = data.partido.horario
        partido.id_inscripcion_local = data.partido.id_inscripcion_local
        partido.id_inscripcion_visitante = data.partido.id_inscripcion_visitante
        partido.id_arbitro1 = data.partido.id_arbitro1
        partido.id_arbitro2 = data.partido.id_arbitro2
        partido.id_capitan_local = data.partido.id_capitan_local
        partido.id_capitan_visitante = data.partido.id_capitan_visitante
        partido.juez_mesa_local = data.partido.juez_mesa_local
        partido.juez_mesa_visitante = data.partido.juez_mesa_visitante
        partido.ubicacion = data.partido.ubicacion
        partido.observaciones = data.partido.observaciones
        partido.numero_fecha = data.partido.numero_fecha
        partido.goles_local_manual = data.partido.goles_local_manual
        partido.goles_visitante_manual = data.partido.goles_visitante_manual

        _validar_arbitros_planilla(db, partido, data.forzar)

        # Personas con tarjetas antes de borrar (se pierde tras el cascade delete)
        ids_persona_antes = {
            row[0] for row in db.query(PlantelIntegrante.id_persona)
            .join(ParticipanPartido, ParticipanPartido.id_plantel_integrante == PlantelIntegrante.id_plantel_integrante)
            .join(Tarjeta, Tarjeta.id_participante_partido == ParticipanPartido.id_participante_partido)
            .filter(ParticipanPartido.id_partido == id_partido)
            .all()
        }

        # =========================
        # 2️⃣ Eliminar participantes (cascade borra goles y tarjetas)
        # =========================
        db.query(ParticipanPartido).filter(ParticipanPartido.id_partido == id_partido).delete()
        db.flush()

        # =========================
        # 3️⃣ Recrear participantes
        # =========================
        participantes_map = {}
        todos_los_participantes = data.participantes.local + data.participantes.visitante

        for p in todos_los_participantes:
            id_pi = p.id_plantel_integrante
            camiseta = p.numero_camiseta

            # Validar que exista el integrante
            integrante = db.get(PlantelIntegrante, id_pi)
            if not integrante:
                raise HTTPException(400, f"Plantel integrante {id_pi} inexistente")
            _validar_jugador_no_suspendido(db, integrante, partido.id_torneo, data.forzar)

            pp = ParticipanPartido(
                id_partido=id_partido,
                id_plantel_integrante=id_pi,
                numero_camiseta=camiseta,
                creado_por=current_user.username,
            )
            db.add(pp)
            db.flush()
            participantes_map[id_pi] = pp.id_participante_partido

        # =========================
        # 4️⃣ Recrear goles
        # =========================
        for g in data.goles:
            id_pp = participantes_map.get(g.id_plantel_integrante)
            if not id_pp:
                raise HTTPException(
                    400,
                    f"El jugador {g.id_plantel_integrante} no participa del partido"
                )

            db.add(
                Gol(
                    id_partido=id_partido,
                    id_participante_partido=id_pp,
                    minuto=g.minuto,
                    cuarto=g.cuarto,
                    referencia_gol=g.referencia_gol,
                    es_autogol=g.es_autogol,
                    creado_por=current_user.username,
                )
            )

        # =========================
        # 5️⃣ Recrear tarjetas
        # =========================
        for t in data.tarjetas:
            id_pp = participantes_map.get(t.id_plantel_integrante)
            if not id_pp:
                raise HTTPException(
                    400,
                    f"El jugador {t.id_plantel_integrante} no participa del partido"
                )

            db.add(
                Tarjeta(
                    id_partido=id_partido,
                    id_participante_partido=id_pp,
                    tipo=t.tipo,
                    minuto=t.minuto,
                    cuarto=t.cuarto,
                    observaciones=t.observaciones,
                    creado_por=current_user.username,
                )
            )

        # =========================
        # 5️⃣c Recrear penales de la tanda
        # =========================
        # Igual que goles y tarjetas: el borrado de `participan_partido` se los
        # llevó en cascada, así que hay que reinsertarlos con las referencias
        # nuevas.
        #
        # El lado NO se deduce por club: se toma de la convocatoria con la que
        # vino la planilla. Si se enfrentan dos equipos del mismo club, comparar
        # por club daría verdadero para los dos lados y los penales se contarían
        # doble.
        if data.penales:
            lado_por_integrante: dict[int, int | None] = {}
            for pl in data.participantes.local:
                lado_por_integrante[pl.id_plantel_integrante] = partido.id_inscripcion_local
            for pv in data.participantes.visitante:
                lado_por_integrante[pv.id_plantel_integrante] = partido.id_inscripcion_visitante

            for orden, pen in enumerate(data.penales, start=1):
                id_pp = participantes_map.get(pen.id_plantel_integrante)
                if not id_pp:
                    raise HTTPException(
                        400,
                        f"El jugador {pen.id_plantel_integrante} no participa del partido"
                    )

                id_inscripcion = lado_por_integrante.get(pen.id_plantel_integrante)
                if not id_inscripcion:
                    raise HTTPException(
                        400,
                        "No se puede determinar el equipo del ejecutante del penal. "
                        "El partido tiene que tener ambas inscripciones definidas."
                    )

                db.add(
                    PenalDefinicion(
                        id_partido=id_partido,
                        id_participante_partido=id_pp,
                        id_inscripcion=id_inscripcion,
                        orden=pen.orden if pen.orden is not None else orden,
                        convertido=pen.convertido,
                        creado_por=current_user.username,
                    )
                )

        # =========================
        # 5️⃣b Recalcular suspensiones automáticas por tarjetas
        # =========================
        # La sesión es autoflush=False: sin este flush las tarjetas recién
        # recreadas no existen todavía para el conteo, que además ya vio
        # borrarse las viejas por el cascade. Contaría cero y llegaría a anular
        # suspensiones legítimas.
        db.flush()

        ids_pi_con_tarjeta = {t.id_plantel_integrante for t in data.tarjetas}
        ids_persona_despues = set()
        if ids_pi_con_tarjeta:
            ids_persona_despues = {
                row[0] for row in db.query(PlantelIntegrante.id_persona)
                .filter(PlantelIntegrante.id_plantel_integrante.in_(ids_pi_con_tarjeta))
                .all()
            }
        ids_persona_afectadas = ids_persona_antes | ids_persona_despues
        if ids_persona_afectadas:
            from app.services.suspensiones_services import recalcular_suspensiones_automaticas_persona
            for id_persona in ids_persona_afectadas:
                recalcular_suspensiones_automaticas_persona(db, id_persona, partido.id_torneo, current_user)

        if partido.estado_partido == "TERMINADO":
            from app.services.suspensiones_services import procesar_cumplimiento_suspensiones_partido
            procesar_cumplimiento_suspensiones_partido(db, partido, current_user)

        db.commit()
        return partido

    except (HTTPException, AppError):
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise _traducir_error_bd(e, "actualizar planilla")


def otorgar_puntos_partido(
    db: Session,
    id_fixture_partido: int,
    goles_local: int,
    goles_visitante: int,
    current_user,
    motivo=None,
    descripcion: str | None = None,
    sin_puntos: bool = False,
):
    """
    Otorga puntos por defecto (walkover) cuando hay no presentación,
    descalificación, etc. Transiciona el partido a TERMINADO y recalcula
    posiciones.

    **Es idempotente y excluyente**: si el partido ya tenía goles cargados, se
    borran. El resultado pasa a ser exclusivamente los goles por defecto, de modo
    que ni el marcador ni la diferencia de gol puedan quedar con doble carga
    (goles reales + goles otorgados). La convocatoria y las tarjetas se conservan
    como registro: borrarlas rompería las suspensiones automáticas por
    acumulación.

    `motivo` es obligatorio y es lo que se muestra en el detalle del partido.
    `descripcion` es una aclaración interna, opcional, que no se publica.
    `sin_puntos` sirve para el caso en que no se presentó ninguno y no se le
    otorgan puntos a nadie: sin esa marca, un 0-0 repartiría 1 punto a cada uno
    por la regla del empate.
    """
    try:
        # El id del fixture es el id del partido (unificación); el partido existe.
        partido = db.get(Partido, id_fixture_partido)
        if not partido:
            raise HTTPException(404, "Partido no encontrado")

        # Si el partido no tiene inscripción, derivarla de equipo + torneo
        # para que cuente en resultados y posiciones.
        if partido.id_inscripcion_local is None or partido.id_inscripcion_visitante is None:
            insc_local = db.query(InscripcionTorneo).filter(
                InscripcionTorneo.id_torneo == partido.id_torneo,
                InscripcionTorneo.id_equipo == partido.id_equipo_local,
            ).first()
            insc_visitante = db.query(InscripcionTorneo).filter(
                InscripcionTorneo.id_torneo == partido.id_torneo,
                InscripcionTorneo.id_equipo == partido.id_equipo_visitante,
            ).first()
            if not insc_local or not insc_visitante:
                raise HTTPException(400, "Los equipos no están inscritos en este torneo")
            partido.id_inscripcion_local = insc_local.id_inscripcion
            partido.id_inscripcion_visitante = insc_visitante.id_inscripcion

        if motivo is None:
            raise HTTPException(400, "Hay que indicar el motivo de la entrega de puntos")

        if sin_puntos and motivo != MotivoPuntos.NO_PRESENTARON_AMBOS:
            raise HTTPException(
                400,
                "Sólo se puede dejar el partido sin puntos cuando no se presentó "
                "ninguno de los dos equipos.",
            )

        # Anular lo que hubiera cargado: el resultado pasa a ser exclusivamente
        # los goles por defecto. Sin esto, un partido con planilla cargada que
        # recibe puntos termina sumando las dos cosas (pasó: un 4-0 otorgado
        # sobre 4 goles reales se publicaba 8-0).
        goles_borrados = (
            db.query(Gol)
            .filter(Gol.id_partido == partido.id_partido)
            .delete(synchronize_session=False)
        )
        if goles_borrados:
            logger.info(
                "Entrega de puntos en el partido %s: se anularon %s goles cargados.",
                partido.id_partido,
                goles_borrados,
            )

        # La definición por penales tampoco tiene sentido en un walkover.
        db.query(PenalDefinicion).filter(
            PenalDefinicion.id_partido == partido.id_partido
        ).delete(synchronize_session=False)

        # Actualizar goles y estado del partido
        partido.goles_por_defecto_local = goles_local
        partido.goles_por_defecto_visitante = goles_visitante
        partido.goles_local_manual = None
        partido.goles_visitante_manual = None
        partido.motivo_puntos = motivo
        partido.descripcion_puntos = descripcion
        partido.sin_puntos = sin_puntos
        partido.estado_partido = EstadoPartido.TERMINADO
        partido.actualizado_por = current_user.username

        db.flush()

        # Si es un partido de playoff, avanzar el ganador a la ronda siguiente.
        if partido.id_fixture_playoff_ronda:
            from app.services.playoff_services import avanzar_ganador
            avanzar_ganador(db, partido.id_partido, current_user.username)

        # Cumplimiento de suspensiones que apuntaban a este partido
        from app.services.suspensiones_services import procesar_cumplimiento_suspensiones_partido
        procesar_cumplimiento_suspensiones_partido(db, partido, current_user)

        # Recalcular tabla de posiciones
        db.execute(text("SELECT recalcular_tabla_posiciones(:id_torneo)"), {"id_torneo": partido.id_torneo})

        db.commit()
        return partido

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise _traducir_error_bd(e, "otorgar puntos")

def deshacer_puntos_partido(db: Session, id_partido: int, current_user):
    """
    Deshace una entrega de puntos hecha por error.

    Limpia los goles por defecto, el motivo, la descripción y la marca de
    `sin_puntos`, devuelve el partido a PENDIENTE y **recalcula la tabla de
    posiciones**, que es el punto de todo: mientras no se recalcule, el torneo
    sigue mostrando los puntos mal otorgados.

    Importante: **los goles que la entrega anuló no se recuperan.** Aquella
    operación los borró para que el marcador no se contara dos veces, y no
    quedó copia. Si el partido se jugó, hay que volver a cargar la planilla.

    Si el partido es de playoff, intenta devolver a su placeholder el cruce de la
    ronda siguiente. Los que ya se jugaron no se tocan: se devuelven como
    advertencia.
    """
    partido = db.get(Partido, id_partido)
    if not partido:
        raise HTTPException(404, "Partido no encontrado")

    if (
        partido.goles_por_defecto_local is None
        and partido.goles_por_defecto_visitante is None
        and partido.motivo_puntos is None
    ):
        raise HTTPException(400, "Este partido no tiene una entrega de puntos para deshacer")

    try:
        advertencias: list[str] = []

        # Antes de limpiar nada: revertir el avance en la llave, que depende del
        # resultado actual.
        if partido.id_fixture_playoff_ronda:
            from app.services.playoff_services import revertir_avance_ganador
            advertencias = revertir_avance_ganador(db, partido, current_user.username)

        partido.goles_por_defecto_local = None
        partido.goles_por_defecto_visitante = None
        partido.motivo_puntos = None
        partido.descripcion_puntos = None
        partido.sin_puntos = False
        partido.estado_partido = EstadoPartido.PENDIENTE
        partido.actualizado_por = current_user.username

        db.flush()

        db.execute(
            text("SELECT recalcular_tabla_posiciones(:id_torneo)"),
            {"id_torneo": partido.id_torneo},
        )

        db.commit()

        logger.info(
            "Entrega de puntos deshecha en el partido %s por %s.",
            partido.id_partido,
            current_user.username,
        )

        return {
            "id_partido": partido.id_partido,
            "id_torneo": partido.id_torneo,
            "estado_partido": EstadoPartido.PENDIENTE.value,
            "advertencias": advertencias,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise _traducir_error_bd(e, "deshacer la entrega de puntos")
