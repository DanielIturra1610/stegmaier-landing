"""
Configuración de Sentry para error tracking y monitoring
"""
import os
import logging
from typing import Optional, Dict, Any
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.httpx import HttpxIntegration

logger = logging.getLogger(__name__)

class SentryConfig:
    """Configuración centralizada de Sentry"""
    
    def __init__(self):
        self.dsn = os.getenv("SENTRY_DSN")
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.release = os.getenv("RELEASE_VERSION", "1.0.0")
        self.sample_rate = float(os.getenv("SENTRY_SAMPLE_RATE", "1.0"))
        self.traces_sample_rate = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))
        
    def configure_sentry(self) -> bool:
        """Configurar Sentry con integraciones específicas para el LMS"""
        if not self.dsn:
            logger.warning("SENTRY_DSN not configured, skipping Sentry initialization")
            return False
        
        try:
            sentry_sdk.init(
                dsn=self.dsn,
                environment=self.environment,
                release=self.release,
                sample_rate=self.sample_rate,
                traces_sample_rate=self.traces_sample_rate,
                
                # Integraciones específicas
                integrations=[
                    FastApiIntegration(auto_enable=True),
                    LoggingIntegration(
                        level=logging.INFO,        # Capturar logs de INFO y superiores
                        event_level=logging.ERROR  # Enviar a Sentry solo ERROR y superiores
                    ),
                    RedisIntegration(),
                    HttpxIntegration(),
                ],
                
                # Configuración de tags globales
                default_integrations=False,
                
                # Configuración de performance
                enable_tracing=True,
                
                # Configuración de release health
                auto_session_tracking=True,
                
                # Filtros de URLs sensibles
                before_send=self._before_send_filter,
                before_send_transaction=self._before_send_transaction_filter,
                
                # Tags por defecto
                tags={
                    "service": "stegmaier-lms",
                    "component": "backend-api"
                }
            )
            
            logger.info(f"Sentry initialized successfully for environment: {self.environment}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Sentry: {str(e)}")
            return False
    
    def _before_send_filter(self, event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Filtrar eventos antes de enviar a Sentry"""
        
        # No enviar errores de health checks
        if "url" in event.get("request", {}):
            url = event["request"]["url"]
            if any(path in url for path in ["/health", "/metrics", "/status"]):
                return None
        
        # No enviar errores de bots/crawlers
        user_agent = event.get("request", {}).get("headers", {}).get("User-Agent", "")
        if any(bot in user_agent.lower() for bot in ["bot", "crawler", "spider", "scraper"]):
            return None
        
        # Filtrar información sensible
        if "request" in event:
            headers = event["request"].get("headers", {})
            # Remover headers sensibles
            sensitive_headers = ["authorization", "cookie", "x-api-key"]
            for header in sensitive_headers:
                if header.lower() in [h.lower() for h in headers]:
                    headers[header] = "[Filtered]"
        
        # Agregar contexto del LMS
        event.setdefault("tags", {}).update({
            "lms_module": self._extract_lms_module(event),
            "user_type": self._extract_user_type(event)
        })
        
        return event
    
    def _before_send_transaction_filter(self, event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Filtrar transacciones antes de enviar a Sentry"""
        
        # No trackear transacciones de health checks
        transaction_name = event.get("transaction")
        if transaction_name and any(path in transaction_name for path in ["/health", "/metrics", "/status"]):
            return None
        
        # Solo trackear transacciones que tarden más de 100ms
        duration = event.get("timestamp", 0) - event.get("start_timestamp", 0)
        if duration < 0.1:  # 100ms
            return None
        
        return event
    
    def _extract_lms_module(self, event: Dict[str, Any]) -> str:
        """Extraer el módulo del LMS del evento"""
        url = event.get("request", {}).get("url", "")
        
        if "/api/v1/courses" in url:
            return "courses"
        elif "/api/v1/lessons" in url:
            return "lessons"
        elif "/api/v1/users" in url:
            return "users"
        elif "/api/v1/enrollments" in url:
            return "enrollments"
        elif "/api/v1/analytics" in url:
            return "analytics"
        elif "/api/v1/media" in url:
            return "media"
        elif "/api/v1/admin" in url:
            return "admin"
        else:
            return "unknown"
    
    def _extract_user_type(self, event: Dict[str, Any]) -> str:
        """Extraer el tipo de usuario del evento"""
        # Esto se podría mejorar con información del token JWT
        url = event.get("request", {}).get("url", "")
        
        if "/admin" in url:
            return "admin"
        elif "/instructor" in url:
            return "instructor"
        else:
            return "student"

class SentryErrorCapture:
    """Utilidades para captura manual de errores"""
    
    @staticmethod
    def capture_lms_error(
        error: Exception,
        context: Dict[str, Any] = None,
        user_id: str = None,
        course_id: str = None,
        lesson_id: str = None
    ):
        """Capturar error específico del LMS con contexto"""
        with sentry_sdk.configure_scope() as scope:
            # Contexto general
            if context:
                scope.set_context("lms_context", context)
            
            # IDs específicos del LMS
            if user_id:
                scope.set_tag("user_id", user_id)
                scope.user = {"id": user_id}
            
            if course_id:
                scope.set_tag("course_id", course_id)
            
            if lesson_id:
                scope.set_tag("lesson_id", lesson_id)
            
            # Capturar el error
            sentry_sdk.capture_exception(error)
    
    @staticmethod
    def capture_lms_event(
        message: str,
        level: str = "info",
        extra_data: Dict[str, Any] = None
    ):
        """Capturar evento personalizado del LMS"""
        with sentry_sdk.configure_scope() as scope:
            if extra_data:
                scope.set_context("event_data", extra_data)
            
            sentry_sdk.capture_message(message, level=level)
    
    @staticmethod
    def add_breadcrumb(
        message: str,
        category: str = "lms",
        level: str = "info",
        data: Dict[str, Any] = None
    ):
        """Agregar breadcrumb para trazabilidad"""
        sentry_sdk.add_breadcrumb(
            message=message,
            category=category,
            level=level,
            data=data or {}
        )

# Configuración global
sentry_config = SentryConfig()

def initialize_sentry() -> bool:
    """Función para inicializar Sentry desde main.py"""
    return sentry_config.configure_sentry()

# Decorador para captura automática de errores en servicios
def capture_lms_exceptions(func):
    """Decorador para capturar excepciones en servicios del LMS"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # Extraer contexto si es posible
            context = {
                "function": func.__name__,
                "module": func.__module__,
                "args_count": len(args),
                "kwargs_keys": list(kwargs.keys())
            }
            
            SentryErrorCapture.capture_lms_error(e, context=context)
            raise  # Re-lanzar la excepción
    
    return wrapper

# Middleware personalizado para Sentry
class SentryContextMiddleware:
    """Middleware para agregar contexto específico del LMS a Sentry"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Agregar contexto HTTP específico del LMS
            with sentry_sdk.configure_scope() as sentry_scope:
                # Headers específicos del LMS
                headers = dict(scope.get("headers", []))
                
                # Agregar información de la plataforma
                sentry_scope.set_tag("platform", "stegmaier-lms")
                sentry_scope.set_tag("api_version", "v1")
                
                # Contexto de la request
                sentry_scope.set_context("lms_request", {
                    "method": scope.get("method"),
                    "path": scope.get("path"),
                    "query_string": scope.get("query_string", b"").decode(),
                })
        
        await self.app(scope, receive, send)
