"""Recalcula el cumplimiento de las suspensiones existentes con la lógica nueva.

Contexto: hasta ahora el cumplimiento se marcaba de forma incremental, solo
cuando el partido reservado pasaba a TERMINADO, y el equipo de la persona se
resolvía con un `.first()` que podía caer en un plantel histórico cerrado.
Eso dejó suspensiones mal:

- si la planilla del partido siguiente se cargaba ANTES que la del partido
  de la tarjeta, ese partido ya figuraba TERMINADO y se salteaba (Alvarado y
  Ventureyra, 18/10: el 354 se cargó antes que el 351 y el 369);
- suspensiones dadas por cumplidas en un partido de otro equipo (Ventureyra:
  amarillas cumplidas en el 352, que es de Esc. Municipal B).

`recalcular_cola_suspensiones` ahora reconstruye el cumplimiento desde la
historia real (fecha y hora de los partidos y quién figura en cada planilla).
Este script lo corre para todas las personas/torneos que ya tienen
suspensiones no anuladas y, de paso, completa `id_partido_origen` en las
automáticas viejas. No crea suspensiones en torneos que no las tenían.

Es **idempotente**. Muestra el antes/después de cada suspensión que cambia.

Uso (desde la raíz del repo), simulación y aplicación:

    docker compose exec -T -e PYTHONPATH=/app api \\
        python db/maintenance/2026-10_recalcular_cumplimiento_suspensiones.py

    docker compose exec -T -e PYTHONPATH=/app api \\
        python db/maintenance/2026-10_recalcular_cumplimiento_suspensiones.py --aplicar

Flags: `--aplicar` escribe (sin él es simulación con rollback), `--torneo N`
acota a un torneo puntual.
"""
import sys

from sqlalchemy import text

from app.database import SessionLocal
from app.services.suspensiones_services import (
    recalcular_cola_suspensiones,
    recalcular_suspensiones_automaticas_persona,
)


PARES_CON_SUSPENSIONES = text(
    """
    SELECT
        s.id_persona,
        s.id_torneo,
        BOOL_OR(s.origen <> 'MANUAL') AS tiene_automaticas
    FROM suspension s
    JOIN torneo tor ON tor.id_torneo = s.id_torneo
    WHERE s.estado_suspension <> 'ANULADA'
      AND tor.borrado_en IS NULL
      AND (:id_torneo IS NULL OR s.id_torneo = :id_torneo)
    GROUP BY s.id_persona, s.id_torneo
    ORDER BY s.id_torneo, s.id_persona
    """
)

ESTADO = text(
    """
    SELECT
        s.id_suspension,
        s.id_torneo,
        per.apellido || ', ' || per.nombre AS persona,
        s.origen::text AS origen,
        s.estado_suspension::text AS estado,
        s.cumplidas,
        s.fechas_suspension,
        s.partidos_cumplidos,
        s.id_partido_origen,
        s.id_partido_a_cumplir
    FROM suspension s
    JOIN persona per ON per.id_persona = s.id_persona
    WHERE s.id_torneo IS NOT NULL
      AND (:id_torneo IS NULL OR s.id_torneo = :id_torneo)
    ORDER BY s.id_torneo, persona, s.id_suspension
    """
)


class _UsuarioScript:
    """Stand-in del usuario autenticado, para `actualizado_por`/`anulada_por`."""

    username = "mantenimiento:recalcular_suspensiones"


def _leer_torneo(argv: list[str]) -> int | None:
    """Devuelve el valor de `--torneo N`, o None si no se pasó."""
    if "--torneo" not in argv:
        return None
    return int(argv[argv.index("--torneo") + 1])


def _describir(f) -> str:
    """Resumen de una fila de suspensión para el antes/después."""
    return (
        f"{f.estado:<8} {f.cumplidas}/{f.fechas_suspension} "
        f"cumplidos={list(f.partidos_cumplidos or [])} "
        f"origen={f.id_partido_origen} a_cumplir={f.id_partido_a_cumplir}"
    )


def main(aplicar: bool, id_torneo: int | None) -> None:
    db = SessionLocal()
    params = {"id_torneo": id_torneo}
    try:
        print(f"Alcance: {'torneo ' + str(id_torneo) if id_torneo else 'todos los torneos con suspensiones'}")
        antes = {f.id_suspension: f for f in db.execute(ESTADO, params).all()}

        pares = db.execute(PARES_CON_SUSPENSIONES, params).all()
        print(f"Personas/torneo a recalcular: {len(pares)}")
        for id_persona, id_torneo_par, tiene_automaticas in pares:
            if tiene_automaticas:
                recalcular_suspensiones_automaticas_persona(db, id_persona, id_torneo_par, _UsuarioScript())
            else:
                recalcular_cola_suspensiones(db, id_persona, id_torneo_par, _UsuarioScript())
        db.flush()

        despues = db.execute(ESTADO, params).all()
        cambios = 0
        print()
        for f in despues:
            previo = antes.get(f.id_suspension)
            if previo is not None and _describir(previo) == _describir(f):
                continue
            cambios += 1
            print(f"  #{f.id_suspension:<4} torneo {f.id_torneo:>3} | {f.persona[:30]:<30} | {f.origen}")
            print(f"        antes:   {_describir(previo) if previo else '(nueva)'}")
            print(f"        después: {_describir(f)}")
        print(f"\nSuspensiones con cambios: {cambios}")

        if aplicar:
            db.commit()
            print("\n✔ Aplicado.")
        else:
            db.rollback()
            print("\n(simulación: no se escribió nada, usá --aplicar)")
    finally:
        db.close()


if __name__ == "__main__":
    main(aplicar="--aplicar" in sys.argv, id_torneo=_leer_torneo(sys.argv))
