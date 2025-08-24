"""
Middleware integrado que combina todos los sistemas de monitoreo
"""
import time
import asyncio
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime
import uuid
import json

from .sentry_config import SentryErrorCapture, SentryContextMiddleware
from .prometheus_metrics import lms_metrics
from .structured_logging import get_structured_logger, request_id_var, user_id_var
from .rate_limiting import get_rate_limiter
from .alerting_system import alert_manager

logger = get_structured_logger("middleware.integrated")

class IntegratedMonitoringMiddleware:
    """Middleware integrado que combina todas las funcionalidades de monitoreo"""
    
    def __init__(self, app):
        self.app = app
        self.rate_limiter = get_rate_limiter()
        self.logger = logger
        
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            await self._handle_http_request(scope, receive, send)
        else:
            await self.app(scope, receive, send)
    
    async def _handle_http_request(self, scope, receive, send):
        """Manejar request HTTP con monitoreo completo"""
        
        # 1. Generar request ID y configurar contexto
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)
        
        # 2. Extraer información del request
        method = scope.get("method", "GET")
        path = scope.get("path", "/")
        client_ip = self._get_client_ip(scope)
        user_agent = self._get_user_agent(scope)
        user_id = self._extract_user_id(scope)
        
        if user_id:
            user_id_var.set(user_id)
        
        # 3. Breadcrumb para Sentry
        SentryErrorCapture.add_breadcrumb(
            message=f"HTTP Request: {method} {path}",
            category="http",
            data={
                "method": method,
                "path": path,
                "client_ip": client_ip,
                "request_id": request_id
            }
        )
        
        start_time = time.time()
        
        # 4. Verificar rate limiting
        rate_limit_result = await self.rate_limiter.check_rate_limit(
            identifier=client_ip,
            endpoint=path,
            method=method,
            user_id=user_id
        )
        
        if not rate_limit_result.allowed:
            # Log rate limit exceeded
            self.logger.warning(
                "Rate limit exceeded",
                client_ip=client_ip,
                endpoint=path,
                method=method,
                user_id=user_id,
                category="rate_limit_exceeded"
            )
            
            # Métrica de rate limiting
            lms_metrics.record_error("rate_limit_exceeded", "middleware", "warning")
            
            # Respuesta de rate limiting
            await self._send_rate_limit_response(send, rate_limit_result)
            return
        
        # 5. Log inicio del request
        self.logger.info(
            f"Request started: {method} {path}",
            method=method,
            path=path,
            client_ip=client_ip,
            user_agent=user_agent[:100] if user_agent else None,
            category="request_start"
        )
        
        # 6. Variables para capturar respuesta
        status_code = 500
        response_size = 0
        error_occurred = False
        
        try:
            # 7. Wrapper para capturar información de respuesta
            async def send_wrapper(message):
                nonlocal status_code, response_size
                
                if message["type"] == "http.response.start":
                    status_code = message["status"]
                    
                    # Agregar headers de monitoreo
                    headers = list(message.get("headers", []))
                    headers.extend([
                        [b"x-request-id", request_id.encode()],
                        [b"x-ratelimit-limit", str(rate_limit_result.limit).encode()],
                        [b"x-ratelimit-remaining", str(rate_limit_result.remaining).encode()],
                    ])
                    message["headers"] = headers
                
                elif message["type"] == "http.response.body":
                    body = message.get("body", b"")
                    response_size += len(body)
                
                await send(message)
            
            # 8. Procesar request
            await self.app(scope, receive, send_wrapper)
            
        except Exception as e:
            error_occurred = True
            status_code = 500
            
            # Log error
            self.logger.error(
                f"Request error: {method} {path}",
                method=method,
                path=path,
                error=str(e),
                error_type=type(e).__name__,
                category="request_error",
                exc_info=True
            )
            
            # Capturar en Sentry
            SentryErrorCapture.capture_lms_error(
                e,
                context={
                    "method": method,
                    "path": path,
                    "client_ip": client_ip,
                    "request_id": request_id
                },
                user_id=user_id
            )
            
            # Métricas de error
            lms_metrics.record_error(
                error_type=type(e).__name__,
                module="api",
                severity="error"
            )
            
            # Re-lanzar la excepción
            raise
        
        finally:
            # 9. Calcular métricas finales
            duration = time.time() - start_time
            duration_ms = duration * 1000
            
            # 10. Determinar tipo de usuario para métricas
            user_type = "authenticated" if user_id else "anonymous"
            if "/admin" in path:
                user_type = "admin"
            elif "/instructor" in path:
                user_type = "instructor"
            
            # 11. Registrar métricas HTTP
            lms_metrics.record_http_request(
                method=method,
                endpoint=path,
                status_code=status_code,
                duration=duration,
                user_type=user_type,
                request_size=0,  # Se podría calcular del body
                response_size=response_size
            )
            
            # 12. Log finalización del request
            log_level = "error" if error_occurred else "warning" if status_code >= 400 else "info"
            getattr(self.logger, log_level)(
                f"Request completed: {method} {path} - {status_code}",
                method=method,
                path=path,
                status_code=status_code,
                duration_ms=duration_ms,
                response_size=response_size,
                user_type=user_type,
                category="request_end"
            )
            
            # 13. Verificar condiciones de alerta
            await self._check_alert_conditions(
                method, path, status_code, duration_ms, client_ip
            )
    
    def _get_client_ip(self, scope) -> str:
        """Extraer IP del cliente"""
        headers = dict(scope.get("headers", []))
        
        # X-Forwarded-For
        forwarded_for = headers.get(b"x-forwarded-for")
        if forwarded_for:
            return forwarded_for.decode().split(",")[0].strip()
        
        # X-Real-IP
        real_ip = headers.get(b"x-real-ip")
        if real_ip:
            return real_ip.decode()
        
        # Client directo
        client = scope.get("client")
        if client:
            return client[0]
        
        return "unknown"
    
    def _get_user_agent(self, scope) -> Optional[str]:
        """Extraer User-Agent"""
        headers = dict(scope.get("headers", []))
        user_agent = headers.get(b"user-agent")
        return user_agent.decode() if user_agent else None
    
    def _extract_user_id(self, scope) -> Optional[str]:
        """Extraer user_id de JWT token"""
        try:
            headers = dict(scope.get("headers", []))
            auth_header = headers.get(b"authorization")
            
            if not auth_header:
                return None
            
            token = auth_header.decode().replace("Bearer ", "")
            
            # Decodificación básica del JWT
            # En producción esto usaría el mismo sistema que el middleware de auth
            import base64
            try:
                # Obtener payload del JWT
                parts = token.split(".")
                if len(parts) >= 2:
                    payload = parts[1]
                    # Agregar padding si es necesario
                    padding = 4 - len(payload) % 4
                    if padding != 4:
                        payload += "=" * padding
                    
                    decoded = base64.urlsafe_b64decode(payload)
                    payload_data = json.loads(decoded)
                    return payload_data.get("sub") or payload_data.get("user_id")
            except Exception:
                pass
            
            return None
            
        except Exception:
            return None
    
    async def _send_rate_limit_response(self, send, rate_limit_result):
        """Enviar respuesta de rate limiting"""
        response_body = json.dumps({
            "error": "Rate limit exceeded",
            "message": f"Too many requests. Try again in {rate_limit_result.retry_after_seconds} seconds.",
            "limit": rate_limit_result.limit,
            "remaining": rate_limit_result.remaining,
            "reset_time": rate_limit_result.reset_time.isoformat()
        }).encode()
        
        await send({
            "type": "http.response.start",
            "status": 429,
            "headers": [
                [b"content-type", b"application/json"],
                [b"x-ratelimit-limit", str(rate_limit_result.limit).encode()],
                [b"x-ratelimit-remaining", str(rate_limit_result.remaining).encode()],
                [b"x-ratelimit-reset", str(int(rate_limit_result.reset_time.timestamp())).encode()],
                [b"retry-after", str(rate_limit_result.retry_after_seconds).encode()],
            ]
        })
        
        await send({
            "type": "http.response.body",
            "body": response_body
        })
    
    async def _check_alert_conditions(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        client_ip: str
    ):
        """Verificar condiciones para generar alertas"""
        try:
            # Preparar datos para verificación de alertas
            alert_data = {
                "avg_response_time_ms": duration_ms,
                "error_rate_percent": 100 if status_code >= 500 else 0,
                "status_code": status_code,
                "endpoint": path,
                "method": method,
                "client_ip": client_ip
            }
            
            # Verificar condiciones de alerta (en background para no bloquear)
            asyncio.create_task(alert_manager.check_conditions(alert_data))
            
        except Exception as e:
            self.logger.error(
                "Error checking alert conditions",
                error=str(e),
                category="alert_system_error"
            )

