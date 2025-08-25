FROM node:20.11-alpine3.19 AS build

WORKDIR /app

# Instalar dependencias primero (mejor caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar archivos de configuración
COPY tsconfig.json tsconfig.node.json ./
COPY vite.config.ts postcss.config.js tailwind.config.js ./
COPY components.json ./

# Copiar código fuente
COPY index.html ./
COPY src ./src
COPY public ./public

# Build para producción
RUN npm run build

# Stage final con Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]