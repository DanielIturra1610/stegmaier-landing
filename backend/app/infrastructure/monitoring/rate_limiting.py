"""
Sistema de rate limiting con Redis para protección de API
"""
import asyncio
import time
import logging
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import json
import hashlib

try:
    from redis.asyncio import Redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    Redis = None

logger = logging.getLogger(__name__)

class RateLimitType(Enum):
    """Tipos de rate limiting"""
    PER_IP = "per_ip"
    PER_USER = "per_user"
    PER_ENDPOINT = "per_endpoint"
    GLOBAL = "global"

@dataclass
class RateLimitRule:
    """Configuración de regla de rate limiting"""
    name: str
    limit: int  # Número de requests permitidos
    window_seconds: int  # Ventana de tiempo en segundos
    limit_type: RateLimitType
    endpoints: List[str] = None  # Endpoints específicos (None = todos)
    methods: List[str] = None  # Métodos HTTP específicos (None = todos)
    burst_allowance: int = 0  # Allowance extra para bursts
    description: str = ""

@dataclass
class RateLimitResult:
    """Resultado de verificación de rate limiting"""
    allowed: bool
    limit: int
    remaining: int
    reset_time: datetime
    retry_after_seconds: int = 0

class RedisRateLimiter:
    """Rate limiter usando Redis con algoritmo de sliding window"""
    
    def __init__(self, redis_client: Optional[Redis] = None):
        self.redis_client = redis_client
        self.rules: List[RateLimitRule] = []
        self.fallback_storage: Dict[str, List[float]] = {}  # Fallback en memoria
        self._setup_default_rules()
    
    def _setup_default_rules(self):
        """Configurar reglas por defecto para el LMS"""
        
        # Rate limiting por IP - Protección general
        self.add_rule(RateLimitRule(
            name="general_per_ip",
            limit=100,
            window_seconds=60,
            limit_type=RateLimitType.PER_IP,
            description="General API rate limit per IP"
        ))
        
        # Rate limiting estricto para autenticación
        self.add_rule(RateLimitRule(
            name="auth_per_ip",
            limit=5,
            window_seconds=300,  # 5 minutos
            limit_type=RateLimitType.PER_IP,
            endpoints=["/api/v1/auth/login", "/api/v1/auth/register"],
            description="Authentication endpoints rate limit"
        ))
        
        # Rate limiting para usuarios autenticados
        self.add_rule(RateLimitRule(
            name="authenticated_user",
            limit=1000,
            window_seconds=3600,  # 1 hora
            limit_type=RateLimitType.PER_USER,
            burst_allowance=50,
            description="Authenticated user rate limit"
        ))
        
        # Rate limiting específico para endpoints críticos
        self.add_rule(RateLimitRule(
            name="course_creation",
            limit=10,
            window_seconds=3600,  # 1 hora
            limit_type=RateLimitType.PER_USER,
            endpoints=["/api/v1/admin/courses"],
            methods=["POST"],
            description="Course creation rate limit"
        ))
        
        # Rate limiting para uploads de media
        self.add_rule(RateLimitRule(
            name="media_upload",
            limit=20,
            window_seconds=600,  # 10 minutos
            limit_type=RateLimitType.PER_USER,
            endpoints=["/api/v1/media/upload"],
            methods=["POST"],
            description="Media upload rate limit"
        ))
        
        # Rate limiting para video streaming
        self.add_rule(RateLimitRule(
            name="video_streaming",
            limit=50,
            window_seconds=60,
            limit_type=RateLimitType.PER_USER,
            endpoints=["/api/v1/media/stream"],
            description="Video streaming rate limit"
        ))
        
        # Rate limiting global para protección del sistema
        self.add_rule(RateLimitRule(
            name="global_protection",
            limit=10000,
            window_seconds=60,
            limit_type=RateLimitType.GLOBAL,
            description="Global system protection"
        ))
    
    def add_rule(self, rule: RateLimitRule):
        """Agregar regla de rate limiting"""
        self.rules.append(rule)
        logger.info(f"Added rate limit rule: {rule.name} - {rule.limit}/{rule.window_seconds}s")
    
    async def check_rate_limit(
        self,
        identifier: str,
        endpoint: str,
        method: str = "GET",
        user_id: str = None
    ) -> RateLimitResult:
        """Verificar rate limiting para un request"""
        
        # Encontrar reglas aplicables
        applicable_rules = self._find_applicable_rules(endpoint, method)
        
        # Verificar cada regla aplicable
        for rule in applicable_rules:
            key = self._generate_key(rule, identifier, user_id, endpoint)
            result = await self._check_rule(rule, key)
            
            if not result.allowed:
                logger.warning(
                    f"Rate limit exceeded: {rule.name}",
                    extra={
                        "rule": rule.name,
                        "identifier": identifier,
                        "endpoint": endpoint,
                        "limit": rule.limit,
                        "window": rule.window_seconds
                    }
                )
                return result
        
        # Si todas las reglas pasan, permitir el request
        return RateLimitResult(
            allowed=True,
            limit=max(rule.limit for rule in applicable_rules) if applicable_rules else 0,
            remaining=0,
            reset_time=datetime.utcnow() + timedelta(seconds=60)
        )
    
    def _find_applicable_rules(self, endpoint: str, method: str) -> List[RateLimitRule]:
        """Encontrar reglas aplicables al endpoint y método"""
        applicable_rules = []
        
        for rule in self.rules:
            # Verificar si el endpoint está en la lista (None = todos)
            if rule.endpoints is not None:
                if not any(ep in endpoint for ep in rule.endpoints):
                    continue
            
            # Verificar si el método está en la lista (None = todos)
            if rule.methods is not None:
                if method not in rule.methods:
                    continue
            
            applicable_rules.append(rule)
        
        return applicable_rules
    
    def _generate_key(
        self,
        rule: RateLimitRule,
        identifier: str,
        user_id: str = None,
        endpoint: str = ""
    ) -> str:
        """Generar clave para almacenamiento en Redis"""
        parts = ["rate_limit", rule.name]
        
        if rule.limit_type == RateLimitType.PER_IP:
            parts.append(f"ip:{identifier}")
        elif rule.limit_type == RateLimitType.PER_USER and user_id:
            parts.append(f"user:{user_id}")
        elif rule.limit_type == RateLimitType.PER_ENDPOINT:
            endpoint_hash = hashlib.md5(endpoint.encode()).hexdigest()[:8]
            parts.append(f"endpoint:{endpoint_hash}")
        elif rule.limit_type == RateLimitType.GLOBAL:
            parts.append("global")
        else:
            parts.append(f"default:{identifier}")
        
        return ":".join(parts)
    
    async def _check_rule(self, rule: RateLimitRule, key: str) -> RateLimitResult:
        """Verificar una regla específica"""
        current_time = time.time()
        window_start = current_time - rule.window_seconds
        
        if self.redis_client and REDIS_AVAILABLE:
            return await self._check_rule_redis(rule, key, current_time, window_start)
        else:
            return self._check_rule_memory(rule, key, current_time, window_start)
    
    async def _check_rule_redis(
        self,
        rule: RateLimitRule,
        key: str,
        current_time: float,
        window_start: float
    ) -> RateLimitResult:
        """Verificar regla usando Redis (sliding window)"""
        try:
            # Pipeline para operaciones atómicas
            pipe = self.redis_client.pipeline()
            
            # Remover requests antiguos fuera de la ventana
            pipe.zremrangebyscore(key, 0, window_start)
            
            # Contar requests actuales en la ventana
            pipe.zcard(key)
            
            # Agregar request actual
            pipe.zadd(key, {str(current_time): current_time})
            
            # Establecer TTL para limpieza automática
            pipe.expire(key, rule.window_seconds + 60)
            
            # Ejecutar pipeline
            results = await pipe.execute()
            
            current_count = results[1]  # Resultado de zcard
            
            # Verificar límite
            effective_limit = rule.limit + rule.burst_allowance
            allowed = current_count <= effective_limit
            
            remaining = max(0, effective_limit - current_count)
            reset_time = datetime.utcnow() + timedelta(seconds=rule.window_seconds)
            retry_after = 0 if allowed else rule.window_seconds
            
            return RateLimitResult(
                allowed=allowed,
                limit=rule.limit,
                remaining=remaining,
                reset_time=reset_time,
                retry_after_seconds=retry_after
            )
            
        except Exception as e:
            logger.error(f"Redis rate limiting error: {str(e)}")
            # Fallback a memoria en caso de error de Redis
            return self._check_rule_memory(rule, key, current_time, window_start)
    
    def _check_rule_memory(
        self,
        rule: RateLimitRule,
        key: str,
        current_time: float,
        window_start: float
    ) -> RateLimitResult:
        """Verificar regla usando almacenamiento en memoria (fallback)"""
        
        # Inicializar si no existe
        if key not in self.fallback_storage:
            self.fallback_storage[key] = []
        
        # Limpiar requests antiguos
        self.fallback_storage[key] = [
            timestamp for timestamp in self.fallback_storage[key]
            if timestamp > window_start
        ]
        
        # Agregar request actual
        self.fallback_storage[key].append(current_time)
        
        # Verificar límite
        current_count = len(self.fallback_storage[key])
        effective_limit = rule.limit + rule.burst_allowance
        allowed = current_count <= effective_limit
        
        remaining = max(0, effective_limit - current_count)
        reset_time = datetime.utcnow() + timedelta(seconds=rule.window_seconds)
        retry_after = 0 if allowed else rule.window_seconds
        
        return RateLimitResult(
            allowed=allowed,
            limit=rule.limit,
            remaining=remaining,
            reset_time=reset_time,
            retry_after_seconds=retry_after
        )
    
    async def get_rate_limit_status(self, identifier: str, user_id: str = None) -> Dict[str, Any]:
        """Obtener estado actual de rate limiting para un identificador"""
        status = {}
        
        for rule in self.rules:
            key = self._generate_key(rule, identifier, user_id)
            current_time = time.time()
            window_start = current_time - rule.window_seconds
            
            if self.redis_client and REDIS_AVAILABLE:
                try:
                    # Limpiar requests antiguos
                    await self.redis_client.zremrangebyscore(key, 0, window_start)
                    # Contar requests actuales
                    current_count = await self.redis_client.zcard(key)
                except Exception:
                    current_count = len(self.fallback_storage.get(key, []))
            else:
                # Limpiar y contar en memoria
                if key in self.fallback_storage:
                    self.fallback_storage[key] = [
                        timestamp for timestamp in self.fallback_storage[key]
                        if timestamp > window_start
                    ]
                    current_count = len(self.fallback_storage[key])
                else:
                    current_count = 0
            
            status[rule.name] = {
                "limit": rule.limit,
                "used": current_count,
                "remaining": max(0, rule.limit - current_count),
                "reset_time": (datetime.utcnow() + timedelta(seconds=rule.window_seconds)).isoformat(),
                "window_seconds": rule.window_seconds
            }
        
        return status
    
    async def reset_rate_limit(self, identifier: str, rule_name: str = None, user_id: str = None):
        """Resetear rate limit para un identificador (solo para testing/admin)"""
        if rule_name:
            rules_to_reset = [rule for rule in self.rules if rule.name == rule_name]
        else:
            rules_to_reset = self.rules
        
        for rule in rules_to_reset:
            key = self._generate_key(rule, identifier, user_id)
            
            if self.redis_client and REDIS_AVAILABLE:
                try:
                    await self.redis_client.delete(key)
                except Exception as e:
                    logger.error(f"Error resetting Redis rate limit: {str(e)}")
            
            # También limpiar memoria
            if key in self.fallback_storage:
                del self.fallback_storage[key]
            
            logger.info(f"Rate limit reset: {rule.name} for {identifier}")

