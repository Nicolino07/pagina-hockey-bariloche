"""Un partido de playoff no reparte puntos: reparte el pase a la ronda siguiente

`posicion` se mantiene sola con dos triggers: uno crea una fila en cero por cada
inscripción, y otro recalcula la tabla cada vez que un partido termina. Ninguno
de los dos miraba el tipo de torneo, así que un playoff acumulaba 3 puntos por
victoria como si fuera una liga.

Esos puntos no significan nada — en una eliminación directa ganar da el pase,
no puntos — y encima son peligrosos: la tabla anual suma la `posicion` de los
torneos marcados `REGULAR`, así que un playoff mal marcado metía en el año
partidos que ya estaban contados en la liga que lo originó.

Se corrige en el origen, con dos reglas:

  1. **Un partido que pertenece a una ronda de playoff no reparte puntos ni
     estadística.** El criterio es `partido.id_fixture_playoff_ronda`, no el
     tipo del torneo: una copa con fase de grupos y llaves reparte puntos en
     los grupos y no en las llaves, que es lo correcto.
  2. **Un torneo de tipo PLAYOFF no tiene tabla de posiciones**: no se le crean
     filas de `posicion` al inscribir equipos.

Datos: se borran las filas de `posicion` de los torneos de tipo PLAYOFF. Hoy son
18 filas con 24 puntos repartidos entre dos «FINALES APERTURA» ya terminados,
que nunca debieron existir.

Lo que NO se toca: los torneos de tipo COPA cuyos partidos no están en ninguna
ronda. Una copa puede repartir puntos (fase de grupos) y el sistema no tiene
cómo distinguir eso de un mal tipeo, así que se deja como está.

Revision ID: 0042
Revises: 0041
Create Date: 2026-08-29
"""
from alembic import op

revision = '0042'
down_revision = '0041'
branch_labels = None
depends_on = None


# Idéntica a la anterior salvo el filtro `id_fixture_playoff_ronda IS NULL` en
# las dos ramas del UNION.
_RECALCULAR_NUEVA = """
CREATE OR REPLACE FUNCTION recalcular_tabla_posiciones(p_id_torneo INT)
RETURNS void
LANGUAGE plpgsql
AS $$
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
        FROM (
            -- LOCAL
            SELECT
                p.id_torneo,
                p.id_inscripcion_local   AS id_inscripcion,
                r.goles_local            AS gf,
                r.goles_visitante        AS gc
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
                r.goles_local              AS gc
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
$$;
"""

_RECALCULAR_VIEJA = _RECALCULAR_NUEVA.replace(
    "              -- Las llaves no reparten puntos: reparten el pase de ronda.\n"
    "              AND p.id_fixture_playoff_ronda IS NULL\n", ""
).replace("              AND p.id_fixture_playoff_ronda IS NULL\n", "")


_INIT_NUEVA = """
CREATE OR REPLACE FUNCTION fn_init_posicion_por_inscripcion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Un playoff no tiene tabla de posiciones: se define por llaves. Crearle
    -- filas en cero solo servía para mostrar una tabla que no significa nada.
    IF EXISTS (
        SELECT 1 FROM torneo t
        WHERE t.id_torneo = NEW.id_torneo AND t.tipo = 'PLAYOFF'
    ) THEN
        RETURN NEW;
    END IF;

    INSERT INTO posicion (
        id_torneo, id_equipo, puntos, partidos_jugados,
        ganados, empatados, perdidos, goles_a_favor, goles_en_contra
    )
    VALUES (NEW.id_torneo, NEW.id_equipo, 0, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (id_torneo, id_equipo) DO NOTHING;

    RETURN NEW;
END;
$$;
"""

_INIT_VIEJA = """
CREATE OR REPLACE FUNCTION fn_init_posicion_por_inscripcion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO posicion (
        id_torneo, id_equipo, puntos, partidos_jugados,
        ganados, empatados, perdidos, goles_a_favor, goles_en_contra
    )
    VALUES (NEW.id_torneo, NEW.id_equipo, 0, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (id_torneo, id_equipo) DO NOTHING;

    RETURN NEW;
END;
$$;
"""


def upgrade() -> None:
    op.execute(_RECALCULAR_NUEVA)
    op.execute(_INIT_NUEVA)

    # Las tablas que nunca debieron existir.
    op.execute("""
        DELETE FROM posicion
        WHERE id_torneo IN (SELECT id_torneo FROM torneo WHERE tipo = 'PLAYOFF');
    """)

    # Y los puntos que hayan quedado por llaves en torneos que sí tienen tabla
    # (una copa con fase de grupos y eliminatoria).
    op.execute("""
        DO $$
        DECLARE v_id INT;
        BEGIN
            FOR v_id IN
                SELECT DISTINCT p.id_torneo
                FROM partido p
                JOIN torneo t ON t.id_torneo = p.id_torneo
                WHERE p.id_fixture_playoff_ronda IS NOT NULL
                  AND t.tipo <> 'PLAYOFF'
            LOOP
                PERFORM recalcular_tabla_posiciones(v_id);
            END LOOP;
        END $$;
    """)


def downgrade() -> None:
    op.execute(_RECALCULAR_VIEJA)
    op.execute(_INIT_VIEJA)

    # Se recrean las filas en cero de los playoffs y se recalculan, que es lo
    # más cerca que se puede volver: los puntos originales eran derivados.
    op.execute("""
        INSERT INTO posicion (id_torneo, id_equipo)
        SELECT i.id_torneo, i.id_equipo
        FROM inscripcion_torneo i
        JOIN torneo t ON t.id_torneo = i.id_torneo
        WHERE t.tipo = 'PLAYOFF' AND i.fecha_baja IS NULL
        ON CONFLICT (id_torneo, id_equipo) DO NOTHING;
    """)
    op.execute("""
        DO $$
        DECLARE v_id INT;
        BEGIN
            FOR v_id IN SELECT id_torneo FROM torneo LOOP
                PERFORM recalcular_tabla_posiciones(v_id);
            END LOOP;
        END $$;
    """)
