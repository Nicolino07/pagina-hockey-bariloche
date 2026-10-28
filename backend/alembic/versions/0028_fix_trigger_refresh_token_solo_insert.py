"""Corrige trg_validar_refresh_token: debe disparar solo en INSERT, no en UPDATE

El trigger vivo quedó desincronizado de db/init/005_triggers.sql: estaba
definido como BEFORE INSERT OR UPDATE, pero fn_validar_refresh_token() rechaza
cualquier fila con revoked = TRUE. Eso significa que la rotación normal del
refresh token (el UPDATE que hace `SET revoked = TRUE` sobre el token viejo al
renovar) disparaba el trigger y abortaba con "Refresh token revocado" — TODA
rotación fallaba con 500, por lo que el refresh nunca funcionó y cada recarga
de página terminaba en un re-login. Se deja el trigger como corresponde: solo
valida al insertar un token nuevo (no debería crearse ya expirado/revocado).

Revision ID: 0028
Revises: 0027
Create Date: 2026-07-26
"""
from alembic import op

revision = '0028'
down_revision = '0027'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_validar_refresh_token ON refresh_token;")
    op.execute(
        """
        CREATE TRIGGER trg_validar_refresh_token
        BEFORE INSERT ON refresh_token
        FOR EACH ROW
        EXECUTE FUNCTION fn_validar_refresh_token();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_validar_refresh_token ON refresh_token;")
    op.execute(
        """
        CREATE TRIGGER trg_validar_refresh_token
        BEFORE INSERT OR UPDATE ON refresh_token
        FOR EACH ROW
        EXECUTE FUNCTION fn_validar_refresh_token();
        """
    )
