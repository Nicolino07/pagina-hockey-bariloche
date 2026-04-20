"""Agrega soporte para fixture de playoff

Revision ID: 0015
Revises: 0014
Create Date: 2026-04-20
"""
from alembic import op
import sqlalchemy as sa

revision = '0015'
down_revision = '0014'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tabla de rondas de playoff
    op.create_table(
        "fixture_playoff_ronda",
        sa.Column("id_fixture_playoff_ronda", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("id_torneo", sa.Integer(), sa.ForeignKey("torneo.id_torneo", ondelete="CASCADE"), nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False),
        sa.Column("ida_y_vuelta", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("creado_en", sa.TIMESTAMP(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("creado_por", sa.String(100), nullable=True),
    )

    # Columnas nuevas en fixture_partido
    op.add_column("fixture_partido", sa.Column(
        "id_fixture_playoff_ronda",
        sa.Integer(),
        sa.ForeignKey("fixture_playoff_ronda.id_fixture_playoff_ronda", ondelete="CASCADE"),
        nullable=True,
    ))
    op.add_column("fixture_partido", sa.Column("placeholder_local", sa.String(100), nullable=True))
    op.add_column("fixture_partido", sa.Column("placeholder_visitante", sa.String(100), nullable=True))

    # Hacer nullable id_equipo_local e id_equipo_visitante
    op.alter_column("fixture_partido", "id_equipo_local", nullable=True)
    op.alter_column("fixture_partido", "id_equipo_visitante", nullable=True)

    # Quitar constraint que impide equipos iguales — falla con NULLs y placeholders
    op.drop_constraint("chk_fixture_equipos_distintos", "fixture_partido", type_="check")

    # Reemplazarla por una que solo aplique cuando ambos equipos están definidos
    op.create_check_constraint(
        "chk_fixture_equipos_distintos",
        "fixture_partido",
        "id_equipo_local IS NULL OR id_equipo_visitante IS NULL OR id_equipo_local <> id_equipo_visitante",
    )


def downgrade() -> None:
    op.drop_constraint("chk_fixture_equipos_distintos", "fixture_partido", type_="check")
    op.create_check_constraint(
        "chk_fixture_equipos_distintos",
        "fixture_partido",
        "id_equipo_local <> id_equipo_visitante",
    )
    op.alter_column("fixture_partido", "id_equipo_local", nullable=False)
    op.alter_column("fixture_partido", "id_equipo_visitante", nullable=False)
    op.drop_column("fixture_partido", "placeholder_local")
    op.drop_column("fixture_partido", "placeholder_visitante")
    op.drop_column("fixture_partido", "id_fixture_playoff_ronda")
    op.drop_table("fixture_playoff_ronda")
