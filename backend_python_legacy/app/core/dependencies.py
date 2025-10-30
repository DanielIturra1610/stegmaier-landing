"""
Dependencias para inyección de dependencias de FastAPI
"""
from ..application.services.media_service import MediaService
from ..infrastructure.repositories.media_repository import FileSystemMediaRepository

# Instancia global del repositorio de media
_media_repository = FileSystemMediaRepository()

def get_media_service() -> MediaService:
    """
    Dependency provider para MediaService
    """
    return MediaService(_media_repository)
