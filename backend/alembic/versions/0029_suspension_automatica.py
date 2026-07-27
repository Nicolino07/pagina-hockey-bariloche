"""Suspensiones automáticas: id_persona directo + origen + partido a cumplir

La tabla `suspension` había quedado referenciando `persona_rol` (commit
34898fb), desincronizada del modelo Python que siempre usó `id_persona`.
Se vuelve a `id_persona` directo (una suspensión es de la persona, no de un
rol puntual) y se agregan las columnas necesarias para las suspensiones
automáticas por tarjetas: `origen` (de dónde salió la suspensión, para poder
marcar el asterisco correcto en la tabla pública de tarjetas) e
`id_partido_a_cumplir` (el próximo partido real, en orden cronológico, que
la persona tiene que cumplir).

Revision ID: 0029
Revises: 0028
Create Date: 2026-07-26
"""
from alembic import op

revision = '0029'
down_revision = '0028'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE tipo_origen_suspension AS ENUM ('AUTOMATICA_AMARILLAS', 'AUTOMATICA_ROJA', 'MANUAL');")

    # La vista depende de id_persona_rol; hay que soltarla antes de tocar la columna.
    op.execute("DROP VIEW IF EXISTS vw_suspensiones_activas;")

    # id_persona_rol -> id_persona
    op.execute("ALTER TABLE suspension ADD COLUMN id_persona INT REFERENCES persona(id_persona);")
    op.execute(
        """
        UPDATE suspension s
        SET id_persona = pr.id_persona
        FROM persona_rol pr
        WHERE pr.id_persona_rol = s.id_persona_rol;
        """
    )
    op.execute("ALTER TABLE suspension ALTER COLUMN id_persona SET NOT NULL;")
    op.execute("DROP INDEX IF EXISTS idx_suspension_persona_rol;")
    op.execute("ALTER TABLE suspension DROP COLUMN id_persona_rol;")

    # Columnas nuevas
    op.execute("ALTER TABLE suspension ADD COLUMN origen tipo_origen_suspension NOT NULL DEFAULT 'MANUAL';")
    op.execute(
        "ALTER TABLE suspension ADD COLUMN id_partido_a_cumplir INT REFERENCES partido(id_partido) ON DELETE SET NULL;"
    )

    op.execute("CREATE INDEX idx_suspension_persona ON suspension (id_persona);")
    op.execute("CREATE INDEX idx_suspension_partido_a_cumplir ON suspension (id_partido_a_cumplir);")

    # Vista de suspensiones activas: join directo a persona, sin persona_rol
    op.execute(
        """
        CREATE OR REPLACE VIEW vw_suspensiones_activas AS
        SELECT
            s.id_suspension,
            p.id_persona,
            p.nombre,
            p.apellido,
            s.id_torneo,
            t.nombre AS torneo,
            s.origen,
            s.tipo_suspension,
            s.motivo,
            s.fechas_suspension,
            s.cumplidas,
            s.fecha_fin_suspension,
            s.id_partido_a_cumplir,
            TRUE AS activa
        FROM suspension s
        JOIN persona p
            ON p.id_persona = s.id_persona
        JOIN torneo t
            ON t.id_torneo = s.id_torneo
        WHERE
            s.estado_suspension = 'ACTIVA'
            AND s.anulada_en IS NULL
            AND (
                (s.tipo_suspension = 'POR_PARTIDOS'
                 AND s.cumplidas < s.fechas_suspension)
                OR
                (s.tipo_suspension = 'POR_FECHA'
                 AND s.fecha_fin_suspension >= CURRENT_DATE)
            );
        """
    )

    # Tarjetas acumuladas: sumar asteriscos por suspensiones cumplidas
    op.execute("DROP VIEW IF EXISTS vw_tarjetas_acumuladas_torneo;")
    op.execute(
        """
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
    )

    # fn_persona_suspendida: s.activa no existe, es s.estado_suspension = 'ACTIVA'
    op.execute(
        """
        CREATE OR REPLACE FUNCTION fn_persona_suspendida(
            p_id_persona INT,
            p_id_torneo  INT,
            p_fecha      DATE
        )
        RETURNS BOOLEAN AS $$
        BEGIN
            RETURN EXISTS (
                SELECT 1
                FROM suspension s
                WHERE s.id_persona = p_id_persona
                  AND s.id_torneo = p_id_torneo
                  AND s.estado_suspension = 'ACTIVA'
                  AND (
                      (s.tipo_suspension = 'POR_PARTIDOS'
                       AND s.cumplidas < s.fechas_suspension)
                   OR
                      (s.tipo_suspension = 'POR_FECHA'
                       AND p_fecha <= s.fecha_fin_suspension)
                  )
            );
        END;
        $$ LANGUAGE plpgsql;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION fn_persona_suspendida(
            p_id_persona INT,
            p_id_torneo  INT,
            p_fecha      DATE
        )
        RETURNS BOOLEAN AS $$
        BEGIN
            RETURN EXISTS (
                SELECT 1
                FROM suspension s
                WHERE s.id_persona = p_id_persona
                  AND s.id_torneo = p_id_torneo
                  AND s.activa = TRUE
                  AND (
                      (s.tipo_suspension = 'POR_PARTIDOS'
                       AND s.cumplidas < s.fechas_suspension)
                   OR
                      (s.tipo_suspension = 'POR_FECHA'
                       AND p_fecha <= s.fecha_fin_suspension)
                  )
            );
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    op.execute("DROP VIEW IF EXISTS vw_tarjetas_acumuladas_torneo;")
    op.execute(
        """
        CREATE OR REPLACE VIEW vw_tarjetas_acumuladas_torneo AS
        SELECT
            id_torneo,
            torneo,
            id_persona,
            nombre_persona,
            apellido_persona,
            id_equipo,
            equipo,
            COUNT(*)                       AS total_tarjetas,
            SUM(verdes)                    AS total_verdes,
            SUM(amarillas)                 AS total_amarillas,
            SUM(rojas)                     AS total_rojas
        FROM vw_tarjetas_detalle_torneo
        GROUP BY
            id_torneo,
            torneo,
            id_persona,
            nombre_persona,
            apellido_persona,
            id_equipo,
            equipo;
        """
    )

    op.execute("DROP VIEW IF EXISTS vw_suspensiones_activas;")
    op.execute("ALTER TABLE suspension ADD COLUMN id_persona_rol INT REFERENCES persona_rol(id_persona_rol);")
    op.execute(
        """
        UPDATE suspension s
        SET id_persona_rol = pr.id_persona_rol
        FROM (
            SELECT DISTINCT ON (id_persona) id_persona, id_persona_rol
            FROM persona_rol
            ORDER BY id_persona, id_persona_rol
        ) pr
        WHERE pr.id_persona = s.id_persona;
        """
    )
    op.execute("ALTER TABLE suspension ALTER COLUMN id_persona_rol SET NOT NULL;")

    op.execute("DROP INDEX IF EXISTS idx_suspension_partido_a_cumplir;")
    op.execute("DROP INDEX IF EXISTS idx_suspension_persona;")
    op.execute("ALTER TABLE suspension DROP COLUMN id_partido_a_cumplir;")
    op.execute("ALTER TABLE suspension DROP COLUMN origen;")
    op.execute("ALTER TABLE suspension DROP COLUMN id_persona;")
    op.execute("CREATE INDEX idx_suspension_persona_rol ON suspension (id_persona_rol);")
    op.execute("DROP TYPE IF EXISTS tipo_origen_suspension;")

    op.execute(
        """
        CREATE OR REPLACE VIEW vw_suspensiones_activas AS
        SELECT
            s.id_suspension,
            pr.id_persona_rol,
            p.id_persona,
            p.nombre,
            p.apellido,
            s.id_torneo,
            t.nombre AS torneo,
            s.tipo_suspension,
            s.motivo,
            s.fechas_suspension,
            s.cumplidas,
            s.fecha_fin_suspension,
            TRUE AS activa
        FROM suspension s
        JOIN persona_rol pr
            ON pr.id_persona_rol = s.id_persona_rol
        JOIN persona p
            ON p.id_persona = pr.id_persona
        JOIN torneo t
            ON t.id_torneo = s.id_torneo
        WHERE
            s.estado_suspension = 'ACTIVA'
            AND s.anulada_en IS NULL
            AND (
                (s.tipo_suspension = 'POR_PARTIDOS'
                 AND s.cumplidas < s.fechas_suspension)
                OR
                (s.tipo_suspension = 'POR_FECHA'
                 AND s.fecha_fin_suspension >= CURRENT_DATE)
            );
        """
    )