class RateLimitMiddleware:
    """Middleware de FastAPI para rate limiting automático"""
    
    def __init__(self, app, rate_limiter: RedisRateLimiter):
        self.app = app
        self.rate_limiter = rate_limiter
        self.logger = logging.getLogger("middleware.rate_limit")
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Extraer información del request
            client_ip = self._get_client_ip(scope)
            method = scope.get("method", "GET")
            path = scope.get("path", "/")
            
            # Extraer user_id de headers si está disponible
            headers = dict(scope.get("headers", []))
            user_id = self._extract_user_id(headers)
            
            # Verificar rate limiting
            result = await self.rate_limiter.check_rate_limit(
                identifier=client_ip,
                endpoint=path,
                method=method,
                user_id=user_id
            )
            
            if not result.allowed:
                # Request bloqueado por rate limiting
                response_body = json.dumps({
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Try again in {result.retry_after_seconds} seconds.",
                    "limit": result.limit,
                    "reset_time": result.reset_time.isoformat()
                }).encode()
                
                response = {
                    "type": "http.response.start",
                    "status": 429,
                    "headers": [
                        [b"content-type", b"application/json"],
                        [b"x-ratelimit-limit", str(result.limit).encode()],
                        [b"x-ratelimit-remaining", str(result.remaining).encode()],
                        [b"x-ratelimit-reset", str(int(result.reset_time.timestamp())).encode()],
                        [b"retry-after", str(result.retry_after_seconds).encode()],
                    ]
                }
                
                await send(response)
                await send({
                    "type": "http.response.body",
                    "body": response_body
                })
                return
            
            # Agregar headers de rate limit a la respuesta
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    headers = list(message.get("headers", []))
                    headers.extend([
                        [b"x-ratelimit-limit", str(result.limit).encode()],
                        [b"x-ratelimit-remaining", str(result.remaining).encode()],
                        [b"x-ratelimit-reset", str(int(result.reset_time.timestamp())).encode()],
                    ])
                    message["headers"] = headers
                
                await send(message)
            
            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)
    
    def _get_client_ip(self, scope) -> str:
        """Extraer IP del cliente del scope"""
        # Verificar headers de proxy
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
    
    def _extract_user_id(self, headers: Dict[bytes, bytes]) -> Optional[str]:
        """Extraer user_id de headers JWT si está disponible"""
        try:
            # Buscar header de autorización
            auth_header = headers.get(b"authorization")
            if not auth_header:
                return None
            
            # Decodificar JWT (implementación básica)
            # En producción esto usaría la misma lógica que el middleware de auth
            token = auth_header.decode().replace("Bearer ", "")
            
            # Por ahora retornamos un hash del token como user_id
            # En implementación real se decodificaría el JWT
            import hashlib
            return hashlib.md5(token.encode()).hexdigest()[:8]
            
        except Exception:
            return None

