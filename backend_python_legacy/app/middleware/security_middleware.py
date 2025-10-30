"""
Security Middleware para headers de seguridad y rate limiting
"""
import time
import redis
import hashlib
from datetime import datetime, timedelta
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from ..core.config import get_settings

settings = get_settings()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware para añadir headers de seguridad críticos
    """
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        if settings.SECURITY_HEADERS_ENABLED:
            # Strict Transport Security (HSTS)
            if settings.ENVIRONMENT == "production":
                response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
            
            # Content Security Policy (CSP)
            csp_directives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https:",
                "media-src 'self' blob:",
                "connect-src 'self' ws: wss:",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
                "upgrade-insecure-requests"
            ]
            response.headers["Content-Security-Policy"] = "; ".join(csp_directives)
            
            # X-Frame-Options
            response.headers["X-Frame-Options"] = "DENY"
            
            # X-Content-Type-Options
            response.headers["X-Content-Type-Options"] = "nosniff"
            
            # X-XSS-Protection
            response.headers["X-XSS-Protection"] = "1; mode=block"
            
            # Referrer Policy
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            
            # Permissions Policy
            permissions_directives = [
                "geolocation=()",
                "camera=()",
                "microphone=()",
                "payment=()",
                "usb=()",
                "magnetometer=()",
                "gyroscope=()",
                "accelerometer=()"
            ]
            response.headers["Permissions-Policy"] = ", ".join(permissions_directives)
            
            # Remove server header for security
            response.headers.pop("server", None)
            
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware de rate limiting robusto con Redis
    """
    
    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self.redis_client = redis_client or self._create_redis_client()
        self.enabled = settings.RATE_LIMIT_ENABLED
        self.requests_per_window = settings.RATE_LIMIT_REQUESTS
        self.window_seconds = settings.RATE_LIMIT_WINDOW
    
    def _create_redis_client(self):
        """Crear cliente Redis con manejo de errores"""
        try:
            client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            # Test connection
            client.ping()
            return client
        except Exception as e:
            print(f"Warning: Redis connection failed: {e}. Rate limiting disabled.")
            return None
    
    def _get_client_identifier(self, request: Request) -> str:
        """
        Obtener identificador único del cliente
        Usa IP + User-Agent para mejor identificación
        """
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        # Para usuarios autenticados, usar su ID si está disponible
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            # Extraer un hash del token para identificación única
            token_hash = hashlib.md5(auth_header.encode()).hexdigest()[:16]
            return f"auth:{token_hash}"
        
        # Para usuarios no autenticados, usar IP + UA
        identifier = f"ip:{client_ip}:ua:{hashlib.md5(user_agent.encode()).hexdigest()[:8]}"
        return identifier
    
    def _is_exempt_path(self, path: str) -> bool:
        """
        Verificar si la ruta está exenta de rate limiting
        """
        exempt_paths = [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico"
        ]
        return any(path.startswith(exempt_path) for exempt_path in exempt_paths)
    
    async def dispatch(self, request: Request, call_next):
        # Si rate limiting está deshabilitado o Redis no disponible
        if not self.enabled or not self.redis_client:
            return await call_next(request)
        
        # Verificar si la ruta está exenta
        if self._is_exempt_path(request.url.path):
            return await call_next(request)
        
        client_id = self._get_client_identifier(request)
        current_time = int(time.time())
        window_start = current_time - (current_time % self.window_seconds)
        
        # Clave Redis para la ventana actual
        key = f"rate_limit:{client_id}:{window_start}"
        
        try:
            # Usar pipeline para operaciones atómicas
            pipe = self.redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, self.window_seconds * 2)  # TTL extendido para seguridad
            results = pipe.execute()
            
            current_requests = results[0]
            
            # Verificar si se excedió el límite
            if current_requests > self.requests_per_window:
                # Añadir headers informativos
                retry_after = self.window_seconds - (current_time % self.window_seconds)
                
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Rate limit exceeded",
                        "message": f"Too many requests. Limit: {self.requests_per_window} per {self.window_seconds} seconds",
                        "retry_after": retry_after
                    },
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(self.requests_per_window),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(window_start + self.window_seconds)
                    }
                )
            
            # Procesar request normalmente
            response = await call_next(request)
            
            # Añadir headers informativos de rate limit
            remaining = max(0, self.requests_per_window - current_requests)
            response.headers["X-RateLimit-Limit"] = str(self.requests_per_window)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(window_start + self.window_seconds)
            
            return response
            
        except Exception as e:
            print(f"Rate limiting error: {e}. Allowing request.")
            # En caso de error, permitir el request
            return await call_next(request)


class RequestSizeMiddleware(BaseHTTPMiddleware):
    """
    Middleware para limitar el tamaño de requests
    """
    
    def __init__(self, app, max_size: int = None):
        super().__init__(app)
        self.max_size = max_size or settings.MAX_TOTAL_UPLOAD_SIZE
    
    async def dispatch(self, request: Request, call_next):
        # Verificar Content-Length header
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                if size > self.max_size:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": "Payload too large",
                            "message": f"Request size {size} bytes exceeds maximum {self.max_size} bytes",
                            "max_size": self.max_size
                        }
                    )
            except ValueError:
                pass  # Invalid content-length, let it pass through
        
        return await call_next(request)
