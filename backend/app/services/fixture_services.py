"""
Servicios para la gestión del fixture (partidos programados).
"""
import random
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.fixture_partido import FixturePartido
from app.models.fixture_fecha import FixtureFecha
from app.models.fixture_playoff_ronda import FixturePlayoffRonda
from app.models.inscripcion_torneo import InscripcionTorneo
from app.models.partido import PartidoDetallado
from app.models.equipo import Equipo
from app.models.torneo import Torneo
from app.schemas.fixture_partido import (
    FixturePartidoCreate,
    FixturePartidoUpdate,
    FixturePartidoPreview,
    FixturePreviewResponse,
)


def _enriquecer(fp: FixturePartido, db: Session | None = None) -> dict:
    """Agrega nombres de equipos, torneo, resultado y descanso al response."""
    data = {c.name: getattr(fp, c.name) for c in fp.__table__.columns}
    data["nombre_equipo_local"] = fp.equipo_local.nombre if fp.equipo_local else None
    data["nombre_equipo_visitante"] = fp.equipo_visitante.nombre if fp.equipo_visitante else None
    data["nombre_torneo"] = fp.torneo.nombre if fp.torneo else None
    data["categoria"] = fp.torneo.categoria.value if fp.torneo else None
    data["division"] = fp.torneo.division if fp.torneo else None
    data["genero"] = fp.torneo.genero.value if fp.torneo else None
    data["goles_local"] = None
    data["goles_visitante"] = None
    if db and fp.id_partido_real:
        detalle = db.get(PartidoDetallado, fp.id_partido_real)
        if detalle:
            data["goles_local"] = detalle.goles_local
            data["goles_visitante"] = detalle.goles_visitante
    # descanso y rueda de la fecha
    data["nombre_equipo_descansa"] = None
    data["rueda"] = None
    if fp.fixture_fecha:
        data["rueda"] = fp.fixture_fecha.rueda
        if fp.fixture_fecha.equipo_descansa:
            data["nombre_equipo_descansa"] = fp.fixture_fecha.equipo_descansa.nombre

    # campos de playoff
    data["placeholder_local"] = getattr(fp, "placeholder_local", None)
    data["placeholder_visitante"] = getattr(fp, "placeholder_visitante", None)
    data["id_fixture_playoff_ronda"] = getattr(fp, "id_fixture_playoff_ronda", None)
    data["nombre_ronda_playoff"] = None
    if fp.id_fixture_playoff_ronda and fp.playoff_ronda:
        data["nombre_ronda_playoff"] = fp.playoff_ronda.nombre
    return data


def obtener_fixture_por_id(db: Session, id_fixture_partido: int):
    """Devuelve un partido del fixture por su ID."""
    fp = (
        db.query(FixturePartido)
        .options(
            joinedload(FixturePartido.equipo_local),
            joinedload(FixturePartido.equipo_visitante),
            joinedload(FixturePartido.torneo),
            joinedload(FixturePartido.fixture_fecha).joinedload(FixtureFecha.equipo_descansa),
            joinedload(FixturePartido.playoff_ronda),
        )
        .filter(FixturePartido.id_fixture_partido == id_fixture_partido)
        .first()
    )
    if not fp:
        raise HTTPException(404, "Partido del fixture no encontrado")
    return _enriquecer(fp, db)


def crear_fixture_partido(db: Session, data: FixturePartidoCreate, username: str):
    """Crea un partido programado en el fixture."""
    if data.id_equipo_local == data.id_equipo_visitante:
        raise HTTPException(400, "El equipo local y visitante deben ser distintos")

    fp = FixturePartido(
        id_torneo=data.id_torneo,
        id_equipo_local=data.id_equipo_local,
        id_equipo_visitante=data.id_equipo_visitante,
        fecha_programada=data.fecha_programada,
        horario=data.horario,
        ubicacion=data.ubicacion,
        numero_fecha=data.numero_fecha,
        id_fixture_playoff_ronda=data.id_fixture_playoff_ronda,
        estado=data.estado if data.estado else ("PENDIENTE" if data.fecha_programada else "BORRADOR"),
        creado_por=username,
    )
    db.add(fp)
    db.commit()
    db.refresh(fp)

    db.refresh(fp, ["equipo_local", "equipo_visitante", "torneo"])
    return _enriquecer(fp, db)


