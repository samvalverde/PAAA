FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar Poetry
RUN pip install --no-cache-dir poetry==1.8.3

# Copiamos metadata
COPY pyproject.toml poetry.lock ./

# Instala solo deps "main" en el sistema del contenedor (sin venv)
RUN poetry config virtualenvs.create false \
  && poetry install --no-interaction --no-ansi --only main

# Copiamos el código de la carpeta agent
COPY agent/ ./agent/

# (Opcional) fuentes para matplotlib
# RUN apt-get update && apt-get install -y --no-install-recommends fonts-dejavu-core \
#     && rm -rf /var/lib/apt/lists/*

ENV MODEL=gpt-4o-mini

# Ejecuta tu entrypoint
CMD ["python", "agent/estudiantes-ati.py"]
