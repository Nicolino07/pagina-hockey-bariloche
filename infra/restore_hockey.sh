#!/bin/bash

CONTAINER_NAME="hockey_db"
DB_USER="hockey_user"
DB_NAME="hockey_db"

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./restore_hockey.sh archivo.dump"
    exit 1
fi

echo "Restaurando $BACKUP_FILE..."

cat $BACKUP_FILE | docker exec -i $CONTAINER_NAME pg_restore \
    -U $DB_USER \
    -d $DB_NAME \
    --clean \
    --if-exists \
    --no-owner

echo "Restauración completa."