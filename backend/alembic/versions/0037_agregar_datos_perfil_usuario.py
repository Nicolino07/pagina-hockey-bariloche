"""Agregar datos de perfil al usuario (nombre, apellido, telefono)

Sección "Mi Perfil": los usuarios necesitan poder cargar y editar sus
propios datos personales, que hasta ahora no existían en la tabla.

Revision ID: 0037
Revises: 0036
Create Date: 2026-08-02
"""
from alembic import op
import sqlalchemy as sa

revision = '0037'
down_revision = '0036'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("usuario", sa.Column("nombre", sa.String(100), nullable=True))
    op.add_column("usuario", sa.Column("apellido", sa.String(100), nullable=True))
    op.add_column("usuario", sa.Column("telefono", sa.String(30), nullable=True))


def downgrade() -> None:
    op.drop_column("usuario", "telefono")
    op.drop_column("usuario", "apellido")
    op.drop_column("usuario", "nombre")
