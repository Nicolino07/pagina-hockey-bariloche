"""Fix vw_resultado_partido: sumar los goles por defecto (walkover)

La vista viva en la DB no sumaba goles_por_defecto, así que los partidos
otorgados por puntos (walkover) se computaban como 0-0 (empate) en la tabla de
posiciones. db/init ya tenía la versión correcta; esta migración la propaga a
las DBs existentes.

Revision ID: 0025
Revises: 0024
Create Date: 2026-07-25
"""
from alembic import op

revision = '0025'
down_revision = '0024'
branch_labels = None
depends_on = None


_VIEW_OK = """
CREATE OR REPLACE VIEW vw_resultado_partido AS
SELECT
    p.id_partido,
    p.id_torneo,
    p.id_inscripcion_local,
    p.id_inscripcion_visitante,
    COALESCE(SUM(
        CASE
            WHEN (it.id_inscripcion = p.id_inscripcion_local AND NOT g.es_autogol)
              OR (it.id_inscripcion = p.id_inscripcion_visitante AND g.es_autogol)
            THEN 1 ELSE 0
        END), 0) + COALESCE(p.goles_por_defecto_local, 0) AS goles_local,
    COALESCE(SUM(
        CASE
            WHEN (it.id_inscripcion = p.id_inscripcion_visitante AND NOT g.es_autogol)
              OR (it.id_inscripcion = p.id_inscripcion_local AND g.es_autogol)
            THEN 1 ELSE 0
        END), 0) + COALESCE(p.goles_por_defecto_visitante, 0) AS goles_visitante
FROM partido p
LEFT JOIN gol g ON g.id_partido = p.id_partido
LEFT JOIN participan_partido pp ON pp.id_participante_partido = g.id_participante_partido
LEFT JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
LEFT JOIN plantel pl ON pl.id_plantel = pi.id_plantel
LEFT JOIN inscripcion_torneo it ON it.id_equipo = pl.id_equipo
GROUP BY
    p.id_partido, p.id_torneo,
    p.id_inscripcion_local, p.id_inscripcion_visitante,
    p.goles_por_defecto_local, p.goles_por_defecto_visitante;
"""

_VIEW_OLD = """
CREATE OR REPLACE VIEW vw_resultado_partido AS
SELECT
    p.id_partido,
    p.id_torneo,
    p.id_inscripcion_local,
    p.id_inscripcion_visitante,
    SUM(CASE
            WHEN it.id_inscripcion = p.id_inscripcion_local AND NOT g.es_autogol
              OR it.id_inscripcion = p.id_inscripcion_visitante AND g.es_autogol
            THEN 1 ELSE 0
        END) AS goles_local,
    SUM(CASE
            WHEN it.id_inscripcion = p.id_inscripcion_visitante AND NOT g.es_autogol
              OR it.id_inscripcion = p.id_inscripcion_local AND g.es_autogol
            THEN 1 ELSE 0
        END) AS goles_visitante
FROM partido p
LEFT JOIN gol g ON g.id_partido = p.id_partido
LEFT JOIN participan_partido pp ON pp.id_participante_partido = g.id_participante_partido
LEFT JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
LEFT JOIN plantel pl ON pl.id_plantel = pi.id_plantel
LEFT JOIN inscripcion_torneo it ON it.id_equipo = pl.id_equipo
GROUP BY p.id_partido, p.id_torneo, p.id_inscripcion_local, p.id_inscripcion_visitante;
"""


def upgrade() -> None:
    op.execute(_VIEW_OK)


def downgrade() -> None:
    op.execute(_VIEW_OLD)