def listar_fixture_por_torneo(db: Session, id_torneo: int, solo_publicos: bool = False) -> list:
    """Lista los partidos de un torneo ordenados por fecha.
    Con solo_publicos=True excluye los BORRADOR (no tienen fecha asignada).
    """
    estados_ocultos = ["BORRADOR"] if solo_publicos else []
    query = (
        db.query(FixturePartido)
        .options(
            joinedload(FixturePartido.equipo_local),
            joinedload(FixturePartido.equipo_visitante),
            joinedload(FixturePartido.torneo),
            joinedload(FixturePartido.fixture_fecha).joinedload(FixtureFecha.equipo_descansa),
            joinedload(FixturePartido.playoff_ronda),
        )
        .filter(FixturePartido.id_torneo == id_torneo)
    )
    if estados_ocultos:
        query = query.filter(FixturePartido.estado.notin_(estados_ocultos))
    partidos = query.order_by(
        FixturePartido.numero_fecha.asc().nulls_last(),
        FixturePartido.fecha_programada.asc().nulls_last(),
        FixturePartido.horario.asc().nulls_last(),
    ).all()
    return [_enriquecer(fp, db) for fp in partidos]


def listar_fixture_proximos(db: Session, id_torneo: int | None = None) -> list:
    """Lista partidos visibles al público: PENDIENTE, SUSPENDIDO y REPROGRAMADO."""
    query = (
        db.query(FixturePartido)
        .options(
            joinedload(FixturePartido.equipo_local),
            joinedload(FixturePartido.equipo_visitante),
            joinedload(FixturePartido.torneo),
            joinedload(FixturePartido.fixture_fecha).joinedload(FixtureFecha.equipo_descansa),
            joinedload(FixturePartido.playoff_ronda),
        )
        .filter(FixturePartido.estado.in_(["PENDIENTE", "SUSPENDIDO", "REPROGRAMADO"]))
    )
    if id_torneo:
        query = query.filter(FixturePartido.id_torneo == id_torneo)

    partidos = query.order_by(
        FixturePartido.fecha_programada.asc().nulls_last(),
        FixturePartido.horario.asc().nulls_last(),
    ).all()
    return [_enriquecer(fp, db) for fp in partidos]


def actualizar_fixture_partido(
    db: Session, id_fixture_partido: int, data: FixturePartidoUpdate, username: str
):
    """Edita fecha, horario, ubicación, número de fecha o estado de un partido programado.
    Si se asigna fecha_programada a un BORRADOR, pasa automáticamente a PENDIENTE.
    Si se quita la fecha_programada de un PENDIENTE, vuelve a BORRADOR.
    """
    fp = db.get(FixturePartido, id_fixture_partido)
    if not fp:
        raise HTTPException(404, "Partido del fixture no encontrado")
    if fp.estado == "TERMINADO":
        raise HTTPException(400, "No se puede editar un partido ya jugado")

    cambios = data.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(fp, campo, valor)

    # transición automática de estado según fecha_programada
    if "estado" not in cambios:
        if fp.fecha_programada and fp.estado == "BORRADOR":
            fp.estado = "PENDIENTE"
        elif not fp.fecha_programada and fp.estado == "PENDIENTE":
            fp.estado = "BORRADOR"

    # avanzar ganador automáticamente en playoffs
    if fp.estado == "TERMINADO" and fp.id_fixture_playoff_ronda:
        from app.services.playoff_services import avanzar_ganador
        avanzar_ganador(db, fp.id_fixture_partido, username)

    db.commit()
    db.refresh(fp)
    db.refresh(fp, ["equipo_local", "equipo_visitante", "torneo"])
    return _enriquecer(fp, db)


def eliminar_fixture_partido(db: Session, id_fixture_partido: int):
    """Elimina un partido programado siempre que no haya sido jugado."""
    fp = db.get(FixturePartido, id_fixture_partido)
    if not fp:
        raise HTTPException(404, "Partido del fixture no encontrado")
    if fp.estado == "TERMINADO":
        raise HTTPException(400, "No se puede eliminar un partido ya jugado")

    db.delete(fp)
    db.commit()


# ── Generación automática de fixture (round-robin) ────────────────────────────

