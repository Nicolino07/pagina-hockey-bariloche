"""Agrega partidos_jugados y promedio_goles a v_goleadores_torneo

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-22
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

VIEW_NEW = """
CREATE OR REPLACE VIEW v_goleadores_torneo AS
WITH
-- Goles válidos por jugador y torneo
goles_por_torneo AS (
    SELECT
        p.id_persona,
        p.nombre,
        p.apellido,
        p.documento,
        t.id_torneo,
        t.nombre AS nombre_torneo,
        t.categoria,
        t.genero,
        t.fecha_inicio,
        t.fecha_fin,
        c.id_club,
        c.nombre AS nombre_club,
        eq.id_equipo,
        eq.nombre AS nombre_equipo,
        COUNT(g.id_gol) AS goles_en_torneo,
        COUNT(g.id_gol) FILTER (WHERE g.es_autogol = TRUE) AS autogoles_en_torneo,
        COUNT(g.id_gol) FILTER (WHERE g.es_autogol = FALSE) AS goles_netos_en_torneo
    FROM gol g
    INNER JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
    INNER JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
    INNER JOIN persona p ON pi.id_persona = p.id_persona
    INNER JOIN plantel pl ON pi.id_plantel = pl.id_plantel
    INNER JOIN equipo eq ON pl.id_equipo = eq.id_equipo
    INNER JOIN club c ON eq.id_club = c.id_club
    INNER JOIN partido pa ON g.id_partido = pa.id_partido
    INNER JOIN torneo t ON pa.id_torneo = t.id_torneo
    WHERE g.estado_gol = 'VALIDO'
      AND (pi.fecha_baja IS NULL OR pi.fecha_baja > pa.fecha)
      AND (t.borrado_en IS NULL)
    GROUP BY p.id_persona, p.nombre, p.apellido, p.documento,
             t.id_torneo, t.nombre, t.categoria, t.genero, t.fecha_inicio, t.fecha_fin,
             c.id_club, c.nombre, eq.id_equipo, eq.nombre
),
-- Partidos jugados por persona en cada torneo (apariciones en participan_partido)
partidos_jugados_torneo AS (
    SELECT
        pi.id_persona,
        pa.id_torneo,
        COUNT(DISTINCT pa.id_partido) AS partidos_jugados
    FROM participan_partido pp
    INNER JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
    INNER JOIN partido pa ON pp.id_partido = pa.id_partido
    INNER JOIN torneo t ON pa.id_torneo = t.id_torneo
    WHERE t.borrado_en IS NULL
      AND pa.estado_partido = 'TERMINADO'
    GROUP BY pi.id_persona, pa.id_torneo
),
-- Goles totales en la carrera del jugador (válidos)
goles_carrera AS (
    SELECT
        p.id_persona,
        COUNT(g.id_gol) AS goles_totales_carrera,
        COUNT(g.id_gol) FILTER (WHERE g.es_autogol = TRUE) AS autogoles_totales_carrera,
        COUNT(DISTINCT t.id_torneo) AS torneos_disputados
    FROM persona p
    LEFT JOIN plantel_integrante pi ON p.id_persona = pi.id_persona
    LEFT JOIN participan_partido pp ON pi.id_plantel_integrante = pp.id_plantel_integrante
    LEFT JOIN gol g ON pp.id_participante_partido = g.id_participante_partido
        AND g.estado_gol = 'VALIDO'
    LEFT JOIN partido pa ON g.id_partido = pa.id_partido
    LEFT JOIN torneo t ON pa.id_torneo = t.id_torneo AND t.borrado_en IS NULL
    WHERE p.borrado_en IS NULL
    GROUP BY p.id_persona
)
SELECT
    gt.id_persona,
    gt.nombre,
    gt.apellido,
    gt.documento,
    gt.id_torneo,
    gt.nombre_torneo,
    gt.categoria,
    gt.genero,
    gt.fecha_inicio,
    gt.fecha_fin,
    gt.id_club,
    gt.nombre_club,
    gt.id_equipo,
    gt.nombre_equipo,
    gt.goles_en_torneo,
    gt.autogoles_en_torneo,
    gt.goles_netos_en_torneo,
    COALESCE(pj.partidos_jugados, 0) AS partidos_jugados,
    CASE
        WHEN COALESCE(pj.partidos_jugados, 0) > 0
        THEN ROUND(gt.goles_netos_en_torneo::numeric / pj.partidos_jugados, 2)
        ELSE NULL
    END AS promedio_goles,
    COALESCE(gc.goles_totales_carrera, 0) AS goles_totales_carrera,
    COALESCE(gc.autogoles_totales_carrera, 0) AS autogoles_totales_carrera,
    COALESCE(gc.torneos_disputados, 0) AS torneos_disputados,
    -- Ranking en el torneo actual
    RANK() OVER (PARTITION BY gt.id_torneo ORDER BY gt.goles_netos_en_torneo DESC) AS ranking_en_torneo
