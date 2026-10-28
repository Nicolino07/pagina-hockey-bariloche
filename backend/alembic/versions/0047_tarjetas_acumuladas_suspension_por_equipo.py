"""Asterisco de suspensiones cumplidas por equipo en vw_tarjetas_acumuladas_torneo

La vista agrupa las tarjetas por persona + equipo, pero sumaba las
suspensiones cumplidas solo por persona + torneo. Una persona que está en
dos equipos del mismo torneo (ej. cuerpo técnico de la A y de la B) mostraba
la misma suspensión cumplida en las dos filas. Ahora cada suspensión se
atribuye al equipo con el que la persona figuró en el partido de origen
(`id_partido_origen`, que las suspensiones automáticas pasan a guardar).

Revision ID: 0047
Revises: 0046
Create Date: 2026-10-27
"""
from alembic import op

revision = '0047'
down_revision = '0046'
branch_labels = None
depends_on = None


VISTA_POR_EQUIPO = """
CREATE OR REPLACE VIEW vw_tarjetas_acumuladas_torneo AS
SELECT
    v.id_torneo,
    v.torneo,
    v.id_persona,
    v.nombre_persona,
    v.apellido_persona,
    v.id_equipo,
    v.equipo,
    COUNT(*)                       AS total_tarjetas,
    SUM(v.verdes)                  AS total_verdes,
    SUM(v.amarillas)               AS total_amarillas,
    SUM(v.rojas)                   AS total_rojas,
    COALESCE(sc.cumplidas_amarillas, 0) AS suspensiones_cumplidas_amarillas,
    COALESCE(sc.cumplidas_rojas, 0)     AS suspensiones_cumplidas_rojas
FROM vw_tarjetas_detalle_torneo v
LEFT JOIN (
    SELECT
        s.id_persona,
        s.id_torneo,
        eq.id_equipo,
        COUNT(*) FILTER (WHERE s.origen = 'AUTOMATICA_AMARILLAS') AS cumplidas_amarillas,
        COUNT(*) FILTER (WHERE s.origen = 'AUTOMATICA_ROJA')      AS cumplidas_rojas
    FROM suspension s
    JOIN LATERAL (
        SELECT pl.id_equipo
        FROM participan_partido pp
        JOIN plantel_integrante pi
            ON pi.id_plantel_integrante = pp.id_plantel_integrante
        JOIN plantel pl
            ON pl.id_plantel = pi.id_plantel
        WHERE pp.id_partido = s.id_partido_origen
          AND pi.id_persona = s.id_persona
        LIMIT 1
    ) eq ON TRUE
    WHERE s.estado_suspension = 'CUMPLIDA'
    GROUP BY s.id_persona, s.id_torneo, eq.id_equipo
) sc
    ON sc.id_persona = v.id_persona
   AND sc.id_torneo = v.id_torneo
   AND sc.id_equipo = v.id_equipo
GROUP BY
    v.id_torneo,
    v.torneo,
    v.id_persona,
    v.nombre_persona,
    v.apellido_persona,
    v.id_equipo,
    v.equipo,
    sc.cumplidas_amarillas,
    sc.cumplidas_rojas;
"""

VISTA_POR_PERSONA = """
CREATE OR REPLACE VIEW vw_tarjetas_acumuladas_torneo AS
SELECT
    v.id_torneo,
    v.torneo,
    v.id_persona,
    v.nombre_persona,
    v.apellido_persona,
    v.id_equipo,
    v.equipo,
    COUNT(*)                       AS total_tarjetas,
    SUM(v.verdes)                  AS total_verdes,
    SUM(v.amarillas)               AS total_amarillas,
    SUM(v.rojas)                   AS total_rojas,
    COALESCE(sc.cumplidas_amarillas, 0) AS suspensiones_cumplidas_amarillas,
    COALESCE(sc.cumplidas_rojas, 0)     AS suspensiones_cumplidas_rojas
FROM vw_tarjetas_detalle_torneo v
LEFT JOIN (
    SELECT
        s.id_persona,
        s.id_torneo,
        COUNT(*) FILTER (WHERE s.origen = 'AUTOMATICA_AMARILLAS') AS cumplidas_amarillas,
        COUNT(*) FILTER (WHERE s.origen = 'AUTOMATICA_ROJA')      AS cumplidas_rojas
    FROM suspension s
    WHERE s.estado_suspension = 'CUMPLIDA'
    GROUP BY s.id_persona, s.id_torneo
) sc
    ON sc.id_persona = v.id_persona
   AND sc.id_torneo = v.id_torneo
GROUP BY
    v.id_torneo,
    v.torneo,
    v.id_persona,
    v.nombre_persona,
    v.apellido_persona,
    v.id_equipo,
    v.equipo,
    sc.cumplidas_amarillas,
    sc.cumplidas_rojas;
"""


def upgrade() -> None:
    op.execute(VISTA_POR_EQUIPO)


def downgrade() -> None:
    op.execute(VISTA_POR_PERSONA)
