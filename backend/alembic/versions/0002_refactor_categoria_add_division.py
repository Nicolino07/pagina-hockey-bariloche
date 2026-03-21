"""Refactor tipo_categoria y agrega division a equipo y torneo

Pasos:
1. Agrega columna division a equipo y torneo
2. Amplía el UNIQUE de torneo para incluir division
3. Agrega MAYORES al enum tipo_categoria
4. Migra datos: A->MAYORES+div='A', B->MAYORES+div='B', SUB_14_DESARROLLO->SUB_14+div='DESARROLLO'
   (el trigger fn_validar_equipo_vs_torneo se deshabilita durante la migración)

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-20
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =========================================================
    # 1. Agregar columna division a equipo y torneo (si no existe)
    # =========================================================
    op.execute("ALTER TABLE equipo ADD COLUMN IF NOT EXISTS division VARCHAR(30)")
    op.execute("ALTER TABLE torneo ADD COLUMN IF NOT EXISTS division VARCHAR(30)")

    # =========================================================
    # 2. Ampliar UNIQUE de torneo para incluir division
    #    El viejo es (nombre, categoria, genero)
    #    El nuevo es (nombre, categoria, division, genero)
    # =========================================================
    op.drop_constraint("torneo_unq_nombre_categoria", "torneo", type_="unique")
    op.create_unique_constraint(
        "torneo_unq_nombre_categoria",
        "torneo",
        ["nombre", "categoria", "division", "genero"]
    )

    # =========================================================
    # 3. Deshabilitar trigger de validación equipo vs torneo
    #    para que no falle al actualizar de a uno por vez
    # =========================================================
    op.execute("ALTER TABLE inscripcion_torneo DISABLE TRIGGER trg_validar_equipo_vs_torneo")

    # =========================================================
    # 4. Agregar MAYORES al enum
    #    ADD VALUE no puede ejecutarse dentro de una transacción,
    #    por eso hacemos COMMIT + BEGIN manualmente
    # =========================================================
    op.execute("COMMIT")
    op.execute("ALTER TYPE tipo_categoria ADD VALUE IF NOT EXISTS 'MAYORES'")
    op.execute("BEGIN")

    # =========================================================
    # 5. Migrar datos en equipo
    #    Usamos cast a texto para evitar error si el valor
    #    ya no existe en el enum (BD local ya migrada)
    # =========================================================
    op.execute("""
        UPDATE equipo SET categoria = 'MAYORES', division = 'A'
        WHERE categoria::text = 'A'
    """)
    op.execute("""
        UPDATE equipo SET categoria = 'MAYORES', division = 'B'
        WHERE categoria::text = 'B'
    """)
    op.execute("""
        UPDATE equipo SET categoria = 'SUB_14', division = 'DESARROLLO'
        WHERE categoria::text = 'SUB_14_DESARROLLO'
    """)

    # =========================================================
    # 6. Migrar datos en torneo
    # =========================================================
    op.execute("""
        UPDATE torneo SET categoria = 'MAYORES', division = 'A'
        WHERE categoria::text = 'A'
    """)
    op.execute("""
        UPDATE torneo SET categoria = 'MAYORES', division = 'B'
        WHERE categoria::text = 'B'
    """)
    op.execute("""
        UPDATE torneo SET categoria = 'SUB_14', division = 'DESARROLLO'
        WHERE categoria::text = 'SUB_14_DESARROLLO'
    """)

    # =========================================================
    # 7. Rehabilitar trigger
    # =========================================================
    op.execute("ALTER TABLE inscripcion_torneo ENABLE TRIGGER trg_validar_equipo_vs_torneo")


def downgrade() -> None:
    op.execute("ALTER TABLE inscripcion_torneo DISABLE TRIGGER trg_validar_equipo_vs_torneo")

    # Revertir datos
    op.execute("""
        UPDATE equipo SET categoria = 'A', division = NULL
        WHERE categoria::text = 'MAYORES' AND division = 'A'
    """)
    op.execute("""
        UPDATE equipo SET categoria = 'B', division = NULL
        WHERE categoria::text = 'MAYORES' AND division = 'B'
    """)
    op.execute("""
        UPDATE equipo SET categoria = 'SUB_14_DESARROLLO', division = NULL
        WHERE categoria::text = 'SUB_14' AND division = 'DESARROLLO'
    """)
    op.execute("""
        UPDATE torneo SET categoria = 'A', division = NULL
        WHERE categoria::text = 'MAYORES' AND division = 'A'
    """)
    op.execute("""
        UPDATE torneo SET categoria = 'B', division = NULL
        WHERE categoria::text = 'MAYORES' AND division = 'B'
    """)
    op.execute("""
        UPDATE torneo SET categoria = 'SUB_14', division = NULL
        WHERE categoria::text = 'SUB_14' AND division = 'DESARROLLO'
    """)

    op.execute("ALTER TABLE inscripcion_torneo ENABLE TRIGGER trg_validar_equipo_vs_torneo")

    # Revertir UNIQUE de torneo
    op.drop_constraint("torneo_unq_nombre_categoria", "torneo", type_="unique")
    op.create_unique_constraint(
        "torneo_unq_nombre_categoria",
        "torneo",
        ["nombre", "categoria", "genero"]
    )

    op.drop_column("equipo", "division")
    op.drop_column("torneo", "division")
