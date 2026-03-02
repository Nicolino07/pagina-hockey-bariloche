#!/bin/bash

CONTAINER_NAME="hockey_db"
DB_USER="hockey_user"
DB_NAME="hockey_db"
BACKUP_PATH="/home/nicolas/backups"
FECHA=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p $BACKUP_PATH

echo "Iniciando backup en formato custom..."

docker exec $CONTAINER_NAME pg_dump -U $DB_USER -Fc $DB_NAME > $BACKUP_PATH/backup_$DB_NAME_$FECHA.dump

echo "Backup finalizado: backup_$DB_NAME_$FECHA.dump"