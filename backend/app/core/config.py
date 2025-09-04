"""Configuración de la aplicación"""
import os
import secrets
from functools import lru_cache
from pydantic import BaseSettings, validator
from typing import Optional, Dict, Any, List

class Settings(BaseSettings):
    # API settings
    api_v1_str: str = "/api/v1"
    PROJECT_NAME: str = "Stegmaier Courses Platform"
    
    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "stegmaier_courses")
    
    # JWT Authentication - CRITICAL: Must be set via environment variables
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    @validator('JWT_SECRET_KEY')
    def validate_jwt_secret(cls, v):
        if not v or len(v) < 32:
            if os.getenv("ENVIRONMENT") == "production":
                raise ValueError("JWT_SECRET_KEY must be set and at least 32 characters long in production")
            # Auto-generate for development if not set
            return secrets.token_urlsafe(32)
        return v
    
    # Media settings - Enhanced security
    MEDIA_ROOT: str = os.getenv("MEDIA_ROOT", "media")
    MAX_VIDEO_SIZE: int = int(os.getenv("MAX_VIDEO_SIZE", str(50 * 1024 * 1024)))  # 50MB default
    MAX_IMAGE_SIZE: int = int(os.getenv("MAX_IMAGE_SIZE", str(5 * 1024 * 1024)))   # 5MB default
    MAX_TOTAL_UPLOAD_SIZE: int = int(os.getenv("MAX_TOTAL_UPLOAD_SIZE", str(100 * 1024 * 1024)))  # 100MB total
    
    # Strict file type validation
    ALLOWED_VIDEO_TYPES: List[str] = ["video/mp4", "video/webm"]  # Reduced for security
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    BLOCKED_EXTENSIONS: List[str] = [
        ".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", ".js", ".jar",
        ".php", ".asp", ".aspx", ".jsp", ".py", ".sh", ".pl", ".rb"
    ]
    
    # File scanning
    ENABLE_VIRUS_SCAN: bool = os.getenv("ENABLE_VIRUS_SCAN", "false").lower() == "true"
    MAX_FILES_PER_REQUEST: int = int(os.getenv("MAX_FILES_PER_REQUEST", "5"))
    
    # CORS settings - SECURITY: No wildcards in production
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Production domains (set via environment variables)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ADMIN_URL: str = os.getenv("ADMIN_URL", "http://localhost:3000")
    
    @property
    def cors_origins(self) -> List[str]:
        if self.ENVIRONMENT == "production":
            # Production: only allow specific domains
            origins = []
            if self.FRONTEND_URL:
                origins.append(self.FRONTEND_URL)
            if self.ADMIN_URL and self.ADMIN_URL != self.FRONTEND_URL:
                origins.append(self.ADMIN_URL)
            # Add any additional production domains from env
            additional = os.getenv("ADDITIONAL_CORS_ORIGINS", "")
            if additional:
                origins.extend([url.strip() for url in additional.split(",")])
            return origins
        else:
            # Development: allow common local development URLs
            return [
                "http://localhost:3000", 
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:8000",
                "http://stegmaier-frontend:5173"
            ]
    
    # Security Headers
    SECURITY_HEADERS_ENABLED: bool = os.getenv("SECURITY_HEADERS_ENABLED", "true").lower() == "true"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))  # requests per minute
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # window in seconds
    
    # Redis for rate limiting
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Email/SMTP Configuration
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "localhost")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    FROM_EMAIL: str = os.getenv("EMAIL_FROM", "noreply@stegmaierplatform.com")
    FROM_NAME: str = os.getenv("FROM_NAME", "Stegmaier LMS")
    SUPPORT_EMAIL: str = os.getenv("SUPPORT_EMAIL", "support@stegmaierplatform.com")
    
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
