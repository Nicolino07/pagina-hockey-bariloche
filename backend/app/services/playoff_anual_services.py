# app/services/playoff_anual_services.py
"""Playoff por el campeón del año: creación y siembra desde la tabla anual.

Se diferencia del playoff común en de dónde salen los equipos. El común cuelga
de un `torneo_base_id` y se siembra con la tabla de ese único torneo; este
cuelga de una **temporada** y se siembra con la suma del año (Apertura +
Clausura + lo que la liga haya marcado como REGULAR).

El torneo que se crea queda con `rol_en_temporada = FINAL_ANUAL`, que es lo que
lee `playoff_services` para saber qué tabla mirar. Como es FINAL_ANUAL y no
REGULAR, sus propios partidos **no** vuelven a sumar a la tabla anual.
"""
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.enums import RolTorneoTemporada, TipoTorneo
from app.models.inscripcion_torneo import InscripcionTorneo
from app.models.plantel import Plantel
from app.models.torneo import Torneo
from app.schemas.fixture_playoff import GenerarPlayoffRequest
from app.schemas.temporada import CrearPlayoffAnualRequest, PlayoffAnualResponse
from app.schemas.torneo import TorneoCreate
from app.services import (
    planteles_services,
    playoff_services,
    temporadas_services,
    torneos_services,
)

# Cuántos equipos entran según la ronda con la que arranca el playoff.
EQUIPOS_POR_RONDA = {
    "octavos": 16,
    "cuartos": 8,
    "semifinal": 4,
    "final": 2,
}


def crear_playoff_anual(
    db: Session,
    id_temporada: int,
    data: CrearPlayoffAnualRequest,
    current_user,
) -> PlayoffAnualResponse:
    """Crea el playoff del campeón anual de una temporada y arma su bracket.

    Hace cuatro cosas, en este orden, porque cada una necesita la anterior:

      1. crea el torneo (tipo PLAYOFF, rol FINAL_ANUAL, sin torneo base);
      2. inscribe a los equipos que clasifican;
      3. copia la nómina de cada uno desde el último torneo REGULAR del año;
      4. genera el bracket, sembrado por la tabla anual.

    Nada de esto se hace en silencio: lo que no se pudo copiar vuelve en
    `planteles_omitidos` y `avisos` para que el admin lo resuelva a mano.
    """
    temporada = temporadas_services.obtener_temporada(db, id_temporada)

    existente = (
        db.query(Torneo)
        .filter(
            Torneo.id_temporada == id_temporada,
            Torneo.rol_en_temporada == RolTorneoTemporada.FINAL_ANUAL,
            Torneo.borrado_en.is_(None),
        )
        .first()
    )
    if existente:
        raise ConflictError(
            f"La temporada ya tiene un playoff anual: «{existente.nombre}». "
            "Eliminá ese torneo si querés rearmarlo."
        )

    regulares = _torneos_regulares(db, id_temporada)
    if not regulares:
        raise ValidationError(
            "La temporada no tiene ningún torneo que sume a la tabla anual. "
            "Elegí primero qué torneos la componen."
        )

    n_equipos = EQUIPOS_POR_RONDA[data.ronda_inicial]
    equipos = _resolver_clasificados(db, temporada, data, n_equipos)

    torneo = torneos_services.crear_torneo(
        db,
        TorneoCreate(
            nombre=data.nombre,
            categoria=temporada.categoria,
            division=temporada.division,
            genero=temporada.genero,
            tipo=TipoTorneo.PLAYOFF,
            fecha_inicio=data.fecha_inicio or date.today(),
            es_competitiva=data.es_competitiva,
            # Sin torneo base: la referencia es la temporada entera. Y no suma a
            # la tabla anual, así que el check va en False.
            torneo_base_id=None,
            computa_anual=False,
        ),
        current_user,
    )

    # `crear_torneo` lo dejó en la temporada como NO_COMPUTA (el check en False).
    # Acá se le pone el rol que lo identifica como el playoff del año, que es lo
    # que hace que se siembre de la tabla anual.
    torneo.id_temporada = id_temporada
    torneo.rol_en_temporada = RolTorneoTemporada.FINAL_ANUAL
    torneo.actualizado_por = current_user.username
    db.commit()

    for equipo in equipos:
        db.add(InscripcionTorneo(
            id_torneo=torneo.id_torneo,
            id_equipo=equipo["id"],
            creado_por=current_user.username,
        ))
    db.commit()

    copiados, omitidos, avisos = _copiar_planteles(
        db, torneo, regulares, equipos, current_user
    ) if data.copiar_planteles else (0, [], [])

    playoff_services.generar_playoff(
        db,
        torneo.id_torneo,
        GenerarPlayoffRequest(
            formato=data.formato,
            asignacion=data.asignacion,
            duelos=data.duelos,
            # En manual la primera ronda son los duelos elegidos; mandar además
            # la ronda haría que `generar_playoff` reclasificara por tabla.
            ronda_inicial=data.ronda_inicial if data.asignacion == "automatico" else None,
            tercer_puesto=data.tercer_puesto,
        ),
        current_user.username,
    )

    return PlayoffAnualResponse(
        id_torneo=torneo.id_torneo,
        nombre=torneo.nombre,
        id_temporada=id_temporada,
        equipos=[e["nombre"] for e in equipos],
        planteles_copiados=copiados,
        planteles_omitidos=omitidos,
        avisos=avisos,
    )


