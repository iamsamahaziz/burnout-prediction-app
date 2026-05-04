# Utilisation d'une image Python légère
FROM python:3.11-slim

# Recommandé pour Flask en Docker
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Installation des dépendances système (si besoin)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copie du reste du code
COPY . .

# Exposition du port Flask
EXPOSE 5000

# Utilisation de Gunicorn pour la production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
