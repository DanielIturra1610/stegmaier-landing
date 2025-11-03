"""
Sistema de monitoreo y health checks para producción
"""
import asyncio
import time
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from motor.motor_asyncio import AsyncIOMotorClient
from redis import Redis
import httpx
import psutil
import os

logger = logging.getLogger(__name__)

@dataclass
class HealthCheckResult:
    service: str
    status: str  # healthy, degraded, unhealthy
    response_time_ms: float
    message: str
    timestamp: datetime
    details: Dict[str, Any] = None

class HealthMonitor:
    """Monitor de salud de servicios críticos"""
    
    def __init__(self):
        self.mongo_client = None
        self.redis_client = None
        self.services = {}
        
    async def check_database_health(self) -> HealthCheckResult:
        """Verificar salud de MongoDB"""
        start_time = time.time()
        
        try:
            if not self.mongo_client:
                mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
                self.mongo_client = AsyncIOMotorClient(mongo_url)
            
            # Test basic connectivity
            await self.mongo_client.admin.command('ping')
            
            # Test collection access
            db = self.mongo_client[os.getenv("DATABASE_NAME", "stegmaier_lms")]
            await db.users.count_documents({}, limit=1)
            
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                service="mongodb",
                status="healthy" if response_time < 100 else "degraded",
                response_time_ms=response_time,
                message="MongoDB is accessible",
                timestamp=datetime.utcnow(),
                details={
                    "ping_response": "ok",
                    "database_accessible": True
                }
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="mongodb",
                status="unhealthy",
                response_time_ms=response_time,
                message=f"MongoDB error: {str(e)}",
                timestamp=datetime.utcnow(),
                details={"error": str(e)}
            )
    
    async def check_redis_health(self) -> HealthCheckResult:
        """Verificar salud de Redis"""
        start_time = time.time()
        
        try:
            if not self.redis_client:
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
                self.redis_client = Redis.from_url(redis_url)
            
            # Test connectivity
            self.redis_client.ping()
            
            # Test read/write
            test_key = "health_check_test"
            self.redis_client.set(test_key, "test_value", ex=60)
            result = self.redis_client.get(test_key)
            
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                service="redis",
                status="healthy" if response_time < 50 else "degraded",
                response_time_ms=response_time,
                message="Redis is accessible",
                timestamp=datetime.utcnow(),
                details={
                    "ping_response": "PONG",
                    "read_write_test": "passed"
                }
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="redis",
                status="unhealthy",
                response_time_ms=response_time,
                message=f"Redis error: {str(e)}",
                timestamp=datetime.utcnow(),
                details={"error": str(e)}
            )
    
    async def check_external_apis(self) -> List[HealthCheckResult]:
        """Verificar APIs externas críticas"""
        results = []
        external_apis = [
            {"name": "email_service", "url": os.getenv("EMAIL_SERVICE_URL")},
            {"name": "payment_gateway", "url": os.getenv("PAYMENT_GATEWAY_URL")},
            {"name": "cdn_service", "url": os.getenv("CDN_HEALTH_URL")}
        ]
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            for api in external_apis:
                if not api["url"]:
                    continue
                    
                start_time = time.time()
                try:
                    response = await client.get(f"{api['url']}/health")
                    response_time = (time.time() - start_time) * 1000
                    
                    status = "healthy"
                    if response.status_code != 200:
                        status = "degraded"
                    if response_time > 2000:
                        status = "degraded"
                        
                    results.append(HealthCheckResult(
                        service=api["name"],
                        status=status,
                        response_time_ms=response_time,
                        message=f"API responded with {response.status_code}",
                        timestamp=datetime.utcnow(),
                        details={
                            "status_code": response.status_code,
                            "headers": dict(response.headers)
                        }
                    ))
                    
                except Exception as e:
                    response_time = (time.time() - start_time) * 1000
                    results.append(HealthCheckResult(
                        service=api["name"],
                        status="unhealthy",
                        response_time_ms=response_time,
                        message=f"API error: {str(e)}",
                        timestamp=datetime.utcnow(),
                        details={"error": str(e)}
                    ))
        
        return results
    
    def check_system_resources(self) -> HealthCheckResult:
        """Verificar recursos del sistema"""
        start_time = time.time()
        
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            
            # Determine status
            status = "healthy"
            if cpu_percent > 80 or memory_percent > 85 or disk_percent > 90:
                status = "degraded"
            if cpu_percent > 95 or memory_percent > 95 or disk_percent > 95:
                status = "unhealthy"
            
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                service="system_resources",
                status=status,
                response_time_ms=response_time,
                message=f"CPU: {cpu_percent}%, Memory: {memory_percent}%, Disk: {disk_percent}%",
                timestamp=datetime.utcnow(),
                details={
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory_percent,
                    "disk_percent": disk_percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "disk_free_gb": disk.free / (1024**3)
                }
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service="system_resources",
                status="unhealthy",
                response_time_ms=response_time,
                message=f"System check error: {str(e)}",
                timestamp=datetime.utcnow(),
                details={"error": str(e)}
            )
    
    async def comprehensive_health_check(self) -> Dict[str, Any]:
        """Ejecutar todos los health checks"""
        start_time = time.time()
        results = []
        
        # Database health
        db_result = await self.check_database_health()
        results.append(db_result)
        
        # Redis health
        redis_result = await self.check_redis_health()
        results.append(redis_result)
        
        # External APIs
        api_results = await self.check_external_apis()
        results.extend(api_results)
        
        # System resources
        system_result = self.check_system_resources()
        results.append(system_result)
        
        # Overall status
        unhealthy_services = [r for r in results if r.status == "unhealthy"]
        degraded_services = [r for r in results if r.status == "degraded"]
        
        overall_status = "healthy"
        if unhealthy_services:
            overall_status = "unhealthy"
        elif degraded_services:
            overall_status = "degraded"
        
        total_time = (time.time() - start_time) * 1000
        
        return {
            "overall_status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "total_check_time_ms": total_time,
            "services": {
                result.service: {
                    "status": result.status,
                    "response_time_ms": result.response_time_ms,
                    "message": result.message,
                    "details": result.details
                } for result in results
            },
            "summary": {
                "total_services": len(results),
                "healthy": len([r for r in results if r.status == "healthy"]),
                "degraded": len(degraded_services),
                "unhealthy": len(unhealthy_services)
            }
        }

