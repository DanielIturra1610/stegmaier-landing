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

# Eliminamos configuraciones obsoletas de npm para evitar advertencias
RUN npm config delete globalignorefile || true && \
    npm config delete python || true

# Creamos el script de inicio directamente en el contenedor
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo '# Desactivar configuraciones obsoletas de npm' >> /app/entrypoint.sh && \
    echo 'npm config delete globalignorefile 2>/dev/null || true' >> /app/entrypoint.sh && \
    echo 'npm config delete python 2>/dev/null || true' >> /app/entrypoint.sh && \
    echo '' >> /app/entrypoint.sh && \
    echo '# Inicia el servidor FastAPI en segundo plano' >> /app/entrypoint.sh && \
    echo 'cd /app && python -m uvicorn src.api.contact:app --host 0.0.0.0 --port 8000 --reload &' >> /app/entrypoint.sh && \
    echo '' >> /app/entrypoint.sh && \
    echo '# Inicia el servidor de desarrollo de Vite' >> /app/entrypoint.sh && \
    echo 'cd /app && NODE_OPTIONS="--no-warnings" npm run dev -- --host 0.0.0.0' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh && \
    cat /app/entrypoint.sh

# Exponemos los puertos de frontend y backend
EXPOSE 5173 8000

# Usamos el script creado directamente en el contenedor
CMD ["/app/entrypoint.sh"]
