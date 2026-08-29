# app/services/temporadas_services.py
"""Servicios de temporadas: la agrupación anual de torneos de una misma liga.

Una temporada junta el Apertura y el Clausura (y lo que la liga sume) para
producir una tabla de posiciones del año, de la cual sale el playoff por el
campeón anual.

El rol de cada torneo dentro de la temporada (`torneo.rol_en_temporada`) decide
tres cosas a la vez, y por eso se elige a mano y no se infiere:

  - qué suma a la tabla anual (`REGULAR`),
  - de dónde se siembra el playoff anual (`FINAL_ANUAL`),
  - de qué torneos puede salir la nómina de ese playoff (solo `REGULAR`).
"""
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models.temporada import Temporada
from app.models.torneo import Torneo
from app.models.vistas import TablaPosicionesAnual
from app.models.enums import RolTorneoTemporada, TipoTorneo
from app.schemas.temporada import TemporadaCreate, TemporadaUpdate
from app.core.exceptions import NotFoundError, ConflictError, ValidationError


def listar_temporadas(
    db: Session,
    *,
    anio: Optional[int] = None,
    solo_activas: bool = False,
) -> list[Temporada]:
    """Lista temporadas con sus torneos, de la más reciente a la más vieja."""
    q = (
        db.query(Temporada)
        .options(selectinload(Temporada.torneos))
        .filter(Temporada.borrado_en.is_(None))
    )
    if anio is not None:
        q = q.filter(Temporada.anio == anio)
    if solo_activas:
        q = q.filter(Temporada.activa.is_(True))

    return q.order_by(
        Temporada.anio.desc(),
        Temporada.categoria,
        Temporada.division,
        Temporada.genero,
    ).all()


def obtener_temporada(db: Session, id_temporada: int) -> Temporada:
    temporada = db.get(Temporada, id_temporada)
    if not temporada or temporada.borrado_en is not None:
        raise NotFoundError("Temporada no encontrada")
    return temporada


def crear_temporada(db: Session, data: TemporadaCreate, current_user) -> Temporada:
    """Crea una temporada. Es única por año + categoría + género + división."""
    existente = (
        db.query(Temporada)
        .filter(
            Temporada.anio == data.anio,
            Temporada.categoria == data.categoria,
            Temporada.genero == data.genero,
            # division es nullable: en la base la unicidad usa COALESCE, acá se
            # compara con IS NOT DISTINCT FROM para que NULL == NULL.
            Temporada.division.is_not_distinct_from(data.division),
            Temporada.borrado_en.is_(None),
        )
        .first()
    )
    if existente:
        raise ConflictError(
            "Ya existe una temporada para ese año, categoría, género y división."
        )

    temporada = Temporada(
        nombre=data.nombre,
        anio=data.anio,
        categoria=data.categoria,
        division=data.division,
        genero=data.genero,
        activa=data.activa,
        creado_por=current_user.username,
    )
    db.add(temporada)
    db.commit()
    db.refresh(temporada)
    return temporada


def actualizar_temporada(
    db: Session, id_temporada: int, data: TemporadaUpdate, current_user
) -> Temporada:
    """Actualiza nombre y estado. Categoría, género, división y año no se tocan:
    cambiarlos convertiría la temporada en otra liga y los torneos ya asignados
    dejarían de corresponder."""
    temporada = obtener_temporada(db, id_temporada)

    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(temporada, campo, valor)
    temporada.actualizado_por = current_user.username

    db.commit()
    db.refresh(temporada)
    return temporada


def eliminar_temporada(db: Session, id_temporada: int, current_user) -> None:
    """Baja lógica. Desasocia los torneos para no dejarlos apuntando a una
    temporada muerta (la FK es ON DELETE SET NULL, pero esto es soft-delete)."""
    from datetime import datetime

    temporada = obtener_temporada(db, id_temporada)

    db.query(Torneo).filter(Torneo.id_temporada == id_temporada).update(
        {"id_temporada": None, "rol_en_temporada": None},
        synchronize_session=False,
    )

    temporada.borrado_en = datetime.now()
    temporada.actualizado_por = current_user.username
    db.commit()


