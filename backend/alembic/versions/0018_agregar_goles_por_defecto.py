"""Agregar goles por defecto a tabla partido

Revision ID: 0018_agregar_goles_por_defecto
Revises: 0017_add_club_ids_to_partido_detallado
Create Date: 2026-06-23

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0018'
down_revision = '0017'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('partido', sa.Column('goles_por_defecto_local', sa.Integer(), nullable=True))
    op.add_column('partido', sa.Column('goles_por_defecto_visitante', sa.Integer(), nullable=True))

    # Agregar check constraints para que sean >= 0
    op.create_check_constraint(
        'chk_goles_defecto_local_no_negativo',
        'partido',
        'goles_por_defecto_local IS NULL OR goles_por_defecto_local >= 0'
    )
    op.create_check_constraint(
        'chk_goles_defecto_visitante_no_negativo',
        'partido',
        'goles_por_defecto_visitante IS NULL OR goles_por_defecto_visitante >= 0'
    )


def downgrade() -> None:
    op.drop_constraint('chk_goles_defecto_visitante_no_negativo', 'partido')
    op.drop_constraint('chk_goles_defecto_local_no_negativo', 'partido')
    op.drop_column('partido', 'goles_por_defecto_visitante')
    op.drop_column('partido', 'goles_por_defecto_local')
