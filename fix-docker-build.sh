#!/bin/bash
# Script para probar la compilación Docker después de las correcciones

echo "🐳 FIXING DOCKER BUILD ISSUES - STEGMAIER LMS"
echo "=============================================="

echo "📋 Issues Found:"
echo "1. ❌ Backend: fastapi.middleware.base import error"  
echo "2. ❌ Backend: Sentry SQLAlchemy integration error"
echo "3. ❌ Backend: pythonjsonlogger module not found"
echo "4. ❌ Backend: PeriodicMetricsMiddleware import error"
echo "5. ❌ Frontend: Missing dependencies (react-dnd, date-fns)"
echo "6. ⚠️  Frontend: Node.js engine warnings (non-critical)"

echo ""
echo "🔧 FIXES APPLIED:"
echo "✅ 1. Changed import from fastapi.middleware.base to starlette.middleware.base"
echo "✅ 2. Removed SQLAlchemy integration from Sentry config (not using SQLAlchemy)"
echo "✅ 3. Added python-json-logger==2.0.7 to requirements.txt"
echo "✅ 4. Created fallback JSON logger for structured logging"
echo "✅ 5. Renamed MetricsUpdateMiddleware to PeriodicMetricsMiddleware"
echo "✅ 6. Added missing dependencies to package.json:"
echo "   - react-dnd: ^16.0.1"
echo "   - react-dnd-html5-backend: ^16.0.1" 
echo "   - react-dnd-touch-backend: ^16.0.1"
echo "   - date-fns: ^2.30.0"

echo ""
echo "🧪 TESTING DOCKER BUILD:"
echo "========================="

# Limpiar contenedores anteriores
echo "🧹 Cleaning previous containers..."
docker-compose down --remove-orphans 2>/dev/null

# Limpiar imágenes anteriores
echo "🗑️  Removing old images..."
docker image prune -f 2>/dev/null

# Intentar construir
echo "🏗️  Building containers..."
docker-compose up --build -d

# Verificar estado
echo ""
echo "📊 CONTAINER STATUS:"
echo "==================="
docker-compose ps

# Verificar logs del backend
echo ""
echo "📝 BACKEND LOGS (last 20 lines):"
echo "================================="
docker-compose logs --tail=20 stegmaier-api

# Verificar logs del frontend  
echo ""
echo "📝 FRONTEND LOGS (last 20 lines):"
echo "=================================="
docker-compose logs --tail=20 stegmaier-frontend

echo ""
echo "🎯 QUICK HEALTH CHECK:"
echo "======================"

# Verificar si los servicios responden
backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null || echo "000") 

if [ "$backend_status" = "200" ]; then
    echo "✅ Backend API: HEALTHY (http://localhost:8000)"
else
    echo "❌ Backend API: NOT RESPONDING (status: $backend_status)"
fi

if [ "$frontend_status" = "200" ]; then
    echo "✅ Frontend: HEALTHY (http://localhost:5173)"
else
    echo "❌ Frontend: NOT RESPONDING (status: $frontend_status)"
fi

echo ""
echo "🔗 ACCESS URLS:"
echo "==============="
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/api/docs"

echo ""
echo "⚡ NEXT STEPS IF ISSUES PERSIST:"
echo "================================"
echo "1. Check detailed container logs: docker-compose logs [service-name]"
echo "2. Verify environment variables are set correctly"
echo "3. Ensure MongoDB and Redis are accessible"
echo "4. Check if ports 5173 and 8000 are available"
echo ""
echo "🎉 Docker build process completed!"