FROM goles_por_torneo gt
LEFT JOIN partidos_jugados_torneo pj
       ON pj.id_persona = gt.id_persona AND pj.id_torneo = gt.id_torneo
LEFT JOIN goles_carrera gc ON gt.id_persona = gc.id_persona;
"""

VIEW_OLD = """
CREATE OR REPLACE VIEW v_goleadores_torneo AS
WITH
-- Goles válidos por jugador y torneo
goles_por_torneo AS (
    SELECT
        p.id_persona,
        p.nombre,
        p.apellido,
        p.documento,
        t.id_torneo,
        t.nombre AS nombre_torneo,
        t.categoria,
        t.genero,
        t.fecha_inicio,
        t.fecha_fin,
        c.id_club,
        c.nombre AS nombre_club,
        eq.id_equipo,
        eq.nombre AS nombre_equipo,
        COUNT(g.id_gol) AS goles_en_torneo,
        COUNT(g.id_gol) FILTER (WHERE g.es_autogol = TRUE) AS autogoles_en_torneo,
        COUNT(g.id_gol) FILTER (WHERE g.es_autogol = FALSE) AS goles_netos_en_torneo
    FROM gol g
    INNER JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
    INNER JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
    INNER JOIN persona p ON pi.id_persona = p.id_persona
    INNER JOIN plantel pl ON pi.id_plantel = pl.id_plantel
    INNER JOIN equipo eq ON pl.id_equipo = eq.id_equipo
    INNER JOIN club c ON eq.id_club = c.id_club
    INNER JOIN partido pa ON g.id_partido = pa.id_partido
    INNER JOIN torneo t ON pa.id_torneo = t.id_torneo
    WHERE g.estado_gol = 'VALIDO'
      AND (pi.fecha_baja IS NULL OR pi.fecha_baja > pa.fecha)
      AND (t.borrado_en IS NULL)
    GROUP BY p.id_persona, p.nombre, p.apellido, p.documento,
             t.id_torneo, t.nombre, t.categoria, t.genero, t.fecha_inicio, t.fecha_fin,
             c.id_club, c.nombre, eq.id_equipo, eq.nombre
),
-- Goles totales en la carrera del jugador (válidos)
goles_carrera AS (
    SELECT
        p.id_persona,
        COUNT(g.id_gol) AS goles_totales_carrera,
        COUNT(g.id_gol) FILTER (WHERE g.es_autogol = TRUE) AS autogoles_totales_carrera,
        COUNT(DISTINCT t.id_torneo) AS torneos_disputados
    FROM persona p
    LEFT JOIN plantel_integrante pi ON p.id_persona = pi.id_persona
    LEFT JOIN participan_partido pp ON pi.id_plantel_integrante = pp.id_plantel_integrante
    LEFT JOIN gol g ON pp.id_participante_partido = g.id_participante_partido
        AND g.estado_gol = 'VALIDO'
    LEFT JOIN partido pa ON g.id_partido = pa.id_partido
    LEFT JOIN torneo t ON pa.id_torneo = t.id_torneo AND t.borrado_en IS NULL
    WHERE p.borrado_en IS NULL
    GROUP BY p.id_persona
)
SELECT
    gt.id_persona,
    gt.nombre,
    gt.apellido,
    gt.documento,
    gt.id_torneo,
    gt.nombre_torneo,
    gt.categoria,
    gt.genero,
    gt.fecha_inicio,
    gt.fecha_fin,
    gt.id_club,
    gt.nombre_club,
    gt.id_equipo,
    gt.nombre_equipo,
    gt.goles_en_torneo,
    gt.autogoles_en_torneo,
    gt.goles_netos_en_torneo,
    COALESCE(gc.goles_totales_carrera, 0) AS goles_totales_carrera,
    COALESCE(gc.autogoles_totales_carrera, 0) AS autogoles_totales_carrera,
    COALESCE(gc.torneos_disputados, 0) AS torneos_disputados,
    -- Ranking en el torneo actual
    RANK() OVER (PARTITION BY gt.id_torneo ORDER BY gt.goles_netos_en_torneo DESC) AS ranking_en_torneo
FROM goles_por_torneo gt
LEFT JOIN goles_carrera gc ON gt.id_persona = gc.id_persona;
"""


def upgrade() -> None:
    op.execute("DROP VIEW IF EXISTS v_goleadores_torneo")
    op.execute(VIEW_NEW)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS v_goleadores_torneo")
    op.execute(VIEW_OLD)
