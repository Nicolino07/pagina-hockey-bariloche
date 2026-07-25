"""
Servicios para la gestión del fixture (partidos programados).
"""
import random
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.fixture_fecha import FixtureFecha
from app.models.fixture_playoff_ronda import FixturePlayoffRonda
from app.models.inscripcion_torneo import InscripcionTorneo
from app.models.partido import Partido, PartidoDetallado
from app.models.equipo import Equipo
from app.models.torneo import Torneo
from app.models.persona import Persona
from app.schemas.fixture_partido import (
    FixturePartidoCreate,
    FixturePartidoUpdate,
    FixturePartidoPreview,
    FixturePreviewResponse,
)


def _enriquecer_partido(p: Partido, db: Session) -> dict:
    """Arma la respuesta del fixture directamente desde un `partido`.
    Mantiene la misma forma que _enriquecer (clave id_fixture_partido = id_partido)."""
    el = db.get(Equipo, p.id_equipo_local) if p.id_equipo_local else None
    ev = db.get(Equipo, p.id_equipo_visitante) if p.id_equipo_visitante else None
    t = db.get(Torneo, p.id_torneo)
    ff = db.get(FixtureFecha, p.id_fixture_fecha) if p.id_fixture_fecha else None
    ronda = db.get(FixturePlayoffRonda, p.id_fixture_playoff_ronda) if p.id_fixture_playoff_ronda else None
    estado = str(getattr(p.estado_partido, "value", p.estado_partido))

    data = {
        "id_fixture_partido": p.id_partido,
        "id_torneo": p.id_torneo,
        "id_equipo_local": p.id_equipo_local,
        "id_equipo_visitante": p.id_equipo_visitante,
        "id_club_local": el.id_club if el else None,
        "id_club_visitante": ev.id_club if ev else None,
        "nombre_equipo_local": el.nombre if el else None,
        "nombre_equipo_visitante": ev.nombre if ev else None,
        "nombre_torneo": t.nombre if t else None,
        "categoria": t.categoria.value if t else None,
        "division": t.division if t else None,
        "genero": t.genero.value if t else None,
        "fecha_programada": p.fecha,
        "horario": p.horario,
        "ubicacion": p.ubicacion,
        "numero_fecha": p.numero_fecha,
        "estado": estado,
        "id_partido_real": p.id_partido,
        "goles_local": None,
        "goles_visitante": None,
        "id_arbitro1": p.id_arbitro1,
        "id_arbitro2": p.id_arbitro2,
        "nombre_arbitro1": None,
        "nombre_arbitro2": None,
        "nombre_equipo_descansa": None,
        "rueda": ff.rueda if ff else None,
        "placeholder_local": p.placeholder_local,
        "placeholder_visitante": p.placeholder_visitante,
        "id_fixture_playoff_ronda": p.id_fixture_playoff_ronda,
        "nombre_ronda_playoff": ronda.nombre if ronda else None,
        "es_tercer_puesto": ronda.es_tercer_puesto if ronda else False,
        "creado_en": p.creado_en,
        "creado_por": p.creado_por,
    }

    if estado == "TERMINADO":
        detalle = db.get(PartidoDetallado, p.id_partido)
        if detalle:
            data["goles_local"] = detalle.goles_local
            data["goles_visitante"] = detalle.goles_visitante
    if p.id_arbitro1:
        a1 = db.get(Persona, p.id_arbitro1)
        data["nombre_arbitro1"] = f"{a1.apellido} {a1.nombre}" if a1 else None
    if p.id_arbitro2:
        a2 = db.get(Persona, p.id_arbitro2)
        data["nombre_arbitro2"] = f"{a2.apellido} {a2.nombre}" if a2 else None
    if ff and ff.id_equipo_descansa:
        ed = db.get(Equipo, ff.id_equipo_descansa)
        data["nombre_equipo_descansa"] = ed.nombre if ed else None
    return data


def obtener_fixture_por_id(db: Session, id_fixture_partido: int):
    """Devuelve un partido del fixture por su ID (= id_partido)."""
    p = db.get(Partido, id_fixture_partido)
    if not p:
        raise HTTPException(404, "Partido del fixture no encontrado")
    return _enriquecer_partido(p, db)


