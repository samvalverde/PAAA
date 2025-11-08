#!/bin/bash
# ======================================================================
# Script: load-data.sh
# Descripción:
#   Carga datos iniciales en las bases de datos del proyecto.
#   Se puede ejecutar en cualquier momento mientras los contenedores
#   estén corriendo.
# ======================================================================

set -e

# Nombres de los contenedores según docker-compose
USERS_DB_CONTAINER="users-db"
ETL_DB_CONTAINER="etl-db"

# Parámetros de conexión
POSTGRES_USER="postgres"
POSTGRES_PASS="postgres"
USERS_DB_NAME="users_db"
ETL_DB_NAME="etl_db"

# Paths a los scripts SQL
USERS_SQL="./db/02-users.sql"
ETL_SQL="./db/02-etl.sql"  # vacío por ahora

# ---------------------------------------------------------
# Función para cargar datos en una base
# ----------------------------------------------------------------------
load_data() {
    local container=$1
    local db_name=$2
    local sql_file=$3

    echo "Cargando datos en la base '$db_name' dentro del contenedor '$container'..."

    # Verificar que el contenedor esté en ejecución
    if [ "$(docker ps -q -f name=$container)" ]; then
    docker exec -i $container psql -U $POSTGRES_USER -d $db_name < $sql_file
    echo "Datos cargados correctamente en $db_name."
    else
    echo "Contenedor $container no está corriendo. Saltando."
    fi
}

# ----------------------------------------------------------------------
# Ejecución
# ----------------------------------------------------------------------
echo "Iniciando carga de datos para PAAA..."
load_data $USERS_DB_CONTAINER $USERS_DB_NAME $USERS_SQL
# Descomenta la siguiente línea si luego añades scripts para ETL
# load_data $ETL_DB_CONTAINER $ETL_DB_NAME $ETL_SQL

echo "Carga completa."
