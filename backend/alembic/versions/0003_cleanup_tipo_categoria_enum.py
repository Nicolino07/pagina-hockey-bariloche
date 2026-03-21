"""Elimina valores obsoletos de tipo_categoria (A, B, SUB_14_DESARROLLO)

Precondición: la migración 0002 ya migró todos los datos a los nuevos valores.
Recreamos el enum sin los valores viejos.

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-20
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Verificar que no queden datos con valores obsoletos antes de proceder
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM equipo WHERE categoria::text IN ('A', 'B', 'SUB_14_DESARROLLO')
            ) THEN
                RAISE EXCEPTION 'Hay equipos con categorías obsoletas. Ejecutar migración 0002 primero.';
            END IF;
            IF EXISTS (
                SELECT 1 FROM torneo WHERE categoria::text IN ('A', 'B', 'SUB_14_DESARROLLO')
            ) THEN
                RAISE EXCEPTION 'Hay torneos con categorías obsoletas. Ejecutar migración 0002 primero.';
            END IF;
        END$$
    """)

    # =========================================================
    # Dropear vistas que dependen de columna categoria
    # =========================================================
    op.execute("DROP VIEW IF EXISTS vw_inscripciones_torneo_detalle")
    op.execute("DROP VIEW IF EXISTS v_valla_menos_vencida_torneo")
    op.execute("DROP VIEW IF EXISTS v_goleadores_torneo")

    # Convertir columnas a texto temporalmente
    op.execute("ALTER TABLE equipo ALTER COLUMN categoria TYPE VARCHAR(50)")
    op.execute("ALTER TABLE torneo ALTER COLUMN categoria TYPE VARCHAR(50)")

    # CASCADE elimina automáticamente funciones y otros objetos dependientes
    # que serán recreados más abajo junto con las vistas
    op.execute("DROP TYPE tipo_categoria CASCADE")

    # Crear el enum limpio
    op.execute("""
        CREATE TYPE tipo_categoria AS ENUM (
            'MAYORES',
            'SUB_19',
            'SUB_16',
            'SUB_14',
            'SUB_12'
        )
    """)

    # Volver a tipar las columnas
    op.execute("""
        ALTER TABLE equipo
        ALTER COLUMN categoria TYPE tipo_categoria
        USING categoria::tipo_categoria
    """)
    op.execute("""
        ALTER TABLE torneo
        ALTER COLUMN categoria TYPE tipo_categoria
        USING categoria::tipo_categoria
    """)

    # Recrear funciones que usan tipo_categoria como argumento
    # (PostgreSQL las invalida al recrear el tipo)
    op.execute("""
        CREATE OR REPLACE FUNCTION fn_validar_equipo_vs_torneo()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        AS $fn$
        DECLARE
            v_cat_equipo   tipo_categoria;
            v_gen_equipo   tipo_genero;
            v_cat_torneo   tipo_categoria;
            v_gen_torneo   tipo_genero;
        BEGIN
            SELECT categoria, genero
            INTO v_cat_equipo, v_gen_equipo
            FROM equipo
            WHERE id_equipo = NEW.id_equipo;

            SELECT categoria, genero
            INTO v_cat_torneo, v_gen_torneo
            FROM torneo
            WHERE id_torneo = NEW.id_torneo;

            IF v_cat_equipo IS NULL OR v_cat_torneo IS NULL THEN
                RAISE EXCEPTION 'Equipo o torneo inexistente';
            END IF;

            IF v_cat_equipo <> v_cat_torneo
               OR v_gen_equipo <> v_gen_torneo THEN
                RAISE EXCEPTION
                    'Inscripción inválida: equipo (%/%) no coincide con torneo (%/%)',
                    v_cat_equipo, v_gen_equipo,
                    v_cat_torneo, v_gen_torneo
                USING HINT = 'La categoría y el género del equipo deben coincidir con el torneo';
            END IF;

            RETURN NEW;
        END;
        $fn$
    """)

    op.execute("""
        CREATE OR REPLACE FUNCTION validar_rol_unico_por_club(
            p_id_persona INT,
            p_rol tipo_rol_persona,
            p_id_club_destino INT,
            p_excluir_id_plantel_integrante INT DEFAULT NULL
        )
        RETURNS VARCHAR
        LANGUAGE plpgsql
        STABLE
        AS $fn$
        DECLARE
            v_club_conflicto_nombre VARCHAR(100);
            v_equipo_conflicto_nombre VARCHAR(100);
            v_categoria_conflicto tipo_categoria;
            v_fecha_alta_conflicto DATE;
            v_mensaje VARCHAR;
        BEGIN
            SELECT
                c.nombre,
                eq.nombre,
                eq.categoria,
                pi.fecha_alta
            INTO
                v_club_conflicto_nombre,
                v_equipo_conflicto_nombre,
                v_categoria_conflicto,
                v_fecha_alta_conflicto
            FROM plantel_integrante pi
            JOIN plantel pl ON pi.id_plantel = pl.id_plantel
            JOIN equipo eq ON pl.id_equipo = eq.id_equipo
            JOIN club c ON eq.id_club = c.id_club
            WHERE pi.id_persona = p_id_persona
              AND pi.rol_en_plantel = p_rol
              AND eq.id_club != p_id_club_destino
              AND pi.fecha_baja IS NULL
              AND pl.activo = true
              AND pi.id_plantel_integrante != COALESCE(p_excluir_id_plantel_integrante, -1)
            LIMIT 1;

            IF v_club_conflicto_nombre IS NOT NULL THEN
                v_mensaje := format(
                    'La persona ya tiene el rol "%s" activo en otro club. '
                    'Club: %s, Equipo: %s (%s), Fecha de alta: %s.',
                    p_rol,
                    v_club_conflicto_nombre,
                    v_equipo_conflicto_nombre,
                    v_categoria_conflicto,
                    v_fecha_alta_conflicto
                );
                RETURN v_mensaje;
            END IF;

            RETURN NULL;
        END;
        $fn$
    """)

    op.execute("""
        CREATE OR REPLACE FUNCTION obtener_persona_roles_activos(p_id_persona INT)
        RETURNS TABLE (
            club_id INT,
            club_nombre VARCHAR(100),
            rol tipo_rol_persona,
            equipo_nombre VARCHAR(100),
            categoria tipo_categoria,
            plantel_activo BOOLEAN,
            fecha_alta DATE,
            fecha_baja DATE
        )
        LANGUAGE plpgsql
        STABLE
        AS $fn$
        BEGIN
            RETURN QUERY
            SELECT
                c.id_club,
                c.nombre,
                pi.rol_en_plantel,
                e.nombre,
                e.categoria,
                pl.activo,
                pi.fecha_alta,
                pi.fecha_baja
            FROM plantel_integrante pi
            JOIN plantel pl ON pi.id_plantel = pl.id_plantel
            JOIN equipo e ON pl.id_equipo = e.id_equipo
            JOIN club c ON e.id_club = c.id_club
            WHERE pi.id_persona = p_id_persona
              AND pi.fecha_baja IS NULL
            ORDER BY c.nombre, pi.rol_en_plantel, e.categoria;
        END;
        $fn$
    """)

    # =========================================================
    # Recrear las vistas que fueron dropeadas
    # =========================================================
    op.execute("""
        CREATE OR REPLACE VIEW vw_inscripciones_torneo_detalle AS
        SELECT
            it.id_inscripcion,
            it.id_torneo,
            it.id_equipo,
            e.nombre        AS nombre_equipo,
            e.categoria     AS categoria_equipo,
            e.division      AS division_equipo,
            e.genero        AS genero_equipo,
            c.id_club,
            c.nombre        AS nombre_club,
            it.fecha_inscripcion,
            it.fecha_baja
        FROM inscripcion_torneo it
        JOIN equipo e ON e.id_equipo = it.id_equipo
        JOIN club c   ON c.id_club   = e.id_club
        WHERE it.fecha_baja IS NULL
    """)

    op.execute("""
        CREATE OR REPLACE VIEW v_valla_menos_vencida_torneo AS
        SELECT
            t.id_torneo,
            t.nombre AS nombre_torneo,
            t.categoria,
            t.genero,
            eq.id_equipo,
            eq.nombre AS nombre_equipo,
            c.id_club,
            c.nombre AS nombre_club,
            pos.partidos_jugados,
            pos.goles_en_contra,
            CASE
                WHEN pos.partidos_jugados > 0
                THEN ROUND(pos.goles_en_contra::numeric / pos.partidos_jugados, 2)
                ELSE NULL
            END AS promedio_goles_recibidos,
            RANK() OVER (
                PARTITION BY t.id_torneo
                ORDER BY pos.goles_en_contra ASC,
                         CASE WHEN pos.partidos_jugados > 0
                              THEN pos.goles_en_contra::numeric / pos.partidos_jugados
                              ELSE 999 END ASC
            ) AS ranking_en_torneo
        FROM posicion pos
        JOIN torneo t ON pos.id_torneo = t.id_torneo
        JOIN equipo eq ON pos.id_equipo = eq.id_equipo
        JOIN club c ON eq.id_club = c.id_club
        WHERE t.borrado_en IS NULL
          AND pos.partidos_jugados > 0
    """)

    op.execute("""
        CREATE OR REPLACE VIEW v_goleadores_torneo AS
        WITH
        goles_por_torneo AS (
            SELECT
                p.id_persona, p.nombre, p.apellido, p.documento,
                t.id_torneo, t.nombre AS nombre_torneo, t.categoria, t.genero,
                t.fecha_inicio, t.fecha_fin,
                c.id_club, c.nombre AS nombre_club,
                eq.id_equipo, eq.nombre AS nombre_equipo,
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
              AND t.borrado_en IS NULL
            GROUP BY p.id_persona, p.nombre, p.apellido, p.documento,
                     t.id_torneo, t.nombre, t.categoria, t.genero,
                     t.fecha_inicio, t.fecha_fin, c.id_club, c.nombre,
                     eq.id_equipo, eq.nombre
        ),
        goles_carrera AS (
            SELECT
                p.id_persona,
                COUNT(g.id_gol) AS goles_totales_carrera,
                COUNT(g.id_gol) FILTER (WHERE g.es_autogol = TRUE) AS autogoles_totales_carrera,
                COUNT(DISTINCT t.id_torneo) AS torneos_disputados
            FROM persona p
            LEFT JOIN plantel_integrante pi ON p.id_persona = pi.id_persona
            LEFT JOIN participan_partido pp ON pi.id_plantel_integrante = pp.id_plantel_integrante
            LEFT JOIN gol g ON pp.id_participante_partido = g.id_participante_partido AND g.estado_gol = 'VALIDO'
            LEFT JOIN partido pa ON g.id_partido = pa.id_partido
            LEFT JOIN torneo t ON pa.id_torneo = t.id_torneo AND t.borrado_en IS NULL
            WHERE p.borrado_en IS NULL
            GROUP BY p.id_persona
        )
        SELECT
            gt.id_persona, gt.nombre, gt.apellido, gt.documento,
            gt.id_torneo, gt.nombre_torneo, gt.categoria, gt.genero,
            gt.fecha_inicio, gt.fecha_fin, gt.id_club, gt.nombre_club,
            gt.id_equipo, gt.nombre_equipo,
            gt.goles_en_torneo, gt.autogoles_en_torneo, gt.goles_netos_en_torneo,
            COALESCE(gc.goles_totales_carrera, 0) AS goles_totales_carrera,
            COALESCE(gc.autogoles_totales_carrera, 0) AS autogoles_totales_carrera,
            COALESCE(gc.torneos_disputados, 0) AS torneos_disputados,
            RANK() OVER (PARTITION BY gt.id_torneo ORDER BY gt.goles_netos_en_torneo DESC) AS ranking_en_torneo
        FROM goles_por_torneo gt
        LEFT JOIN goles_carrera gc ON gt.id_persona = gc.id_persona
    """)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_inscripciones_torneo_detalle")
    op.execute("DROP VIEW IF EXISTS v_valla_menos_vencida_torneo")
    op.execute("DROP VIEW IF EXISTS v_goleadores_torneo")
    op.execute("ALTER TABLE equipo ALTER COLUMN categoria TYPE VARCHAR(50)")
    op.execute("ALTER TABLE torneo ALTER COLUMN categoria TYPE VARCHAR(50)")

    op.execute("DROP TYPE tipo_categoria")

    op.execute("""
        CREATE TYPE tipo_categoria AS ENUM (
            'A',
            'B',
            'MAYORES',
            'SUB_19',
            'SUB_16',
            'SUB_14',
            'SUB_14_DESARROLLO',
            'SUB_12'
        )
    """)

    op.execute("""
        ALTER TABLE equipo
        ALTER COLUMN categoria TYPE tipo_categoria
        USING categoria::tipo_categoria
    """)
    op.execute("""
        ALTER TABLE torneo
        ALTER COLUMN categoria TYPE tipo_categoria
        USING categoria::tipo_categoria
    """)
