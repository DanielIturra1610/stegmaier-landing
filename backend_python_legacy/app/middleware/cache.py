"""
Middleware para control de cache HTTP
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable, Dict, Optional
import re

class CacheControlMiddleware(BaseHTTPMiddleware):
    """
    Middleware que añade headers de cache control basados en el tipo de contenido
    y la ruta del request.
    """
    
    def __init__(self, app):
        super().__init__(app)
        
        # Configuración de cache por tipo de contenido
        self.cache_rules = {
            # Archivos estáticos - cache largo
            'media_files': {
                'patterns': [
                    r'^/media/(videos|images)/',
                    r'\.(jpg|jpeg|png|gif|mp4|webm|pdf)$'
                ],
                'max_age': 86400 * 30,  # 30 días
                'headers': {
                    'Cache-Control': 'public, max-age=2592000, immutable',
                    'Expires': None  # Se calculará dinámicamente
                }
            },
            
            # APIs de analytics - cache corto con revalidación
            'analytics_api': {
                'patterns': [
                    r'^/api/v1/analytics/',
                ],
                'max_age': 300,  # 5 minutos
                'headers': {
                    'Cache-Control': 'public, max-age=300, must-revalidate',
                    'Vary': 'Authorization'
                }
            },
            
            # APIs de cursos - cache medio
            'courses_api': {
                'patterns': [
                    r'^/api/v1/courses/[^/]+$',  # Detalles de curso específico
                    r'^/api/v1/lessons/[^/]+$',  # Detalles de lección específica
                ],
                'max_age': 1800,  # 30 minutos
                'headers': {
                    'Cache-Control': 'public, max-age=1800, must-revalidate',
                    'Vary': 'Authorization'
                }
            },
            
            # APIs de usuario - no cache
            'user_api': {
                'patterns': [
                    r'^/api/v1/users/',
                    r'^/api/v1/auth/',
                    r'^/api/v1/progress/',
                    r'^/api/v1/enrollments/'
                ],
                'max_age': 0,
                'headers': {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            },
            
            # APIs administrativas - no cache
            'admin_api': {
                'patterns': [
                    r'^/api/v1/admin/',
                ],
                'max_age': 0,
                'headers': {
                    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
                    'Pragma': 'no-cache'
                }
            },
            
            # Lista de cursos públicos - cache corto
            'public_content': {
                'patterns': [
                    r'^/api/v1/courses/?$',  # Lista de cursos
                    r'^/api/v1/courses/categories',
                ],
                'max_age': 600,  # 10 minutos
                'headers': {
                    'Cache-Control': 'public, max-age=600, stale-while-revalidate=300'
                }
            }
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Procesar el request
        response = await call_next(request)
        
        # Solo aplicar cache control a respuestas exitosas
        if response.status_code >= 400:
            return response
        
        url_path = request.url.path
        method = request.method
        
        # Solo aplicar cache a GET requests
        if method != 'GET':
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response
        
        # Encontrar la regla de cache aplicable
        cache_rule = self._find_cache_rule(url_path)
        
        if cache_rule:
            # Aplicar headers de cache
            for header, value in cache_rule['headers'].items():
                if value is not None:
                    response.headers[header] = value
            
            # Calcular Expires si es necesario
            if 'Expires' in cache_rule['headers'] and cache_rule['headers']['Expires'] is None:
                from datetime import datetime, timedelta
                expires = datetime.utcnow() + timedelta(seconds=cache_rule['max_age'])
                response.headers['Expires'] = expires.strftime('%a, %d %b %Y %H:%M:%S GMT')
            
            # Añadir ETag para contenido que puede cambiar
            if cache_rule['max_age'] > 0 and cache_rule['max_age'] < 86400:  # Menos de 1 día
                etag = self._generate_etag(url_path, response)
                if etag:
                    response.headers['ETag'] = etag
        
        # Header personalizado para debugging
        if request.headers.get('X-Debug-Cache'):
            rule_name = self._get_rule_name(url_path) or 'none'
            response.headers['X-Cache-Rule'] = rule_name
        
        return response
    
    def _find_cache_rule(self, url_path: str) -> Optional[Dict]:
        """
        Encuentra la regla de cache apropiada para una URL.
        """
        for rule_name, rule in self.cache_rules.items():
            for pattern in rule['patterns']:
                if re.search(pattern, url_path):
                    return rule
        
        # Regla por defecto para rutas no especificadas
        return {
            'max_age': 0,
            'headers': {
                'Cache-Control': 'no-cache'
            }
        }
    
    def _get_rule_name(self, url_path: str) -> Optional[str]:
        """
        Obtiene el nombre de la regla aplicada (para debugging).
        """
        for rule_name, rule in self.cache_rules.items():
            for pattern in rule['patterns']:
                if re.search(pattern, url_path):
                    return rule_name
        return None
    
    def _generate_etag(self, url_path: str, response: Response) -> Optional[str]:
        """
        Genera un ETag básico para el contenido.
        En producción, esto podría usar un hash del contenido o timestamp.
        """
        try:
            import hashlib
            
            # Usar el path y el timestamp del servidor como base para el ETag
            from datetime import datetime
            base_string = f"{url_path}-{datetime.utcnow().strftime('%Y-%m-%d-%H')}"
            
            etag = hashlib.md5(base_string.encode()).hexdigest()[:12]
            return f'W/"{etag}"'  # Weak ETag
            
        except Exception:
            return None

class ConditionalRequestMiddleware(BaseHTTPMiddleware):
    """
    Middleware que maneja requests condicionales (If-None-Match, If-Modified-Since)
    para optimizar el ancho de banda.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Verificar headers condicionales
        if_none_match = request.headers.get('If-None-Match')
        if_modified_since = request.headers.get('If-Modified-Since')
        
        # Procesar request normalmente
        response = await call_next(request)
        
        # Solo procesar respuestas exitosas GET
        if request.method != 'GET' or response.status_code != 200:
            return response
        
        # Verificar If-None-Match (ETags)
        if if_none_match and response.headers.get('ETag'):
            etag = response.headers.get('ETag')
            if if_none_match == etag or if_none_match == '*':
                from starlette.responses import Response as StarletteResponse
                return StarletteResponse(
                    status_code=304,
                    headers={
                        'ETag': etag,
                        'Cache-Control': response.headers.get('Cache-Control', ''),
                        'Expires': response.headers.get('Expires', ''),
                    }
                )
        
        # Verificar If-Modified-Since
        if if_modified_since and response.headers.get('Last-Modified'):
            try:
                from datetime import datetime
                
                client_time = datetime.strptime(
                    if_modified_since, 
                    '%a, %d %b %Y %H:%M:%S GMT'
                )
                server_time = datetime.strptime(
                    response.headers.get('Last-Modified'),
                    '%a, %d %b %Y %H:%M:%S GMT'
                )
                
                if client_time >= server_time:
                    from starlette.responses import Response as StarletteResponse
                    return StarletteResponse(
                        status_code=304,
                        headers={
                            'Last-Modified': response.headers.get('Last-Modified'),
                            'Cache-Control': response.headers.get('Cache-Control', ''),
                            'Expires': response.headers.get('Expires', ''),
                        }
                    )
            except (ValueError, TypeError):
                # Si no se puede parsear la fecha, continuar normalmente
                pass
        
        return response
