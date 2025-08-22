"""
Middleware de monitoreo y métricas en tiempo real
"""
import time
import logging
import uuid
from typing import Callable, Dict, Any
from datetime import datetime
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import os
import json

logger = logging.getLogger(__name__)

class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware para monitoreo de requests y métricas"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.request_metrics: Dict[str, Any] = {}
        self.slow_query_threshold = float(os.getenv("SLOW_QUERY_THRESHOLD", "2.0"))
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generar ID único para el request
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Timestamp de inicio
        start_time = time.time()
        
        # Métricas del request
        method = request.method
        path = request.url.path
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # Procesar request
        response = await call_next(request)
        
        # Calcular tiempo de procesamiento
        process_time = time.time() - start_time
        process_time_ms = process_time * 1000
        
        # Headers de debugging
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time_ms:.2f}ms"
        
        # Log del request
        self._log_request(
            request_id=request_id,
            method=method,
            path=path,
            status_code=response.status_code,
            process_time_ms=process_time_ms,
            client_ip=client_ip,
            user_agent=user_agent
        )
        
        # Alertas de performance
        if process_time > self.slow_query_threshold:
            await self._handle_slow_request(
                request_id, method, path, process_time_ms, response.status_code
            )
        
        # Alertas de errores
        if response.status_code >= 500:
            await self._handle_server_error(
                request_id, method, path, response.status_code
            )
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Obtener IP real del cliente"""
        # Verificar headers de proxy
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def _log_request(self, **kwargs):
        """Log detallado del request"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": "http_request",
            **kwargs
        }
        
        # Log level basado en status code
        if kwargs["status_code"] >= 500:
            logger.error(f"HTTP {kwargs['status_code']} - {json.dumps(log_data)}")
        elif kwargs["status_code"] >= 400:
            logger.warning(f"HTTP {kwargs['status_code']} - {json.dumps(log_data)}")
        elif kwargs["process_time_ms"] > 1000:
            logger.warning(f"SLOW REQUEST - {json.dumps(log_data)}")
        else:
            logger.info(f"HTTP {kwargs['status_code']} - {kwargs['method']} {kwargs['path']} - {kwargs['process_time_ms']:.2f}ms")
    
    async def _handle_slow_request(self, request_id: str, method: str, path: str, process_time_ms: float, status_code: int):
        """Manejar requests lentos"""
        try:
            from app.monitoring.alerts import alert_manager, AlertLevel
            
            alert = alert_manager.create_alert(
                AlertLevel.WARNING,
                "api_performance",
                f"Slow request detected: {method} {path}",
                {
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "process_time_ms": process_time_ms,
                    "status_code": status_code,
                    "threshold_ms": self.slow_query_threshold * 1000
                }
            )
            
            # Solo enviar alerta si es muy lento (>5 segundos)
            if process_time_ms > 5000:
                from dataclasses import asdict
                await alert_manager.send_alert(asdict(alert))
                
        except Exception as e:
            logger.error(f"Error handling slow request alert: {str(e)}")
    
    async def _handle_server_error(self, request_id: str, method: str, path: str, status_code: int):
        """Manejar errores del servidor"""
        try:
            from app.monitoring.alerts import alert_manager, AlertLevel
            
            alert = alert_manager.create_alert(
                AlertLevel.ERROR,
                "api_errors",
                f"Server error: {status_code} on {method} {path}",
                {
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "status_code": status_code
                }
            )
            
            from dataclasses import asdict
            await alert_manager.send_alert(asdict(alert))
            
        except Exception as e:
            logger.error(f"Error handling server error alert: {str(e)}")

