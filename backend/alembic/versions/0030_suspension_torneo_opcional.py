"""Torneo de origen opcional en suspension

Una suspensión manual no siempre está ligada a una competencia (ej. una
sanción disciplinaria general de la persona, sin torneo de origen). Se
saca el NOT NULL de `suspension.id_torneo`; las suspensiones automáticas
(por tarjetas) siguen escribiéndose siempre con torneo, eso no cambia.

Revision ID: 0030
Revises: 0029
Create Date: 2026-07-26
"""
from alembic import op

revision = '0030'
down_revision = '0029'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_suspensiones_activas;")
    op.execute("ALTER TABLE suspension ALTER COLUMN id_torneo DROP NOT NULL;")
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
        LEFT JOIN torneo t
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


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_suspensiones_activas;")
    op.execute(
        """
        UPDATE suspension SET id_torneo = (SELECT id_torneo FROM torneo ORDER BY id_torneo LIMIT 1)
        WHERE id_torneo IS NULL;
        """
    )
    op.execute("ALTER TABLE suspension ALTER COLUMN id_torneo SET NOT NULL;")
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
