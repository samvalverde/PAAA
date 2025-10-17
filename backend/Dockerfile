FROM python:3.11-slim

WORKDIR /code

# System deps (psycopg2)
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /code

# Create dirs for SQLite/local storage in isolated mode
RUN mkdir -p /code/data /code/storage

EXPOSE 8000
CMD [ "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" ]
