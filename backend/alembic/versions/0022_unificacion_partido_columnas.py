"""Unificación partido/fixture (fase 1): columnas aditivas en partido + backfill

Primer paso de la unificación de `partido` y `fixture_partido` en una sola entidad.
Es puramente aditivo y seguro: agrega a `partido` las columnas del fixture
(equipos directos, placeholders y agrupación por jornada/llave), afloja la
inscripción a nullable y hace backfill de los partidos existentes. NO crea filas
nuevas ni elimina `fixture_partido` — eso va en el paso siguiente.

Revision ID: 0022
Revises: 0021
Create Date: 2026-07-24
"""
from alembic import op
import sqlalchemy as sa

revision = '0022'
down_revision = '0021'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Referencia directa a equipos (nullable: soporta placeholders de playoff).
    op.add_column("partido", sa.Column(
        "id_equipo_local", sa.Integer(),
        sa.ForeignKey("equipo.id_equipo", ondelete="RESTRICT"), nullable=True,
    ))
    op.add_column("partido", sa.Column(
        "id_equipo_visitante", sa.Integer(),
        sa.ForeignKey("equipo.id_equipo", ondelete="RESTRICT"), nullable=True,
    ))

    # 2. Placeholders para llaves de playoff sin equipos definidos aún.
    op.add_column("partido", sa.Column("placeholder_local", sa.String(100), nullable=True))
    op.add_column("partido", sa.Column("placeholder_visitante", sa.String(100), nullable=True))

    # 3. Agrupación del calendario (jornada / ronda de playoff).
    op.add_column("partido", sa.Column(
        "id_fixture_fecha", sa.Integer(),
        sa.ForeignKey("fixture_fecha.id_fixture_fecha", ondelete="SET NULL"), nullable=True,
    ))
    op.add_column("partido", sa.Column(
        "id_fixture_playoff_ronda", sa.Integer(),
        sa.ForeignKey("fixture_playoff_ronda.id_fixture_playoff_ronda", ondelete="SET NULL"),
        nullable=True,
    ))

    # 4. La inscripción deja de ser obligatoria (los programados y los placeholders
    #    de playoff pueden no tenerla; se deriva de equipo + torneo cuando hace falta).
    op.alter_column("partido", "id_inscripcion_local", existing_type=sa.Integer(), nullable=True)
    op.alter_column("partido", "id_inscripcion_visitante", existing_type=sa.Integer(), nullable=True)

    # 5. Backfill de los partidos existentes.
    #    5a. Equipos desde la inscripción.
    op.execute("""
        UPDATE partido p
        SET id_equipo_local     = il.id_equipo,
            id_equipo_visitante = iv.id_equipo
        FROM inscripcion_torneo il, inscripcion_torneo iv
        WHERE il.id_inscripcion = p.id_inscripcion_local
          AND iv.id_inscripcion = p.id_inscripcion_visitante
    """)
    #    5b. Agrupación (jornada / ronda) desde el fixture vinculado.
    op.execute("""
        UPDATE partido p
        SET id_fixture_fecha         = f.id_fixture_fecha,
            id_fixture_playoff_ronda = f.id_fixture_playoff_ronda,
            numero_fecha             = COALESCE(p.numero_fecha, f.numero_fecha)
        FROM fixture_partido f
        WHERE f.id_partido_real = p.id_partido
    """)


def downgrade() -> None:
    op.alter_column("partido", "id_inscripcion_visitante", existing_type=sa.Integer(), nullable=False)
    op.alter_column("partido", "id_inscripcion_local", existing_type=sa.Integer(), nullable=False)
    op.drop_column("partido", "id_fixture_playoff_ronda")
    op.drop_column("partido", "id_fixture_fecha")
    op.drop_column("partido", "placeholder_visitante")
    op.drop_column("partido", "placeholder_local")
    op.drop_column("partido", "id_equipo_visitante")
    op.drop_column("partido", "id_equipo_local")
