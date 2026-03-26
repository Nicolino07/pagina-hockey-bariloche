"""Fix vw_partidos_detallados: COALESCE en cuarto y capitan para evitar filas ocultas

Dos bugs en la vista donde NULL en la concatenacion con || excluia filas del string_agg:
1. g.cuarto / tj.cuarto pueden ser NULL -> gol o tarjeta no aparecia en la lista
2. (pi.id_plantel_integrante = p.id_capitan_local/visitante) es NULL cuando no hay
   capitan asignado -> jugador no aparecia en la plantilla

Revision ID: 0010
Revises: 0009
Create Date: 2026-03-26
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

VIEW_NEW = """
CREATE OR REPLACE VIEW vw_partidos_detallados AS
 SELECT p.id_partido,
    p.id_torneo,
    t.categoria AS categoria_torneo,
    t.genero AS genero_torneo,
    t.division AS division_torneo,
    itl.id_equipo AS id_equipo_local,
    itv.id_equipo AS id_equipo_visitante,
    t.nombre AS nombre_torneo,
    p.fecha,
    p.horario,
    p.ubicacion,
    p.numero_fecha,
    p.observaciones,
    p.juez_mesa_local,
    p.juez_mesa_visitante,
    p.creado_por,
    p.creado_en,
    el.nombre AS equipo_local_nombre,
    ev.nombre AS equipo_visitante_nombre,
    TRIM(BOTH FROM (per_a1.apellido::text || ' ') || per_a1.nombre::text) AS nombre_arbitro1,
    TRIM(BOTH FROM (per_a2.apellido::text || ' ') || per_a2.nombre::text) AS nombre_arbitro2,
    concat_ws('; ',
        TRIM(BOTH FROM (per_a1.apellido::text || ' ') || per_a1.nombre::text),
        TRIM(BOTH FROM (per_a2.apellido::text || ' ') || per_a2.nombre::text)
    ) AS arbitros,
    COALESCE(p.goles_local_manual::bigint, (
        SELECT count(*) FROM gol g
        JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
        JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
        JOIN plantel pl ON pi.id_plantel = pl.id_plantel
        WHERE g.id_partido = p.id_partido
        AND (pl.id_equipo = itl.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itv.id_equipo AND g.es_autogol)
    )) AS goles_local,
    COALESCE(p.goles_visitante_manual::bigint, (
        SELECT count(*) FROM gol g
        JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
        JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
        JOIN plantel pl ON pi.id_plantel = pl.id_plantel
        WHERE g.id_partido = p.id_partido
        AND (pl.id_equipo = itv.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itl.id_equipo AND g.es_autogol)
    )) AS goles_visitante,
    (SELECT string_agg(
        per.apellido||'|'||per.nombre||'|'||COALESCE(pp.numero_camiseta::text,'')||'|'||pi.rol_en_plantel||'|'||COALESCE((pi.id_plantel_integrante = p.id_capitan_local)::text,'false'),
        '; ' ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta)
     FROM participan_partido pp
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo
    ) AS lista_jugadores_local,
    (SELECT string_agg(
        per.apellido||'|'||per.nombre||'|'||COALESCE(pp.numero_camiseta::text,'')||'|'||pi.rol_en_plantel||'|'||COALESCE((pi.id_plantel_integrante = p.id_capitan_visitante)::text,'false'),
        '; ' ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta)
     FROM participan_partido pp
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo
    ) AS lista_jugadores_visitante,
    (SELECT string_agg(
        per.apellido||'|'||per.nombre||'|'||g.minuto::text||'|'||COALESCE(g.cuarto::text,'')||'|'||g.es_autogol::text,
        '; ')
     FROM gol g
     JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE g.id_partido = p.id_partido
     AND (pl.id_equipo = itl.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itv.id_equipo AND g.es_autogol)
    ) AS lista_goles_local,
    (SELECT string_agg(
        per.apellido||'|'||per.nombre||'|'||tj.minuto::text||'|'||COALESCE(tj.cuarto::text,'')||'|'||tj.tipo::text,
        '; ')
     FROM tarjeta tj
     JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo
    ) AS lista_tarjetas_local,
    (SELECT string_agg(
        per.apellido||'|'||per.nombre||'|'||g.minuto::text||'|'||COALESCE(g.cuarto::text,'')||'|'||g.es_autogol::text,
        '; ')
     FROM gol g
     JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE g.id_partido = p.id_partido
     AND (pl.id_equipo = itv.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itl.id_equipo AND g.es_autogol)
    ) AS lista_goles_visitante,
    (SELECT string_agg(
        per.apellido||'|'||per.nombre||'|'||tj.minuto::text||'|'||COALESCE(tj.cuarto::text,'')||'|'||tj.tipo::text,
        '; ')
     FROM tarjeta tj
     JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo
    ) AS lista_tarjetas_visitante
   FROM partido p
     JOIN torneo t ON p.id_torneo = t.id_torneo
     JOIN inscripcion_torneo itl ON p.id_inscripcion_local = itl.id_inscripcion
     JOIN equipo el ON itl.id_equipo = el.id_equipo
     JOIN inscripcion_torneo itv ON p.id_inscripcion_visitante = itv.id_inscripcion
     JOIN equipo ev ON itv.id_equipo = ev.id_equipo
     LEFT JOIN persona per_a1 ON p.id_arbitro1 = per_a1.id_persona
     LEFT JOIN persona per_a2 ON p.id_arbitro2 = per_a2.id_persona;
"""


def upgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_partidos_detallados")
    op.execute(VIEW_NEW)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_partidos_detallados")
    op.execute(VIEW_NEW
        .replace("COALESCE(g.cuarto::text,'')", "g.cuarto")
        .replace("COALESCE(tj.cuarto::text,'')", "tj.cuarto")
        .replace("COALESCE((pi.id_plantel_integrante = p.id_capitan_local)::text,'false')", "(pi.id_plantel_integrante = p.id_capitan_local)::text")
        .replace("COALESCE((pi.id_plantel_integrante = p.id_capitan_visitante)::text,'false')", "(pi.id_plantel_integrante = p.id_capitan_visitante)::text")
    )
