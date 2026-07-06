"""Agrega es_tercer_puesto a fixture_playoff_ronda

Marca la ronda del partido por el 3er puesto (perdedores de semifinal).

Revision ID: 0020
Revises: 0019
Create Date: 2026-07-06
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0020'
down_revision = '0019'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "fixture_playoff_ronda",
        sa.Column(
            "es_tercer_puesto",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("fixture_playoff_ronda", "es_tercer_puesto")
