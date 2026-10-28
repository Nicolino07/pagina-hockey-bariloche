"""Agrega soporte para vincular playoff/copa con su torneo base

Revision ID: 0016
Revises: 0015
Create Date: 2026-06-22
"""
from alembic import op
import sqlalchemy as sa

revision = '0016'
down_revision = '0015'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "torneo",
        sa.Column(
            "torneo_base_id",
            sa.Integer(),
            sa.ForeignKey("torneo.id_torneo", ondelete="SET NULL"),
            nullable=True,
        )
    )


def downgrade() -> None:
    op.drop_column("torneo", "torneo_base_id")
