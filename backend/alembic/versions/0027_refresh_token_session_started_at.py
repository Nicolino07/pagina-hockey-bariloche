"""Tope absoluto de sesión: session_started_at en refresh_token

Agrega la columna que guarda el login original. Se arrastra sin cambios en cada
rotación del refresh token, para medir el tope absoluto de sesión
(settings.session_max_hours) desde el login real y no reiniciarlo al renovar.

Se agrega directamente NOT NULL con DEFAULT CURRENT_TIMESTAMP: Postgres rellena
las filas existentes con el default sin disparar triggers de fila. Evitamos un
UPDATE de backfill a propósito, porque la tabla tiene un trigger de validación
(fn_validar_refresh_token) que aborta al tocar tokens ya expirados.

Revision ID: 0027
Revises: 0026
Create Date: 2026-07-25
"""
from alembic import op
import sqlalchemy as sa

revision = '0027'
down_revision = '0026'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "refresh_token",
        sa.Column(
            "session_started_at",
            sa.TIMESTAMP(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )


def downgrade() -> None:
    op.drop_column("refresh_token", "session_started_at")
