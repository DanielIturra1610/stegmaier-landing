"""
Punto de entrada principal de la aplicación FastAPI para la plataforma de cursos
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .infrastructure.database import connect_to_mongo, close_mongo_connection

# Importación de routers (se crearán en futuros pasos)
# from .api.v1.endpoints import users, auth, courses, lessons, enrollments, reviews

def create_application() -> FastAPI:
    """
    Crea y configura la aplicación FastAPI
    
    Returns:
        Aplicación FastAPI configurada
    """
    settings = get_settings()
    
    # Opciones para Swagger UI
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="API para la plataforma de cursos online de Stegmaier - Documentación de la API RESTful",
        version="1.0.0",
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_tags=[
            {
                "name": "autenticación",
                "description": "Operaciones relacionadas con la autenticación de usuarios",
                "externalDocs": {
                    "description": "Más información sobre JWT",
                    "url": "https://jwt.io/introduction",
                },
            },
            {
                "name": "usuarios",
                "description": "Operaciones con usuarios - crear, actualizar, eliminar",
            },
            {
                "name": "cursos",
                "description": "Gestión de cursos - creación, actualización, listado, búsqueda",
            },
            {
                "name": "lecciones",
                "description": "Gestión de lecciones de cursos",
            },
            {
                "name": "inscripciones",
                "description": "Gestión de inscripciones a cursos y seguimiento del progreso",
            },
            {
                "name": "reseñas",
                "description": "Sistema de valoraciones y reseñas de cursos",
            },
        ],
    )
    
    # Configuración de CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Eventos de inicio y cierre
    app.add_event_handler("startup", connect_to_mongo)
    app.add_event_handler("shutdown", close_mongo_connection)
    
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
