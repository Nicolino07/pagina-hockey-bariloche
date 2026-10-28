"""Fixture: agrega estado PENDIENTE al enum y columnas de auditoría faltantes

- Agrega PENDIENTE a tipo_estado_partido
- Agrega actualizado_por a fixture_partido
- Agrega actualizado_en y actualizado_por a fixture_fecha

Revision ID: 0013
Revises: 0012
Create Date: 2026-04-20
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0013"
down_revision: Union[str, None] = "0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Nuevo valor en el enum
    op.execute("ALTER TYPE tipo_estado_partido ADD VALUE IF NOT EXISTS 'PENDIENTE'")

    # 2. Columna faltante en fixture_partido (el trigger la necesita)
    op.add_column(
        "fixture_partido",
        sa.Column("actualizado_por", sa.String(100), nullable=True),
    )

    # 3. Columnas faltantes en fixture_fecha
    op.add_column(
        "fixture_fecha",
        sa.Column("actualizado_en", sa.TIMESTAMP(), nullable=True),
    )
    op.add_column(
        "fixture_fecha",
        sa.Column("actualizado_por", sa.String(100), nullable=True),
    )

    # 4. Equipo que descansa en cada fecha (número impar de equipos)
    op.add_column(
        "fixture_fecha",
        sa.Column("id_equipo_descansa", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_fixture_fecha_equipo_descansa",
        "fixture_fecha", "equipo",
        ["id_equipo_descansa"], ["id_equipo"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_fixture_fecha_equipo_descansa", "fixture_fecha", type_="foreignkey")
    op.drop_column("fixture_fecha", "id_equipo_descansa")
    op.drop_column("fixture_partido", "actualizado_por")
    op.drop_column("fixture_fecha", "actualizado_por")
    op.drop_column("fixture_fecha", "actualizado_en")
    # PENDIENTE no se puede eliminar del enum sin recrearlo; se omite intencionalmente.