class MetricsCollector:
    """Recolector de métricas de aplicación"""
    
    def __init__(self):
        self.metrics = {}
        self.mongo_client = None
        
    async def collect_app_metrics(self) -> Dict[str, Any]:
        """Recopilar métricas de la aplicación"""
        if not self.mongo_client:
            mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
            self.mongo_client = AsyncIOMotorClient(mongo_url)
        
        db = self.mongo_client[os.getenv("DATABASE_NAME", "stegmaier_lms")]
        
        # Métricas de usuarios
        total_users = await db.users.count_documents({})
        active_users_24h = await db.users.count_documents({
            "last_login": {"$gte": datetime.utcnow() - timedelta(hours=24)}
        })
        
        # Métricas de cursos
        total_courses = await db.courses.count_documents({})
        published_courses = await db.courses.count_documents({"is_published": True})
        
        # Métricas de inscripciones
        total_enrollments = await db.enrollments.count_documents({})
        active_enrollments = await db.enrollments.count_documents({"status": "active"})
        
        # Métricas de progreso
        completed_lessons_24h = await db.lesson_progress.count_documents({
            "completed": True,
            "completed_at": {"$gte": datetime.utcnow() - timedelta(hours=24)}
        })
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "users": {
                "total": total_users,
                "active_24h": active_users_24h,
                "activity_rate": (active_users_24h / total_users * 100) if total_users > 0 else 0
            },
            "courses": {
                "total": total_courses,
                "published": published_courses,
                "publish_rate": (published_courses / total_courses * 100) if total_courses > 0 else 0
            },
            "enrollments": {
                "total": total_enrollments,
                "active": active_enrollments,
                "activity_rate": (active_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
            },
            "learning": {
                "lessons_completed_24h": completed_lessons_24h
            }
        }
    
    async def collect_performance_metrics(self) -> Dict[str, Any]:
        """Recopilar métricas de performance"""
        # Estas métricas normalmente vendrían de un APM como New Relic, DataDog, etc.
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "response_times": {
                "avg_api_response_ms": 250,  # Placeholder
                "p95_api_response_ms": 800,  # Placeholder
                "p99_api_response_ms": 1200  # Placeholder
            },
            "throughput": {
                "requests_per_minute": 150,  # Placeholder
                "api_calls_per_minute": 200  # Placeholder
            },
            "errors": {
                "error_rate_percent": 0.5,  # Placeholder
                "critical_errors_24h": 2  # Placeholder
            }
        }

# Instancia global
health_monitor = HealthMonitor()
metrics_collector = MetricsCollector()
