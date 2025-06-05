FROM node:20-alpine

WORKDIR /app

# Instalar dependencias globales
RUN npm install -g vite

# El resto de dependencias se instalarán al montar el volumen
CMD ["npm", "run", "dev"]