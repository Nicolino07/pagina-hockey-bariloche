"""
Servicios para generación y gestión de fixture de playoff (eliminación directa).
"""
import math
import random
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.fixture_partido import FixturePartido
from app.models.fixture_playoff_ronda import FixturePlayoffRonda
from app.models.inscripcion_torneo import InscripcionTorneo
from app.models.equipo import Equipo
from app.schemas.fixture_playoff import GenerarPlayoffRequest, PlayoffPreviewResponse


# Nombres de ronda según cantidad de partidos en esa ronda
_NOMBRES_RONDA = {
    1: "Final",
    2: "Semifinal",
    4: "Cuartos de final",
    8: "Octavos de final",
    16: "Dieciseisavos de final",
}


def _nombre_ronda(n_partidos: int) -> str:
    return _NOMBRES_RONDA.get(n_partidos, f"Ronda de {n_partidos * 2}")


def _obtener_equipos(db: Session, id_torneo: int) -> list[dict]:
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
        raise HTTPException(400, "Se necesitan al menos 2 equipos inscriptos")
    if len(inscripciones) % 2 != 0:
        raise HTTPException(400, "El número de equipos debe ser par para un playoff")
    return [{"id": i.id_equipo, "nombre": i.equipo.nombre} for i in inscripciones]


