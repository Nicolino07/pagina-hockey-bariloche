"""Agrega tipo_torneo enum y columna tipo en torneo

Revision ID: 0014
Revises: 0013
Create Date: 2026-04-20
"""
from alembic import op
import sqlalchemy as sa

revision = '0014'
down_revision = '0013'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE tipo_torneo AS ENUM ('LIGA', 'PLAYOFF', 'COPA')")
    op.add_column(
        "torneo",
        sa.Column(
            "tipo",
            sa.Enum("LIGA", "PLAYOFF", "COPA", name="tipo_torneo"),
            nullable=False,
            server_default="LIGA",
        ),
    )


def downgrade() -> None:
    op.drop_column("torneo", "tipo")
    op.execute("DROP TYPE tipo_torneo")
