#!/bin/bash
# Script de configuración para entorno de desarrollo
# Stegmaier Learning Platform API

# Crear archivos de variables de entorno
echo "Creando archivo de variables de entorno..."

cat > .env << EOL
# Variables de entorno para desarrollo
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=stegmaier_courses
JWT_SECRET_KEY=dev_secret_key_change_in_production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EOL

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "Python 3 no está instalado. Por favor instala Python 3."
    exit 1
fi

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual e instalar dependencias
echo "Instalando dependencias..."
source venv/bin/activate
pip install -r requirements.txt

echo "Configuración completada exitosamente."
echo "Para iniciar el servidor de desarrollo ejecuta: uvicorn app.main:app --reload"
echo "Para iniciar con Docker ejecuta: docker-compose up"