def _calcular_rondas(n_equipos: int) -> list[dict]:
    """
    Calcula las rondas necesarias para n_equipos (siempre par).
    Si n no es potencia de 2, los equipos sobrantes van a un Repechaje previo.
    Devuelve lista de dicts con nombre, orden, n_partidos, tiene_bye.
    """
    rondas = []
    orden = 1

    # Potencia de 2 superior o igual
    pot2 = 2 ** math.ceil(math.log2(n_equipos))

    if pot2 != n_equipos:
        # Equipos que juegan repechaje = 2 * (n_equipos - pot2//2)
        n_repechaje = 2 * (n_equipos - pot2 // 2)
        n_bye = n_equipos - n_repechaje
        rondas.append({
            "nombre": "Repechaje",
            "orden": orden,
            "n_partidos": n_repechaje // 2,
            "n_bye": n_bye,
        })
        orden += 1
        # Después del repechaje quedan pot2//2 equipos
        n_siguiente = pot2 // 2
    else:
        n_siguiente = n_equipos

    while n_siguiente >= 2:
        n_partidos = n_siguiente // 2
        rondas.append({
            "nombre": _nombre_ronda(n_partidos),
            "orden": orden,
            "n_partidos": n_partidos,
            "n_bye": 0,
        })
        orden += 1
        n_siguiente = n_partidos

    return rondas


def previsualizar_playoff(
    db: Session, id_torneo: int, request: GenerarPlayoffRequest
) -> PlayoffPreviewResponse:
    # En modo manual usamos los duelos como primera ronda
    if request.asignacion == "manual" and request.duelos:
        equipos_todos = _obtener_equipos(db, id_torneo)
        equipos_por_id = {e["id"]: e["nombre"] for e in equipos_todos}
        n_equipos = len(request.duelos) * 2
        rondas_config = _calcular_rondas(n_equipos)
        primera_ronda_partidos = [
            {
                "local": equipos_por_id.get(d.id_equipo_local, f"Equipo {d.id_equipo_local}"),
                "visitante": equipos_por_id.get(d.id_equipo_visitante, f"Equipo {d.id_equipo_visitante}"),
                "placeholder_local": None,
                "placeholder_visitante": None,
            }
            for d in request.duelos
        ]
    else:
        equipos = _obtener_equipos(db, id_torneo)
        random.shuffle(equipos)
        n_equipos = len(equipos)
        rondas_config = _calcular_rondas(n_equipos)
        equipos_disponibles = list(equipos)
        primera_ronda_partidos = None  # se calcula abajo

    rondas_preview = []

    for i, ronda in enumerate(rondas_config):
        partidos = []
        n = ronda["n_partidos"]

        if i == 0:
            if primera_ronda_partidos is not None:
                partidos = primera_ronda_partidos
            elif ronda.get("n_bye", 0) > 0:
                jugadores = equipos_disponibles[: n * 2]
                byes = equipos_disponibles[n * 2 :]
                for j in range(0, len(jugadores), 2):
                    partidos.append({
                        "local": jugadores[j]["nombre"],
                        "visitante": jugadores[j + 1]["nombre"],
                        "placeholder_local": None,
                        "placeholder_visitante": None,
                    })
                for bye in byes:
                    partidos.append({"bye": bye["nombre"]})
            else:
                for j in range(0, n * 2, 2):
                    partidos.append({
                        "local": equipos_disponibles[j]["nombre"],
                        "visitante": equipos_disponibles[j + 1]["nombre"],
                        "placeholder_local": None,
                        "placeholder_visitante": None,
                    })
        else:
            ronda_anterior = rondas_config[i - 1]
            nombre_ant = ronda_anterior["nombre"]
            for j in range(1, n + 1):
                partidos.append({
                    "local": None,
                    "visitante": None,
                    "placeholder_local": f"Ganador {nombre_ant} {j}",
                    "placeholder_visitante": f"Ganador {nombre_ant} {n + j if n > 1 else j + 1}",
                })

        rondas_preview.append({
            "nombre": ronda["nombre"],
            "orden": ronda["orden"],
            "ida_y_vuelta": request.formato == "ida_y_vuelta",
            "partidos": partidos,
        })

    total_partidos = sum(
        len([p for p in r["partidos"] if "bye" not in p])
        for r in rondas_preview
    )
    if request.formato == "ida_y_vuelta":
        total_partidos *= 2

    return PlayoffPreviewResponse(
        total_rondas=len(rondas_config),
        total_partidos=total_partidos,
        formato=request.formato,
        rondas=rondas_preview,
    )


def generar_playoff(
    db: Session, id_torneo: int, request: GenerarPlayoffRequest, username: str
) -> list:
    # Verificar que no haya partidos jugados
    tiene_jugados = (
        db.query(FixturePartido)
        .filter(
            FixturePartido.id_torneo == id_torneo,
            FixturePartido.estado == "TERMINADO",
        )
        .first()
    )
    if tiene_jugados:
        raise HTTPException(400, "El torneo tiene partidos ya jugados. No se puede regenerar el fixture.")

    # Limpiar fixture previo
    db.query(FixturePartido).filter(FixturePartido.id_torneo == id_torneo).delete()
    db.query(FixturePlayoffRonda).filter(FixturePlayoffRonda.id_torneo == id_torneo).delete()
    db.flush()

    if request.asignacion == "manual" and request.duelos:
        return _generar_playoff_manual(db, id_torneo, request, username)

    equipos = _obtener_equipos(db, id_torneo)
    random.shuffle(equipos)
    rondas_config = _calcular_rondas(len(equipos))

    nuevos_partidos = []

    for i, ronda in enumerate(rondas_config):
        ronda_obj = FixturePlayoffRonda(
            id_torneo=id_torneo,
            nombre=ronda["nombre"],
            orden=ronda["orden"],
            ida_y_vuelta=request.formato == "ida_y_vuelta",
            creado_por=username,
        )
        db.add(ronda_obj)
        db.flush()

        n = ronda["n_partidos"]

        if i == 0 and ronda.get("n_bye", 0) > 0:
            jugadores = equipos[: n * 2]
            for j in range(0, len(jugadores), 2):
                nuevos_partidos += _crear_partido_playoff(
                    db, id_torneo, ronda_obj.id_fixture_playoff_ronda,
                    id_local=jugadores[j]["id"],
                    id_visitante=jugadores[j + 1]["id"],
                    formato=request.formato,
                    username=username,
                )
        elif i == 0:
            for j in range(0, n * 2, 2):
                nuevos_partidos += _crear_partido_playoff(
                    db, id_torneo, ronda_obj.id_fixture_playoff_ronda,
                    id_local=equipos[j]["id"],
                    id_visitante=equipos[j + 1]["id"],
                    formato=request.formato,
                    username=username,
                )
        else:
            ronda_anterior = rondas_config[i - 1]
            nombre_ant = ronda_anterior["nombre"]
            for j in range(1, n + 1):
                ph_local = f"Ganador {nombre_ant} {j}"
                ph_visitante = f"Ganador {nombre_ant} {n + j if n > 1 else j + 1}"
                nuevos_partidos += _crear_partido_playoff(
                    db, id_torneo, ronda_obj.id_fixture_playoff_ronda,
                    placeholder_local=ph_local,
                    placeholder_visitante=ph_visitante,
                    formato=request.formato,
                    username=username,
                )

    db.commit()
    for fp in nuevos_partidos:
        db.refresh(fp)

    from app.services.fixture_services import listar_fixture_por_torneo
    return listar_fixture_por_torneo(db, id_torneo)


def _crear_partido_playoff(
    db: Session,
    id_torneo: int,
    id_ronda: int,
    formato: str,
    username: str,
    id_local: int | None = None,
    id_visitante: int | None = None,
    placeholder_local: str | None = None,
    placeholder_visitante: str | None = None,
) -> list[FixturePartido]:
    """Crea 1 o 2 partidos según el formato (ida / ida y vuelta)."""
    partidos = []
    p1 = FixturePartido(
        id_torneo=id_torneo,
        id_fixture_playoff_ronda=id_ronda,
        id_equipo_local=id_local,
        id_equipo_visitante=id_visitante,
        placeholder_local=placeholder_local,
        placeholder_visitante=placeholder_visitante,
        creado_por=username,
    )
    db.add(p1)
    partidos.append(p1)

    if formato == "ida_y_vuelta" and (id_local or placeholder_local):
        p2 = FixturePartido(
            id_torneo=id_torneo,
            id_fixture_playoff_ronda=id_ronda,
            id_equipo_local=id_visitante,
            id_equipo_visitante=id_local,
            placeholder_local=placeholder_visitante,
            placeholder_visitante=placeholder_local,
            creado_por=username,
        )
        db.add(p2)
        partidos.append(p2)

    db.flush()
    return partidos


def _generar_playoff_manual(
    db: Session, id_torneo: int, request: GenerarPlayoffRequest, username: str
) -> list:
    """
    Genera playoff con cruces del primer round definidos manualmente.
    Las rondas siguientes se generan automáticamente con placeholders,
    usando la misma lógica que el modo automático.
    """
    duelos = request.duelos or []
    n_equipos = len(duelos) * 2
    if n_equipos < 2:
        raise HTTPException(400, "Se necesitan al menos 2 equipos para generar el playoff.")

    rondas_config = _calcular_rondas(n_equipos)
    nuevos_partidos = []

    for i, ronda in enumerate(rondas_config):
        ronda_obj = FixturePlayoffRonda(
            id_torneo=id_torneo,
            nombre=ronda["nombre"],
            orden=ronda["orden"],
            ida_y_vuelta=request.formato == "ida_y_vuelta",
            creado_por=username,
        )
        db.add(ronda_obj)
        db.flush()

        if i == 0:
            # Primera ronda: usar los duelos definidos manualmente
            for duelo in duelos:
                nuevos_partidos += _crear_partido_playoff(
                    db, id_torneo, ronda_obj.id_fixture_playoff_ronda,
                    id_local=duelo.id_equipo_local,
                    id_visitante=duelo.id_equipo_visitante,
                    formato=request.formato,
                    username=username,
                )
        else:
            # Rondas siguientes: placeholders automáticos
            ronda_anterior = rondas_config[i - 1]
            nombre_ant = ronda_anterior["nombre"]
            n = ronda["n_partidos"]
            for j in range(1, n + 1):
                ph_local = f"Ganador {nombre_ant} {j}"
                ph_visitante = f"Ganador {nombre_ant} {n + j if n > 1 else j + 1}"
                nuevos_partidos += _crear_partido_playoff(
                    db, id_torneo, ronda_obj.id_fixture_playoff_ronda,
                    placeholder_local=ph_local,
                    placeholder_visitante=ph_visitante,
                    formato=request.formato,
                    username=username,
                )

    db.commit()
    for fp in nuevos_partidos:
        db.refresh(fp)

    from app.services.fixture_services import listar_fixture_por_torneo
    return listar_fixture_por_torneo(db, id_torneo)


def avanzar_ganador(db: Session, id_fixture_partido: int, username: str) -> None:
    """
    Cuando un partido de playoff se marca como TERMINADO,
    busca el partido de la siguiente ronda con el placeholder correspondiente
    y lo reemplaza por el equipo ganador.
    """
    fp = db.get(FixturePartido, id_fixture_partido)
    if not fp or not fp.id_fixture_playoff_ronda:
        return

    ronda = db.get(FixturePlayoffRonda, fp.id_fixture_playoff_ronda)
    if not ronda:
        return

    from app.models.partido import PartidoDetallado
    if not fp.id_partido_real:
        return
    db.flush()
    db.expire_all()
    resultado = db.get(PartidoDetallado, fp.id_partido_real)
    if not resultado:
        return

    gl = resultado.goles_local
    gv = resultado.goles_visitante
    if gl is None or gv is None:
        return

    if ronda.ida_y_vuelta:
        # En ida y vuelta necesitamos que ambos partidos de la serie terminen
        # para poder sumar los goles. Deferimos hasta que el segundo termine.
        return _avanzar_ganador_ida_vuelta(db, fp, ronda, username)

    if gl > gv:
        id_ganador = fp.id_equipo_local
    elif gv > gl:
        id_ganador = fp.id_equipo_visitante
    else:
        return  # Empate — no avanza automáticamente

    _asignar_ganador_siguiente_ronda(db, fp, ronda, id_ganador, username)


def _asignar_ganador_siguiente_ronda(
    db: Session,
    fp: FixturePartido,
    ronda: FixturePlayoffRonda,
    id_ganador: int,
    username: str,
) -> None:
    """Busca el placeholder en la ronda siguiente y lo reemplaza con el equipo ganador."""
    partidos_ronda = (
        db.query(FixturePartido)
        .filter(FixturePartido.id_fixture_playoff_ronda == ronda.id_fixture_playoff_ronda)
        .order_by(FixturePartido.id_fixture_partido)
        .all()
    )
    indices = [p.id_fixture_partido for p in partidos_ronda]
    pos = indices.index(fp.id_fixture_partido)
    numero_llave = pos + 1

    placeholder = f"Ganador {ronda.nombre} {numero_llave}"

    siguientes = (
        db.query(FixturePartido)
        .join(FixturePlayoffRonda)
        .filter(
            FixturePlayoffRonda.id_torneo == ronda.id_torneo,
            FixturePlayoffRonda.orden == ronda.orden + 1,
        )
        .filter(
            (FixturePartido.placeholder_local == placeholder) |
            (FixturePartido.placeholder_visitante == placeholder)
        )
        .all()
    )

    for siguiente in siguientes:
        if siguiente.placeholder_local == placeholder:
            siguiente.id_equipo_local = id_ganador
            siguiente.placeholder_local = None
        if siguiente.placeholder_visitante == placeholder:
            siguiente.id_equipo_visitante = id_ganador
            siguiente.placeholder_visitante = None
        siguiente.actualizado_por = username

    db.flush()


def _avanzar_ganador_ida_vuelta(
    db: Session,
    fp: FixturePartido,
    ronda: FixturePlayoffRonda,
    username: str,
) -> None:
    """
    Para series ida y vuelta: espera que ambos partidos terminen,
    suma goles y determina el ganador global de la llave.
    """
    from app.models.partido import PartidoDetallado

    # Todos los partidos de la ronda ordenados
    partidos_ronda = (
        db.query(FixturePartido)
        .filter(FixturePartido.id_fixture_playoff_ronda == ronda.id_fixture_playoff_ronda)
        .order_by(FixturePartido.id_fixture_partido)
        .all()
    )

    indices = [p.id_fixture_partido for p in partidos_ronda]
    pos = indices.index(fp.id_fixture_partido)
    # Los partidos van de a pares: posición 0-1 = llave 1, 2-3 = llave 2, etc.
    llave_idx = pos // 2
    numero_llave = llave_idx + 1
    par = partidos_ronda[llave_idx * 2 : llave_idx * 2 + 2]

    # Ambos deben estar terminados
    if len(par) < 2 or par[0].estado != "TERMINADO" or par[1].estado != "TERMINADO":
        return
    if not par[0].id_partido_real or not par[1].id_partido_real:
        return

    db.flush()
    db.expire_all()
    p1 = db.get(PartidoDetallado, par[0].id_partido_real)
    p2 = db.get(PartidoDetallado, par[1].id_partido_real)
    if not p1 or not p2:
        return

    gl1 = (p1.goles_local or 0) + (p2.goles_visitante or 0)
    gv1 = (p1.goles_visitante or 0) + (p2.goles_local or 0)

    if gl1 > gv1:
        id_ganador = par[0].id_equipo_local
    elif gv1 > gl1:
        id_ganador = par[0].id_equipo_visitante
    else:
        return  # Empate global — no avanza automáticamente

    placeholder = f"Ganador {ronda.nombre} {numero_llave}"

    siguientes = (
        db.query(FixturePartido)
        .join(FixturePlayoffRonda)
        .filter(
            FixturePlayoffRonda.id_torneo == ronda.id_torneo,
            FixturePlayoffRonda.orden == ronda.orden + 1,
        )
        .filter(
            (FixturePartido.placeholder_local == placeholder) |
            (FixturePartido.placeholder_visitante == placeholder)
        )
        .all()
    )

    for siguiente in siguientes:
        if siguiente.placeholder_local == placeholder:
            siguiente.id_equipo_local = id_ganador
            siguiente.placeholder_local = None
        if siguiente.placeholder_visitante == placeholder:
            siguiente.id_equipo_visitante = id_ganador
            siguiente.placeholder_visitante = None
        siguiente.actualizado_por = username

    db.flush()


def crear_ronda_playoff(db: Session, id_torneo: int, nombre: str, ida_y_vuelta: bool, username: str) -> FixturePlayoffRonda:
    """Crea una ronda de playoff manualmente para un torneo."""
    ultimo_orden = (
        db.query(FixturePlayoffRonda)
        .filter(FixturePlayoffRonda.id_torneo == id_torneo)
        .count()
    )
    ronda = FixturePlayoffRonda(
        id_torneo=id_torneo,
        nombre=nombre,
        orden=ultimo_orden + 1,
        ida_y_vuelta=ida_y_vuelta,
        creado_por=username,
    )
    db.add(ronda)
    db.commit()
    db.refresh(ronda)
    return ronda


def listar_rondas_playoff(db: Session, id_torneo: int) -> list[FixturePlayoffRonda]:
    return (
        db.query(FixturePlayoffRonda)
        .filter(FixturePlayoffRonda.id_torneo == id_torneo)
        .order_by(FixturePlayoffRonda.orden)
        .all()
    )
