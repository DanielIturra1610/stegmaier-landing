"""
Sistema de logging estructurado para observabilidad avanzada
"""
import logging
import json
import sys
import os
from typing import Dict, Any, Optional
from datetime import datetime
from contextvars import ContextVar
try:
    from pythonjsonlogger import jsonlogger
except ImportError:
    # Create a simple fallback for JSON logging
    class JsonLoggerFallback:
        def __init__(self, *args, **kwargs):
            pass
        
        class JsonFormatter(logging.Formatter):
            def format(self, record):
                log_data = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'level': record.levelname,
                    'message': record.getMessage(),
                    'module': record.module,
                    'function': record.funcName,
                    'line': record.lineno
                }
                return json.dumps(log_data)
    
    jsonlogger = JsonLoggerFallback()
import traceback

# Context variables para tracking de requests
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar('user_id', default=None)
correlation_id_var: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)

class LMSStructuredLogger:
    """Logger estructurado específico para Stegmaier LMS"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self._configure_logger()
    
    def _configure_logger(self):
        """Configurar el logger con formato estructurado"""
        if not self.logger.handlers:
            # Handler para consola/stdout
            console_handler = logging.StreamHandler(sys.stdout)
            console_formatter = CustomJSONFormatter()
            console_handler.setFormatter(console_formatter)
            console_handler.setLevel(logging.INFO)
            
            # Handler para archivo de logs (si está configurado)
            log_file = os.getenv("LOG_FILE_PATH")
            if log_file:
                file_handler = logging.FileHandler(log_file)
                file_formatter = CustomJSONFormatter()
                file_handler.setFormatter(file_formatter)
                file_handler.setLevel(logging.DEBUG)
                self.logger.addHandler(file_handler)
            
            self.logger.addHandler(console_handler)
            self.logger.setLevel(logging.INFO)
            self.logger.propagate = False
    
    def _enrich_log_data(self, extra_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Enriquecer datos del log con contexto del LMS"""
        log_data = {
            "service": "stegmaier-lms",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request_id_var.get(),
            "user_id": user_id_var.get(),
            "correlation_id": correlation_id_var.get(),
        }
        
        if extra_data:
            log_data.update(extra_data)
        
        # Filtrar valores None
        return {k: v for k, v in log_data.items() if v is not None}
    
    def info(self, message: str, **kwargs):
        """Log de información"""
        extra_data = self._enrich_log_data(kwargs)
        self.logger.info(message, extra=extra_data)
    
    def warning(self, message: str, **kwargs):
        """Log de advertencia"""
        extra_data = self._enrich_log_data(kwargs)
        self.logger.warning(message, extra=extra_data)
    
    def error(self, message: str, exc_info: bool = False, **kwargs):
        """Log de error"""
        extra_data = self._enrich_log_data(kwargs)
        if exc_info:
            extra_data["exception"] = traceback.format_exc()
        self.logger.error(message, extra=extra_data, exc_info=exc_info)
    
    def critical(self, message: str, exc_info: bool = False, **kwargs):
        """Log crítico"""
        extra_data = self._enrich_log_data(kwargs)
        if exc_info:
            extra_data["exception"] = traceback.format_exc()
        self.logger.critical(message, extra=extra_data, exc_info=exc_info)
    
    def debug(self, message: str, **kwargs):
        """Log de debug"""
        extra_data = self._enrich_log_data(kwargs)
        self.logger.debug(message, extra=extra_data)
    
    # Métodos específicos del LMS
    def log_user_action(self, user_id: str, action: str, resource_type: str, resource_id: str = None, **kwargs):
        """Log de acción de usuario"""
        self.info(
            f"User action: {action}",
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            category="user_action",
            **kwargs
        )
    
    def log_api_request(self, method: str, path: str, status_code: int, response_time_ms: float, **kwargs):
        """Log de request API"""
        level = "warning" if status_code >= 400 else "info"
        getattr(self, level)(
            f"API {method} {path} - {status_code}",
            method=method,
            path=path,
            status_code=status_code,
            response_time_ms=response_time_ms,
            category="api_request",
            **kwargs
        )
    
    def log_database_operation(self, operation: str, collection: str, duration_ms: float, success: bool = True, **kwargs):
        """Log de operación de base de datos"""
        level = "warning" if not success else "info"
        getattr(self, level)(
            f"DB {operation} on {collection}",
            operation=operation,
            collection=collection,
            duration_ms=duration_ms,
            success=success,
            category="database",
            **kwargs
        )
    
    def log_business_event(self, event_type: str, entity_type: str, entity_id: str, **kwargs):
        """Log de evento de negocio del LMS"""
        self.info(
            f"Business event: {event_type}",
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            category="business_event",
            **kwargs
        )
    
    def log_security_event(self, event_type: str, severity: str = "medium", **kwargs):
        """Log de evento de seguridad"""
        level = "critical" if severity == "high" else "warning" if severity == "medium" else "info"
        getattr(self, level)(
            f"Security event: {event_type}",
            event_type=event_type,
            severity=severity,
            category="security",
            **kwargs
        )
    
    def log_performance_metric(self, metric_name: str, value: float, unit: str = "ms", **kwargs):
        """Log de métrica de performance"""
        self.info(
            f"Performance metric: {metric_name} = {value}{unit}",
            metric_name=metric_name,
            metric_value=value,
            metric_unit=unit,
            category="performance",
            **kwargs
        )