# Instancia global y funciones de utilidad
rate_limiter: Optional[RedisRateLimiter] = None

async def initialize_rate_limiter(redis_url: str = None) -> RedisRateLimiter:
    """Inicializar rate limiter con Redis"""
    global rate_limiter
    
    redis_client = None
    if redis_url and REDIS_AVAILABLE:
        try:
            redis_client = Redis.from_url(redis_url)
            # Test de conectividad
            await redis_client.ping()
            logger.info("Redis rate limiter initialized successfully")
        except Exception as e:
            logger.warning(f"Redis not available for rate limiting: {str(e)}")
            redis_client = None
    
    rate_limiter = RedisRateLimiter(redis_client)
    return rate_limiter

def get_rate_limiter() -> RedisRateLimiter:
    """Obtener instancia global del rate limiter"""
    global rate_limiter
    if rate_limiter is None:
        rate_limiter = RedisRateLimiter()
    return rate_limiter

# Decorador para endpoints específicos
def rate_limit(limit: int, window_seconds: int, per: str = "ip"):
    """Decorador para aplicar rate limiting a endpoints específicos"""
    def decorator(func):
        # Agregar metadata al endpoint para rate limiting personalizado
        func._rate_limit_config = {
            "limit": limit,
            "window_seconds": window_seconds,
            "per": per
        }
        return func
    return decorator
