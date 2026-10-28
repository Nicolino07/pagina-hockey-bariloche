"""Agrega valor MIXTO al enum tipo_genero

Revision ID: 0001
Revises:
Create Date: 2026-03-18

"""
from typing import Sequence, Union
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ALTER TYPE ADD VALUE no puede ejecutarse dentro de una transacción en PostgreSQL.
    # Alembic maneja esto automáticamente con execution_options.
    op.execute("ALTER TYPE tipo_genero ADD VALUE IF NOT EXISTS 'MIXTO'")


def downgrade() -> None:
    # PostgreSQL no permite eliminar valores de un ENUM sin recrearlo.
    # El downgrade es intencional no-op.
    pass
