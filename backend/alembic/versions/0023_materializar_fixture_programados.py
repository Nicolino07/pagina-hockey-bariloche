"""Unificación partido/fixture (fase 2): materializar los fixtures programados

Crea un `partido` por cada `fixture_partido` que todavía no tiene uno, EXCEPTO
los TERMINADO-sin-partido (10 duplicados + 2 semifinales por error de carga, que
se descartan). Los materializados llevan equipos/placeholders, agrupación y estado
del fixture, con inscripción NULL (se deriva de equipo+torneo cuando hace falta).

Como la vista de resultados hace INNER JOIN con inscripción, estos partidos
programados quedan fuera de resultados/posiciones automáticamente: la app no cambia.

Revision ID: 0023
Revises: 0022
Create Date: 2026-07-24
"""
from alembic import op

revision = '0023'
down_revision = '0022'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Columna temporal para correlacionar cada partido nuevo con su fixture origen.
    op.execute("ALTER TABLE partido ADD COLUMN _src_fixture INT")

    # Materializar solo los NO terminados sin partido (los TERMINADO-sin-partido
    # son datos erróneos y se descartan: desaparecen al dropear fixture_partido).
    op.execute("""
        INSERT INTO partido (
            id_torneo,
            id_equipo_local, id_equipo_visitante,
            placeholder_local, placeholder_visitante,
            id_fixture_fecha, id_fixture_playoff_ronda,
            fecha, horario, ubicacion, numero_fecha,
            estado_partido, creado_por, creado_en,
            _src_fixture
        )
        SELECT
            f.id_torneo,
            f.id_equipo_local, f.id_equipo_visitante,
            f.placeholder_local, f.placeholder_visitante,
            f.id_fixture_fecha, f.id_fixture_playoff_ronda,
            f.fecha_programada, f.horario, f.ubicacion, f.numero_fecha,
            f.estado, f.creado_por, COALESCE(f.creado_en, CURRENT_TIMESTAMP),
            f.id_fixture_partido
        FROM fixture_partido f
        WHERE f.id_partido_real IS NULL
          AND f.estado <> 'TERMINADO'
    """)

    # Enlazar cada fixture con su partido recién creado.
    op.execute("""
        UPDATE fixture_partido f
        SET id_partido_real = p.id_partido
        FROM partido p
        WHERE p._src_fixture = f.id_fixture_partido
    """)

    op.execute("ALTER TABLE partido DROP COLUMN _src_fixture")


def downgrade() -> None:
    # Elimina los partidos materializados y desvincula sus fixtures.
    op.execute("""
        UPDATE fixture_partido f
        SET id_partido_real = NULL
        FROM partido p
        WHERE f.id_partido_real = p.id_partido
          AND p.id_inscripcion_local IS NULL
          AND p.estado_partido <> 'TERMINADO'
    """)
    op.execute("""
        DELETE FROM partido
        WHERE id_inscripcion_local IS NULL
          AND id_inscripcion_visitante IS NULL
          AND estado_partido <> 'TERMINADO'
    """)
