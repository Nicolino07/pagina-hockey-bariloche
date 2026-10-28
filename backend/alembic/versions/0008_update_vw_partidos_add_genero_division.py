"""Agrega genero y division del torneo a vw_partidos_detallados

Revision ID: 0008
Revises: 0007
Create Date: 2026-03-22
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
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
    TRIM(BOTH FROM (per_a1.apellido::text || ' '::text) || per_a1.nombre::text) AS nombre_arbitro1,
    TRIM(BOTH FROM (per_a2.apellido::text || ' '::text) || per_a2.nombre::text) AS nombre_arbitro2,
    concat_ws('; '::text, TRIM(BOTH FROM (per_a1.apellido::text || ' '::text) || per_a1.nombre::text), TRIM(BOTH FROM (per_a2.apellido::text || ' '::text) || per_a2.nombre::text)) AS arbitros,
    COALESCE(p.goles_local_manual::bigint, ( SELECT count(*) AS count
           FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itl.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itv.id_equipo AND g.es_autogol))) AS goles_local,
    COALESCE(p.goles_visitante_manual::bigint, ( SELECT count(*) AS count
           FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itv.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itl.id_equipo AND g.es_autogol))) AS goles_visitante,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || COALESCE(pp.numero_camiseta::text, ''::text)) || '|'::text) || pi.rol_en_plantel) || '|'::text) || (pi.id_plantel_integrante = p.id_capitan_local)::text, '; '::text ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta) AS string_agg
           FROM participan_partido pp
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_jugadores_local,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || COALESCE(pp.numero_camiseta::text, ''::text)) || '|'::text) || pi.rol_en_plantel) || '|'::text) || (pi.id_plantel_integrante = p.id_capitan_visitante)::text, '; '::text ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta) AS string_agg
           FROM participan_partido pp
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo) AS lista_jugadores_visitante,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || g.minuto) || '|'::text) || g.cuarto) || '|'::text) || g.es_autogol::text, '; '::text) AS string_agg
           FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itl.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itv.id_equipo AND g.es_autogol)) AS lista_goles_local,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || tj.minuto) || '|'::text) || tj.cuarto) || '|'::text) || tj.tipo::text, '; '::text) AS string_agg
           FROM tarjeta tj
             JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_tarjetas_local,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || g.minuto) || '|'::text) || g.cuarto) || '|'::text) || g.es_autogol::text, '; '::text) AS string_agg
           FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itv.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itl.id_equipo AND g.es_autogol)) AS lista_goles_visitante,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || tj.minuto) || '|'::text) || tj.cuarto) || '|'::text) || tj.tipo::text, '; '::text) AS string_agg
           FROM tarjeta tj
             JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo) AS lista_tarjetas_visitante
   FROM partido p
     JOIN torneo t ON p.id_torneo = t.id_torneo
     JOIN inscripcion_torneo itl ON p.id_inscripcion_local = itl.id_inscripcion
     JOIN equipo el ON itl.id_equipo = el.id_equipo
     JOIN inscripcion_torneo itv ON p.id_inscripcion_visitante = itv.id_inscripcion
     JOIN equipo ev ON itv.id_equipo = ev.id_equipo
     LEFT JOIN persona per_a1 ON p.id_arbitro1 = per_a1.id_persona
     LEFT JOIN persona per_a2 ON p.id_arbitro2 = per_a2.id_persona;
"""

VIEW_OLD = """
CREATE OR REPLACE VIEW vw_partidos_detallados AS
 SELECT p.id_partido,
    p.id_torneo,
    t.categoria AS categoria_torneo,
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
    TRIM(BOTH FROM (per_a1.apellido::text || ' '::text) || per_a1.nombre::text) AS nombre_arbitro1,
    TRIM(BOTH FROM (per_a2.apellido::text || ' '::text) || per_a2.nombre::text) AS nombre_arbitro2,
    concat_ws('; '::text, TRIM(BOTH FROM (per_a1.apellido::text || ' '::text) || per_a1.nombre::text), TRIM(BOTH FROM (per_a2.apellido::text || ' '::text) || per_a2.nombre::text)) AS arbitros,
    COALESCE(p.goles_local_manual::bigint, ( SELECT count(*) AS count
           FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itl.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itv.id_equipo AND g.es_autogol))) AS goles_local,
    COALESCE(p.goles_visitante_manual::bigint, ( SELECT count(*) AS count
           FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itv.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itl.id_equipo AND g.es_autogol))) AS goles_visitante,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || COALESCE(pp.numero_camiseta::text, ''::text)) || '|'::text) || pi.rol_en_plantel) || '|'::text) || (pi.id_plantel_integrante = p.id_capitan_local)::text, '; '::text ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta) AS string_agg
           FROM participan_partido pp
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_jugadores_local,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || COALESCE(pp.numero_camiseta::text, ''::text)) || '|'::text) || pi.rol_en_plantel) || '|'::text) || (pi.id_plantel_integrante = p.id_capitan_visitante)::text, '; '::text ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta) AS string_agg
           FROM participan_partido pp
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo) AS lista_jugadores_visitante,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || g.minuto) || '|'::text) || g.cuarto) || '|'::text) || g.es_autogol::text, '; '::text) AS string_agg
           FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itl.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itv.id_equipo AND g.es_autogol)) AS lista_goles_local,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || tj.minuto) || '|'::text) || tj.cuarto) || '|'::text) || tj.tipo::text, '; '::text) AS string_agg
           FROM tarjeta tj
             JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_tarjetas_local,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || g.minuto) || '|'::text) || g.cuarto) || '|'::text) || g.es_autogol::text, '; '::text) AS string_agg
           FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itv.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itl.id_equipo AND g.es_autogol)) AS lista_goles_visitante,
    ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || tj.minuto) || '|'::text) || tj.cuarto) || '|'::text) || tj.tipo::text, '; '::text) AS string_agg
           FROM tarjeta tj
             JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
          WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo) AS lista_tarjetas_visitante
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
    op.execute(VIEW_OLD)