def asignar_torneo(
    db: Session,
    id_temporada: int,
    id_torneo: int,
    rol: Optional[RolTorneoTemporada],
    current_user,
) -> Torneo:
    """Asocia un torneo a la temporada con un rol, o lo desasocia con rol=None.

    El torneo tiene que coincidir en categoría, género y división: una temporada
    representa una liga concreta, y sumar a la tabla anual torneos de otra
    categoría daría una tabla sin sentido.
    """
    temporada = obtener_temporada(db, id_temporada)

    torneo = db.get(Torneo, id_torneo)
    if not torneo or torneo.borrado_en is not None:
        raise NotFoundError("Torneo no encontrado")

    if rol is None:
        torneo.id_temporada = None
        torneo.rol_en_temporada = None
        torneo.actualizado_por = current_user.username
        db.commit()
        db.refresh(torneo)
        return torneo

    if (
        torneo.categoria != temporada.categoria
        or torneo.genero != temporada.genero
        or (torneo.division or None) != (temporada.division or None)
    ):
        raise ValidationError(
            "El torneo no coincide con la temporada en categoría, género o división."
        )

    if (
        torneo.id_temporada is not None
        and torneo.id_temporada != id_temporada
    ):
        raise ConflictError(
            "El torneo ya pertenece a otra temporada. Desasignalo primero."
        )

    torneo.id_temporada = id_temporada
    torneo.rol_en_temporada = rol
    torneo.actualizado_por = current_user.username

    db.commit()
    db.refresh(torneo)
    return torneo


def obtener_tabla_anual(db: Session, id_temporada: int) -> list[TablaPosicionesAnual]:
    """Tabla anual de una temporada, ya ordenada por la vista.

    Devuelve lista vacía si la temporada todavía no tiene ningún torneo marcado
    como REGULAR: no es un error, es una temporada recién creada.
    """
    obtener_temporada(db, id_temporada)

    return (
        db.query(TablaPosicionesAnual)
        .filter(TablaPosicionesAnual.id_temporada == id_temporada)
        .order_by(TablaPosicionesAnual.puesto)
        .all()
    )


def torneos_asignables(db: Session, id_temporada: int) -> list[Torneo]:
    """Torneos que podrían sumarse a esta temporada.

    Son los que coinciden en categoría, género y división y todavía no están en
    ninguna otra temporada. Se usa para poblar el selector del ABM.
    """
    temporada = obtener_temporada(db, id_temporada)

    return (
        db.query(Torneo)
        .filter(
            Torneo.borrado_en.is_(None),
            Torneo.categoria == temporada.categoria,
            Torneo.genero == temporada.genero,
            Torneo.division.is_not_distinct_from(temporada.division),
            (Torneo.id_temporada.is_(None)) | (Torneo.id_temporada == id_temporada),
        )
        .order_by(Torneo.fecha_inicio.desc(), Torneo.nombre)
        .all()
    )


def aplicar_computa_anual(
    db: Session,
    torneo: Torneo,
    computa: bool,
    current_user,
) -> None:
    """Marca si un torneo suma a la tabla anual, resolviendo su temporada sola.

    Es lo que hay detrás del check «Suma a la tabla anual» del alta de torneos.
    La temporada se deriva de la **tupla** del torneo — año de `fecha_inicio` +
    categoría + género + división — y se crea si todavía no existe. En ningún
    momento se mira el nombre del torneo: dos ligas distintas nunca comparten
    tupla, y un nombre no dice nada confiable sobre a qué año pertenece algo.

    Con `computa=False` el torneo se marca `NO_COMPUTA` si ya pertenece a una
    temporada; si no pertenece a ninguna, se lo deja fuera en vez de crear una
    temporada solo para excluirlo de ella.

    Un torneo de tipo PLAYOFF nunca suma, sin importar cómo venga el check: es
    una fase final que reparte un campeón, y sus puntos ya están contados en la
    liga que lo originó. Sumarlo contaría dos veces los mismos partidos.

    El playoff del campeón anual (`FINAL_ANUAL`) no se toca nunca: su rol lo
    define el alta del playoff anual, no este check. Sin este corte, editar ese
    torneo desde la pantalla de siempre le borraría el rol y dejaría de sembrar
    desde la tabla anual.

    No hace commit: lo hace quien lo llama, junto con el resto del alta o edición.
    """
    if torneo.rol_en_temporada == RolTorneoTemporada.FINAL_ANUAL:
        return

    if torneo.tipo == TipoTorneo.PLAYOFF:
        computa = False

    if computa:
        temporada = _resolver_o_crear_temporada(db, torneo, current_user)
        torneo.id_temporada = temporada.id_temporada
        torneo.rol_en_temporada = RolTorneoTemporada.REGULAR
        return

    # No computa: si ya está en una temporada se queda ahí, marcado; si no, no
    # se le inventa una.
    if torneo.id_temporada is not None:
        torneo.rol_en_temporada = RolTorneoTemporada.NO_COMPUTA
        return

    temporada = _buscar_temporada(db, torneo)
    if temporada is not None:
        torneo.id_temporada = temporada.id_temporada
        torneo.rol_en_temporada = RolTorneoTemporada.NO_COMPUTA


