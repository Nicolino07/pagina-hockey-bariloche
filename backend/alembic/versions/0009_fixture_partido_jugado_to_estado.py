"""Reemplaza jugado BOOLEAN por estado tipo_estado_partido en fixture_partido

Revision ID: 0009
Revises: 0008
Create Date: 2026-03-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Agregar columna nullable temporalmente
    op.add_column(
        "fixture_partido",
        sa.Column(
            "estado",
            sa.Enum(
                "BORRADOR", "TERMINADO", "SUSPENDIDO", "ANULADO", "REPROGRAMADO",
                name="tipo_estado_partido",
                create_type=False,
            ),
            nullable=True,
        ),
    )

    # 2. Migrar datos existentes
    op.execute("""
        UPDATE fixture_partido
        SET estado = CASE
            WHEN jugado = TRUE THEN 'TERMINADO'::tipo_estado_partido
            ELSE 'BORRADOR'::tipo_estado_partido
        END
    """)

    # 3. Aplicar NOT NULL y default
    op.alter_column("fixture_partido", "estado", nullable=False,
                    server_default="BORRADOR")

    # 4. Eliminar columna jugado
    op.drop_column("fixture_partido", "jugado")


def downgrade() -> None:
    # 1. Restaurar columna jugado
    op.add_column(
        "fixture_partido",
        sa.Column("jugado", sa.Boolean(), nullable=True),
    )

    # 2. Migrar datos de vuelta
    op.execute("""
        UPDATE fixture_partido
        SET jugado = CASE
            WHEN estado = 'TERMINADO' THEN TRUE
            ELSE FALSE
        END
    """)

    # 3. Aplicar NOT NULL y default
    op.alter_column("fixture_partido", "jugado", nullable=False,
                    server_default=sa.false())

    # 4. Eliminar columna estado
    op.drop_column("fixture_partido", "estado")
