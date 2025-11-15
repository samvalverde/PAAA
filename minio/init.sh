set -eu

MC="/usr/local/bin/mc"
HOST="127.0.0.1:9000"   # MinIO corre en el mismo contenedor

log() { echo "[init-minio] $*"; }

# Instalar mc si no está
if ! command -v "$MC" >/dev/null 2>&1; then
  log "Descargando mc…"
  # usa wget si está, si no curl
  if command -v wget >/dev/null 2>&1; then
    wget -qO "$MC" https://dl.min.io/client/mc/release/linux-amd64/mc
  else
    # la imagen oficial tampoco trae curl normalmente,
    # pero dejamos este fallback por si tu build la incluye
    curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc -o "$MC" || true
  fi
  chmod +x "$MC" || true
fi

# Esperar a que el servidor acepte credenciales (sin usar curl/wget)
: "${MINIO_ACCESS_KEY:?MINIO_ACCESS_KEY faltante}"
: "${MINIO_SECRET_KEY:?MINIO_SECRET_KEY faltante}"

log "Esperando a MinIO…"
sleep 20

# Crear bucket y “carpetas”
"$MC" mb -p paaa || true
echo "" | "$MC" pipe paaa/ATI/estudiantes/.keep
echo "" | "$MC" pipe paaa/ATI/egresados/.keep

log "Bucket 'paaa' y prefijos ATI/{estudiantes,egresados} creados."