def _buscar_temporada(db: Session, torneo: Torneo) -> Optional[Temporada]:
    """Temporada que le corresponde a un torneo por su tupla, o None."""
    if torneo.fecha_inicio is None:
        return None

    return _buscar_temporada_por_tupla(
        db,
        torneo.fecha_inicio.year,
        torneo.categoria,
        torneo.genero,
        torneo.division,
    )


def _resolver_o_crear_temporada(db: Session, torneo: Torneo, current_user) -> Temporada:
    """Devuelve la temporada del torneo, creándola si es la primera de esa liga."""
    temporada = _buscar_temporada(db, torneo)
    if temporada is not None:
        return temporada

    if torneo.fecha_inicio is None:
        raise ValidationError(
            "El torneo necesita fecha de inicio para saber a qué temporada pertenece."
        )

    temporada = Temporada(
        nombre=_nombre_sugerido(torneo),
        anio=torneo.fecha_inicio.year,
        categoria=torneo.categoria,
        division=torneo.division,
        genero=torneo.genero,
        creado_por=current_user.username,
    )
    db.add(temporada)
    db.flush()  # necesitamos id_temporada para asignarlo al torneo
    return temporada


def _nombre_sugerido(torneo: Torneo) -> str:
    """Etiqueta inicial de una temporada creada automáticamente.

    Es solo un rótulo editable desde el ABM: la identidad de la temporada es la
    tupla (año, categoría, género, división), nunca este texto.
    """
    categoria = torneo.categoria.value.replace("_", " ").title()
    genero = {
        "MASCULINO": "Caballeros",
        "FEMENINO": "Damas",
        "MIXTO": "Mixto",
    }.get(torneo.genero.value, torneo.genero.value.title())
    division = f" {torneo.division}" if torneo.division else ""
    return f"{categoria} {genero}{division}"