def _round_robin(equipos: list) -> tuple[list[list[tuple]], list]:
    """
    Genera las rondas de un torneo round-robin.
    Con número impar de equipos agrega un BYE para el descanso.
    Devuelve (fechas, descansos_por_fecha):
      - fechas: lista de rondas, cada ronda es lista de tuplas (local, visitante)
      - descansos_por_fecha: lista con el equipo que descansa en cada ronda (o None si par)
    """
    n = len(equipos)
    equipos = list(equipos)
    tiene_bye = n % 2 == 1
    if tiene_bye:
        equipos.append(None)  # BYE
        n += 1

    fechas = []
    descansos = []
    mitad = n // 2
    fijo = equipos[0]
    rotativos = equipos[1:]

    for _ in range(n - 1):
        ronda = []
        descansa = None
        circulo = [fijo] + rotativos
        for i in range(mitad):
            local = circulo[i]
            visitante = circulo[n - 1 - i]
            if local is None:
                descansa = visitante
            elif visitante is None:
                descansa = local
            else:
                ronda.append((local, visitante))
        fechas.append(ronda)
        descansos.append(descansa)
        rotativos = [rotativos[-1]] + rotativos[:-1]

    return fechas, descansos


def _obtener_equipos_torneo(db: Session, id_torneo: int) -> list[dict]:
    """Devuelve lista de dicts {id_equipo, nombre} inscriptos en el torneo."""
    inscripciones = (
        db.query(InscripcionTorneo)
        .filter(
            InscripcionTorneo.id_torneo == id_torneo,
            InscripcionTorneo.fecha_baja.is_(None),
        )
        .join(Equipo, InscripcionTorneo.id_equipo == Equipo.id_equipo)
        .all()
    )
    if len(inscripciones) < 2:
        raise HTTPException(400, "Se necesitan al menos 2 equipos inscriptos para generar el fixture")

    return [{"id": i.id_equipo, "nombre": i.equipo.nombre} for i in inscripciones]


def previsualizar_fixture(db: Session, id_torneo: int, tipo: str) -> FixturePreviewResponse:
    """Genera el fixture en memoria sin guardar nada. Devuelve la previsualización."""
    from app.schemas.fixture_partido import FixtureDescansoPreview

    equipos = _obtener_equipos_torneo(db, id_torneo)
    random.shuffle(equipos)

    rondas_ida, descansos_ida = _round_robin(equipos)
    ruedas = [("ida", rondas_ida, descansos_ida)]

    if tipo == "ida_y_vuelta":
        rondas_vuelta = [[(v, l) for l, v in ronda] for ronda in rondas_ida]
        ruedas.append(("vuelta", rondas_vuelta, descansos_ida))
    elif tipo == "ida_y_vuelta_aleatorio":
        equipos_vuelta = list(equipos)
        random.shuffle(equipos_vuelta)
        rondas_vuelta_raw, descansos_vuelta = _round_robin(equipos_vuelta)
        # Reordena la vuelta para evitar que la primera fecha de vuelta repita
        # los mismos enfrentamientos que la última de ida
        enfrentamientos_ultima_ida = {
            frozenset([l["id"], v["id"]]) for l, v in rondas_ida[-1]
        }
        mejor_inicio = 0
        for idx, ronda in enumerate(rondas_vuelta_raw):
            enfrentamientos = {frozenset([l["id"], v["id"]]) for l, v in ronda}
            if not enfrentamientos & enfrentamientos_ultima_ida:
                mejor_inicio = idx
                break
        rondas_vuelta = rondas_vuelta_raw[mejor_inicio:] + rondas_vuelta_raw[:mejor_inicio]
        descansos_vuelta = descansos_vuelta[mejor_inicio:] + descansos_vuelta[:mejor_inicio]
        # Invierte local/visitante para la vuelta
        rondas_vuelta = [[(v, l) for l, v in ronda] for ronda in rondas_vuelta]
        ruedas.append(("vuelta", rondas_vuelta, descansos_vuelta))

    partidos_preview: list[FixturePartidoPreview] = []
    descansos_preview: list[FixtureDescansoPreview] = []
    equipo_nombre = {e["id"]: e["nombre"] for e in equipos}

    for rueda, rondas, descansos in ruedas:
        offset = len(rondas_ida) if rueda == "vuelta" else 0
        for i, (ronda, descansa) in enumerate(zip(rondas, descansos), start=1):
            numero_fecha = i + offset
            for local, visitante in ronda:
                partidos_preview.append(FixturePartidoPreview(
                    numero_fecha=numero_fecha,
                    rueda=rueda,
                    id_equipo_local=local["id"],
                    id_equipo_visitante=visitante["id"],
                    nombre_equipo_local=equipo_nombre[local["id"]],
                    nombre_equipo_visitante=equipo_nombre[visitante["id"]],
                ))
            if descansa:
                descansos_preview.append(FixtureDescansoPreview(
                    numero_fecha=numero_fecha,
                    rueda=rueda,
                    id_equipo=descansa["id"],
                    nombre_equipo=equipo_nombre[descansa["id"]],
                ))

    fechas_unicas = {p.numero_fecha for p in partidos_preview}
    return FixturePreviewResponse(
        total_fechas=len(fechas_unicas),
        total_partidos=len(partidos_preview),
        tipo=tipo,
        partidos=partidos_preview,
        descansos=descansos_preview,
    )


