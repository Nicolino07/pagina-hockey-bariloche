"""Vista de jugadores que participaron en cada torneo

La nómina habilitada por torneo recién existe a partir de la migración 0033
(`plantel.id_torneo`), así que para los torneos anteriores no hay registro de
quién estaba habilitado. Lo que sí es un hecho histórico completo e inmutable es
quién fue planillado: `participan_partido → partido → torneo`.

Esta vista expone exactamente eso, y por lo tanto funciona igual para los
torneos ya cerrados que para los nuevos. Los playoffs se agrupan con su torneo
base (`COALESCE(torneo_base_id, id_torneo)`) para que la lista de un torneo
incluya lo jugado en sus finales.

No toca planteles ni constraints.

Revision ID: 0034
Revises: 0033
Create Date: 2026-07-28
"""
from alembic import op

revision = '0034'
down_revision = '0033'
branch_labels = None
depends_on = None


_VISTA = """
CREATE OR REPLACE VIEW vw_jugadores_participaron_torneo AS
SELECT
    COALESCE(t.torneo_base_id, t.id_torneo) AS id_torneo,
    tb.nombre                               AS nombre_torneo,
    e.id_equipo,
    e.nombre                                AS nombre_equipo,
    per.id_persona,
    per.nombre                              AS nombre_persona,
    per.apellido                            AS apellido_persona,
    per.documento,
    pi.rol_en_plantel,
    -- Dorsal efectivamente usado. Se toma de participan_partido (no del
    -- plantel) porque es el que quedó registrado en la planilla del partido.
    MIN(pp.numero_camiseta)                 AS numero_camiseta,
    COUNT(DISTINCT p.id_partido)            AS partidos_jugados,
    MIN(p.fecha)                            AS primer_partido,
    MAX(p.fecha)                            AS ultimo_partido
FROM participan_partido pp
JOIN partido p            ON p.id_partido = pp.id_partido
JOIN torneo t             ON t.id_torneo = p.id_torneo
JOIN torneo tb            ON tb.id_torneo = COALESCE(t.torneo_base_id, t.id_torneo)
JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
JOIN persona per          ON per.id_persona = pi.id_persona
JOIN plantel pl           ON pl.id_plantel = pi.id_plantel
JOIN equipo e             ON e.id_equipo = pl.id_equipo
GROUP BY
    COALESCE(t.torneo_base_id, t.id_torneo),
    tb.nombre,
    e.id_equipo,
    e.nombre,
    per.id_persona,
    per.nombre,
    per.apellido,
    per.documento,
    pi.rol_en_plantel;
"""


def upgrade() -> None:
    op.execute(_VISTA)
    op.execute("GRANT SELECT ON vw_jugadores_participaron_torneo TO hockey_app;")


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_jugadores_participaron_torneo;")