def definir_torneos_computables(
    db: Session,
    *,
    categoria,
    genero,
    division: Optional[str],
    anio: int,
    id_torneos: list[int],
    current_user,
) -> Optional[Temporada]:
    """Define de una sola vez qué torneos de una liga suman a su tabla anual.

    Es lo que hay detrás del selector «Torneos que suman a la tabla anual»: el
    front manda la lista completa de los tildados y esto la aplica como estado
    final, en vez de ir torneo por torneo. Los que están en la lista quedan
    `REGULAR`; los demás torneos de la misma liga y año quedan `NO_COMPUTA`.

    Crea la temporada si es la primera vez que se marca algo en esa liga. Con la
    lista vacía no se crea nada: si la temporada ya existía, se queda sin
    torneos que sumen (tabla anual vacía), que es un estado válido.

    Los playoffs quedan afuera: no se pueden seleccionar, y si alguno había
    quedado marcado `REGULAR` se lo baja a `NO_COMPUTA` acá mismo. Sus partidos
    son la fase final de una liga que ya suma, así que contarlos otra vez
    duplicaría los mismos resultados en la tabla del año.

    Devuelve la temporada resultante, o None si no hay ninguna todavía.
    """
    todos = (
        db.query(Torneo)
        .filter(
            Torneo.borrado_en.is_(None),
            Torneo.categoria == categoria,
            Torneo.genero == genero,
            Torneo.division.is_not_distinct_from(division),
            func.extract("year", Torneo.fecha_inicio) == anio,
        )
        .all()
    )
    candidatos = [t for t in todos if t.tipo != TipoTorneo.PLAYOFF]
    playoffs = [t for t in todos if t.tipo == TipoTorneo.PLAYOFF]
    por_id = {t.id_torneo: t for t in candidatos}

    seleccionados = set(id_torneos)

    playoffs_elegidos = seleccionados & {t.id_torneo for t in playoffs}
    if playoffs_elegidos:
        raise ValidationError(
            "Un playoff no puede sumar a la tabla anual: sus partidos son la "
            "fase final de una liga que ya está sumando."
        )

    desconocidos = seleccionados - set(por_id)
    if desconocidos:
        raise ValidationError(
            "Estos torneos no pertenecen a la categoría y año indicados: "
            + ", ".join(str(i) for i in sorted(desconocidos))
        )

    temporada = _buscar_temporada_por_tupla(db, anio, categoria, genero, division)
    if temporada is None and seleccionados:
        temporada = Temporada(
            nombre=_nombre_sugerido_tupla(categoria, genero, division),
            anio=anio,
            categoria=categoria,
            division=division,
            genero=genero,
            creado_por=current_user.username,
        )
        db.add(temporada)
        db.flush()

    for torneo in candidatos:
        if torneo.id_torneo in seleccionados:
            torneo.id_temporada = temporada.id_temporada
            torneo.rol_en_temporada = RolTorneoTemporada.REGULAR
        elif torneo.id_temporada is not None:
            # Sale de la tabla pero sigue perteneciendo al año.
            torneo.rol_en_temporada = RolTorneoTemporada.NO_COMPUTA
        torneo.actualizado_por = current_user.username

    # Repara los playoffs que hayan quedado sumando de antes. El del campeón
    # anual no se toca: su rol no sale de este selector.
    for torneo in playoffs:
        if torneo.rol_en_temporada == RolTorneoTemporada.REGULAR:
            torneo.rol_en_temporada = RolTorneoTemporada.NO_COMPUTA
            torneo.actualizado_por = current_user.username

    db.commit()
    if temporada is not None:
        db.refresh(temporada)
    return temporada


def torneos_de_categoria(
    db: Session,
    *,
    categoria,
    genero,
    division: Optional[str],
    anio: int,
) -> list[Torneo]:
    """Torneos de una liga en un año, para poblar el selector de la tabla anual.

    Los playoffs no se listan: no son una opción a tildar. Son la fase final de
    una liga cuyos puntos ya están en la tabla, y el del campeón anual sale
    justamente de esa tabla.
    """
    return (
        db.query(Torneo)
        .filter(
            Torneo.borrado_en.is_(None),
            Torneo.categoria == categoria,
            Torneo.genero == genero,
            Torneo.division.is_not_distinct_from(division),
            Torneo.tipo != TipoTorneo.PLAYOFF,
            func.extract("year", Torneo.fecha_inicio) == anio,
        )
        .order_by(Torneo.fecha_inicio, Torneo.id_torneo)
        .all()
    )


def _buscar_temporada_por_tupla(
    db: Session, anio: int, categoria, genero, division: Optional[str]
) -> Optional[Temporada]:
    return (
        db.query(Temporada)
        .filter(
            Temporada.anio == anio,
            Temporada.categoria == categoria,
            Temporada.genero == genero,
            Temporada.division.is_not_distinct_from(division),
            Temporada.borrado_en.is_(None),
        )
        .first()
    )


def _nombre_sugerido_tupla(categoria, genero, division: Optional[str]) -> str:
    cat = categoria.value.replace("_", " ").title()
    gen = {
        "MASCULINO": "Caballeros",
        "FEMENINO": "Damas",
        "MIXTO": "Mixto",
    }.get(genero.value, genero.value.title())
    div = f" {division}" if division else ""
    return f"{cat} {gen}{div}"