def generar_fixture(db: Session, id_torneo: int, tipo: str, username: str) -> list:
    """
    Genera y guarda el fixture completo para un torneo.
    Falla si ya existen partidos no jugados en el fixture.
    """
    tiene_jugados = (
        db.query(FixturePartido)
        .filter(
            FixturePartido.id_torneo == id_torneo,
            FixturePartido.estado == "TERMINADO",
        )
        .first()
    )
    if tiene_jugados:
        raise HTTPException(
            400,
            "El torneo tiene partidos ya jugados. No se puede regenerar el fixture.",
        )

    # borra fixture previo (partidos no jugados y fechas)
    db.query(FixturePartido).filter(FixturePartido.id_torneo == id_torneo).delete()
    db.query(FixtureFecha).filter(FixtureFecha.id_torneo == id_torneo).delete()
    db.flush()

    equipos = _obtener_equipos_torneo(db, id_torneo)
    random.shuffle(equipos)

    rondas_ida, descansos_ida = _round_robin(equipos)
    ruedas = [("ida", rondas_ida, descansos_ida)]
    if tipo == "ida_y_vuelta":
        rondas_vuelta = [[(v, l) for l, v in ronda] for ronda in rondas_ida]
        ruedas.append(("vuelta", rondas_vuelta, descansos_ida))
    elif tipo == "ida_y_vuelta_aleatorio":
        equipos_vuelta = list(equipos)
        random.shuffle(equipos_vuelta)
        rondas_vuelta_raw, descansos_vuelta = _round_robin(equipos_vuelta)
        enfrentamientos_ultima_ida = {
            frozenset([l["id"], v["id"]]) for l, v in rondas_ida[-1]
        }
        mejor_inicio = 0
        for idx, ronda in enumerate(rondas_vuelta_raw):
            enfrentamientos = {frozenset([l["id"], v["id"]]) for l, v in ronda}
            if not enfrentamientos & enfrentamientos_ultima_ida:
                mejor_inicio = idx
                break
        rondas_vuelta = rondas_vuelta_raw[mejor_inicio:] + rondas_vuelta_raw[:mejor_inicio]
        descansos_vuelta = descansos_vuelta[mejor_inicio:] + descansos_vuelta[:mejor_inicio]
        rondas_vuelta = [[(v, l) for l, v in ronda] for ronda in rondas_vuelta]
        ruedas.append(("vuelta", rondas_vuelta, descansos_vuelta))

    nuevos: list[FixturePartido] = []

    for rueda, rondas, descansos in ruedas:
        offset = len(rondas_ida) if rueda == "vuelta" else 0
        for i, (ronda, descansa) in enumerate(zip(rondas, descansos), start=1):
            numero_fecha = i + offset
            fecha_obj = FixtureFecha(
                id_torneo=id_torneo,
                numero_fecha=numero_fecha,
                rueda=rueda,
                id_equipo_descansa=descansa["id"] if descansa else None,
                creado_por=username,
            )
            db.add(fecha_obj)
            db.flush()

            for local, visitante in ronda:
                fp = FixturePartido(
                    id_torneo=id_torneo,
                    id_fixture_fecha=fecha_obj.id_fixture_fecha,
                    id_equipo_local=local["id"],
                    id_equipo_visitante=visitante["id"],
                    numero_fecha=numero_fecha,
                    creado_por=username,
                )
                db.add(fp)
                nuevos.append(fp)

    db.commit()
    for fp in nuevos:
        db.refresh(fp)

    return listar_fixture_por_torneo(db, id_torneo)


def eliminar_fixture_torneo(db: Session, id_torneo: int) -> None:
    """Elimina todo el fixture de un torneo si no hay partidos jugados."""
    tiene_jugados = (
        db.query(FixturePartido)
        .filter(
            FixturePartido.id_torneo == id_torneo,
            FixturePartido.estado == "TERMINADO",
        )
        .first()
    )
    if tiene_jugados:
        raise HTTPException(400, "Hay partidos ya jugados. No se puede eliminar el fixture completo.")

    db.query(FixturePartido).filter(FixturePartido.id_torneo == id_torneo).delete()
    db.query(FixtureFecha).filter(FixtureFecha.id_torneo == id_torneo).delete()
    db.commit()
