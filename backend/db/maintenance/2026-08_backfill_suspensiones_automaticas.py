"""Backfill de suspensiones automáticas por tarjetas.

Por un bug en `partidos_services` (sesión con autoflush=False: el recálculo
corría antes de que las tarjetas recién cargadas llegaran a la base) las
suspensiones automáticas nunca se generaron. Este script las reconstruye a
partir de las tarjetas VALIDAS ya cargadas.

Es **idempotente**: usa `recalcular_suspensiones_automaticas_persona`, que
reconcilia contra lo que ya existe. Correrlo dos veces no duplica nada.

Por defecto solo toca **torneos activos**. En un torneo terminado no quedan
partidos por jugar, así que la suspensión no consigue partido a cumplir: se
quedaría ACTIVA para siempre sin llegar nunca a CUMPLIDA, que es lo que
dispara el asterisco público. Con `--incluir-terminados` se procesan todos.

Uso (desde la raíz del repo), simulación y aplicación:

    docker compose exec -T -e PYTHONPATH=/app api \\
        python db/maintenance/2026-08_backfill_suspensiones_automaticas.py

    docker compose exec -T -e PYTHONPATH=/app api \\
        python db/maintenance/2026-08_backfill_suspensiones_automaticas.py --aplicar

Flags: `--aplicar` escribe (sin él es simulación con rollback),
`--incluir-terminados` no filtra por torneo activo, `--torneo N` acota a un
torneo puntual (útil para no arrastrar los torneos basura que dejan los tests,
que corren contra esta misma base).
"""
import sys

from sqlalchemy import text

from app.database import SessionLocal
from app.services.suspensiones_services import recalcular_suspensiones_automaticas_persona


PARES_CON_TARJETAS = text(
    """
    SELECT DISTINCT pi.id_persona, p.id_torneo
    FROM tarjeta t
    JOIN participan_partido pp ON pp.id_participante_partido = t.id_participante_partido
    JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
    JOIN partido p ON p.id_partido = t.id_partido
    JOIN torneo tor ON tor.id_torneo = p.id_torneo
    WHERE t.estado_tarjeta = 'VALIDA'
      AND t.tipo IN ('AMARILLA', 'ROJA')
      AND tor.borrado_en IS NULL
      AND (:incluir_terminados OR tor.activo = TRUE)
      AND (:id_torneo IS NULL OR tor.id_torneo = :id_torneo)
    """
)

RESUMEN = text(
    """
    SELECT
        s.id_torneo,
        tor.nombre AS torneo,
        per.nombre || ' ' || per.apellido AS persona,
        s.origen::text AS origen,
        s.estado_suspension::text AS estado,
        s.id_partido_a_cumplir
    FROM suspension s
    JOIN persona per ON per.id_persona = s.id_persona
    JOIN torneo tor ON tor.id_torneo = s.id_torneo
    WHERE s.origen <> 'MANUAL'
      AND tor.borrado_en IS NULL
      AND (:incluir_terminados OR tor.activo = TRUE)
      AND (:id_torneo IS NULL OR tor.id_torneo = :id_torneo)
    ORDER BY s.id_torneo, persona
    """
)


class _UsuarioScript:
    """Stand-in del usuario autenticado, para el campo `creado_por`."""

    username = "backfill_suspensiones"


def _leer_torneo(argv: list[str]) -> int | None:
    """Devuelve el valor de `--torneo N`, o None si no se pasó."""
    if "--torneo" not in argv:
        return None
    return int(argv[argv.index("--torneo") + 1])


def main(aplicar: bool, incluir_terminados: bool, id_torneo: int | None) -> None:
    db = SessionLocal()
    # Pedir un torneo puntual ya es intención explícita: no se filtra además
    # por `activo`, o un torneo terminado pedido por id quedaría fuera.
    params = {
        "incluir_terminados": incluir_terminados or id_torneo is not None,
        "id_torneo": id_torneo,
    }
    try:
        alcance = "todos los torneos" if incluir_terminados else "solo torneos activos"
        if id_torneo is not None:
            alcance = f"torneo {id_torneo}"
        print(f"Alcance: {alcance}")

        pares = db.execute(PARES_CON_TARJETAS, params).all()
        print(f"Personas/torneo con tarjetas a evaluar: {len(pares)}")

        for id_persona_par, id_torneo_par in pares:
            recalcular_suspensiones_automaticas_persona(
                db, id_persona_par, id_torneo_par, _UsuarioScript()
            )
        db.flush()

        filas = db.execute(RESUMEN, params).all()
        print(f"\nSuspensiones automáticas resultantes: {len(filas)}\n")
        for f in filas:
            cumple = f.id_partido_a_cumplir or "— (sin partido pendiente)"
            print(
                f"  torneo {f.id_torneo:>3} {(f.torneo or ''):<30} | "
                f"{f.persona[:34]:<34} | {f.origen:<22} | {f.estado:<8} | cumple en {cumple}"
            )

        if aplicar:
            db.commit()
            print("\n✔ Aplicado.")
        else:
            db.rollback()
            print("\n(simulación: no se escribió nada, usá --aplicar)")
    finally:
        db.close()


if __name__ == "__main__":
    main(
        aplicar="--aplicar" in sys.argv,
        incluir_terminados="--incluir-terminados" in sys.argv,
        id_torneo=_leer_torneo(sys.argv),
    )
