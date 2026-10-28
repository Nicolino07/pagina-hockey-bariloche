import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Importar Base y todos los modelos para que Alembic los detecte
from app.models.base import Base
import app.models  # noqa: F401 — registra todos los modelos en Base.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata de los modelos para autogenerate
target_metadata = Base.metadata

# Usar DATABASE_URL del entorno (mismo que usa FastAPI)
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("La variable de entorno DATABASE_URL no está definida")

config.set_main_option("sqlalchemy.url", DATABASE_URL)


def run_migrations_offline() -> None:
    """Modo offline: genera SQL sin conectarse a la DB."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Importante: no comparar tipos de servidor para evitar falsos positivos
        compare_type=False,
        compare_server_default=False,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Modo online: conecta a la DB y aplica migraciones."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # No comparar tipos nativos de PG (evita migraciones fantasma en enums)
            compare_type=False,
            compare_server_default=False,
            # Incluir schemas si usás uno distinto al público
            include_schemas=False,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
