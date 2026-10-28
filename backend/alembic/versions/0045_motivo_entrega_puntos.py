"""Registrar el motivo de la entrega de puntos y permitir no otorgarlos

Hasta ahora, otorgar puntos (walkover) sólo guardaba dos números en
`goles_por_defecto_local` / `goles_por_defecto_visitante`. El motivo —no
presentación, descalificación— no quedaba en ningún lado: el modal lo mencionaba
pero no lo persistía. En el sitio público el partido se publicaba como cualquier
otro, con la lista de goleadores vacía y sin explicación.

Esta migración agrega:

1. `motivo_puntos`: enum **obligatorio** al otorgar puntos (la columna es nullable
   porque los partidos normales no lo tienen). Es lo que se muestra en el detalle
   del partido.

2. `descripcion_puntos`: texto libre **opcional y administrativo**. No se muestra
   en las vistas públicas; sirve para dejar constancia interna.

3. `sin_puntos`: cuando no se presenta ninguno de los dos, permite no otorgar
   puntos a nadie. Sin esta marca, un 0-0 le daría **1 punto a cada uno** por la
   regla del empate, que es justo lo contrario de lo que se quiere.

Y modifica `recalcular_tabla_posiciones` para que un partido con `sin_puntos`
sume partido jugado y perdido a los dos equipos, con 0 puntos y 0 goles.

**Backfill**: de los 4 partidos con goles por defecto que existen, sólo 2 son
inequívocos (4-0 sin ningún gol ni convocado cargado) y se marcan como
`NO_PRESENTO_VISITANTE`. Los otros 2 se dejan **sin motivo, a propósito**:

  - partido 274: tiene 4 goles cargados Y 4 por defecto, y se publica 8-0.
    Requiere una decisión humana sobre cuál es el resultado real.
  - partido 280: goles por defecto 0-0 sobre un partido que sí se jugó; la
    entrega de puntos no cambió nada y probablemente fue un uso equivocado.

Esta migración no borra ni un gol: la limpieza al otorgar puntos rige de acá en
adelante, desde el servicio.

Revision ID: 0045
Revises: 0044
Create Date: 2026-09-24
"""
from alembic import op

