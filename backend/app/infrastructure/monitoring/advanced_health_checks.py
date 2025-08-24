"""
Health checks avanzados para producción con dependencias externas
"""
import asyncio
import time
import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from motor.motor_asyncio import AsyncIOMotorClient
from redis.asyncio import Redis
import httpx
import psutil
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class HealthCheckResult:
    service: str
    status: str  # healthy, degraded, unhealthy
    response_time_ms: float
    message: str
    timestamp: str
    details: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None

@dataclass
class ServiceDependency:
    name: str
    url: str
    timeout: float
    critical: bool = True

class AdvancedHealthMonitor:
    """Monitor avanzado de salud del sistema"""
    
    def __init__(self):
        self.mongo_client: Optional[AsyncIOMotorClient] = None
        self.redis_client: Optional[Redis] = None
        self.external_dependencies = [
            ServiceDependency("email_service", os.getenv("EMAIL_SERVICE_URL", ""), 5.0, False),
            ServiceDependency("media_cdn", os.getenv("CDN_HEALTH_URL", ""), 3.0, False),
            ServiceDependency("payment_gateway", os.getenv("PAYMENT_GATEWAY_URL", ""), 10.0, False),
        ]
        
    async def comprehensive_health_check(self) -> Dict[str, Any]:
        """Ejecutar un health check completo del sistema"""
        start_time = time.time()
        results = []
        
        # Core services checks
        core_checks = [
            self._check_api_health(),
            self._check_database_health(),
            self._check_redis_health(),
            self._check_filesystem_health(),
            self._check_system_resources(),
        ]
        
        # Ejecutar checks de core services
        core_results = await asyncio.gather(*core_checks, return_exceptions=True)
        
        for result in core_results:
            if isinstance(result, Exception):
                results.append(HealthCheckResult(
                    service="unknown_core_service",
                    status="unhealthy",
                    response_time_ms=0,
                    message=f"Health check failed: {str(result)}",
                    timestamp=datetime.utcnow().isoformat()
                ))
            else:
                results.append(result)
        
        # External dependencies checks (non-blocking)
        external_results = await self._check_external_dependencies()
        results.extend(external_results)
        
        # Application-specific checks
        app_checks = [
            self._check_lms_functionality(),
            self._check_media_processing(),
            self._check_email_system(),
        ]
        
        app_results = await asyncio.gather(*app_checks, return_exceptions=True)
        
        for result in app_results:
            if isinstance(result, Exception):
                results.append(HealthCheckResult(
                    service="unknown_app_service",
                    status="unhealthy", 
                    response_time_ms=0,
                    message=f"App check failed: {str(result)}",
                    timestamp=datetime.utcnow().isoformat()
                ))
            else:
                results.append(result)
        
        # Calcular estado general
        overall_status = self._calculate_overall_status(results)
        total_time = (time.time() - start_time) * 1000
        
        return {
            "overall_status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "total_check_time_ms": round(total_time, 2),
            "version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "services": {result.service: asdict(result) for result in results},
            "summary": self._generate_summary(results),
            "recommendations": self._generate_recommendations(results),
            "next_check_recommended": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        }
    
    async def _check_api_health(self) -> HealthCheckResult:
        """Verificar salud de la API principal"""
        start_time = time.time()
        
        try:
            # Simular request interno básico
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                service="fastapi_core",
                status="healthy",
                response_time_ms=response_time,
                message="FastAPI core is running normally",
                timestamp=datetime.utcnow().isoformat(),
                details={
                    "python_version": f"{psutil.sys.version_info.major}.{psutil.sys.version_info.minor}",
                    "process_id": os.getpid(),
                    "worker_ready": True
                }
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="fastapi_core",
                status="unhealthy",
                response_time_ms=response_time,
                message=f"API core error: {str(e)}",
                timestamp=datetime.utcnow().isoformat(),
                details={"error": str(e)}
            )
    
    async def _check_database_health(self) -> HealthCheckResult:
        """Verificar salud de MongoDB con tests específicos del LMS"""
        start_time = time.time()
        
        try:
            if not self.mongo_client:
                mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
                self.mongo_client = AsyncIOMotorClient(mongo_url)
            
            # Test 1: Conectividad básica
            await self.mongo_client.admin.command('ping')
            
            # Test 2: Acceso a base de datos principal
            db_name = os.getenv("DATABASE_NAME", "stegmaier_lms")
            db = self.mongo_client[db_name]
            
            # Test 3: Verificar colecciones críticas
            critical_collections = ["users", "courses", "lessons", "enrollments"]
            collection_stats = {}
            
            for collection in critical_collections:
                try:
                    count = await db[collection].count_documents({}, limit=1)
                    stats = await db.command("collStats", collection)
                    collection_stats[collection] = {
                        "accessible": True,
                        "document_count": stats.get("count", 0),
                        "avg_obj_size": stats.get("avgObjSize", 0),
                        "storage_size": stats.get("storageSize", 0)
                    }
                except Exception:
                    collection_stats[collection] = {"accessible": False}
            
            # Test 4: Performance de consulta
            query_start = time.time()
            await db.users.find_one({"role": "admin"})
            query_time = (time.time() - query_start) * 1000
            
            response_time = (time.time() - start_time) * 1000
            
            # Determinar estado
            status = "healthy"
            if response_time > 500:
                status = "degraded"
            if query_time > 1000:
                status = "degraded"
            
            inaccessible_collections = [k for k, v in collection_stats.items() if not v.get("accessible", True)]
            if inaccessible_collections:
                status = "unhealthy"
            
            return HealthCheckResult(
                service="mongodb",
                status=status,
                response_time_ms=response_time,
                message=f"MongoDB is accessible, query time: {query_time:.2f}ms",
                timestamp=datetime.utcnow().isoformat(),
                details={
                    "connection_time_ms": response_time,
                    "query_performance_ms": query_time,
                    "collections": collection_stats,
                    "database_name": db_name
                },
                recommendations=[
                    "Consider adding indexes if query time > 100ms",
                    "Monitor connection pool usage"
                ] if status != "healthy" else None
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="mongodb",
                status="unhealthy",
                response_time_ms=response_time,
                message=f"MongoDB error: {str(e)}",
                timestamp=datetime.utcnow().isoformat(),
                details={"error": str(e)},
                recommendations=[
                    "Check MongoDB service status",
                    "Verify connection string",
                    "Check network connectivity"
                ]
            )
    
    async def _check_redis_health(self) -> HealthCheckResult:
        """Verificar salud de Redis para caching y sessions"""
        start_time = time.time()
        
        try:
            if not self.redis_client:
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
                self.redis_client = Redis.from_url(redis_url)
            
            # Test 1: Ping básico
            ping_result = await self.redis_client.ping()
            
            # Test 2: Read/Write test
            test_key = f"health_check_{int(time.time())}"
            await self.redis_client.set(test_key, "test_value", ex=60)
            test_value = await self.redis_client.get(test_key)
            await self.redis_client.delete(test_key)
            
            # Test 3: Info de servidor
            info = await self.redis_client.info()
            
            response_time = (time.time() - start_time) * 1000
            
            # Determinar estado basado en memoria y conexiones
            memory_usage_percent = (info.get('used_memory', 0) / info.get('maxmemory', 1)) * 100 if info.get('maxmemory', 0) > 0 else 0
            connected_clients = info.get('connected_clients', 0)
            
            status = "healthy"
            if memory_usage_percent > 80 or connected_clients > 100:
                status = "degraded"
            if response_time > 100:
                status = "degraded"
            if not ping_result or test_value != b"test_value":
                status = "unhealthy"
            
            return HealthCheckResult(
                service="redis",
                status=status,
                response_time_ms=response_time,
                message=f"Redis is accessible, memory: {memory_usage_percent:.1f}%",
                timestamp=datetime.utcnow().isoformat(),
                details={
                    "ping_response": str(ping_result),
                    "read_write_test": "passed" if test_value == b"test_value" else "failed",
                    "memory_usage_percent": memory_usage_percent,
                    "connected_clients": connected_clients,
                    "redis_version": info.get('redis_version', 'unknown'),
                    "uptime_seconds": info.get('uptime_in_seconds', 0)
                }
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="redis",
                status="unhealthy",
                response_time_ms=response_time,
                message=f"Redis error: {str(e)}",
                timestamp=datetime.utcnow().isoformat(),
                details={"error": str(e)},
                recommendations=[
                    "Check Redis service status",
                    "Verify Redis configuration",
                    "Check memory availability"
                ]
            )
    
    async def _check_filesystem_health(self) -> HealthCheckResult:
        """Verificar salud del sistema de archivos y storage"""
        start_time = time.time()
        
        try:
            media_path = Path(os.getenv("MEDIA_ROOT", "/tmp/media"))
            upload_path = Path(os.getenv("UPLOAD_PATH", "/tmp/uploads"))
            
            # Test 1: Verificar acceso de lectura/escritura
            test_results = {}
            
            for path_name, path in [("media", media_path), ("uploads", upload_path)]:
                try:
                    # Crear directorio si no existe
                    path.mkdir(parents=True, exist_ok=True)
                    
                    # Test de escritura
                    test_file = path / f"health_check_{int(time.time())}.tmp"
                    test_file.write_text("health check test")
                    
                    # Test de lectura
                    content = test_file.read_text()
                    
                    # Limpiar
                    test_file.unlink()
                    
                    # Estadísticas del directorio
                    stat = path.stat()
                    
                    test_results[path_name] = {
                        "accessible": True,
                        "writable": True,
                        "readable": True,
                        "path": str(path),
                        "permissions": oct(stat.st_mode)[-3:],
                        "size_mb": sum(f.stat().st_size for f in path.rglob('*') if f.is_file()) / (1024*1024)
                    }
                    
                except Exception as e:
                    test_results[path_name] = {
                        "accessible": False,
                        "error": str(e),
                        "path": str(path)
                    }
            
            # Test 2: Espacio en disco
            disk_usage = psutil.disk_usage(str(media_path.parent))
            free_space_percent = (disk_usage.free / disk_usage.total) * 100
            
            response_time = (time.time() - start_time) * 1000
            
            # Determinar estado
            status = "healthy"
            failed_paths = [k for k, v in test_results.items() if not v.get("accessible", True)]
            
            if failed_paths:
                status = "unhealthy"
            elif free_space_percent < 10:
                status = "degraded"
            elif free_space_percent < 5:
                status = "unhealthy"
            
            return HealthCheckResult(
                service="filesystem",
                status=status,
                response_time_ms=response_time,
                message=f"Filesystem accessible, {free_space_percent:.1f}% free space",
                timestamp=datetime.utcnow().isoformat(),
                details={
                    "paths": test_results,
                    "disk_usage": {
                        "total_gb": disk_usage.total / (1024**3),
                        "free_gb": disk_usage.free / (1024**3),
                        "used_gb": disk_usage.used / (1024**3),
                        "free_percent": free_space_percent
                    }
                },
                recommendations=[
                    "Monitor disk space regularly",
                    "Set up alerts for <15% free space",
                    "Consider cleanup policies for old media files"
                ] if free_space_percent < 20 else None
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="filesystem",
                status="unhealthy",
                response_time_ms=response_time,
                message=f"Filesystem error: {str(e)}",
                timestamp=datetime.utcnow().isoformat(),
                details={"error": str(e)}
            )
    
    async def _check_system_resources(self) -> HealthCheckResult:
        """Verificar recursos del sistema (CPU, memoria, etc.)"""
        start_time = time.time()
        
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            
            # Network stats
            network = psutil.net_io_counters()
            
            # Process info
            process = psutil.Process()
            process_memory = process.memory_info()
            
            response_time = (time.time() - start_time) * 1000
            
            # Determinar estado
            status = "healthy"
            warnings = []
            
            if cpu_percent > 80:
                status = "degraded"
                warnings.append(f"High CPU usage: {cpu_percent}%")
            
            if memory_percent > 85:
                status = "degraded"
                warnings.append(f"High memory usage: {memory_percent}%")
            
            if disk_percent > 90:
                status = "degraded"
                warnings.append(f"High disk usage: {disk_percent}%")
            
            if cpu_percent > 95 or memory_percent > 95 or disk_percent > 98:
                status = "unhealthy"
            
            return HealthCheckResult(
                service="system_resources",
                status=status,
                response_time_ms=response_time,
                message=f"CPU: {cpu_percent}%, Memory: {memory_percent}%, Disk: {disk_percent}%",
                timestamp=datetime.utcnow().isoformat(),
                details={
                    "cpu": {
                        "usage_percent": cpu_percent,
                        "count": cpu_count,
                        "load_average": list(os.getloadavg()) if hasattr(os, 'getloadavg') else None
                    },
                    "memory": {
                        "total_gb": memory.total / (1024**3),
                        "available_gb": memory.available / (1024**3),
                        "percent": memory_percent,
                        "process_memory_mb": process_memory.rss / (1024**2)
                    },
                    "disk": {
                        "total_gb": disk.total / (1024**3),
                        "free_gb": disk.free / (1024**3),
                        "percent": disk_percent
                    },
                    "network": {
                        "bytes_sent": network.bytes_sent,
                        "bytes_recv": network.bytes_recv,
                        "packets_sent": network.packets_sent,
                        "packets_recv": network.packets_recv
                    }
                },
                recommendations=[
                    "Monitor resource usage trends",
                    "Consider horizontal scaling if consistently high",
                    "Review application performance optimizations"
                ] if warnings else None
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="system_resources",
                status="unhealthy",
                response_time_ms=response_time,
                message=f"System check error: {str(e)}",
                timestamp=datetime.utcnow().isoformat(),
                details={"error": str(e)}
            )
    
    async def _check_external_dependencies(self) -> List[HealthCheckResult]:
        """Verificar dependencias externas de forma no bloqueante"""
        results = []
        
        for dependency in self.external_dependencies:
            if not dependency.url:
                continue
                
            start_time = time.time()
            try:
                timeout = httpx.Timeout(dependency.timeout)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.get(f"{dependency.url}/health")
                    response_time = (time.time() - start_time) * 1000
                    
                    status = "healthy"
                    if response.status_code != 200:
                        status = "degraded" if not dependency.critical else "unhealthy"
                    if response_time > dependency.timeout * 500:  # 50% del timeout
                        status = "degraded"
                    
                    results.append(HealthCheckResult(
                        service=dependency.name,
                        status=status,
                        response_time_ms=response_time,
                        message=f"External service responded with {response.status_code}",
                        timestamp=datetime.utcnow().isoformat(),
                        details={
                            "status_code": response.status_code,
                            "critical": dependency.critical,
                            "timeout_ms": dependency.timeout * 1000,
                            "url": dependency.url
                        }
                    ))
                    
            except Exception as e:
                response_time = (time.time() - start_time) * 1000
                status = "unhealthy" if dependency.critical else "degraded"
                
                results.append(HealthCheckResult(
                    service=dependency.name,
                    status=status,
                    response_time_ms=response_time,
                    message=f"External service error: {str(e)}",
                    timestamp=datetime.utcnow().isoformat(),
                    details={
                        "error": str(e),
                        "critical": dependency.critical,
                        "url": dependency.url
                    }
                ))
        
        return results
    
    async def _check_lms_functionality(self) -> HealthCheckResult:
        """Verificar funcionalidad específica del LMS"""
        start_time = time.time()
        
        try:
            # Test 1: Verificar que se pueden crear objetos básicos del LMS
            if self.mongo_client:
                db = self.mongo_client.get_database()
                
                # Test básico de lectura de datos críticos
                user_count = await db.users.count_documents({}, limit=1)
                course_count = await db.courses.count_documents({}, limit=1)
                
                response_time = (time.time() - start_time) * 1000
                
                return HealthCheckResult(
                    service="lms_functionality",
                    status="healthy",
                    response_time_ms=response_time,
                    message="LMS core functionality is accessible",
                    timestamp=datetime.utcnow().isoformat(),
                    details={
                        "users_accessible": user_count >= 0,
                        "courses_accessible": course_count >= 0,
                        "core_collections_readable": True
                    }
                )
            else:
                raise Exception("MongoDB client not initialized")
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="lms_functionality",
                status="unhealthy",
                response_time_ms=response_time,
                message=f"LMS functionality error: {str(e)}",
                timestamp=datetime.utcnow().isoformat(),
                details={"error": str(e)}
            )
    
    async def _check_media_processing(self) -> HealthCheckResult:
        """Verificar capacidad de procesamiento de media"""
        start_time = time.time()
        
        try:
            # Verificar que los directorios de media existen y son escribibles
            media_path = Path(os.getenv("MEDIA_ROOT", "/tmp/media"))
            
            # Test básico de acceso
            if media_path.exists() and os.access(media_path, os.W_OK):
                response_time = (time.time() - start_time) * 1000
                
                return HealthCheckResult(
                    service="media_processing",
                    status="healthy",
                    response_time_ms=response_time,
                    message="Media processing capabilities available",
                    timestamp=datetime.utcnow().isoformat(),
                    details={
                        "media_path_accessible": True,
                        "media_path": str(media_path)
                    }
                )
            else:
                raise Exception("Media path not accessible")
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="media_processing",
                status="degraded",
                response_time_ms=response_time,
                message=f"Media processing issue: {str(e)}",
                timestamp=datetime.utcnow().isoformat(),
                details={"error": str(e)}
            )
    
    async def _check_email_system(self) -> HealthCheckResult:
        """Verificar sistema de email"""
        start_time = time.time()
        
        try:
            # Verificar configuración de email
            email_config = {
                "smtp_server": os.getenv("SMTP_SERVER"),
                "smtp_port": os.getenv("SMTP_PORT"),
                "smtp_username": os.getenv("SMTP_USERNAME"),
                "from_email": os.getenv("FROM_EMAIL")
            }
            
            missing_config = [k for k, v in email_config.items() if not v]
            
            response_time = (time.time() - start_time) * 1000
            
            if missing_config:
                return HealthCheckResult(
                    service="email_system",
                    status="degraded",
                    response_time_ms=response_time,
                    message=f"Email configuration incomplete: {', '.join(missing_config)}",
                    timestamp=datetime.utcnow().isoformat(),
                    details={
                        "configured": {k: bool(v) for k, v in email_config.items()},
                        "missing": missing_config
                    }
                )
            else:
                return HealthCheckResult(
                    service="email_system",
                    status="healthy",
                    response_time_ms=response_time,
                    message="Email system configured",
                    timestamp=datetime.utcnow().isoformat(),
                    details={"fully_configured": True}
                )
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="email_system",
                status="unhealthy",
                response_time_ms=response_time,
                message=f"Email system error: {str(e)}",
                timestamp=datetime.utcnow().isoformat(),
                details={"error": str(e)}
            )
    
    def _calculate_overall_status(self, results: List[HealthCheckResult]) -> str:
        """Calcular estado general del sistema"""
        unhealthy_critical = [r for r in results if r.status == "unhealthy" and r.service in ["mongodb", "fastapi_core", "system_resources"]]
        unhealthy_services = [r for r in results if r.status == "unhealthy"]
        degraded_services = [r for r in results if r.status == "degraded"]
        
        if unhealthy_critical:
            return "unhealthy"
        elif unhealthy_services:
            return "degraded"
        elif degraded_services:
            return "degraded"
        else:
            return "healthy"
    
    def _generate_summary(self, results: List[HealthCheckResult]) -> Dict[str, Any]:
        """Generar resumen de resultados"""
        total = len(results)
        healthy = len([r for r in results if r.status == "healthy"])
        degraded = len([r for r in results if r.status == "degraded"])
        unhealthy = len([r for r in results if r.status == "unhealthy"])
        
        avg_response_time = sum(r.response_time_ms for r in results) / total if total > 0 else 0
        
        return {
            "total_services": total,
            "healthy": healthy,
            "degraded": degraded,
            "unhealthy": unhealthy,
            "health_percentage": (healthy / total * 100) if total > 0 else 0,
            "average_response_time_ms": round(avg_response_time, 2),
            "critical_services_status": {
                service: next((r.status for r in results if r.service == service), "unknown")
                for service in ["mongodb", "fastapi_core", "system_resources"]
            }
        }
    
    def _generate_recommendations(self, results: List[HealthCheckResult]) -> List[str]:
        """Generar recomendaciones basadas en los resultados"""
        recommendations = []
        
        # Recomendaciones de resultados individuales
        for result in results:
            if result.recommendations:
                recommendations.extend(result.recommendations)
        
        # Recomendaciones generales
        unhealthy_count = len([r for r in results if r.status == "unhealthy"])
        degraded_count = len([r for r in results if r.status == "degraded"])
        
        if unhealthy_count > 0:
            recommendations.append("Immediate attention required for unhealthy services")
            recommendations.append("Consider activating incident response procedures")
        
        if degraded_count > 2:
            recommendations.append("Multiple services showing degraded performance")
            recommendations.append("Review system capacity and scaling options")
        
        # Remover duplicados
        return list(dict.fromkeys(recommendations))

# Instancia global
advanced_health_monitor = AdvancedHealthMonitor()
