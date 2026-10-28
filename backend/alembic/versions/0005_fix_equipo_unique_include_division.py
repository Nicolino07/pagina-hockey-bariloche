"""Corrige el UNIQUE de equipo para incluir division

La constraint original era (id_club, nombre, categoria, genero).
La migración 0002 agregó la columna division pero olvidó actualizar
este constraint. Ahora se amplía a (id_club, nombre, categoria, division, genero)
para permitir mismo nombre/categoría/género con distinta división.

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-21
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("equipo_unq_club_cat_gen", "equipo", type_="unique")
    op.create_unique_constraint(
        "equipo_unq_club_cat_gen",
        "equipo",
        ["id_club", "nombre", "categoria", "division", "genero"]
    )


def downgrade() -> None:
    op.drop_constraint("equipo_unq_club_cat_gen", "equipo", type_="unique")
    op.create_unique_constraint(
        "equipo_unq_club_cat_gen",
        "equipo",
        ["id_club", "nombre", "categoria", "genero"]
    )
