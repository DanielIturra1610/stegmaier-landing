"""
Configuración de la aplicación
"""
import os
from functools import lru_cache
from pydantic import BaseSettings
from typing import Optional, Dict, Any, List

class Settings(BaseSettings):
    # API settings
    api_v1_str: str = "/api/v1"
    PROJECT_NAME: str = "Stegmaier Courses Platform"
    
    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "stegmaier_courses")
    
    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-for-development-only")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # Media settings
    MEDIA_ROOT: str = os.getenv("MEDIA_ROOT", "media")
    MAX_VIDEO_SIZE: int = 100 * 1024 * 1024  # 100MB
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024   # 10MB
    ALLOWED_VIDEO_TYPES: List[str] = ["video/mp4", "video/mpeg", "video/quicktime", "video/webm"]
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    
    # CORS settings
    cors_origins: List[str] = [
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://stegmaier-frontend:5173",
        "*"
    ]
    
    class Config:
        case_sensitive = True
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    """
    Obtiene la configuración de la aplicación.
    Usa @lru_cache para evitar cargar múltiples veces la configuración.
    
    Returns:
        Settings: Objeto con la configuración de la aplicación
    """
    return Settings()

# Para compatibilidad con código existente
settings = get_settings()