class MetricsUpdateMiddleware:
    """Middleware para actualizar métricas del sistema periódicamente"""
    
    def __init__(self, app):
        self.app = app
        self.last_update = 0
        self.update_interval = 30  # 30 segundos
    
    async def __call__(self, scope, receive, send):
        # Actualizar métricas del sistema periódicamente
        current_time = time.time()
        if current_time - self.last_update > self.update_interval:
            try:
                lms_metrics.update_system_metrics()
                self.last_update = current_time
            except Exception as e:
                logger.error(f"Error updating system metrics: {str(e)}")
        
        await self.app(scope, receive, send)

class DatabaseQueryMiddleware:
    """Middleware para trackear queries de base de datos"""
    
    def __init__(self, app):
        self.app = app
        self.logger = get_structured_logger("middleware.database")
    
    async def __call__(self, scope, receive, send):
        # Este middleware se integraría con el ORM/driver de MongoDB
        # para trackear queries automáticamente
        await self.app(scope, receive, send)

# Factory function para crear stack de middleware completo
def create_monitoring_middleware_stack(app):
    """Crear stack completo de middleware de monitoreo"""
    
    # Aplicar middleware en orden correcto (LIFO)
    # El último aplicado será el primero en ejecutarse
    
    # 1. Metrics update (debe ser externo)
    app = MetricsUpdateMiddleware(app)
    
    # 2. Database query tracking
    app = DatabaseQueryMiddleware(app)
    
    # 3. Sentry context (debe estar cerca del core)
    app = SentryContextMiddleware(app)
    
    # 4. Integrated monitoring (principal)
    app = IntegratedMonitoringMiddleware(app)
    
    return app

