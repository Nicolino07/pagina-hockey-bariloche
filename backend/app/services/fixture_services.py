"""
Servicios para la gestión del fixture (partidos programados).
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.fixture_partido import FixturePartido
from app.models.equipo import Equipo
from app.models.torneo import Torneo
from app.schemas.fixture_partido import FixturePartidoCreate, FixturePartidoUpdate


def _enriquecer(fp: FixturePartido) -> dict:
    """Agrega nombres de equipos y torneo al response."""
    data = {c.name: getattr(fp, c.name) for c in fp.__table__.columns}
    data["nombre_equipo_local"] = fp.equipo_local.nombre if fp.equipo_local else None
    data["nombre_equipo_visitante"] = fp.equipo_visitante.nombre if fp.equipo_visitante else None
    data["nombre_torneo"] = fp.torneo.nombre if fp.torneo else None
    return data


def obtener_fixture_por_id(db: Session, id_fixture_partido: int):
    """Devuelve un partido del fixture por su ID."""
    fp = (
        db.query(FixturePartido)
        .options(
            joinedload(FixturePartido.equipo_local),
            joinedload(FixturePartido.equipo_visitante),
            joinedload(FixturePartido.torneo),
        )
        .filter(FixturePartido.id_fixture_partido == id_fixture_partido)
        .first()
    )
    if not fp:
        raise HTTPException(404, "Partido del fixture no encontrado")
    return _enriquecer(fp)


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
        creado_por=username,
    )
    db.add(fp)
    db.commit()
    db.refresh(fp)

    db.refresh(fp, ["equipo_local", "equipo_visitante", "torneo"])
    return _enriquecer(fp)


def listar_fixture_por_torneo(db: Session, id_torneo: int) -> list:
    """Lista todos los partidos programados de un torneo, ordenados por fecha."""
    partidos = (
        db.query(FixturePartido)
        .options(
            joinedload(FixturePartido.equipo_local),
            joinedload(FixturePartido.equipo_visitante),
            joinedload(FixturePartido.torneo),
        )
        .filter(FixturePartido.id_torneo == id_torneo)
        .order_by(
            FixturePartido.numero_fecha.asc().nulls_last(),
            FixturePartido.fecha_programada.asc().nulls_last(),
            FixturePartido.horario.asc().nulls_last(),
        )
        .all()
    )
    return [_enriquecer(fp) for fp in partidos]


def listar_fixture_proximos(db: Session, id_torneo: int | None = None) -> list:
    """Lista partidos programados no jugados. Opcionalmente filtra por torneo."""
    query = (
        db.query(FixturePartido)
        .options(
            joinedload(FixturePartido.equipo_local),
            joinedload(FixturePartido.equipo_visitante),
            joinedload(FixturePartido.torneo),
        )
        .filter(FixturePartido.jugado == False)  # noqa: E712
    )
    if id_torneo:
        query = query.filter(FixturePartido.id_torneo == id_torneo)

    partidos = query.order_by(
        FixturePartido.fecha_programada.asc().nulls_last(),
        FixturePartido.horario.asc().nulls_last(),
    ).all()
    return [_enriquecer(fp) for fp in partidos]


def actualizar_fixture_partido(
    db: Session, id_fixture_partido: int, data: FixturePartidoUpdate, username: str
):
    """Edita fecha, horario, ubicación o número de fecha de un partido programado."""
    fp = db.get(FixturePartido, id_fixture_partido)
    if not fp:
        raise HTTPException(404, "Partido del fixture no encontrado")
    if fp.jugado:
        raise HTTPException(400, "No se puede editar un partido ya jugado")

    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(fp, campo, valor)

    db.commit()
    db.refresh(fp)
    db.refresh(fp, ["equipo_local", "equipo_visitante", "torneo"])
    return _enriquecer(fp)


def eliminar_fixture_partido(db: Session, id_fixture_partido: int):
    """Elimina un partido programado siempre que no haya sido jugado."""
    fp = db.get(FixturePartido, id_fixture_partido)
    if not fp:
        raise HTTPException(404, "Partido del fixture no encontrado")
    if fp.jugado:
        raise HTTPException(400, "No se puede eliminar un partido ya jugado")

    db.delete(fp)
    db.commit()
