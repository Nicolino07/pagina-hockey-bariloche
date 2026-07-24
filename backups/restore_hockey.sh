#!/bin/bash
#
# Restauración de la base PostgreSQL desde un backup generado por backup_hockey.sh.
#
# Uso: ./restore_hockey.sh [local|vps] archivo.dump.gpg
#
# Acepta tanto archivos cifrados (.dump.gpg) como los dumps en claro (.dump)
# generados por versiones anteriores del script.
#
# Este archivo es IDENTICO en todos los proyectos: la configuración vive en
# backups/.env.<entorno>. Ver la cabecera de backup_hockey.sh.

set -euo pipefail

ENTORNO="${1:-local}"
BACKUP_FILE="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.$ENTORNO"

log() { echo "[$(date +%Y-%m-%d_%H-%M-%S)] $*"; }
error() { echo "[$(date +%Y-%m-%d_%H-%M-%S)] ERROR: $*" >&2; }

if [[ -z "$BACKUP_FILE" ]]; then
    echo "Uso: ./restore_hockey.sh [local|vps] archivo.dump.gpg"
    exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
    error "no se encontró $ENV_FILE"
    exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
    error "no se encontró el archivo $BACKUP_FILE"
    exit 1
fi

# Ver la nota en backup_hockey.sh: si el .env del proyecto no es bash válido,
# el source aborta y las variables quedan vacías.
# shellcheck source=/dev/null
set +u
source "$ENV_FILE" || true
set -u

for var in CONTAINER_NAME DB_USER DB_NAME; do
    if [[ -z "${!var:-}" ]]; then
        error "falta la variable $var en $ENV_FILE (o quedó vacía)"
        error "Si el .env hace 'source' del .env del proyecto, revisá que ese"
        error "archivo sea bash válido: un solo valor sin comillas corta el"
        error "source a mitad y vacía todas las variables posteriores."
        exit 1
    fi
done

CIFRADO=false
if [[ "$BACKUP_FILE" == *.gpg ]]; then
    CIFRADO=true
    if ! command -v gpg >/dev/null; then
        error "gpg no está instalado (apt install gnupg)"
        exit 1
    fi
    # Se pide siempre por teclado. Visible a propósito: la passphrase es larga
    # y así se puede verificar que se pegó bien. Si el archivo no está cifrado,
    # ni se pregunta.
    read -r -p "Passphrase del backup: " BACKUP_PASSPHRASE
    if [[ -z "$BACKUP_PASSPHRASE" ]]; then
        error "no se ingresó ninguna passphrase"
        exit 1
    fi
fi

echo "Restaurando en entorno '$ENTORNO':"
echo "  Archivo    : $BACKUP_FILE"
echo "  Cifrado    : $CIFRADO"
echo "  Contenedor : $CONTAINER_NAME"
echo "  Usuario    : $DB_USER"
echo "  Base       : $DB_NAME"
echo
echo "Esto ELIMINA la base '$DB_NAME' actual y la reemplaza."
# En local se restaura directo. En vps queda una confirmación simple porque
# el DROP DATABASE es irreversible y ahí la base es producción.
if [[ "$ENTORNO" == "vps" ]]; then
    read -r -p "¿Continuar? [s/N]: " CONFIRMACION
    if [[ "$CONFIRMACION" != "s" && "$CONFIRMACION" != "S" ]]; then
        error "cancelado; no se tocó nada"
        exit 1
    fi
fi

# ---------------------------------------------------------------------------
# 1. Descifrar a un temporal y verificar antes de tocar la base
# ---------------------------------------------------------------------------

TMP_DUMP=""
limpiar() { [[ -n "$TMP_DUMP" ]] && rm -f "$TMP_DUMP"; }
trap limpiar EXIT

if [[ "$CIFRADO" == true ]]; then
    TMP_DUMP="$(mktemp)"
    chmod 600 "$TMP_DUMP"
    log "Descifrando..."
    # El --yes es necesario: mktemp ya creó el archivo, y gpg --batch se niega
    # a sobrescribir un archivo existente si no se lo autoriza explícitamente.
    if ! gpg --batch --yes --quiet --decrypt --passphrase-fd 3 \
            --output "$TMP_DUMP" "$BACKUP_FILE" 3<<<"$BACKUP_PASSPHRASE"; then
        error "no se pudo descifrar (¿passphrase incorrecta?)"
        exit 1
    fi
    DUMP="$TMP_DUMP"
else
    DUMP="$BACKUP_FILE"
fi

log "Verificando el dump..."
if ! docker exec -i "$CONTAINER_NAME" pg_restore -l < "$DUMP" > /dev/null; then
    error "el dump está corrupto; no se tocó la base"
    exit 1
fi

# ---------------------------------------------------------------------------
# 2. Recrear la base
# ---------------------------------------------------------------------------

log "Terminando conexiones activas..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
    > /dev/null

log "Recreando la base..."
if ! docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"; then
    error "falló el DROP DATABASE"
    exit 1
fi

if ! docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"; then
    error "falló el CREATE DATABASE"
    exit 1
fi

# ---------------------------------------------------------------------------
# 3. Restaurar
# ---------------------------------------------------------------------------

log "Restaurando datos..."
if ! docker exec -i "$CONTAINER_NAME" pg_restore -U "$DB_USER" -d "$DB_NAME" --no-owner < "$DUMP"; then
    error "falló la restauración"
    exit 1
fi

log "Restauración completa."
