"""Alcance por rol para suspensiones globales

Las suspensiones automáticas (por tarjetas) siempre llevan `id_torneo` y
quedan acotadas a ese torneo: no cambia nada para ellas. Las suspensiones
manuales pueden seguir siendo de alcance torneo (id_torneo seteado) o global
(id_torneo NULL); cuando son globales, ahora pueden restringirse a un
subconjunto de roles vía `roles_afectados` (NULL = todos los roles). El
CHECK asegura que `roles_afectados` solo tenga sentido cuando la suspensión
ya es global.

Revision ID: 0032
Revises: 0031
Create Date: 2026-07-27
"""
from alembic import op

revision = '0032'
down_revision = '0031'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE suspension ADD COLUMN roles_afectados tipo_rol_persona[];")
    op.execute(
        """
        ALTER TABLE suspension
            ADD CONSTRAINT chk_suspension_roles_solo_global
                CHECK (roles_afectados IS NULL OR id_torneo IS NULL);
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE suspension DROP CONSTRAINT IF EXISTS chk_suspension_roles_solo_global;")
    op.execute("ALTER TABLE suspension DROP COLUMN IF EXISTS roles_afectados;")
