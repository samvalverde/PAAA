FROM python:3.11-slim

WORKDIR /code

# Dependencias del sistema
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Copiar requirements.txt (ya está dentro del contexto ./backend)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código (todo el contenido del backend)
COPY . .

# Crear carpetas locales
RUN mkdir -p /code/data /code/storage

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
