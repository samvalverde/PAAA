# PAAA – Backend FastAPI Boilerplate

Este paquete incluye:
- Backend **FastAPI** con estructura modular (auth, users, servicios)
- Conexión a **2 bases de datos** (Users y Data) vía SQLAlchemy
- Fallback de **almacenamiento local** si no hay MinIO (./storage)
- **Docker Compose** para entorno completo (frontend, backend, agente, 2 Postgres, pgAdmin, MinIO)
- **Docker Compose reducido** para desarrollar solo el backend con **SQLite**

## Estructura
```
backend/
  app/
    core/ (config, db, security)
    models/ (User)
    schemas/ (UserCreate/UserOut)
    api/v1/routes/ (auth, users)
    services/ (files: MinIO o local)
    main.py
  requirements.txt
  Dockerfile
docker-compose.yml                # FULL: frontend + backend + agente + dbs + minio + pgadmin
docker-compose.backend.yml        # ISOLATED: solo backend (SQLite y storage local)
```

## Requisitos
- Docker + Docker Compose
- (Opcional) Python 3.11 si quieres correr fuera de Docker

## Modo A: Full stack
1. Copia `.env.example` a `backend/.env` y ajusta si es necesario.
2. Levanta todo:
   ```bash
   docker compose up --build
   ```
3. Accesos:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000 (Docs en `/docs` y `/redoc`)
   - DB usuarios (Postgres): localhost:5432
   - DB datos (Postgres): localhost:5433
   - MinIO: http://localhost:9001 (console) | API en :9000
   - pgAdmin: http://localhost:5050

> El backend se conecta a:
> - `DATABASE_URL_USERS=postgresql://postgres:postgres@database:5432/paadb_users`
> - `DATABASE_URL_DATA=postgresql://postgres:postgres@database_etl:5432/paadb_data`
> - `MINIO_ENDPOINT=http://minio:9000`

## Modo B: Solo backend (aislado)
Este entorno usa **SQLite** para las dos bases y **carpeta local** para almacenamiento.
1. Ejecuta:
   ```bash
   docker compose -f docker-compose.backend.yml up --build
   ```
2. Accede a:
   - Backend: http://localhost:8000 (Docs en `/docs` y `/redoc`)
3. Archivos generados:
   - `backend/data/` (SQLite `.db`)
   - `backend/storage/` (archivos de pruebas)

## Endpoints de prueba
- `POST /auth/login` con `application/x-www-form-urlencoded`:
  - username = email
  - password = contraseña
- `POST /users/`:
  ```json
  {
    "email": "admin@example.com",
    "password": "Admin123!",
    "role": "admin",
    "is_active": true
  }
  ```
- `GET /users/`

## Alembic (migraciones)
Inicializa alembic si deseas manejar migraciones (opcional para el avance 1):
```bash
docker compose exec backend alembic init alembic
# luego configura alembic.ini y env.py para apuntar a DATABASE_URL_USERS y/o DATA
```

## Notas
- En el compose **full**, el servicio `agente` se incluye como contenedor independiente, dependiendo de `database`, `database_etl` y `minio`.
- El backend está listo para integrar más routers: KPIs, Reports, Datasets, etc.
- Para producción, cambia el `CMD` del backend a gunicorn+uvicorn workers.