class MetricsCollectorMiddleware(BaseHTTPMiddleware):
    """Middleware para recolectar métricas agregadas"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.metrics = {
            "total_requests": 0,
            "status_codes": {},
            "response_times": [],
            "endpoints": {},
            "errors_per_hour": {},
            "last_reset": datetime.utcnow()
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        
        # Actualizar métricas
        self._update_metrics(request, response, process_time)
        
        # Headers de métricas
        response.headers["X-Total-Requests"] = str(self.metrics["total_requests"])
        
        return response
    
    def _update_metrics(self, request: Request, response: Response, process_time: float):
        """Actualizar métricas agregadas"""
        self.metrics["total_requests"] += 1
        
        # Status codes
        status = response.status_code
        self.metrics["status_codes"][status] = self.metrics["status_codes"].get(status, 0) + 1
        
        # Response times (mantener solo los últimos 1000)
        self.metrics["response_times"].append(process_time)
        if len(self.metrics["response_times"]) > 1000:
            self.metrics["response_times"] = self.metrics["response_times"][-1000:]
        
        # Endpoints
        endpoint = f"{request.method} {request.url.path}"
        if endpoint not in self.metrics["endpoints"]:
            self.metrics["endpoints"][endpoint] = {
                "count": 0,
                "avg_response_time": 0,
                "total_time": 0
            }
        
        endpoint_metrics = self.metrics["endpoints"][endpoint]
        endpoint_metrics["count"] += 1
        endpoint_metrics["total_time"] += process_time
        endpoint_metrics["avg_response_time"] = endpoint_metrics["total_time"] / endpoint_metrics["count"]
        
        # Errores por hora
        if status >= 400:
            hour_key = datetime.utcnow().strftime("%Y-%m-%d-%H")
            self.metrics["errors_per_hour"][hour_key] = self.metrics["errors_per_hour"].get(hour_key, 0) + 1
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Obtener resumen de métricas"""
        response_times = self.metrics["response_times"]
        
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Percentiles
        if response_times:
            sorted_times = sorted(response_times)
            p50 = sorted_times[int(len(sorted_times) * 0.5)]
            p95 = sorted_times[int(len(sorted_times) * 0.95)]
            p99 = sorted_times[int(len(sorted_times) * 0.99)]
        else:
            p50 = p95 = p99 = 0
        
        return {
            "total_requests": self.metrics["total_requests"],
            "uptime_since": self.metrics["last_reset"].isoformat(),
            "response_times": {
                "avg_ms": avg_response_time * 1000,
                "p50_ms": p50 * 1000,
                "p95_ms": p95 * 1000,
                "p99_ms": p99 * 1000
            },
            "status_codes": self.metrics["status_codes"],
            "top_endpoints": dict(
                sorted(
                    self.metrics["endpoints"].items(),
                    key=lambda x: x[1]["count"],
                    reverse=True
                )[:10]
            ),
            "recent_errors": dict(
                list(self.metrics["errors_per_hour"].items())[-24:]  # Últimas 24 horas
            )
        }

class MaintenanceModeMiddleware(BaseHTTPMiddleware):
    """Middleware para modo mantenimiento"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.maintenance_file = os.getenv("MAINTENANCE_FILE", "/tmp/maintenance_mode.json")
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Verificar si está en modo mantenimiento
        if self._is_maintenance_mode():
            # Permitir health checks y endpoints de monitoreo
            if request.url.path in ["/health", "/health/detailed", "/metrics", "/status"]:
                return await call_next(request)
            
            # Retornar página de mantenimiento
            maintenance_info = self._get_maintenance_info()
            return Response(
                content=json.dumps({
                    "message": "System under maintenance",
                    "details": maintenance_info,
                    "estimated_completion": maintenance_info.get("estimated_completion"),
                    "contact": "support@stegmaier-lms.com"
                }),
                status_code=503,
                headers={"Content-Type": "application/json"}
            )
        
        return await call_next(request)
    
    def _is_maintenance_mode(self) -> bool:
        """Verificar si está en modo mantenimiento"""
        try:
            if os.path.exists(self.maintenance_file):
                with open(self.maintenance_file, 'r') as f:
                    maintenance_data = json.load(f)
                    return maintenance_data.get("enabled", False)
        except Exception as e:
            logger.error(f"Error checking maintenance mode: {str(e)}")
        
        return False
    
    def _get_maintenance_info(self) -> Dict[str, Any]:
        """Obtener información del mantenimiento"""
        try:
            if os.path.exists(self.maintenance_file):
                with open(self.maintenance_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error reading maintenance info: {str(e)}")
        
        return {
            "message": "System maintenance in progress",
            "timestamp": datetime.utcnow().isoformat()
        }

# Instancias globales para acceso a métricas
metrics_collector = MetricsCollectorMiddleware
