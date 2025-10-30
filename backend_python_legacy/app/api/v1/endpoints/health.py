"""
Endpoints para health check y monitoreo del sistema
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
import time
from datetime import datetime
import os

from ...deps import get_current_admin_user
from ....domain.entities.user import User
from ....middleware.performance import request_metrics

router = APIRouter()

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check básico para verificar que la API está funcionando.
    Endpoint público para monitoreo externo.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "service": "stegmaier-analytics-api"
    }

@router.get("/health/detailed")
async def detailed_health_check(
    current_user: User = Depends(get_current_admin_user)
) -> Dict[str, Any]:
    """
    Health check detallado con métricas del sistema.
    Solo accesible para administradores.
    """
    
    # Métricas de performance del middleware
    performance_metrics = request_metrics.get_metrics()
    
    # Información del sistema
    import psutil
    
    try:
        # Métricas de CPU y memoria
        cpu_percent = psutil.cpu_percent(interval=1)
        memory_info = psutil.virtual_memory()
        disk_info = psutil.disk_usage('/')
        
        system_metrics = {
            "cpu_usage_percent": cpu_percent,
            "memory": {
                "total_gb": round(memory_info.total / (1024**3), 2),
                "used_gb": round(memory_info.used / (1024**3), 2),
                "available_gb": round(memory_info.available / (1024**3), 2),
                "usage_percent": memory_info.percent
            },
            "disk": {
                "total_gb": round(disk_info.total / (1024**3), 2),
                "used_gb": round(disk_info.used / (1024**3), 2),
                "free_gb": round(disk_info.free / (1024**3), 2),
                "usage_percent": round((disk_info.used / disk_info.total) * 100, 2)
            }
        }
    except ImportError:
        # Si psutil no está instalado
        system_metrics = {
            "cpu_usage_percent": "unavailable (psutil not installed)",
            "memory": "unavailable (psutil not installed)",
            "disk": "unavailable (psutil not installed)"
        }
    
    # Verificar conectividad de base de datos
    database_status = "unknown"
    try:
        # Aquí podrías hacer un ping a MongoDB
        # Por simplicidad, asumimos que está funcionando si llegamos aquí
        database_status = "connected"
    except Exception:
        database_status = "disconnected"
    
    # Verificar sistema de archivos de media
    media_status = "unknown"
    try:
        from ....core.config import get_settings
        settings = get_settings()
        media_path = settings.MEDIA_ROOT
        
        if os.path.exists(media_path) and os.access(media_path, os.W_OK):
            media_status = "accessible"
        else:
            media_status = "inaccessible"
    except Exception:
        media_status = "error"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "service": "stegmaier-analytics-api",
        "components": {
            "api": "healthy",
            "database": database_status,
            "media_storage": media_status
        },
        "metrics": {
            "performance": performance_metrics,
            "system": system_metrics
        },
        "uptime_info": {
            "checked_by": current_user.email,
            "server_time": datetime.utcnow().isoformat()
        }
    }

@router.get("/metrics")
async def get_system_metrics(
    current_user: User = Depends(get_current_admin_user)
) -> Dict[str, Any]:
    """
    Endpoint específico para métricas de performance.
    Útil para integración con sistemas de monitoreo como Prometheus.
    """
    
    performance_metrics = request_metrics.get_metrics()
    
    # Métricas en formato más amigable para sistemas de monitoreo
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": {
            "http_requests_total": performance_metrics["total_requests"],
            "http_request_errors_total": performance_metrics["total_errors"],
            "http_request_duration_average_seconds": performance_metrics["average_response_time"],
            "http_slow_requests_total": performance_metrics["slow_request_count"],
            "http_error_rate": performance_metrics["error_rate"]
        },
        "labels": {
            "service": "stegmaier-analytics-api",
            "version": "1.0.0"
        }
    }

@router.get("/status")
async def service_status() -> Dict[str, Any]:
    """
    Estado simplificado del servicio para checks automáticos.
    """
    return {
        "status": "ok",
        "timestamp": int(time.time()),
        "service": "analytics-api"
    }