class CustomJSONFormatter(jsonlogger.JsonFormatter):
    """Formatter JSON personalizado para el LMS"""
    
    def add_fields(self, log_record, record, message_dict):
        super(CustomJSONFormatter, self).add_fields(log_record, record, message_dict)
        
        # Agregar timestamp si no existe
        if not log_record.get('timestamp'):
            log_record['timestamp'] = datetime.utcnow().isoformat()
        
        # Agregar nivel de log
        log_record['level'] = record.levelname
        
        # Agregar información del módulo
        log_record['module'] = record.name
        log_record['filename'] = record.filename
        log_record['line_number'] = record.lineno
        
        # Agregar contexto de thread/proceso si es relevante
        if record.process:
            log_record['process_id'] = record.process
        if record.thread:
            log_record['thread_id'] = record.thread

class LoggingMiddleware:
    """Middleware para capturar y contextualizar logs de requests"""
    
    def __init__(self, app):
        self.app = app
        self.logger = get_structured_logger("middleware.logging")
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Generar request ID
            import uuid
            request_id = str(uuid.uuid4())
            request_id_var.set(request_id)
            
            # Extraer información del request
            method = scope.get("method")
            path = scope.get("path")
            
            # Log inicio del request
            self.logger.info(
                f"Request started: {method} {path}",
                request_method=method,
                request_path=path,
                category="request_start"
            )
            
            # Wrapper para capturar la respuesta
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    status_code = message["status"]
                    
                    # Log finalización del request
                    self.logger.log_api_request(
                        method=method,
                        path=path,
                        status_code=status_code,
                        response_time_ms=0,  # Se calcularía con timing real
                        category="request_end"
                    )
                
                await send(message)
            
            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)

class LMSLoggerAdapter:
    """Adapter para integrar el logger estructurado con servicios existentes"""
    
    def __init__(self, service_name: str):
        self.logger = get_structured_logger(f"service.{service_name}")
        self.service_name = service_name
    
    def log_service_operation(self, operation: str, success: bool = True, duration_ms: float = None, **kwargs):
        """Log de operación de servicio"""
        level = "info" if success else "error"
        message = f"Service operation: {operation}"
        
        extra_data = {
            "service_name": self.service_name,
            "operation": operation,
            "success": success,
            "category": "service_operation"
        }
        
        if duration_ms is not None:
            extra_data["duration_ms"] = duration_ms
        
        extra_data.update(kwargs)
        
        getattr(self.logger, level)(message, **extra_data)
    
    def log_validation_error(self, field: str, value: Any, error_message: str, **kwargs):
        """Log de error de validación"""
        self.logger.warning(
            f"Validation error: {field}",
            field=field,
            invalid_value=str(value),
            error_message=error_message,
            category="validation_error",
            **kwargs
        )
    
    def log_business_rule_violation(self, rule: str, entity_type: str, entity_id: str, **kwargs):
        """Log de violación de regla de negocio"""
        self.logger.warning(
            f"Business rule violation: {rule}",
            rule=rule,
            entity_type=entity_type,
            entity_id=entity_id,
            category="business_rule_violation",
            **kwargs
        )

# Factory functions
def get_structured_logger(name: str) -> LMSStructuredLogger:
    """Obtener logger estructurado"""
    return LMSStructuredLogger(name)

def get_service_logger(service_name: str) -> LMSLoggerAdapter:
    """Obtener logger adapter para servicios"""
    return LMSLoggerAdapter(service_name)

# Configuración global de logging
def configure_global_logging():
    """Configurar logging global para la aplicación"""
    
    # Configurar nivel de logging basado en environment
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # Configurar formato para loggers estándar de terceros
    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Configurar loggers específicos
    loggers_config = {
        "uvicorn.access": logging.WARNING,
        "uvicorn.error": logging.INFO,
        "motor": logging.WARNING,
        "httpx": logging.WARNING,
        "fastapi": logging.INFO
    }
    
    for logger_name, level in loggers_config.items():
        logging.getLogger(logger_name).setLevel(level)

# Context managers para logging contextual
class LogContext:
    """Context manager para enriquecer logs con contexto específico"""
    
    def __init__(self, **context):
        self.context = context
        self.tokens = {}
    
    def __enter__(self):
        # Guardar valores actuales y establecer nuevos
        for key, value in self.context.items():
            if key == 'request_id':
                self.tokens['request_id'] = request_id_var.set(value)
            elif key == 'user_id':
                self.tokens['user_id'] = user_id_var.set(value)
            elif key == 'correlation_id':
                self.tokens['correlation_id'] = correlation_id_var.set(value)
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Restaurar valores anteriores
        for key, token in self.tokens.items():
            if key == 'request_id':
                request_id_var.reset(token)
            elif key == 'user_id':
                user_id_var.reset(token)
            elif key == 'correlation_id':
                correlation_id_var.reset(token)

# Decorador para logging automático de funciones
def log_function_call(logger_name: str = None):
    """Decorador para logging automático de llamadas a funciones"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger = get_structured_logger(logger_name or func.__module__)
            
            # Log inicio de función
            logger.debug(
                f"Function call: {func.__name__}",
                function=func.__name__,
                module=func.__module__,
                args_count=len(args),
                kwargs_keys=list(kwargs.keys()),
                category="function_call"
            )
            
            try:
                import time
                start_time = time.time()
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                # Log éxito
                logger.debug(
                    f"Function completed: {func.__name__}",
                    function=func.__name__,
                    duration_ms=duration_ms,
                    success=True,
                    category="function_completion"
                )
                
                return result
                
            except Exception as e:
                # Log error
                logger.error(
                    f"Function failed: {func.__name__}",
                    function=func.__name__,
                    error=str(e),
                    error_type=type(e).__name__,
                    success=False,
                    category="function_error",
                    exc_info=True
                )
                raise
        
        return wrapper
    return decorator

# Instancias globales para uso común
main_logger = get_structured_logger("stegmaier_lms")
api_logger = get_structured_logger("api")
db_logger = get_structured_logger("database")
auth_logger = get_structured_logger("auth")
business_logger = get_structured_logger("business")
