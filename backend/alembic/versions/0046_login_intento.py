"""Tabla `login_intento` para el bloqueo temporal de login por cuenta

Guarda los intentos fallidos por email (normalizado, exista o no la cuenta) y
hasta cuándo queda bloqueado. La usa app/auth/bloqueo.py. No lleva trigger de
auditoría: cada intento de login es una escritura y llenaría auditoria_log.

Revision ID: 0046
Revises: 0045
Create Date: 2026-10-04
"""
from alembic import op

revision = '0046'
down_revision = '0045'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS login_intento (
            email            VARCHAR(255) PRIMARY KEY,
            intentos         INT NOT NULL DEFAULT 0,
            ultimo_intento   TIMESTAMP NOT NULL,
            bloqueado_hasta  TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS ix_login_intento_ultimo_intento
            ON login_intento (ultimo_intento);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS login_intento;")