def _torneos_regulares(db: Session, id_temporada: int) -> list[Torneo]:
    """Torneos que suman a la tabla anual, del más reciente al más viejo.

    El orden importa: es el que decide de qué torneo se hereda la nómina de
    cada equipo (la última vigente del año).
    """
    return (
        db.query(Torneo)
        .filter(
            Torneo.id_temporada == id_temporada,
            Torneo.rol_en_temporada == RolTorneoTemporada.REGULAR,
            Torneo.borrado_en.is_(None),
        )
        .order_by(Torneo.fecha_inicio.desc(), Torneo.id_torneo.desc())
        .all()
    )


def _resolver_clasificados(
    db: Session, temporada, data: CrearPlayoffAnualRequest, n_equipos: int
) -> list[dict]:
    """Equipos que juegan el playoff, en orden de mérito.

    En automático son los N mejores de la tabla anual. En manual son los que el
    admin puso en los duelos, y se valida que estén en la tabla: un equipo que
    no jugó la temporada no puede entrar al playoff del año.
    """
    filas = playoff_services._tabla_anual(db, temporada.id_temporada)
    por_id = {f.id_equipo: f.equipo for f in filas}

    if data.asignacion == "automatico":
        if len(filas) < n_equipos:
            raise ValidationError(
                f"La tabla anual tiene {len(filas)} equipos y la ronda elegida "
                f"necesita {n_equipos}."
            )
        return [{"id": f.id_equipo, "nombre": f.equipo} for f in filas[:n_equipos]]

    duelos = data.duelos or []
    if len(duelos) * 2 != n_equipos:
        raise ValidationError(
            f"La ronda elegida necesita {n_equipos // 2} duelos y llegaron {len(duelos)}."
        )

    ids: list[int] = []
    for duelo in duelos:
        for id_equipo in (duelo.id_equipo_local, duelo.id_equipo_visitante):
            if id_equipo not in por_id:
                raise ValidationError(
                    f"El equipo #{id_equipo} no está en la tabla anual de la temporada."
                )
            if id_equipo in ids:
                raise ValidationError(
                    f"«{por_id[id_equipo]}» aparece en más de un duelo."
                )
            ids.append(id_equipo)

    return [{"id": i, "nombre": por_id[i]} for i in ids]


def _copiar_planteles(
    db: Session,
    torneo: Torneo,
    regulares: list[Torneo],
    equipos: list[dict],
    current_user,
) -> tuple[int, list[dict], list[str]]:
    """Copia al playoff la última nómina vigente de cada equipo clasificado.

    El origen se busca **solo** entre los torneos REGULAR de la temporada, del
    más reciente al más viejo: si el equipo además jugó una copa en paralelo,
    esa nómina no cuenta. Tampoco se usa el plantel histórico
    (`id_torneo IS NULL`) como fallback: es único por equipo y compartido entre
    todos los torneos, así que copiarlo mezclaría nóminas de años distintos y
    dejaría a la misma persona elegible en dos equipos del mismo club.

    Se copia fila por fila con `copiar_plantel` justamente para que corran los
    triggers BEFORE INSERT que validan fichaje, suspensión y doble equipo.
    """
    ids_regulares = [t.id_torneo for t in regulares]
    orden = {id_torneo: i for i, id_torneo in enumerate(ids_regulares)}

    copiados = 0
    omitidos: list[dict] = []
    avisos: list[str] = []

    for equipo in equipos:
        candidatos = (
            db.query(Plantel)
            .filter(
                Plantel.id_equipo == equipo["id"],
                Plantel.id_torneo.in_(ids_regulares),
                Plantel.borrado_en.is_(None),
            )
            .all()
        )
        if not candidatos:
            avisos.append(
                f"{equipo['nombre']}: no tiene nómina propia en ningún torneo "
                "del año, hay que cargarla a mano."
            )
            continue

        # El plantel cerrado sirve igual: un torneo terminado cierra su nómina y
        # esa es justamente la última vigente.
        origen = min(candidatos, key=lambda p: orden[p.id_torneo])

        resultado = planteles_services.copiar_plantel(
            db=db,
            id_plantel_origen=origen.id_plantel,
            id_torneo_destino=torneo.id_torneo,
            current_user=current_user,
        )
        copiados += resultado["copiados"]
        for omitido in resultado["omitidos"]:
            omitidos.append({**omitido, "equipo": equipo["nombre"]})

    db.commit()
    return copiados, omitidos, avisos
