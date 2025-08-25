#!/bin/bash

# Production startup script for Stegmaier LMS on Railway
# This script ensures proper initialization and error handling

set -e  # Exit on any error

echo "🚀 Starting Stegmaier LMS in Production Mode..."

# Environment validation
if [ "$ENVIRONMENT" != "production" ]; then
    echo "⚠️  WARNING: ENVIRONMENT is not set to 'production'"
fi

if [ -z "$JWT_SECRET_KEY" ]; then
    echo "❌ CRITICAL: JWT_SECRET_KEY is not set"
    exit 1
fi

if [ ${#JWT_SECRET_KEY} -lt 32 ]; then
    echo "❌ CRITICAL: JWT_SECRET_KEY must be at least 32 characters long"
    exit 1
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p /app/media/videos
mkdir -p /app/media/images
mkdir -p /app/logs

# Set proper permissions
chmod 755 /app/media
chmod 755 /app/media/videos
chmod 755 /app/media/images

# Database connection check (with retry logic)
echo "🗄️  Checking database connection..."
python -c "
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_db():
    try:
        client = AsyncIOMotorClient(os.getenv('MONGODB_URL'))
        await client.admin.command('ping')
        print('✅ Database connection successful')
        await client.close()
        return True
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        return False

if not asyncio.run(check_db()):
    sys.exit(1)
"

# Log configuration info
echo "📊 Production Configuration:"
echo "   Environment: $ENVIRONMENT"
echo "   Port: ${PORT:-8000}"
echo "   Workers: 2"
echo "   Media Root: ${MEDIA_ROOT:-/app/media}"
echo "   Rate Limiting: ${RATE_LIMIT_ENABLED:-true}"
echo "   Security Headers: ${SECURITY_HEADERS_ENABLED:-true}"

# Start the application
echo "🔄 Starting FastAPI application..."
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --workers 2 \
    --access-log \
    --log-level info \
    --loop uvloop \
    --http httptools