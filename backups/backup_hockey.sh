#!/bin/bash
#
# Backup cifrado de la base PostgreSQL que corre en un contenedor Docker.
#
# Uso: ./backup_hockey.sh [local|vps]
#
# Este archivo es IDENTICO en todos los proyectos. Todo lo que cambia entre
# proyectos y entornos vive en backups/.env.<entorno>:
#
#   CONTAINER_NAME      Nombre del contenedor de PostgreSQL      (obligatorio)
#   DB_USER             Usuario de la base                       (obligatorio)
#   DB_NAME             Nombre de la base                        (obligatorio)
#   BACKUP_PATH         Carpeta destino de los dumps             (obligatorio, debe existir)
#   BACKUP_PASSPHRASE   Passphrase de cifrado GPG                (obligatorio)
#   DRIVE_REMOTE        Remoto de rclone; cada cuenta de Google  (default: drive)
#                       es un remoto distinto
#   DRIVE_FOLDER        Carpeta destino en Drive                 (obligatorio en vps)
#   RETENTION_DAYS      Días de retención local y en Drive       (default: 30)
#
# IMPORTANTE: BACKUP_PASSPHRASE debe guardarse TAMBIEN fuera del servidor
# (gestor de contraseñas). Si se pierde el VPS y la passphrase estaba solo ahí,
# los backups de Drive quedan indescifrables.
#
# El .env se lee con "source", así que la passphrase va entre COMILLAS SIMPLES.
# Con comillas dobles, bash expande $ y las comillas invertidas:
#     BACKUP_PASSPHRASE='mi$passphrase'    <-- correcto
#     BACKUP_PASSPHRASE="mi$passphrase"    <-- se rompe silenciosamente

set -euo pipefail

ENTORNO="${1:-local}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.$ENTORNO"

log() { echo "[$(date +%Y-%m-%d_%H-%M-%S)] $*"; }
error() { echo "[$(date +%Y-%m-%d_%H-%M-%S)] ERROR: $*" >&2; }

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------

if [[ ! -f "$ENV_FILE" ]]; then
    error "no se encontró $ENV_FILE"
    exit 1
fi

# El .env puede a su vez hacer "source" del .env del proyecto. Si ese archivo
# tiene un valor sin comillas con paréntesis, & o ; no es bash válido, el
# source aborta a mitad de camino y las variables posteriores quedan VACIAS.
# Se desactiva "set -u" solo durante el source: si una variable quedó sin
# definir preferimos detectarlo en la validación de abajo, que explica el
# problema, y no con un "variable sin asignar" suelto.
# shellcheck source=/dev/null
# El "|| true" evita que set -e mate el script acá: si el source falló,
# queremos llegar a la validación de abajo, que explica el problema.
set +u
source "$ENV_FILE" || true
set -u

DRIVE_REMOTE="${DRIVE_REMOTE:-drive}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

for var in CONTAINER_NAME DB_USER DB_NAME BACKUP_PATH BACKUP_PASSPHRASE; do
    if [[ -z "${!var:-}" ]]; then
        error "falta la variable $var en $ENV_FILE (o quedó vacía)"
        error "Si el .env hace 'source' del .env del proyecto, revisá que ese"
        error "archivo sea bash válido: un solo valor sin comillas corta el"
        error "source a mitad y vacía todas las variables posteriores."
        error '    APP_NAME="Hockey Bariloche API (DEV)"   <-- con comillas'
        exit 1
    fi
done

if [[ "$ENTORNO" == "vps" && -z "${DRIVE_FOLDER:-}" ]]; then
    error "falta la variable DRIVE_FOLDER en $ENV_FILE"
    exit 1
fi

# El .env tiene la passphrase: no debe ser legible por otros usuarios.
PERMISOS="$(stat -c %a "$ENV_FILE")"
if [[ "$PERMISOS" != "600" && "$PERMISOS" != "400" ]]; then
    log "AVISO: $ENV_FILE tiene permisos $PERMISOS y contiene la passphrase."
    log "AVISO: corregir con  chmod 600 '$ENV_FILE'"
fi

if ! command -v gpg >/dev/null; then
    error "gpg no está instalado (apt install gnupg)"
    exit 1
fi

# A diferencia de la versión anterior, NO se crea la carpeta con mkdir -p:
# si el destino no existe suele ser porque alguien movió el proyecto, y
# crearla en silencio hace que los backups se escriban donde nadie los busca.
if [[ ! -d "$BACKUP_PATH" ]]; then
    error "BACKUP_PATH no existe: $BACKUP_PATH"
    error "Si la ruta es correcta, creala a mano: mkdir -p '$BACKUP_PATH'"
    exit 1
fi

FECHA="$(date +%Y-%m-%d_%H-%M-%S)"
ARCHIVO="backup_${DB_NAME}_${FECHA}.dump.gpg"
DESTINO="$BACKUP_PATH/$ARCHIVO"
TMP_DUMP="$BACKUP_PATH/.tmp_${DB_NAME}_${FECHA}.dump"

# Nunca dejar el dump en claro ni un archivo a medias dando vueltas.
limpiar() { rm -f "$TMP_DUMP"; }
trap limpiar EXIT

log "Iniciando backup ($ENTORNO) de '$DB_NAME' en '$CONTAINER_NAME'..."

