#!/bin/sh
# Si la DB es nueva (no tiene tabla alembic_version), los scripts de init ya
# crearon todo el schema actualizado — solo marcamos las migraciones como aplicadas.
# Si la DB ya existe, aplicamos las migraciones pendientes normalmente.

HAS_ALEMBIC=$(python -c "
import os, psycopg2
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()
cur.execute(\"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='alembic_version')\")
print(cur.fetchone()[0])
conn.close()
")

if [ "$HAS_ALEMBIC" = "False" ]; then
    echo "DB nueva detectada — marcando migraciones como aplicadas (stamp head)"
    alembic stamp head
else
    echo "DB existente — aplicando migraciones pendientes (upgrade head)"
    alembic upgrade head
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
