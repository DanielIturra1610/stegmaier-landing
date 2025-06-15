# ——— Etapa 1 · dependencias ———————————————— #
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./

# instala según el lockfile *si existe*,
# pero no exige coincidencia estricta ni falla si falta algo
RUN npm install

# 2. Instalación **completa** (modo dev)
RUN npm ci               # <——  ¡esta línea es obligatoria!

# ——— Etapa 2 · código fuente + herramientas ——— #
FROM node:20-alpine
WORKDIR /app

# Copiamos las deps instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copiamos el resto del proyecto
COPY . .

EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0"]
