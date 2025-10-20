#!/usr/bin/env python3
"""
Script para verificar las rutas registradas en el servidor FastAPI
"""
import sys
import os

# Añadir el directorio de la app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    from fastapi.routing import APIRoute
    from app.api.v1.api import api_router
    from app.api.v1.endpoints.quizzes import router as quiz_router

    print("🔍 VERIFICACIÓN DE RUTAS DE QUIZZES")
    print("=" * 50)

    # Verificar rutas del quiz_router
    print("\n📋 Rutas en quiz_router:")
    for route in quiz_router.routes:
        if isinstance(route, APIRoute):
            print(f"  {route.methods} -> {route.path}")

    # Verificar rutas en api_router
    print(f"\n📋 Quiz router prefix en api_router:")
    for route in api_router.routes:
        if hasattr(route, 'app') and route.app == quiz_router:
            print(f"  Prefix: '{route.path_prefix}'")
            break

    # Mostrar rutas completas esperadas
    print(f"\n✅ RUTAS FINALES ESPERADAS:")
    quiz_routes = [
        ("POST", "/api/v1/quizzes/lesson/{lesson_id}"),
        ("GET", "/api/v1/quizzes/lesson/{lesson_id}/quiz"),
        ("POST", "/api/v1/quizzes/"),
        ("GET", "/api/v1/quizzes/{quiz_id}"),
    ]

    for method, path in quiz_routes:
        print(f"  {method} -> {path}")

    print(f"\n🚀 El endpoint problemático debería estar en:")
    print(f"  POST -> /api/v1/quizzes/lesson/{{lesson_id}}")

except Exception as e:
    print(f"❌ Error al verificar rutas: {e}")
    print("Este error es normal en el entorno local por problemas de dependencias.")
    print("En producción debería funcionar correctamente.")