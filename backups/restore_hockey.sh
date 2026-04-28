#!/bin/bash

# Uso: ./restore_hockey.sh [local|vps] archivo.dump
ENTORNO=${1:-local}
BACKUP_FILE=$2
ENV_FILE="$(dirname "$0")/.env.$ENTORNO"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: no se encontró $ENV_FILE"
    exit 1
fi

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./restore_hockey.sh [local|vps] archivo.dump"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: no se encontró el archivo $BACKUP_FILE"
    exit 1
fi

source "$ENV_FILE"

echo "Restaurando $BACKUP_FILE en entorno '$ENTORNO'..."
echo "  Contenedor : $CONTAINER_NAME"
echo "  Usuario    : $DB_USER"
echo "  Base       : $DB_NAME"

echo "Recreando base de datos..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

if [ $? -ne 0 ]; then
    echo "ERROR: falló al recrear la base de datos"
    exit 1
fi

cat "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" pg_restore \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner

if [ $? -ne 0 ]; then
    echo "ERROR: falló la restauración"
    exit 1
fi

echo "Restauración completa."
