# app/services/plantel_resolver.py
"""Resolución canónica del plantel de un equipo en un torneo.

Desde la migración 0033 un `plantel` pertenece a un torneo (`plantel.id_torneo`).
Los planteles anteriores a esa migración quedaron con `id_torneo IS NULL` y se
siguen usando como fallback hasta que cada equipo tenga su plantel por torneo.

Todo consumidor que necesite "el plantel de este equipo para este torneo" debe
usar `resolver_plantel` en vez de buscar el plantel activo por equipo: con N
planteles activos por equipo (uno por torneo), esa búsqueda es ambigua.

Existe un espejo SQL, `fn_plantel_de_equipo_en_torneo(id_equipo, id_torneo)`,
creado en la migración 0033 y usado por vistas y SQL crudo. Si se cambia la
lógica hay que cambiar las dos: `tests/test_plantel_resolver.py` verifica que
ambas devuelvan lo mismo para todos los pares equipo/torneo inscriptos.
"""
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.plantel import Plantel
from app.models.torneo import Torneo

logger = logging.getLogger(__name__)


def torneo_de_plantel(db: Session, id_torneo: int) -> int:
    """Devuelve el torneo cuyo plantel corresponde usar.

    Los torneos de playoff/finales comparten la nómina de su torneo base, así
    que se resuelve a `torneo_base_id` cuando existe.
    """
    torneo = db.get(Torneo, id_torneo)
    if torneo is not None and torneo.torneo_base_id:
        return torneo.torneo_base_id
    return id_torneo


def resolver_plantel(
    db: Session,
    id_equipo: int,
    id_torneo: int,
    *,
    permitir_fallback: bool = True,
) -> Optional[Plantel]:
    """Devuelve el plantel de `id_equipo` para `id_torneo`, o None.

    Con `permitir_fallback=True` (lecturas) cae al plantel histórico si el
    equipo todavía no tiene plantel propio en ese torneo, para que el sistema
    siga funcionando durante la transición.

    Con `permitir_fallback=False` (escrituras: alta de integrante, copia,
    planilla) nunca devuelve el histórico: escribir sobre él mezclaría la
    nómina de todos los torneos.
    """
    id_torneo_base = torneo_de_plantel(db, id_torneo)

    # Plantel propio del torneo. Se devuelve aunque esté cerrado: un torneo
    # terminado tiene su plantel cerrado y las lecturas históricas deben andar.
    plantel = (
        db.query(Plantel)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.id_torneo == id_torneo_base,
            Plantel.borrado_en.is_(None),
        )
        .order_by(Plantel.activo.desc())
        .first()
    )
    if plantel is not None:
        return plantel

    if not permitir_fallback:
        return None

    # Fallback al plantel histórico. Es único gracias a uq_plantel_legacy_activo.
    plantel = (
        db.query(Plantel)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.id_torneo.is_(None),
            Plantel.activo.is_(True),
            Plantel.borrado_en.is_(None),
        )
        .first()
    )
    if plantel is not None:
        # Cada warning marca un equipo que todavía no migró su nómina a este
        # torneo. Cuando dejan de aparecer, se puede apagar el fallback.
        logger.warning(
            "Plantel resuelto por fallback histórico: equipo=%s torneo=%s plantel=%s",
            id_equipo, id_torneo, plantel.id_plantel,
        )
    return plantel


def resolver_id_plantel(
    db: Session,
    id_equipo: int,
    id_torneo: int,
    *,
    permitir_fallback: bool = True,
) -> Optional[int]:
    """Igual que `resolver_plantel` pero devuelve solo el id."""
    plantel = resolver_plantel(db, id_equipo, id_torneo, permitir_fallback=permitir_fallback)
    return plantel.id_plantel if plantel else None
