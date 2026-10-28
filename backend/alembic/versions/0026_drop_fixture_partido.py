"""Unificación (final): DROP TABLE fixture_partido

El partido programado y el partido jugado son una sola entidad `partido`. La tabla
`fixture_partido` quedó sin uso (su data ya vive en `partido`, agrupada por
fixture_fecha / fixture_playoff_ronda). Se elimina.

Revision ID: 0026
Revises: 0025
Create Date: 2026-07-25
"""
from alembic import op

revision = '0026'
down_revision = '0025'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS fixture_partido CASCADE")


def downgrade() -> None:
    # Recrea la estructura vacía (los datos no se restauran: viven en `partido`).
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS fixture_partido (
            id_fixture_partido       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            id_fixture_fecha         INT REFERENCES fixture_fecha(id_fixture_fecha) ON DELETE CASCADE,
            id_torneo                INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
            id_equipo_local          INT REFERENCES equipo(id_equipo),
            id_equipo_visitante      INT REFERENCES equipo(id_equipo),
            id_fixture_playoff_ronda INT REFERENCES fixture_playoff_ronda(id_fixture_playoff_ronda) ON DELETE CASCADE,
            placeholder_local        VARCHAR(100),
            placeholder_visitante    VARCHAR(100),
            numero_fecha             INT,
            fecha_programada         DATE,
            horario                  TIME,
            ubicacion                VARCHAR(200),
            estado                   tipo_estado_partido NOT NULL DEFAULT 'BORRADOR',
            id_partido_real          INT REFERENCES partido(id_partido) ON DELETE SET NULL,
            creado_en                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            creado_por               VARCHAR(100),
            actualizado_en           TIMESTAMP DEFAULT NULL,
            actualizado_por          VARCHAR(100),
            CONSTRAINT chk_fixture_equipos_distintos
                CHECK (id_equipo_local IS NULL OR id_equipo_visitante IS NULL
                       OR id_equipo_local <> id_equipo_visitante)
        )
        """
    )