# ---------------------------------------------------------------------------
# 1. Dump
# ---------------------------------------------------------------------------

if ! docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$TMP_DUMP"; then
    error "falló el pg_dump"
    exit 1
fi

if [[ ! -s "$TMP_DUMP" ]]; then
    error "el dump quedó vacío"
    exit 1
fi

# ---------------------------------------------------------------------------
# 2. Verificar que el dump es válido ANTES de darlo por bueno
# ---------------------------------------------------------------------------

log "Verificando el dump..."
if ! docker exec -i "$CONTAINER_NAME" pg_restore -l < "$TMP_DUMP" > /dev/null; then
    error "el dump está corrupto (pg_restore -l no pudo leerlo)"
    exit 1
fi

# Se cuentan las entradas "TABLE DATA": una por cada tabla cuyo contenido
# quedó dentro del dump. No sirve contar " TABLE " a secas, porque también
# matchea las entradas ACL y las definiciones sin datos.
TABLAS="$(docker exec -i "$CONTAINER_NAME" pg_restore -l < "$TMP_DUMP" \
    | grep -cP '^\d+;\s+\d+\s+\d+\s+TABLE DATA\s' || true)"
if [[ "$TABLAS" -eq 0 ]]; then
    error "el dump no contiene datos de ninguna tabla; se aborta por las dudas"
    exit 1
fi
log "Dump válido: $TABLAS tablas con datos, $(du -h "$TMP_DUMP" | cut -f1) sin cifrar."

# ---------------------------------------------------------------------------
# 3. Cifrar
# ---------------------------------------------------------------------------

# La passphrase se pasa por file descriptor, no por argumento: los argumentos
# de un proceso son visibles para cualquier usuario mediante ps.
log "Cifrando (AES-256)..."
if ! gpg --batch --yes --quiet \
        --symmetric --cipher-algo AES256 \
        --passphrase-fd 3 \
        --output "$DESTINO" \
        "$TMP_DUMP" 3<<<"$BACKUP_PASSPHRASE"; then
    error "falló el cifrado"
    rm -f "$DESTINO"
    exit 1
fi

# Verificar que lo cifrado se puede volver a abrir. Un backup que no se puede
# descifrar no es un backup.
#
# Se compara byte a byte contra el dump original en vez de pasarlo por
# pg_restore: pg_restore -l lee sólo la tabla de contenidos y cierra la
# tubería, y gpg muere con SIGPIPE ("Broken pipe") en cuanto el dump no entra
# en el buffer. "cmp" consume toda la entrada, y de paso verifica más: que el
# descifrado sea idéntico al original, no sólo que se pueda leer.
log "Verificando el descifrado..."
if ! gpg --batch --quiet --decrypt --passphrase-fd 3 "$DESTINO" 3<<<"$BACKUP_PASSPHRASE" \
        | cmp -s - "$TMP_DUMP"; then
    error "el archivo cifrado no se pudo descifrar o no coincide con el original"
    rm -f "$DESTINO"
    exit 1
fi

limpiar
log "Backup generado: $DESTINO ($(du -h "$DESTINO" | cut -f1))"

# ---------------------------------------------------------------------------
# 4. Subir a Drive (solo en VPS)
# ---------------------------------------------------------------------------

if [[ "$ENTORNO" == "vps" ]]; then
    log "Subiendo a $DRIVE_REMOTE:$DRIVE_FOLDER ..."
    if ! rclone copy "$DESTINO" "$DRIVE_REMOTE:$DRIVE_FOLDER"; then
        error "falló la subida a Drive; el backup local quedó en $DESTINO"
        exit 1
    fi
    log "Subido: $DRIVE_REMOTE:$DRIVE_FOLDER/$ARCHIVO"

    # La limpieza corre recién acá: si algo falló antes, el script ya salió y
    # los backups viejos siguen intactos.
    log "Limpiando backups en Drive de más de $RETENTION_DAYS días..."
    if ! rclone delete "$DRIVE_REMOTE:$DRIVE_FOLDER" --min-age "${RETENTION_DAYS}d"; then
        log "AVISO: la limpieza en Drive falló (el backup de hoy sí se subió)."
    fi
fi

# ---------------------------------------------------------------------------
# 5. Limpieza local
# ---------------------------------------------------------------------------

log "Limpiando backups locales de más de $RETENTION_DAYS días..."
find "$BACKUP_PATH" -maxdepth 1 -name "*.dump.gpg" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_PATH" -maxdepth 1 -name "*.dump" -mtime "+$RETENTION_DAYS" -delete

# ---------------------------------------------------------------------------
# 6. Chequeo de frescura
# ---------------------------------------------------------------------------

# Si el cron se rompe, esto es lo único que lo grita. Buscar "BACKUP OBSOLETO"
# en el log, o engancharlo a un monitoreo.
RECIENTE="$(find "$BACKUP_PATH" -maxdepth 1 -name "*.dump.gpg" -mtime -2 | wc -l)"
if [[ "$RECIENTE" -eq 0 ]]; then
    error "BACKUP OBSOLETO: no hay ningún backup de menos de 48 horas en $BACKUP_PATH"
    exit 1
fi

log "Backup finalizado correctamente: $ARCHIVO"
