"""Agrega campos de resultado manual a la tabla partido

Para categorías como SUB_12 donde no se registran goles individuales,
estos campos permiten cargar el resultado final directamente.

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-20
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE partido ADD COLUMN IF NOT EXISTS goles_local_manual INT CHECK (goles_local_manual >= 0)")
    op.execute("ALTER TABLE partido ADD COLUMN IF NOT EXISTS goles_visitante_manual INT CHECK (goles_visitante_manual >= 0)")

    # Recrear la vista vw_partidos_detallados para que use
    # COALESCE(manual, calculado_por_goles) y exponga categoria_torneo
    op.execute("DROP VIEW IF EXISTS vw_partidos_detallados")
    op.execute("""
        CREATE VIEW vw_partidos_detallados AS
        SELECT
            p.id_partido,
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

            TRIM(per_a1.apellido || ' ' || per_a1.nombre) AS nombre_arbitro1,
            TRIM(per_a2.apellido || ' ' || per_a2.nombre) AS nombre_arbitro2,
            CONCAT_WS('; ',
                TRIM(per_a1.apellido || ' ' || per_a1.nombre),
                TRIM(per_a2.apellido || ' ' || per_a2.nombre)
            ) AS arbitros,

            -- Resultado: si hay manual lo usa, sino infiere desde goles
            COALESCE(
                p.goles_local_manual,
                (SELECT COUNT(*) FROM gol g
                 JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
                 WHERE g.id_partido = p.id_partido
                   AND ((pl.id_equipo = itl.id_equipo AND NOT g.es_autogol)
                     OR (pl.id_equipo = itv.id_equipo AND g.es_autogol)))
            ) AS goles_local,

            COALESCE(
                p.goles_visitante_manual,
                (SELECT COUNT(*) FROM gol g
                 JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
                 JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                 JOIN plantel pl ON pi.id_plantel = pl.id_plantel
                 WHERE g.id_partido = p.id_partido
                   AND ((pl.id_equipo = itv.id_equipo AND NOT g.es_autogol)
                     OR (pl.id_equipo = itl.id_equipo AND g.es_autogol)))
            ) AS goles_visitante,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || COALESCE(pp.numero_camiseta::text, '') || '|' || pi.rol_en_plantel, '; ' ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta ASC)
             FROM participan_partido pp
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
             WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_jugadores_local,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || COALESCE(pp.numero_camiseta::text, '') || '|' || pi.rol_en_plantel, '; ' ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta ASC)
             FROM participan_partido pp
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
             WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo) AS lista_jugadores_visitante,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || g.minuto || '|' || g.cuarto || '|' || g.es_autogol::text, '; ')
             FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
             WHERE g.id_partido = p.id_partido
               AND ((pl.id_equipo = itl.id_equipo AND NOT g.es_autogol)
                 OR (pl.id_equipo = itv.id_equipo AND g.es_autogol))) AS lista_goles_local,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || tj.minuto || '|' || tj.cuarto || '|' || tj.tipo::text, '; ')
             FROM tarjeta tj
             JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
             WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_tarjetas_local,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || g.minuto || '|' || g.cuarto || '|' || g.es_autogol::text, '; ')
             FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
             WHERE g.id_partido = p.id_partido
               AND ((pl.id_equipo = itv.id_equipo AND NOT g.es_autogol)
                 OR (pl.id_equipo = itl.id_equipo AND g.es_autogol))) AS lista_goles_visitante,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || tj.minuto || '|' || tj.cuarto || '|' || tj.tipo::text, '; ')
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
        LEFT JOIN persona per_a2 ON p.id_arbitro2 = per_a2.id_persona
    """)


def downgrade() -> None:
    # Restaurar vista sin los campos manuales
    op.execute("""
        CREATE OR REPLACE VIEW vw_partidos_detallados AS
        SELECT
            p.id_partido,
            p.id_torneo,
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

            TRIM(per_a1.apellido || ' ' || per_a1.nombre) AS nombre_arbitro1,
            TRIM(per_a2.apellido || ' ' || per_a2.nombre) AS nombre_arbitro2,
            CONCAT_WS('; ',
                TRIM(per_a1.apellido || ' ' || per_a1.nombre),
                TRIM(per_a2.apellido || ' ' || per_a2.nombre)
            ) AS arbitros,

            COALESCE((SELECT COUNT(*) FROM gol g
                      JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
                      JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                      JOIN plantel pl ON pi.id_plantel = pl.id_plantel
                      WHERE g.id_partido = p.id_partido
                        AND ((pl.id_equipo = itl.id_equipo AND NOT g.es_autogol)
                          OR (pl.id_equipo = itv.id_equipo AND g.es_autogol))), 0) AS goles_local,

            COALESCE((SELECT COUNT(*) FROM gol g
                      JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
                      JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
                      JOIN plantel pl ON pi.id_plantel = pl.id_plantel
                      WHERE g.id_partido = p.id_partido
                        AND ((pl.id_equipo = itv.id_equipo AND NOT g.es_autogol)
                          OR (pl.id_equipo = itl.id_equipo AND g.es_autogol))), 0) AS goles_visitante,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || COALESCE(pp.numero_camiseta::text, '') || '|' || pi.rol_en_plantel, '; ' ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta ASC)
             FROM participan_partido pp
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
             WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_jugadores_local,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || COALESCE(pp.numero_camiseta::text, '') || '|' || pi.rol_en_plantel, '; ' ORDER BY pi.rol_en_plantel DESC, pp.numero_camiseta ASC)
             FROM participan_partido pp
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
             WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo) AS lista_jugadores_visitante,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || g.minuto || '|' || g.cuarto || '|' || g.es_autogol::text, '; ')
             FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
             WHERE g.id_partido = p.id_partido
               AND ((pl.id_equipo = itl.id_equipo AND NOT g.es_autogol)
                 OR (pl.id_equipo = itv.id_equipo AND g.es_autogol))) AS lista_goles_local,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || tj.minuto || '|' || tj.cuarto || '|' || tj.tipo::text, '; ')
             FROM tarjeta tj
             JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
             WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_tarjetas_local,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || g.minuto || '|' || g.cuarto || '|' || g.es_autogol::text, '; ')
             FROM gol g
             JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
             JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
             JOIN persona per ON pi.id_persona = per.id_persona
             JOIN plantel pl ON pi.id_plantel = pl.id_plantel
             WHERE g.id_partido = p.id_partido
               AND ((pl.id_equipo = itv.id_equipo AND NOT g.es_autogol)
                 OR (pl.id_equipo = itl.id_equipo AND g.es_autogol))) AS lista_goles_visitante,

            (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || tj.minuto || '|' || tj.cuarto || '|' || tj.tipo::text, '; ')
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
        LEFT JOIN persona per_a2 ON p.id_arbitro2 = per_a2.id_persona
    """)

    op.execute("ALTER TABLE partido DROP COLUMN IF EXISTS goles_local_manual")
    op.execute("ALTER TABLE partido DROP COLUMN IF EXISTS goles_visitante_manual")