revision = '0045'
down_revision = '0044'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # =========================================================
    # 1. Enum del motivo
    # =========================================================
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_motivo_puntos') THEN
                CREATE TYPE tipo_motivo_puntos AS ENUM (
                    'NO_PRESENTO_LOCAL',
                    'NO_PRESENTO_VISITANTE',
                    'NO_PRESENTARON_AMBOS',
                    'DESCALIFICADO_LOCAL',
                    'DESCALIFICADO_VISITANTE',
                    'OTRO'
                );
            END IF;
        END $$;
    """)

    # =========================================================
    # 2. Columnas en partido
    # =========================================================
    op.execute("""
        ALTER TABLE partido
            ADD COLUMN IF NOT EXISTS motivo_puntos      tipo_motivo_puntos,
            ADD COLUMN IF NOT EXISTS descripcion_puntos VARCHAR(500),
            ADD COLUMN IF NOT EXISTS sin_puntos         BOOLEAN NOT NULL DEFAULT FALSE;
    """)

    # `sin_puntos` sólo tiene sentido dentro de una entrega de puntos.
    op.execute("""
        ALTER TABLE partido
            DROP CONSTRAINT IF EXISTS chk_partido_sin_puntos_con_motivo;
        ALTER TABLE partido
            ADD CONSTRAINT chk_partido_sin_puntos_con_motivo
            CHECK (NOT sin_puntos OR motivo_puntos IS NOT NULL);
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_partido_motivo_puntos
            ON partido (motivo_puntos) WHERE motivo_puntos IS NOT NULL;
    """)

    # =========================================================
    # 3. Backfill sólo de los casos inequívocos
    # =========================================================
    # Un 4-0 por defecto, sin un solo gol ni convocado cargado, es una no
    # presentación del visitante. Cualquier otra combinación queda sin motivo
    # para que la revise una persona.
    op.execute("""
        UPDATE partido p
           SET motivo_puntos = 'NO_PRESENTO_VISITANTE'
         WHERE p.goles_por_defecto_local > 0
           AND COALESCE(p.goles_por_defecto_visitante, 0) = 0
           AND p.motivo_puntos IS NULL
           AND NOT EXISTS (SELECT 1 FROM gol g WHERE g.id_partido = p.id_partido)
           AND NOT EXISTS (SELECT 1 FROM participan_partido pp WHERE pp.id_partido = p.id_partido);
    """)
    op.execute("""
        UPDATE partido p
           SET motivo_puntos = 'NO_PRESENTO_LOCAL'
         WHERE p.goles_por_defecto_visitante > 0
           AND COALESCE(p.goles_por_defecto_local, 0) = 0
           AND p.motivo_puntos IS NULL
           AND NOT EXISTS (SELECT 1 FROM gol g WHERE g.id_partido = p.id_partido)
           AND NOT EXISTS (SELECT 1 FROM participan_partido pp WHERE pp.id_partido = p.id_partido);
    """)

    # =========================================================
    # 4. Puntos: un partido `sin_puntos` no reparte nada
    # =========================================================
    _crear_funcion_posiciones(con_sin_puntos=True)


def downgrade() -> None:
    _crear_funcion_posiciones(con_sin_puntos=False)

    op.execute("DROP INDEX IF EXISTS idx_partido_motivo_puntos;")
    op.execute("ALTER TABLE partido DROP CONSTRAINT IF EXISTS chk_partido_sin_puntos_con_motivo;")
    op.execute("""
        ALTER TABLE partido
            DROP COLUMN IF EXISTS motivo_puntos,
            DROP COLUMN IF EXISTS descripcion_puntos,
            DROP COLUMN IF EXISTS sin_puntos;
    """)
    op.execute("DROP TYPE IF EXISTS tipo_motivo_puntos;")


def _crear_funcion_posiciones(*, con_sin_puntos: bool) -> None:
    """
    Reescribe `recalcular_tabla_posiciones`.

    Con `con_sin_puntos`, los partidos marcados `sin_puntos` suman partido jugado
    y perdido a ambos equipos, con 0 puntos y 0 goles. Sin la marca, el 0-0 caería
    en la rama del empate y repartiría 1 punto a cada uno.
    """
    if con_sin_puntos:
        campos = """
            SUM(CASE WHEN sin_puntos THEN 0 WHEN gf > gc THEN 1 ELSE 0 END) AS ganados,
            SUM(CASE WHEN sin_puntos THEN 0 WHEN gf = gc THEN 1 ELSE 0 END) AS empatados,
            SUM(CASE WHEN sin_puntos THEN 1 WHEN gf < gc THEN 1 ELSE 0 END) AS perdidos,
            SUM(CASE WHEN sin_puntos THEN 0 ELSE gf END) AS goles_a_favor,
            SUM(CASE WHEN sin_puntos THEN 0 ELSE gc END) AS goles_en_contra,
            SUM(
                CASE
                    WHEN sin_puntos THEN 0
                    WHEN gf > gc THEN 3
                    WHEN gf = gc THEN 1
                    ELSE 0
                END
            ) AS puntos
        """
        col_extra_local = "p.sin_puntos"
        col_extra_visitante = "p.sin_puntos"
    else:
        campos = """
            SUM(CASE WHEN gf > gc THEN 1 ELSE 0 END) AS ganados,
            SUM(CASE WHEN gf = gc THEN 1 ELSE 0 END) AS empatados,
            SUM(CASE WHEN gf < gc THEN 1 ELSE 0 END) AS perdidos,
            SUM(gf) AS goles_a_favor,
            SUM(gc) AS goles_en_contra,
            SUM(
                CASE
                    WHEN gf > gc THEN 3
                    WHEN gf = gc THEN 1
                    ELSE 0
                END
            ) AS puntos
        """
        col_extra_local = "FALSE"
        col_extra_visitante = "FALSE"

    op.execute(f"""
        CREATE OR REPLACE FUNCTION recalcular_tabla_posiciones(p_id_torneo INT)
        RETURNS VOID AS $$
        BEGIN
            UPDATE posicion
            SET puntos = 0,
                partidos_jugados = 0,
                ganados = 0,
                empatados = 0,
                perdidos = 0,
                goles_a_favor = 0,
                goles_en_contra = 0
            WHERE id_torneo = p_id_torneo;

            UPDATE posicion pos
            SET
                partidos_jugados = pos.partidos_jugados + x.partidos_jugados,
                ganados           = pos.ganados           + x.ganados,
                empatados         = pos.empatados         + x.empatados,
                perdidos          = pos.perdidos          + x.perdidos,
                goles_a_favor     = pos.goles_a_favor     + x.goles_a_favor,
                goles_en_contra   = pos.goles_en_contra   + x.goles_en_contra,
                puntos            = pos.puntos            + x.puntos
            FROM (
                SELECT
                    it.id_equipo,
                    COUNT(*) AS partidos_jugados,
                    {campos}
                FROM (
                    -- LOCAL
                    SELECT
                        p.id_torneo,
                        p.id_inscripcion_local   AS id_inscripcion,
                        r.goles_local            AS gf,
                        r.goles_visitante        AS gc,
                        {col_extra_local}        AS sin_puntos
                    FROM vw_resultado_partido r
                    JOIN partido p ON p.id_partido = r.id_partido
                    WHERE p.estado_partido = 'TERMINADO'
                      -- Las llaves no reparten puntos: reparten el pase de ronda.
                      AND p.id_fixture_playoff_ronda IS NULL

                    UNION ALL

                    -- VISITANTE
                    SELECT
                        p.id_torneo,
                        p.id_inscripcion_visitante AS id_inscripcion,
                        r.goles_visitante          AS gf,
                        r.goles_local              AS gc,
                        {col_extra_visitante}      AS sin_puntos
                    FROM vw_resultado_partido r
                    JOIN partido p ON p.id_partido = r.id_partido
                    WHERE p.estado_partido = 'TERMINADO'
                      AND p.id_fixture_playoff_ronda IS NULL
                ) partidos
                JOIN inscripcion_torneo it
                  ON it.id_inscripcion = partidos.id_inscripcion
                WHERE partidos.id_torneo = p_id_torneo
                GROUP BY it.id_equipo
            ) x
            WHERE pos.id_torneo = p_id_torneo
              AND pos.id_equipo = x.id_equipo;
        END;
        $$ LANGUAGE plpgsql;
    """)
