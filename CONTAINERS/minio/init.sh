#!/bin/sh

set -e

# Esperar a que MinIO esté disponible
while ! mc ls myminio; do
    echo "Esperando a que MinIO esté disponible..."
    sleep 2
done

# Crear el bucket si no existe
mc mb myminio/files || true
mc mb myminio/reports || true
