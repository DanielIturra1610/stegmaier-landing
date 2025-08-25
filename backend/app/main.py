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

def create_application() -> FastAPI:
    """
    Crea y configura la aplicación FastAPI
    
    Returns:
        Aplicación FastAPI configurada
    """
    settings = get_settings()
    
    # Configuración básica de FastAPI
    app = FastAPI(
        title="Stegmaier LMS API",
        version="1.0.0",
        description="API para la plataforma de cursos de Stegmaier Consulting",
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )
    
    # CORS - SECURITY: Configured per environment
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,  # Dynamic based on environment
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Accept",
            "Accept-Language", 
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-Request-ID"
        ],
        expose_headers=["X-Process-Time", "X-Request-ID", "X-RateLimit-Remaining"],
        max_age=600
    )
    
    # Eventos de inicio y cierre
    app.add_event_handler("startup", connect_to_mongo)
    app.add_event_handler("shutdown", close_mongo_connection)
    
    # Configurar servicio de archivos estáticos para media
    media_path = settings.MEDIA_ROOT
    if not os.path.exists(media_path):
        os.makedirs(media_path, exist_ok=True)
    
    app.mount("/static/media", StaticFiles(directory=media_path), name="media")
    
    # Health check endpoint básico
    @app.get("/health", include_in_schema=False)
    async def health_check():
        """Health check para monitoreo"""
        return {"status": "healthy", "service": "stegmaier-lms-api"}
    
    @app.get("/", include_in_schema=False)
    async def root():
        """
        Ruta principal para verificar si la API está funcionando
        """
        return {
            "message": "Bienvenido a la API de la plataforma de cursos de Stegmaier Consulting",
            "version": "1.0.0",
            "docs": "/api/docs",
            "health": "/health"
        }
    
    return app

app = create_application()
