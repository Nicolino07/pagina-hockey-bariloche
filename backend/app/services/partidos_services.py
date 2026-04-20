from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from fastapi import HTTPException
from sqlalchemy import or_, text
from psycopg2.errors import UniqueViolation, ForeignKeyViolation


from app.models.partido import Partido, PartidoDetallado
from app.models.participan_partido import ParticipanPartido
from app.models.gol import Gol
from app.models.tarjeta import Tarjeta
from app.models.plantel_integrante import PlantelIntegrante
from app.models.fixture_partido import FixturePartido


def crear_planilla_partido(db: Session, data, current_user):
    try:
        # =========================
        # 1️⃣ Crear partido
        # =========================
        partido = Partido(**data.partido.dict())
        partido.estado_partido = "BORRADOR"
        partido.creado_por = current_user.username

        db.add(partido)
        db.flush()  # tenemos id_partido

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

        # Disparo de triggers y fin
        partido.estado_partido = "TERMINADO"
        db.flush()

        # =========================
        # 5️⃣ Vincular fixture si viene
        # =========================
        if data.id_fixture_partido:
            fp = db.get(FixturePartido, data.id_fixture_partido)
            if fp and fp.estado != "TERMINADO":
                fp.estado = "TERMINADO"
                fp.id_partido_real = partido.id_partido
                db.flush()
                if fp.id_fixture_playoff_ronda:
                    from app.services.playoff_services import avanzar_ganador
                    avanzar_ganador(db, fp.id_fixture_partido, current_user.username)

        db.commit()
        return partido

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as e:
        db.rollback()
        orig = getattr(e, "orig", None)
        if isinstance(orig, UniqueViolation):
            raise HTTPException(
                status_code=409,
                detail="Ya existe un partido cargado para estos equipos en esa fecha y torneo."
            )
        if isinstance(orig, ForeignKeyViolation):
            raise HTTPException(
                status_code=400,
                detail="Uno de los datos referenciados no existe (equipo, inscripción, árbitro, etc.)."
            )
        raise HTTPException(status_code=400, detail="Error de integridad en los datos.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al guardar la planilla.")
    





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

    # Obtener equipo del equipo local para separar participantes
    insc_local = db.get(InscripcionTorneo, partido.id_inscripcion_local)
    insc_visitante = db.get(InscripcionTorneo, partido.id_inscripcion_visitante)

    id_equipo_local = insc_local.id_equipo if insc_local else None
    id_equipo_visitante = insc_visitante.id_equipo if insc_visitante else None

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

    # Obtener id_fixture_partido si existe vínculo
    fp = db.query(FixturePartido).filter(FixturePartido.id_partido_real == id_partido).first()
    id_fixture_partido = fp.id_fixture_partido if fp else None

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

        db.commit()
        return partido

    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))