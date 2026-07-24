"""
Servicios de designación de árbitros.

La designación es directa: el admin de árbitros asigna id_arbitro1/id_arbitro2
sobre partidos en estado BORRADOR o PENDIENTE. Las reglas de negocio se validan
tanto acá (pre-validación amigable) como en la base de datos (trigger
trg_validar_designacion_arbitros, como última barrera).

Reglas:
  1. Club propio (exceptuable): la persona no puede arbitrar si tiene un rol
     activo en el club local o visitante. Se relaja si torneo.es_competitiva=FALSE.
  2. Torneo propio (absoluta): la persona no puede arbitrar en un torneo donde
     integra un plantel.
Además, la persona designada debe tener el rol ARBITRO vigente.
"""
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, BusinessRuleError
from app.models.partido import Partido


ESTADOS_DESIGNABLES = ("BORRADOR", "PENDIENTE")


def listar_partidos_designables(db: Session, torneo_id: Optional[int] = None):
    """Devuelve los partidos en estado BORRADOR/PENDIENTE candidatos a designación."""
    filas = db.execute(
        text(
            """
            SELECT
                p.id_partido,
                p.id_torneo,
                t.nombre               AS nombre_torneo,
                t.es_competitiva,
                p.fecha,
                p.horario,
                p.estado_partido::text AS estado_partido,
                COALESCE(el.nombre, p.placeholder_local)     AS equipo_local,
                COALESCE(ev.nombre, p.placeholder_visitante) AS equipo_visitante,
                p.id_arbitro1,
                p.id_arbitro2,
                (a1.nombre || ' ' || a1.apellido) AS nombre_arbitro1,
                (a2.nombre || ' ' || a2.apellido) AS nombre_arbitro2
            FROM partido p
            JOIN torneo t  ON t.id_torneo = p.id_torneo
            LEFT JOIN equipo el ON el.id_equipo = p.id_equipo_local
            LEFT JOIN equipo ev ON ev.id_equipo = p.id_equipo_visitante
            LEFT JOIN persona a1 ON a1.id_persona = p.id_arbitro1
            LEFT JOIN persona a2 ON a2.id_persona = p.id_arbitro2
            WHERE p.estado_partido IN ('BORRADOR', 'PENDIENTE')
              AND (:torneo_id IS NULL OR p.id_torneo = :torneo_id)
            ORDER BY p.fecha, p.horario NULLS LAST, p.id_partido
            """
        ),
        {"torneo_id": torneo_id},
    ).mappings().all()
    return [dict(f) for f in filas]


def _motivo_no_disponible(
    *,
    tiene_rol_arbitro: bool,
    en_torneo: bool,
    en_club: bool,
    es_competitiva: bool,
    nombre_completo: str,
) -> Optional[str]:
    """Devuelve el motivo por el que una persona no puede arbitrar, o None si puede."""
    if not tiene_rol_arbitro:
        return f"{nombre_completo} no tiene el rol ARBITRO vigente."
    # Regla 2 (absoluta)
    if en_torneo:
        return f"{nombre_completo} integra un plantel de este torneo."
    # Regla 1 (solo en torneos competitivos)
    if es_competitiva and en_club:
        return f"{nombre_completo} tiene un rol activo en uno de los clubes del partido."
    return None


