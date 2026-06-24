"""Add club IDs to vw_partidos_detallados view

Revision ID: 0017
Revises: 0016
Create Date: 2024-06-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0017'
down_revision = '0016'
branch_labels = None
depends_on = None


def upgrade():
    # Drop and recreate the view with id_club_local and id_club_visitante fields
    op.execute("DROP VIEW IF EXISTS vw_partidos_detallados CASCADE")
    op.execute("""
    CREATE VIEW vw_partidos_detallados AS
     SELECT p.id_partido,
        p.id_torneo,
        t.categoria AS categoria_torneo,
        t.genero AS genero_torneo,
        t.division AS division_torneo,
        itl.id_equipo AS id_equipo_local,
        itv.id_equipo AS id_equipo_visitante,
        el.id_club AS id_club_local,
        ev.id_club AS id_club_visitante,
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
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || COALESCE(pp.numero_camiseta::text, ''::text)) || '|'::text) || pi.rol_en_plantel) || '|'::text) || COALESCE((pi.id_plantel_integrante = p.id_capitan_local)::text,'false'), '; '::text ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta) AS string_agg
               FROM participan_partido pp
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN persona per ON pi.id_persona = per.id_persona
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_jugadores_local,
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || COALESCE(pp.numero_camiseta::text, ''::text)) || '|'::text) || pi.rol_en_plantel) || '|'::text) || COALESCE((pi.id_plantel_integrante = p.id_capitan_visitante)::text,'false'), '; '::text ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta) AS string_agg
               FROM participan_partido pp
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN persona per ON pi.id_persona = per.id_persona
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo) AS lista_jugadores_visitante,
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || g.minuto) || '|'::text) || COALESCE(g.cuarto::text,'')) || '|'::text) || g.es_autogol::text, '; '::text) AS string_agg
               FROM gol g
                 JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN persona per ON pi.id_persona = per.id_persona
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itl.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itv.id_equipo AND g.es_autogol)) AS lista_goles_local,
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || tj.minuto) || '|'::text) || COALESCE(tj.cuarto::text,'')) || '|'::text) || tj.tipo::text, '; '::text) AS string_agg
               FROM tarjeta tj
                 JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN persona per ON pi.id_persona = per.id_persona
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_tarjetas_local,
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || g.minuto) || '|'::text) || COALESCE(g.cuarto::text,'')) || '|'::text) || g.es_autogol::text, '; '::text) AS string_agg
               FROM gol g
                 JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN persona per ON pi.id_persona = per.id_persona
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itv.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itl.id_equipo AND g.es_autogol)) AS lista_goles_visitante,
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || tj.minuto) || '|'::text) || COALESCE(tj.cuarto::text,'')) || '|'::text) || tj.tipo::text, '; '::text) AS string_agg
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
    """)


def downgrade():
    # Downgrade by removing the id_club fields (recreate original view)
    op.execute("DROP VIEW IF EXISTS vw_partidos_detallados CASCADE")
    op.execute("""
    CREATE VIEW vw_partidos_detallados AS
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
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || COALESCE(pp.numero_camiseta::text, ''::text)) || '|'::text) || pi.rol_en_plantel) || '|'::text) || COALESCE((pi.id_plantel_integrante = p.id_capitan_local)::text,'false'), '; '::text ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta) AS string_agg
               FROM participan_partido pp
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN persona per ON pi.id_persona = per.id_persona
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_jugadores_local,
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || COALESCE(pp.numero_camiseta::text, ''::text)) || '|'::text) || pi.rol_en_plantel) || '|'::text) || COALESCE((pi.id_plantel_integrante = p.id_capitan_visitante)::text,'false'), '; '::text ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta) AS string_agg
               FROM participan_partido pp
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN persona per ON pi.id_persona = per.id_persona
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo) AS lista_jugadores_visitante,
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || g.minuto) || '|'::text) || COALESCE(g.cuarto::text,'')) || '|'::text) || g.es_autogol::text, '; '::text) AS string_agg
               FROM gol g
                 JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN persona per ON pi.id_persona = per.id_persona
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itl.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itv.id_equipo AND g.es_autogol)) AS lista_goles_local,
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || tj.minuto) || '|'::text) || COALESCE(tj.cuarto::text,'')) || '|'::text) || tj.tipo::text, '; '::text) AS string_agg
               FROM tarjeta tj
                 JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN persona per ON pi.id_persona = per.id_persona
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_tarjetas_local,
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || g.minuto) || '|'::text) || COALESCE(g.cuarto::text,'')) || '|'::text) || g.es_autogol::text, '; '::text) AS string_agg
               FROM gol g
                 JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN persona per ON pi.id_persona = per.id_persona
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE g.id_partido = p.id_partido AND (pl.id_equipo = itv.id_equipo AND NOT g.es_autogol OR pl.id_equipo = itl.id_equipo AND g.es_autogol)) AS lista_goles_visitante,
        ( SELECT string_agg((((((((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text) || tj.minuto) || '|'::text) || COALESCE(tj.cuarto::text,'')) || '|'::text) || tj.tipo::text, '; '::text) AS string_agg
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
    """)
