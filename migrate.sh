#!/usr/bin/env bash
# Ejecuta migraciones de base de datos en producción (Lightsail).
#
# SIEMPRE crea un backup completo (pg_dump) antes de aplicar migraciones.
# El backup se guarda:
#   - En el servidor: ~/bookofdate/backups/
#   - Localmente:     ./backups/
#
# Uso:
#   ./migrate.sh              # backup + migrar todo lo pendiente
#   ./migrate.sh --backup     # solo hacer backup sin migrar
#   ./migrate.sh --list       # listar migraciones aplicadas vs pendientes
#
# Variables de entorno opcionales (mismas que deploy.sh):
#   DEPLOY_SSH_KEY     ruta a la llave .pem
#   DEPLOY_HOST        usuario@ip del servidor
#   DEPLOY_REMOTE_DIR  carpeta del proyecto en el servidor

set -euo pipefail

SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/Downloads/LightsailDefaultKey-us-east-1.pem}"
SSH_HOST="${DEPLOY_HOST:-ubuntu@13.220.170.16}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-~/bookofdate}"

POSTGRES_USER="${POSTGRES_USER:-bookofdate}"
POSTGRES_DB="${POSTGRES_DB:-bookofdate}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MIGRATIONS_DIR="Backend/sql/migrations"
LOCAL_BACKUP_DIR="./backups"

ACTION="${1:-migrate}"

if [ ! -f "$SSH_KEY" ]; then
  echo "❌ No encuentro la llave SSH en: $SSH_KEY" >&2
  echo "   Define DEPLOY_SSH_KEY con la ruta correcta." >&2
  exit 1
fi

# ─── Funciones ────────────────────────────────────────────────

ssh_cmd() {
  ssh -i "$SSH_KEY" "$SSH_HOST" "$@"
}

scp_from() {
  scp -i "$SSH_KEY" -q "$SSH_HOST:$1" "$2"
}

scp_to() {
  scp -i "$SSH_KEY" -q "$1" "$SSH_HOST:$2"
}

get_postgres_container() {
  ssh_cmd "cd $REMOTE_DIR && sudo docker compose ps -q postgres"
}

# Crea la tabla de control de migraciones si no existe
ensure_migrations_table() {
  local container="$1"
  ssh_cmd "sudo docker exec $container psql -U $POSTGRES_USER -d $POSTGRES_DB -c \"
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  \"" > /dev/null 2>&1
}

# Obtiene lista de migraciones ya aplicadas
get_applied_migrations() {
  local container="$1"
  ssh_cmd "sudo docker exec $container psql -U $POSTGRES_USER -d $POSTGRES_DB -t -A -c \"
    SELECT filename FROM _migrations ORDER BY filename;
  \"" 2>/dev/null
}

# ─── Backup ───────────────────────────────────────────────────

do_backup() {
  echo "==> Creando backup de la base de datos..."

  local container
  container=$(get_postgres_container)
  if [ -z "$container" ]; then
    echo "❌ No se encontró el contenedor de postgres." >&2
    exit 1
  fi

  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  local backup_filename="bookofdate_backup_${timestamp}.sql.gz"

  # Crear directorio de backups en el servidor
  ssh_cmd "mkdir -p $REMOTE_DIR/backups"

  # Ejecutar pg_dump dentro del contenedor y comprimir
  echo "   Ejecutando pg_dump..."
  ssh_cmd "sudo docker exec $container pg_dump -U $POSTGRES_USER -d $POSTGRES_DB --no-owner --no-acl | gzip > $REMOTE_DIR/backups/$backup_filename"

  # Verificar que el backup no está vacío
  local size
  size=$(ssh_cmd "stat -c%s $REMOTE_DIR/backups/$backup_filename" 2>/dev/null || echo "0")
  if [ "$size" -lt 100 ]; then
    echo "❌ El backup parece vacío o falló. Abortando." >&2
    exit 1
  fi

  # Descargar backup localmente
  mkdir -p "$LOCAL_BACKUP_DIR"
  echo "   Descargando backup localmente..."
  scp_from "$REMOTE_DIR/backups/$backup_filename" "$LOCAL_BACKUP_DIR/$backup_filename"

  local size_human
  size_human=$(ssh_cmd "du -h $REMOTE_DIR/backups/$backup_filename | cut -f1")
  echo "✅ Backup creado: $backup_filename ($size_human)"
  echo "   Servidor: $REMOTE_DIR/backups/$backup_filename"
  echo "   Local:    $LOCAL_BACKUP_DIR/$backup_filename"

  # Limpiar backups antiguos en el servidor (mantener últimos 10)
  ssh_cmd "cd $REMOTE_DIR/backups && ls -t bookofdate_backup_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm --"

  echo "$backup_filename"
}

