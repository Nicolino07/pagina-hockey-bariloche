"""Tope absoluto de sesión: session_started_at en refresh_token

Agrega la columna que guarda el login original. Se arrastra sin cambios en cada
rotación del refresh token, para medir el tope absoluto de sesión
(settings.session_max_hours) desde el login real y no reiniciarlo al renovar.

Se agrega nullable, se backfillea con created_at (mejor aproximación del login
para los tokens ya existentes) y recién ahí se marca NOT NULL.

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
        sa.Column("session_started_at", sa.TIMESTAMP(), nullable=True),
    )
    # Backfill: para tokens ya emitidos, el mejor proxy del login es created_at.
    op.execute(
        "UPDATE refresh_token "
        "SET session_started_at = created_at "
        "WHERE session_started_at IS NULL"
    )
    op.alter_column(
        "refresh_token",
        "session_started_at",
        existing_type=sa.TIMESTAMP(),
        nullable=False,
        server_default=sa.text("CURRENT_TIMESTAMP"),
    )


def downgrade() -> None:
    op.drop_column("refresh_token", "session_started_at")
