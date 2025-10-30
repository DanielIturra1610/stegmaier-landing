"""
Métricas de Prometheus para observabilidad avanzada del LMS
"""
import time
import asyncio
from typing import Dict, Any, Optional
from prometheus_client import (
    Counter, Histogram, Gauge, Info, Enum,
    generate_latest, CONTENT_TYPE_LATEST, REGISTRY
)
from datetime import datetime, timedelta
import psutil
import logging

logger = logging.getLogger(__name__)

class LMSMetrics:
    """Métricas específicas para la plataforma educativa Stegmaier LMS"""
    
    def __init__(self):
        # Métricas HTTP
        self.http_requests_total = Counter(
            'lms_http_requests_total',
            'Total HTTP requests',
            ['method', 'endpoint', 'status_code', 'user_type']
        )
        
        self.http_request_duration_seconds = Histogram(
            'lms_http_request_duration_seconds',
            'HTTP request duration in seconds',
            ['method', 'endpoint'],
            buckets=[0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0]
        )
        
        self.http_request_size_bytes = Histogram(
            'lms_http_request_size_bytes',
            'HTTP request size in bytes',
            ['method', 'endpoint']
        )
        
        self.http_response_size_bytes = Histogram(
            'lms_http_response_size_bytes',
            'HTTP response size in bytes',
            ['method', 'endpoint']
        )
        
        # Métricas de usuarios
        self.users_total = Gauge(
            'lms_users_total',
            'Total number of users',
            ['role']
        )
        
        self.users_active_24h = Gauge(
            'lms_users_active_24h',
            'Number of active users in last 24 hours'
        )
        
        self.user_sessions_active = Gauge(
            'lms_user_sessions_active',
            'Number of active user sessions'
        )
        
        self.user_login_total = Counter(
            'lms_user_login_total',
            'Total user logins',
            ['role', 'success']
        )
        
        # Métricas de cursos
        self.courses_total = Gauge(
            'lms_courses_total',
            'Total number of courses',
            ['status', 'category']
        )
        
        self.course_enrollments_total = Counter(
            'lms_course_enrollments_total',
            'Total course enrollments',
            ['course_id', 'course_category']
        )
        
        self.course_completions_total = Counter(
            'lms_course_completions_total',
            'Total course completions',
            ['course_id', 'course_category']
        )
        
        self.course_engagement_score = Gauge(
            'lms_course_engagement_score',
            'Course engagement score (0-100)',
            ['course_id']
        )
        
        # Métricas de lecciones
        self.lessons_total = Gauge(
            'lms_lessons_total',
            'Total number of lessons',
            ['course_id', 'lesson_type']
        )
        
        self.lesson_views_total = Counter(
            'lms_lesson_views_total',
            'Total lesson views',
            ['lesson_id', 'lesson_type']
        )
        
        self.lesson_completions_total = Counter(
            'lms_lesson_completions_total',
            'Total lesson completions',
            ['lesson_id', 'lesson_type']
        )
        
        self.video_watch_time_seconds = Counter(
            'lms_video_watch_time_seconds_total',
            'Total video watch time in seconds',
            ['lesson_id', 'user_type']
        )
        
        # Métricas de sistema
        self.database_connections_active = Gauge(
            'lms_database_connections_active',
            'Number of active database connections'
        )
        
        self.database_query_duration_seconds = Histogram(
            'lms_database_query_duration_seconds',
            'Database query duration in seconds',
            ['operation', 'collection']
        )
        
        self.cache_operations_total = Counter(
            'lms_cache_operations_total',
            'Total cache operations',
            ['operation', 'result']
        )
        
        self.media_storage_usage_bytes = Gauge(
            'lms_media_storage_usage_bytes',
            'Media storage usage in bytes',
            ['media_type']
        )
        
        # Métricas de errores
        self.errors_total = Counter(
            'lms_errors_total',
            'Total application errors',
            ['error_type', 'module', 'severity']
        )
        
        self.slow_requests_total = Counter(
            'lms_slow_requests_total',
            'Total slow requests (>2s)',
            ['endpoint']
        )
        
        # Métricas de negocio específicas del LMS
        self.learning_streaks_active = Gauge(
            'lms_learning_streaks_active',
            'Number of users with active learning streaks'
        )
        
        self.certificates_issued_total = Counter(
            'lms_certificates_issued_total',
            'Total certificates issued',
            ['course_category']
        )
        
        self.quiz_attempts_total = Counter(
            'lms_quiz_attempts_total',
            'Total quiz attempts',
            ['lesson_id', 'result']
        )
        
        # Métricas de rendimiento de sistema
        self.system_cpu_usage_percent = Gauge(
            'lms_system_cpu_usage_percent',
            'System CPU usage percentage'
        )
        
        self.system_memory_usage_bytes = Gauge(
            'lms_system_memory_usage_bytes',
            'System memory usage in bytes',
            ['type']
        )
        
        self.system_disk_usage_bytes = Gauge(
            'lms_system_disk_usage_bytes',
            'System disk usage in bytes',
            ['mount_point', 'type']
        )
        
        # Info metrics
        self.lms_info = Info(
            'lms_build_info',
            'LMS build information'
        )
        
        # Estado del servicio
        self.service_health_status = Enum(
            'lms_service_health_status',
            'Health status of LMS services',
            ['service'],
            states=['healthy', 'degraded', 'unhealthy']
        )
        
    def record_http_request(self, method: str, endpoint: str, status_code: int, 
                           duration: float, user_type: str = "unknown",
                           request_size: int = 0, response_size: int = 0):
        """Registrar métricas de request HTTP"""
        # Normalizar endpoint para evitar high cardinality
        normalized_endpoint = self._normalize_endpoint(endpoint)
        
        self.http_requests_total.labels(
            method=method,
            endpoint=normalized_endpoint,
            status_code=status_code,
            user_type=user_type
        ).inc()
        
        self.http_request_duration_seconds.labels(
            method=method,
            endpoint=normalized_endpoint
        ).observe(duration)
        
        if request_size > 0:
            self.http_request_size_bytes.labels(
                method=method,
                endpoint=normalized_endpoint
            ).observe(request_size)
        
        if response_size > 0:
            self.http_response_size_bytes.labels(
                method=method,
                endpoint=normalized_endpoint
            ).observe(response_size)
        
        # Registrar requests lentos
        if duration > 2.0:
            self.slow_requests_total.labels(endpoint=normalized_endpoint).inc()
    
    def record_user_login(self, role: str, success: bool):
        """Registrar login de usuario"""
        self.user_login_total.labels(
            role=role,
            success="true" if success else "false"
        ).inc()
    
    def record_course_enrollment(self, course_id: str, course_category: str):
        """Registrar inscripción a curso"""
        self.course_enrollments_total.labels(
            course_id=course_id,
            course_category=course_category
        ).inc()
    
    def record_course_completion(self, course_id: str, course_category: str):
        """Registrar finalización de curso"""
        self.course_completions_total.labels(
            course_id=course_id,
            course_category=course_category
        ).inc()
    
    def record_lesson_view(self, lesson_id: str, lesson_type: str):
        """Registrar visualización de lección"""
        self.lesson_views_total.labels(
            lesson_id=lesson_id,
            lesson_type=lesson_type
        ).inc()
    
    def record_lesson_completion(self, lesson_id: str, lesson_type: str):
        """Registrar finalización de lección"""
        self.lesson_completions_total.labels(
            lesson_id=lesson_id,
            lesson_type=lesson_type
        ).inc()
    
    def record_video_watch_time(self, lesson_id: str, user_type: str, seconds: float):
        """Registrar tiempo de visualización de video"""
        self.video_watch_time_seconds.labels(
            lesson_id=lesson_id,
            user_type=user_type
        ).inc(seconds)
    
    def record_database_query(self, operation: str, collection: str, duration: float):
        """Registrar query de base de datos"""
        self.database_query_duration_seconds.labels(
            operation=operation,
            collection=collection
        ).observe(duration)
    
    def record_cache_operation(self, operation: str, result: str):
        """Registrar operación de cache"""
        self.cache_operations_total.labels(
            operation=operation,
            result=result
        ).inc()
    
    def record_error(self, error_type: str, module: str, severity: str):
        """Registrar error de aplicación"""
        self.errors_total.labels(
            error_type=error_type,
            module=module,
            severity=severity
        ).inc()
    
    def record_certificate_issued(self, course_category: str):
        """Registrar certificado emitido"""
        self.certificates_issued_total.labels(
            course_category=course_category
        ).inc()
    
    def record_quiz_attempt(self, lesson_id: str, result: str):
        """Registrar intento de quiz"""
        self.quiz_attempts_total.labels(
            lesson_id=lesson_id,
            result=result
        ).inc()
    
    def update_system_metrics(self):
        """Actualizar métricas del sistema"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            self.system_cpu_usage_percent.set(cpu_percent)
            
            # Memoria
            memory = psutil.virtual_memory()
            self.system_memory_usage_bytes.labels(type="total").set(memory.total)
            self.system_memory_usage_bytes.labels(type="used").set(memory.used)
            self.system_memory_usage_bytes.labels(type="available").set(memory.available)
            
            # Disco
            disk = psutil.disk_usage('/')
            self.system_disk_usage_bytes.labels(mount_point="/", type="total").set(disk.total)
            self.system_disk_usage_bytes.labels(mount_point="/", type="used").set(disk.used)
            self.system_disk_usage_bytes.labels(mount_point="/", type="free").set(disk.free)
            
        except Exception as e:
            logger.error(f"Error updating system metrics: {e}")
    
    def update_service_health(self, service: str, status: str):
        """Actualizar estado de salud de servicio"""
        self.service_health_status.labels(service=service).state(status)
    
    def set_build_info(self, version: str, commit: str, build_date: str):
        """Establecer información de build"""
        self.lms_info.info({
            'version': version,
            'commit': commit,
            'build_date': build_date,
            'service': 'stegmaier-lms'
        })
    
    def _normalize_endpoint(self, endpoint: str) -> str:
        """Normalizar endpoint para evitar high cardinality"""
        import re
        
        # Reemplazar IDs con placeholder
        patterns = [
            (r'/api/v1/courses/[a-f0-9]{24}', '/api/v1/courses/{id}'),
            (r'/api/v1/lessons/[a-f0-9]{24}', '/api/v1/lessons/{id}'),
            (r'/api/v1/users/[a-f0-9]{24}', '/api/v1/users/{id}'),
            (r'/api/v1/enrollments/[a-f0-9]{24}', '/api/v1/enrollments/{id}'),
            (r'/api/v1/media/[a-f0-9]{24}', '/api/v1/media/{id}'),
            (r'/\d+', '/{id}'),  # Cualquier número
        ]
        
        normalized = endpoint
        for pattern, replacement in patterns:
            normalized = re.sub(pattern, replacement, normalized)
        
        return normalized

class MetricsCollector:
    """Recolector automático de métricas del LMS"""
    
    def __init__(self, metrics: LMSMetrics, mongo_client=None):
        self.metrics = metrics
        self.mongo_client = mongo_client
        self._running = False
    
    async def start_collection(self, interval: int = 60):
        """Iniciar recolección automática de métricas"""
        self._running = True
        while self._running:
            try:
                await self._collect_application_metrics()
                self.metrics.update_system_metrics()
                await asyncio.sleep(interval)
            except Exception as e:
                logger.error(f"Error in metrics collection: {e}")
                await asyncio.sleep(interval)
    
    def stop_collection(self):
        """Detener recolección de métricas"""
        self._running = False
    
    async def _collect_application_metrics(self):
        """Recopilar métricas de la aplicación"""
        if not self.mongo_client:
            return
        
        try:
            db = self.mongo_client.get_database()
            
            # Métricas de usuarios
            users_by_role = await db.users.aggregate([
                {"$group": {"_id": "$role", "count": {"$sum": 1}}}
            ]).to_list(None)
            
            for user_role in users_by_role:
                self.metrics.users_total.labels(role=user_role["_id"]).set(user_role["count"])
            
            # Usuarios activos en 24h
            active_users = await db.users.count_documents({
                "last_login": {"$gte": datetime.utcnow() - timedelta(hours=24)}
            })
            self.metrics.users_active_24h.set(active_users)
            
            # Métricas de cursos
            courses_by_status = await db.courses.aggregate([
                {"$group": {"_id": {"status": "$is_published", "category": "$category"}, "count": {"$sum": 1}}}
            ]).to_list(None)
            
            for course_group in courses_by_status:
                status = "published" if course_group["_id"]["status"] else "draft"
                category = course_group["_id"]["category"] or "uncategorized"
                self.metrics.courses_total.labels(status=status, category=category).set(course_group["count"])
            
            # Métricas de storage de media
            media_usage = await db.media_assets.aggregate([
                {"$group": {"_id": "$media_type", "total_size": {"$sum": "$file_size"}}}
            ]).to_list(None)
            
            for media_type in media_usage:
                self.metrics.media_storage_usage_bytes.labels(
                    media_type=media_type["_id"]
                ).set(media_type["total_size"])
            
        except Exception as e:
            logger.error(f"Error collecting application metrics: {e}")

# Instancia global
lms_metrics = LMSMetrics()

def get_metrics_registry():
    """Obtener registry de métricas para endpoint de Prometheus"""
    return REGISTRY

def generate_metrics() -> str:
    """Generar métricas en formato Prometheus"""
    return generate_latest(REGISTRY)

def get_metrics_content_type() -> str:
    """Obtener content type para métricas"""
    return CONTENT_TYPE_LATEST
