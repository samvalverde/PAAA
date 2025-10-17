# ETL (PAAA)

Módulo de ingesta de datos para el servicio **agente**.

## Uso rápido

```python
from etl import SurveyETL

etl = SurveyETL(
  source="datos/estudiantes_20220622.xlsx",   # o se actualiza a minio
  dataset_name="estudiantes",
  key_columns=("id_estudiante", "periodo"),
  dtypes={"id_estudiante": "string", "periodo": "string", "email": "string"},
  write_raw=True,
)
etl.run()
```

## Dependencias recomendadas (Poetry)

- pandas
- SQLAlchemy (>=2.0)
- psycopg2-binary
- openpyxl (para Excel)
- minio (solo si vas a leer `minio://`)

## Variables de entorno (Postgres)

- `PG_DSN` (opcional) — ejemplo: `postgresql+psycopg2://postgres:postgres@db:5432/postgres`
- O bien: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

## Variables MinIO (si usas `minio://`)

- `MINIO_ENDPOINT` (ej: `minio:9000`)
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_SECURE` (`true|false`)
