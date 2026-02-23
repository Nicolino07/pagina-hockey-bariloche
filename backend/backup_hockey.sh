#!/bin/bash

# --- CONFIGURACIÓN ---
CONTAINER_NAME="hockey_db"
DB_USER="hockey_user"
DB_NAME="hockey_db"
BACKUP_PATH="/home/tu_usuario/backups" # Cambiá 'tu_usuario' por el real
FECHA=$(date +%Y-%m-%d_%H%M%S)
RETENCION_DIAS=15

# Crear carpeta de backups si no existe
mkdir -p $BACKUP_PATH

echo "Iniciando backup de la base de datos: $DB_NAME..."

# Ejecutar el dump desde el contenedor
# Usamos -t para que no pida TTY y redirigimos la salida a un .sql
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > $BACKUP_PATH/backup_$DB_NAME_$FECHA.sql

# Comprimir para ahorrar espacio (pasa de pesar MB a KB)
gzip $BACKUP_PATH/backup_$DB_NAME_$FECHA.sql

# Borrar backups más viejos de 15 días
find $BACKUP_PATH -type f -name "*.sql.gz" -mtime +$RETENCION_DIAS -exec rm {} \;

echo "Backup finalizado exitosamente en: $BACKUP_PATH/backup_$DB_NAME_$FECHA.sql.gz"