# ─── Listar migraciones ──────────────────────────────────────

do_list() {
  local container
  container=$(get_postgres_container)
  ensure_migrations_table "$container"

  local applied
  applied=$(get_applied_migrations "$container")

  echo ""
  echo "Estado de migraciones:"
  echo "─────────────────────────────────────────"

  for file in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
    local filename
    filename=$(basename "$file")
    if echo "$applied" | grep -qx "$filename"; then
      echo "  ✅ $filename (aplicada)"
    else
      echo "  ⏳ $filename (pendiente)"
    fi
  done
  echo ""
}

# ─── Migrar ───────────────────────────────────────────────────

do_migrate() {
  local container
  container=$(get_postgres_container)
  if [ -z "$container" ]; then
    echo "❌ No se encontró el contenedor de postgres." >&2
    exit 1
  fi

  ensure_migrations_table "$container"

  local applied
  applied=$(get_applied_migrations "$container")

  # Determinar migraciones pendientes
  local pending=()
  for file in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
    local filename
    filename=$(basename "$file")
    if ! echo "$applied" | grep -qx "$filename"; then
      pending+=("$file")
    fi
  done

  if [ ${#pending[@]} -eq 0 ]; then
    echo "✅ No hay migraciones pendientes. Todo al día."
    return 0
  fi

  echo ""
  echo "==> Migraciones pendientes: ${#pending[@]}"
  for f in "${pending[@]}"; do
    echo "    - $(basename "$f")"
  done
  echo ""

  # Backup ANTES de migrar
  echo "==> Creando backup antes de migrar (por seguridad)..."
  do_backup
  echo ""

  # Copiar migraciones al servidor y ejecutarlas
  echo "==> Aplicando migraciones..."
  ssh_cmd "mkdir -p $REMOTE_DIR/tmp_migrations"

  for file in "${pending[@]}"; do
    local filename
    filename=$(basename "$file")
    echo "   Aplicando: $filename ..."

    # Copiar archivo de migración
    scp_to "$file" "$REMOTE_DIR/tmp_migrations/$filename"

    # Ejecutar dentro del contenedor
    ssh_cmd "sudo docker exec -i $container psql -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1 < $REMOTE_DIR/tmp_migrations/$filename"

    if [ $? -ne 0 ]; then
      echo "❌ Error al aplicar $filename. Se detuvo la migración." >&2
      echo "   El backup está disponible para restaurar si es necesario." >&2
      ssh_cmd "rm -rf $REMOTE_DIR/tmp_migrations"
      exit 1
    fi

    # Registrar migración como aplicada
    ssh_cmd "sudo docker exec $container psql -U $POSTGRES_USER -d $POSTGRES_DB -c \"
      INSERT INTO _migrations (filename) VALUES ('$filename') ON CONFLICT DO NOTHING;
    \"" > /dev/null

    echo "   ✅ $filename aplicada"
  done

  # Limpieza
  ssh_cmd "rm -rf $REMOTE_DIR/tmp_migrations"

  echo ""
  echo "✅ Todas las migraciones aplicadas correctamente."

  # Generar thumbnails para fotos existentes que no tengan
  echo ""
  echo "==> Generando thumbnails para fotos existentes..."
  local backend_container
  backend_container=$(ssh_cmd "cd $REMOTE_DIR && sudo docker compose ps -q backend")
  if [ -n "$backend_container" ]; then
    ssh_cmd "sudo docker exec $backend_container node src/scripts/generateThumbnails.js" || true
  else
    echo "   ⚠️  Contenedor backend no encontrado, omitiendo thumbnails."
    echo "   Ejecuta manualmente: docker exec <backend> node src/scripts/generateThumbnails.js"
  fi
}

# ─── Main ─────────────────────────────────────────────────────

case "$ACTION" in
  --backup|-b)
    do_backup
    ;;
  --list|-l)
    do_list
    ;;
  migrate|--migrate|-m)
    do_migrate
    ;;
  *)
    echo "Uso: $0 [migrate|--backup|--list]"
    echo ""
    echo "  migrate    Backup + aplicar migraciones pendientes (default)"
    echo "  --backup   Solo hacer backup de la DB"
    echo "  --list     Ver estado de migraciones (aplicadas/pendientes)"
    exit 1
    ;;
esac
