"""
Punto de entrada principal de la aplicación FastAPI para la plataforma de cursos
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import asyncio

from .core.config import get_settings
from .infrastructure.database import connect_to_mongo, close_mongo_connection
from .middleware import CacheControlMiddleware, ConditionalRequestMiddleware
from .middleware.monitoring_middleware import MaintenanceModeMiddleware
from .middleware.security_middleware import (
    SecurityHeadersMiddleware, 
    RateLimitMiddleware, 
    RequestSizeMiddleware
)
from .infrastructure.monitoring.integrated_middleware import (
    IntegratedMonitoringMiddleware,
    PeriodicMetricsMiddleware,
    initialize_monitoring_system
)
from .api.v1.openapi_config import get_openapi_config, TAGS_METADATA

# Importación de routers (se crearán en futuros pasos)
# from .api.v1.endpoints import users, auth, courses, lessons, enrollments, reviews

def create_application() -> FastAPI:
    """
    Crea y configura la aplicación FastAPI
    
    Returns:
        Aplicación FastAPI configurada
    """
    settings = get_settings()
    openapi_config = get_openapi_config()
    
    # Configuración completa de OpenAPI con documentación mejorada
    app = FastAPI(
        **openapi_config,
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )
    
    # Middlewares personalizados (el orden importa)
    
    # 1. Middleware de mantenimiento - debe ir primero
    app.add_middleware(MaintenanceModeMiddleware)
    
    # 2. Security Headers - segundo para asegurar todas las responses
    app.add_middleware(SecurityHeadersMiddleware)
    
    # 3. Request size limiting - antes de procesar requests grandes
    app.add_middleware(RequestSizeMiddleware)
    
    # 4. Rate Limiting - después de security headers pero antes de processing
    app.add_middleware(RateLimitMiddleware)
    
    # 5. Middleware de monitoreo integrado - incluye Sentry, logging, métricas y alertas
    app.add_middleware(IntegratedMonitoringMiddleware)
    
    # 6. Middleware de métricas periódicas - para actualizaciones en background
    app.add_middleware(PeriodicMetricsMiddleware)
    
    # 7. Middleware de cache control
    app.add_middleware(CacheControlMiddleware)
    app.add_middleware(ConditionalRequestMiddleware)
    
    # 8. CORS - SECURITY: Configured per environment
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,  # Dynamic based on environment
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicit methods only
        allow_headers=[
            "Accept",
            "Accept-Language", 
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-Request-ID"
        ],  # Explicit headers only
        expose_headers=["X-Process-Time", "X-Request-ID", "X-Cache-Rule", "X-RateLimit-Remaining"],
        max_age=600  # Tiempo de caché para las comprobaciones preflight
    )
    
    # Eventos de inicio y cierre
    app.add_event_handler("startup", connect_to_mongo)
    app.add_event_handler("startup", initialize_monitoring_system)
    app.add_event_handler("shutdown", close_mongo_connection)
    
    # Configurar servicio de archivos estáticos para media
    media_path = settings.MEDIA_ROOT
    if not os.path.exists(media_path):
        os.makedirs(media_path, exist_ok=True)
    
    app.mount("/static/media", StaticFiles(directory=media_path), name="media")
    
    # Incluir router principal de la API v1
    from .api.v1.api import api_router
    app.include_router(api_router, prefix=settings.api_v1_str)
    
    @app.get("/", include_in_schema=False)
    async def root():
        """
        Ruta principal para verificar si la API está funcionando
        """
        return {
            "message": "Bienvenido a la API de la plataforma de cursos de Stegmaier Consulting",
            "version": "0.1.0",
            "docs": f"{settings.api_v1_str}/docs"
        }
    
    return app

app = create_application()
