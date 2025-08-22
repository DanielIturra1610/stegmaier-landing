"""
Endpoints de monitoreo y métricas para producción
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Dict, Any
import os
from datetime import datetime

from app.monitoring.health_checks import health_monitor, metrics_collector
from app.monitoring.alerts import alert_manager
from app.core.dependencies import get_current_admin_user

router = APIRouter()

@router.get("/health", summary="Health Check Básico")
async def basic_health_check():
    """Health check básico para load balancers"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "stegmaier-lms-api"
    }

@router.get("/health/detailed", summary="Health Check Detallado")
async def detailed_health_check():
    """Health check detallado de todos los servicios"""
    result = await health_monitor.comprehensive_health_check()
    
    # Si hay servicios críticos down, retornar 503
    if result["overall_status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=result)
    
    return result

@router.get("/metrics", summary="Métricas de Aplicación")
async def get_application_metrics(
    _: dict = Depends(get_current_admin_user)
):
    """Obtener métricas de la aplicación (solo admins)"""
    app_metrics = await metrics_collector.collect_app_metrics()
    performance_metrics = await metrics_collector.collect_performance_metrics()
    
    return {
        "application": app_metrics,
        "performance": performance_metrics
    }

@router.get("/metrics/system", summary="Métricas del Sistema")
async def get_system_metrics(
    _: dict = Depends(get_current_admin_user)
):
    """Obtener métricas del sistema operativo"""
    system_result = health_monitor.check_system_resources()
    
    return {
        "system": {
            "status": system_result.status,
            "details": system_result.details,
            "message": system_result.message,
            "timestamp": system_result.timestamp.isoformat()
        }
    }

@router.get("/status", summary="Estado General del Sistema")
async def system_status():
    """Estado general del sistema para páginas de status públicas"""
    health_result = await health_monitor.comprehensive_health_check()
    
    # Información pública sin detalles sensibles
    public_services = {}
    for service_name, service_data in health_result["services"].items():
        public_services[service_name] = {
            "status": service_data["status"],
            "response_time_ms": service_data["response_time_ms"]
        }
    
    return {
        "overall_status": health_result["overall_status"],
        "timestamp": health_result["timestamp"],
        "services": public_services,
        "summary": health_result["summary"]
    }

@router.post("/alerts/test", summary="Probar Sistema de Alertas")
async def test_alert_system(
    background_tasks: BackgroundTasks,
    _: dict = Depends(get_current_admin_user)
):
    """Enviar alerta de prueba (solo admins)"""
    test_alert = {
        "level": "warning",
        "service": "monitoring_system",
        "message": "Test alert from monitoring system",
        "details": {"test": True, "timestamp": datetime.utcnow().isoformat()}
    }
    
    background_tasks.add_task(alert_manager.send_alert, test_alert)
    
    return {
        "message": "Test alert queued successfully",
        "alert": test_alert
    }

@router.get("/alerts/history", summary="Historial de Alertas")
async def get_alerts_history(
    limit: int = 50,
    _: dict = Depends(get_current_admin_user)
):
    """Obtener historial de alertas recientes"""
    return await alert_manager.get_recent_alerts(limit)

@router.get("/uptime", summary="Información de Uptime")
async def get_uptime_info():
    """Información de uptime del servicio"""
    # Estas métricas normalmente vendrían de un sistema de monitoreo externo
    return {
        "uptime_seconds": 86400,  # Placeholder: 24 horas
        "uptime_percentage_30d": 99.9,
        "last_restart": "2024-01-01T00:00:00Z",
        "deployment_version": os.getenv("APP_VERSION", "1.0.0"),
        "environment": os.getenv("ENVIRONMENT", "production")
    }

@router.get("/diagnostics", summary="Diagnósticos del Sistema")
async def run_diagnostics(
    _: dict = Depends(get_current_admin_user)
):
    """Ejecutar diagnósticos completos del sistema"""
    health_result = await health_monitor.comprehensive_health_check()
    app_metrics = await metrics_collector.collect_app_metrics()
    
    # Análisis automático de problemas potenciales
    issues = []
    recommendations = []
    
    # Verificar tiempos de respuesta
    for service_name, service_data in health_result["services"].items():
        if service_data["response_time_ms"] > 1000:
            issues.append(f"{service_name} has high response time: {service_data['response_time_ms']}ms")
            recommendations.append(f"Investigate {service_name} performance")
    
    # Verificar recursos del sistema
    system_details = health_result["services"].get("system_resources", {}).get("details", {})
    if system_details.get("memory_percent", 0) > 85:
        issues.append(f"High memory usage: {system_details['memory_percent']}%")
        recommendations.append("Consider scaling up or optimizing memory usage")
    
    if system_details.get("cpu_percent", 0) > 80:
        issues.append(f"High CPU usage: {system_details['cpu_percent']}%")
        recommendations.append("Consider scaling horizontally or optimizing CPU-intensive operations")
    
    # Verificar métricas de aplicación
    if app_metrics["users"]["activity_rate"] < 10:
        issues.append(f"Low user activity rate: {app_metrics['users']['activity_rate']}%")
        recommendations.append("Review user engagement and notification systems")
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "overall_health": health_result["overall_status"],
        "issues_found": len(issues),
        "issues": issues,
        "recommendations": recommendations,
        "health_summary": health_result["summary"],
        "app_metrics_summary": {
            "total_users": app_metrics["users"]["total"],
            "active_users_24h": app_metrics["users"]["active_24h"],
            "total_courses": app_metrics["courses"]["total"],
            "active_enrollments": app_metrics["enrollments"]["active"]
        }
    }

@router.post("/maintenance", summary="Modo Mantenimiento")
async def toggle_maintenance_mode(
    enabled: bool,
    message: str = "System maintenance in progress",
    _: dict = Depends(get_current_admin_user)
):
    """Activar/desactivar modo mantenimiento"""
    # En una implementación real, esto escribiría a Redis o una base de datos
    # para que el middleware de mantenimiento lo pueda leer
    
    maintenance_status = {
        "enabled": enabled,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "set_by": "admin"
    }
    
    # Aquí normalmente guardaríamos en Redis:
    # redis_client.set("maintenance_mode", json.dumps(maintenance_status))
    
    return {
        "maintenance_mode": maintenance_status,
        "message": f"Maintenance mode {'enabled' if enabled else 'disabled'}"
    }
