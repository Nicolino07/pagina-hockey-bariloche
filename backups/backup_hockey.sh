#!/bin/bash

# Uso: ./backup_hockey.sh [local|vps]
ENTORNO=${1:-local}
ENV_FILE="$(dirname "$0")/.env.$ENTORNO"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: no se encontró $ENV_FILE"
    exit 1
fi

source "$ENV_FILE"

FECHA=$(date +%Y-%m-%d_%H-%M-%S)
ARCHIVO="backup_${DB_NAME}_${FECHA}.dump"
DRIVE_FOLDER="backups/hockey"

mkdir -p "$BACKUP_PATH"

# 1. Backup
echo "[$FECHA] Iniciando backup ($ENTORNO)..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$BACKUP_PATH/$ARCHIVO"

if [ $? -ne 0 ]; then
    echo "ERROR: falló el pg_dump"
    exit 1
fi

echo "Backup generado: $BACKUP_PATH/$ARCHIVO"

# 2. Subir a Drive (solo en VPS)
if [ "$ENTORNO" = "vps" ]; then
    echo "Subiendo a Google Drive..."
    rclone copy "$BACKUP_PATH/$ARCHIVO" "drive:$DRIVE_FOLDER"

    if [ $? -ne 0 ]; then
        echo "ERROR: falló la subida a Drive"
        exit 1
    fi

    echo "Subido a drive:$DRIVE_FOLDER/$ARCHIVO"

    # 3. Limpiar backups viejos en Drive (más de 30 días)
    echo "Limpiando backups viejos en Drive (>30 días)..."
    rclone delete "drive:$DRIVE_FOLDER" --min-age 30d
fi

# 4. Limpiar archivos locales viejos (más de 30 días)
find "$BACKUP_PATH" -name "*.dump" -mtime +30 -delete
echo "Limpieza local completada."

echo "Backup finalizado correctamente: $ARCHIVO"