# Funciones de inicialización
async def initialize_monitoring_system(
    redis_url: str = None,
    sentry_dsn: str = None,
    enable_structured_logging: bool = True
):
    """Inicializar sistema completo de monitoreo"""
    
    # 1. Configurar Sentry
    if sentry_dsn:
        from .sentry_config import initialize_sentry
        sentry_initialized = initialize_sentry()
        logger.info(f"Sentry initialization: {'success' if sentry_initialized else 'failed'}")
    
    # 2. Configurar logging estructurado
    if enable_structured_logging:
        from .structured_logging import configure_global_logging
        configure_global_logging()
        logger.info("Structured logging configured")
    
    # 3. Inicializar rate limiter
    from .rate_limiting import initialize_rate_limiter
    rate_limiter = await initialize_rate_limiter(redis_url)
    logger.info("Rate limiter initialized")
    
    # 4. Configurar métricas de Prometheus
    lms_metrics.set_build_info(
        version="1.0.0",
        commit="latest",
        build_date=datetime.utcnow().isoformat()
    )
    logger.info("Prometheus metrics configured")
    
    # 5. Inicializar sistema de alerting (en background)
    async def metrics_collector():
        """Función para recopilar métricas para el sistema de alerting"""
        try:
            # Aquí se recopilarían métricas reales del sistema
            # Por ahora retornamos métricas de ejemplo
            return {
                "avg_response_time_ms": 250,
                "error_rate_percent": 0.5,
                "cpu_usage_percent": 45,
                "memory_usage_percent": 62,
                "disk_free_percent": 25,
                "database_status": "healthy"
            }
        except Exception as e:
            logger.error(f"Error collecting metrics for alerting: {str(e)}")
            return {}
    
    from .alerting_system import start_alerting_system
    alerting_task = await start_alerting_system(metrics_collector)
    logger.info("Alerting system started")
    
    return {
        "rate_limiter": rate_limiter,
        "alerting_task": alerting_task,
        "sentry_enabled": sentry_dsn is not None,
        "structured_logging": enable_structured_logging
    }

# Función para obtener métricas de monitoreo en runtime
async def get_monitoring_status() -> Dict[str, Any]:
    """Obtener estado actual del sistema de monitoreo"""
    from .advanced_health_checks import advanced_health_monitor
    
    try:
        # Health check completo
        health_data = await advanced_health_monitor.comprehensive_health_check()
        
        # Estado del rate limiter
        rate_limiter = get_rate_limiter()
        
        # Estadísticas de alertas
        alert_stats = alert_manager.get_alert_stats()
        
        return {
            "health": health_data,
            "rate_limiting": {
                "rules_count": len(rate_limiter.rules),
                "fallback_storage_size": len(rate_limiter.fallback_storage)
            },
            "alerts": alert_stats,
            "monitoring_active": True,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting monitoring status: {str(e)}")
        return {
            "error": str(e),
            "monitoring_active": False,
            "timestamp": datetime.utcnow().isoformat()
        }
