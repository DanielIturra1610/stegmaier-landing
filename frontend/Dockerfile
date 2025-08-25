FROM node:20.11-alpine3.19 AS build

WORKDIR /app

# Copia los archivos de configuración y dependencias
COPY package.json ./
COPY tsconfig.json tsconfig.node.json ./
COPY vite.config.ts postcss.config.js tailwind.config.js ./
COPY components.json ./

# Instala las dependencias
RUN npm install

# Copia el código fuente
COPY index.html ./
COPY src ./src
COPY public ./public

# Compila la aplicación para producción
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copia los archivos de distribución desde la etapa de compilación
COPY --from=build /app/dist /usr/share/nginx/html

# Configura Nginx para aplicaciones SPA
RUN echo 'server { \
    listen       80; \
    server_name  localhost; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    error_page   500 502 503 504  /50x.html; \
    location = /50x.html { \
        root   /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Puerto que expone Nginx
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
