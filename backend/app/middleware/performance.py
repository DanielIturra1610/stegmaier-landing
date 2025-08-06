"""
Middleware para monitoreo de rendimiento y logging de requests lentos
"""
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable

# Configurar logger específico para performance
performance_logger = logging.getLogger("performance")
performance_logger.setLevel(logging.INFO)

# Handler para archivo de log (opcional)
if not performance_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    performance_logger.addHandler(handler)

class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    Middleware que mide el tiempo de respuesta de cada request y 
    logea información de rendimiento.
    """
    
    def __init__(
        self, 
        app, 
        slow_request_threshold: float = 1.0,  # Segundos
        log_all_requests: bool = False
    ):
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold
        self.log_all_requests = log_all_requests
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Obtener información del request
        method = request.method
        url = str(request.url)
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Headers adicionales para debugging
        request_id = request.headers.get("x-request-id", f"req-{int(time.time() * 1000)}")
        
        try:
            # Procesar request
            response = await call_next(request)
            
            # Calcular tiempo de procesamiento
            process_time = time.time() - start_time
            
            # Añadir headers de respuesta con información de performance
            response.headers["X-Process-Time"] = str(round(process_time, 4))
            response.headers["X-Request-ID"] = request_id
            
            # Información básica del request
            log_data = {
                "request_id": request_id,
                "method": method,
                "url": url,
                "status_code": response.status_code,
                "process_time": round(process_time, 4),
                "client_ip": client_ip,
                "user_agent": user_agent[:100]  # Truncar user agent
            }
            
            # Logear requests lentos siempre
            if process_time > self.slow_request_threshold:
                performance_logger.warning(
                    f"SLOW REQUEST - {method} {url} - "
                    f"Status: {response.status_code} - "
                    f"Time: {process_time:.4f}s - "
                    f"Client: {client_ip} - "
                    f"RequestID: {request_id}"
                )
            
            # Logear todos los requests si está habilitado
            elif self.log_all_requests:
                performance_logger.info(
                    f"REQUEST - {method} {url} - "
                    f"Status: {response.status_code} - "
                    f"Time: {process_time:.4f}s - "
                    f"RequestID: {request_id}"
                )
            
            # Logging adicional para APIs críticas
            if "/api/v1/analytics/" in url or "/api/v1/courses/" in url:
                performance_logger.info(
                    f"CRITICAL_API - {method} {url} - "
                    f"Time: {process_time:.4f}s - "
                    f"Status: {response.status_code}"
                )
            
            return response
            
        except Exception as e:
            # Calcular tiempo hasta el error
            process_time = time.time() - start_time
            
            # Logear errores
            performance_logger.error(
                f"REQUEST_ERROR - {method} {url} - "
                f"Error: {str(e)} - "
                f"Time: {process_time:.4f}s - "
                f"Client: {client_ip} - "
                f"RequestID: {request_id}"
            )
            
            # Re-lanzar la excepción para que la maneje FastAPI
            raise e

class RequestMetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware más avanzado que puede integrarse con sistemas de métricas
    como Prometheus o DataDog en el futuro.
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.request_count = 0
        self.error_count = 0
        self.total_response_time = 0.0
        self.slow_request_count = 0
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # Métricas básicas
            process_time = time.time() - start_time
            self.request_count += 1
            self.total_response_time += process_time
            
            if process_time > 1.0:  # Requests lentos > 1 segundo
                self.slow_request_count += 1
            
            # Headers con métricas agregadas (para debugging)
            if request.url.path.startswith("/api/v1/admin/"):
                response.headers["X-Total-Requests"] = str(self.request_count)
                response.headers["X-Avg-Response-Time"] = str(
                    round(self.total_response_time / self.request_count, 4)
                )
                response.headers["X-Slow-Requests"] = str(self.slow_request_count)
            
            return response
            
        except Exception as e:
            self.error_count += 1
            raise e
    
    def get_metrics(self) -> dict:
        """
        Devuelve métricas actuales del sistema.
        Útil para endpoints de health check o monitoreo.
        """
        avg_response_time = (
            self.total_response_time / self.request_count 
            if self.request_count > 0 else 0
        )
        
        return {
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "average_response_time": round(avg_response_time, 4),
            "slow_request_count": self.slow_request_count,
            "error_rate": round(self.error_count / max(self.request_count, 1), 4)
        }

# Instancia global para acceso a métricas
request_metrics = RequestMetricsMiddleware(None)