def crear_fixture_partido(db: Session, data: FixturePartidoCreate, username: str):
    """Crea un partido programado en el fixture."""
    if data.id_equipo_local == data.id_equipo_visitante:
        raise HTTPException(400, "El equipo local y visitante deben ser distintos")

    p = Partido(
        id_torneo=data.id_torneo,
        id_equipo_local=data.id_equipo_local,
        id_equipo_visitante=data.id_equipo_visitante,
        fecha=data.fecha_programada,
        horario=data.horario,
        ubicacion=data.ubicacion,
        numero_fecha=data.numero_fecha,
        id_fixture_playoff_ronda=data.id_fixture_playoff_ronda,
        estado_partido=data.estado if data.estado else ("PENDIENTE" if data.fecha_programada else "BORRADOR"),
        creado_por=username,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return _enriquecer_partido(p, db)


def listar_fixture_por_torneo(db: Session, id_torneo: int, solo_publicos: bool = False) -> list:
    """Lista los partidos de un torneo ordenados por fecha.
    Con solo_publicos=True excluye los BORRADOR (no tienen fecha asignada).
    """
    query = db.query(Partido).filter(Partido.id_torneo == id_torneo)
    if solo_publicos:
        query = query.filter(Partido.estado_partido != "BORRADOR")
    partidos = query.order_by(
        Partido.numero_fecha.asc().nulls_last(),
        Partido.fecha.asc().nulls_last(),
        Partido.horario.asc().nulls_last(),
    ).all()
    return [_enriquecer_partido(p, db) for p in partidos]


def listar_fixture_proximos(db: Session, id_torneo: int | None = None) -> list:
    """Lista partidos visibles al público: PENDIENTE, SUSPENDIDO y REPROGRAMADO."""
    query = db.query(Partido).filter(
        Partido.estado_partido.in_(["PENDIENTE", "SUSPENDIDO", "REPROGRAMADO"])
    )
    if id_torneo:
        query = query.filter(Partido.id_torneo == id_torneo)

    partidos = query.order_by(
        Partido.fecha.asc().nulls_last(),
        Partido.horario.asc().nulls_last(),
    ).all()
    return [_enriquecer_partido(p, db) for p in partidos]


def actualizar_fixture_partido(
    db: Session, id_fixture_partido: int, data: FixturePartidoUpdate, username: str
):
    """Edita fecha, horario, ubicación, número de fecha o estado de un partido programado.
    Si se asigna fecha_programada a un BORRADOR, pasa automáticamente a PENDIENTE.
    Si se quita la fecha_programada de un PENDIENTE, vuelve a BORRADOR.
    """
    p = db.get(Partido, id_fixture_partido)
    if not p:
        raise HTTPException(404, "Partido del fixture no encontrado")
    if str(getattr(p.estado_partido, "value", p.estado_partido)) == "TERMINADO":
        raise HTTPException(400, "No se puede editar un partido ya jugado")

    cambios = data.model_dump(exclude_unset=True)
    # Mapeo de campos del fixture a columnas de partido.
    if "fecha_programada" in cambios:
        p.fecha = cambios["fecha_programada"]
    if "horario" in cambios:
        p.horario = cambios["horario"]
    if "ubicacion" in cambios:
        p.ubicacion = cambios["ubicacion"]
    if "numero_fecha" in cambios:
        p.numero_fecha = cambios["numero_fecha"]
    if "estado" in cambios:
        p.estado_partido = cambios["estado"]

    # transición automática de estado según la fecha
    if "estado" not in cambios:
        estado_actual = str(getattr(p.estado_partido, "value", p.estado_partido))
        if p.fecha and estado_actual == "BORRADOR":
            p.estado_partido = "PENDIENTE"
        elif not p.fecha and estado_actual == "PENDIENTE":
            p.estado_partido = "BORRADOR"

    p.actualizado_por = username

    # avanzar ganador automáticamente en playoffs
    if str(getattr(p.estado_partido, "value", p.estado_partido)) == "TERMINADO" and p.id_fixture_playoff_ronda:
        from app.services.playoff_services import avanzar_ganador
        avanzar_ganador(db, p.id_partido, username)

    db.commit()
    db.refresh(p)
    return _enriquecer_partido(p, db)


def eliminar_fixture_partido(db: Session, id_fixture_partido: int):
    """Elimina un partido programado siempre que no haya sido jugado."""
    p = db.get(Partido, id_fixture_partido)
    if not p:
        raise HTTPException(404, "Partido del fixture no encontrado")
    if str(getattr(p.estado_partido, "value", p.estado_partido)) == "TERMINADO":
        raise HTTPException(400, "No se puede eliminar un partido ya jugado")

    db.delete(p)
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
        db.query(Partido)
        .filter(
            Partido.id_torneo == id_torneo,
            Partido.estado_partido == "TERMINADO",
        )
        .first()
    )
    if tiene_jugados:
        raise HTTPException(
            400,
            "El torneo tiene partidos ya jugados. No se puede regenerar el fixture.",
        )

    # borra los partidos programados (no jugados) y las jornadas previas
    db.query(Partido).filter(
        Partido.id_torneo == id_torneo,
        Partido.estado_partido != "TERMINADO",
    ).delete(synchronize_session=False)
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

    nuevos: list[Partido] = []

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
                p = Partido(
                    id_torneo=id_torneo,
                    id_fixture_fecha=fecha_obj.id_fixture_fecha,
                    id_equipo_local=local["id"],
                    id_equipo_visitante=visitante["id"],
                    numero_fecha=numero_fecha,
                    estado_partido="BORRADOR",
                    creado_por=username,
                )
                db.add(p)
                nuevos.append(p)

    db.commit()
    for p in nuevos:
        db.refresh(p)

    return listar_fixture_por_torneo(db, id_torneo)


def eliminar_fixture_torneo(db: Session, id_torneo: int) -> None:
    """Elimina todo el fixture de un torneo si no hay partidos jugados."""
    tiene_jugados = (
        db.query(Partido)
        .filter(
            Partido.id_torneo == id_torneo,
            Partido.estado_partido == "TERMINADO",
        )
        .first()
    )
    if tiene_jugados:
        raise HTTPException(400, "Hay partidos ya jugados. No se puede eliminar el fixture completo.")

    db.query(Partido).filter(
        Partido.id_torneo == id_torneo,
        Partido.estado_partido != "TERMINADO",
    ).delete(synchronize_session=False)
    db.query(FixtureFecha).filter(FixtureFecha.id_torneo == id_torneo).delete()
    db.commit()
