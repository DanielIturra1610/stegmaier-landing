# ——— Etapa 1 · dependencias frontend ———————————————— #
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./

# instala según el lockfile *si existe*,
# pero no exige coincidencia estricta ni falla si falta algo
RUN npm install

# Instalación completa (modo dev)
RUN npm ci               # <——  ¡esta línea es obligatoria!

# ——— Etapa 2 · imagen final con todo ——————————————— #
FROM python:3.9-alpine
WORKDIR /app

# Instalamos Node.js
RUN apk add --no-cache nodejs npm

# Copiamos las deps de frontend instaladas
COPY --from=deps /app/node_modules ./node_modules

# Instalamos dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el código del proyecto primero
COPY . .

# Copiamos el archivo de entorno (sobreescribiendo si existe)
COPY .env.docker ./.env

# Variables de entorno para el servidor
ENV PYTHONPATH=/app:${PYTHONPATH}

# Permisos para script de inicio
RUN chmod +x /app/start-services.sh

# Exponemos los puertos de frontend y backend
EXPOSE 5173 8000

# Iniciamos ambos servicios
CMD ["/app/start-services.sh"]