def listar_arbitros_para_partido(db: Session, id_partido: int):
    """
    Lista las personas con rol ARBITRO vigente y su disponibilidad para el partido.
    Marca cada una como disponible/no disponible según las reglas de negocio.
    """
    partido = db.get(Partido, id_partido)
    if not partido:
        raise NotFoundError("Partido no encontrado")

    es_competitiva = db.execute(
        text(
            """
            SELECT t.es_competitiva
            FROM torneo t
            JOIN partido p ON p.id_torneo = t.id_torneo
            WHERE p.id_partido = :id_partido
            """
        ),
        {"id_partido": id_partido},
    ).scalar()

    filas = db.execute(
        text(
            """
            SELECT DISTINCT
                pe.id_persona,
                pe.nombre,
                pe.apellido,
                fn_arbitro_en_torneo_del_partido(pe.id_persona, :id_partido) AS en_torneo,
                fn_arbitro_en_club_del_partido(pe.id_persona, :id_partido)   AS en_club
            FROM persona pe
            JOIN persona_rol pr ON pr.id_persona = pe.id_persona
            WHERE pr.rol = 'ARBITRO'
              AND (pr.fecha_hasta IS NULL OR pr.fecha_hasta >= CURRENT_DATE)
              AND pe.borrado_en IS NULL
            ORDER BY pe.apellido, pe.nombre
            """
        ),
        {"id_partido": id_partido},
    ).mappings().all()

    resultado = []
    for f in filas:
        nombre_completo = f"{f['nombre']} {f['apellido']}"
        motivo = _motivo_no_disponible(
            tiene_rol_arbitro=True,
            en_torneo=f["en_torneo"],
            en_club=f["en_club"],
            es_competitiva=es_competitiva,
            nombre_completo=nombre_completo,
        )
        resultado.append(
            {
                "id_persona": f["id_persona"],
                "nombre": f["nombre"],
                "apellido": f["apellido"],
                "disponible": motivo is None,
                "motivo": motivo,
            }
        )
    return resultado


def _validar_arbitro(db: Session, id_partido: int, id_persona: int, es_competitiva: bool) -> None:
    """Pre-valida una persona como árbitro del partido. Lanza BusinessRuleError si no puede."""
    fila = db.execute(
        text(
            """
            SELECT
                (p.nombre || ' ' || p.apellido) AS nombre_completo,
                EXISTS (
                    SELECT 1 FROM persona_rol pr
                    WHERE pr.id_persona = p.id_persona
                      AND pr.rol = 'ARBITRO'
                      AND (pr.fecha_hasta IS NULL OR pr.fecha_hasta >= CURRENT_DATE)
                ) AS tiene_rol_arbitro,
                fn_arbitro_en_torneo_del_partido(p.id_persona, :id_partido) AS en_torneo,
                fn_arbitro_en_club_del_partido(p.id_persona, :id_partido)   AS en_club
            FROM persona p
            WHERE p.id_persona = :id_persona
            """
        ),
        {"id_partido": id_partido, "id_persona": id_persona},
    ).mappings().first()

    if fila is None:
        raise NotFoundError(f"La persona {id_persona} no existe")

    motivo = _motivo_no_disponible(
        tiene_rol_arbitro=fila["tiene_rol_arbitro"],
        en_torneo=fila["en_torneo"],
        en_club=fila["en_club"],
        es_competitiva=es_competitiva,
        nombre_completo=fila["nombre_completo"],
    )
    if motivo:
        raise BusinessRuleError(f"No se puede designar: {motivo}")


def designar_arbitros(db: Session, id_partido: int, data, current_user):
    """
    Designa (o quita) los árbitros de un partido en estado BORRADOR/PENDIENTE.
    Valida las reglas de negocio antes de guardar.
    """
    partido = db.get(Partido, id_partido)
    if not partido:
        raise NotFoundError("Partido no encontrado")

    estado = str(getattr(partido.estado_partido, "value", partido.estado_partido))
    if estado not in ESTADOS_DESIGNABLES:
        raise BusinessRuleError(
            "Solo se pueden designar árbitros en partidos en estado BORRADOR o PENDIENTE."
        )

    id_arbitro1 = data.id_arbitro1
    id_arbitro2 = data.id_arbitro2

    if id_arbitro1 is not None and id_arbitro1 == id_arbitro2:
        raise BusinessRuleError("Los dos árbitros deben ser personas distintas.")

    es_competitiva = db.execute(
        text("SELECT es_competitiva FROM torneo WHERE id_torneo = :id_torneo"),
        {"id_torneo": partido.id_torneo},
    ).scalar()

    for id_persona in (id_arbitro1, id_arbitro2):
        if id_persona is not None:
            _validar_arbitro(db, id_partido, id_persona, es_competitiva)

    partido.id_arbitro1 = id_arbitro1
    partido.id_arbitro2 = id_arbitro2

    db.commit()
    db.refresh(partido)
    return partido
