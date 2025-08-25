"""
Endpoints avanzados de monitoreo y observabilidad
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response, Query
from fastapi.responses import PlainTextResponse
from typing import Dict, Any, Optional, List
import os
from datetime import datetime, timedelta

from ....infrastructure.monitoring.advanced_health_checks import advanced_health_monitor
from ....infrastructure.monitoring.prometheus_metrics import lms_metrics, generate_metrics, get_metrics_content_type
from ....infrastructure.monitoring.alerting_system import alert_manager
from ...deps import get_current_admin_user
from ....domain.entities.user import User

router = APIRouter()

@router.get("/health", summary="Health Check Básico")
async def basic_health_check():
    """Health check básico para load balancers y monitoreo externo"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "stegmaier-lms-api",
        "version": "1.0.0"
    }

@router.get("/health/detailed", summary="Health Check Detallado")
async def detailed_health_check(
    current_user: User = Depends(get_current_admin_user)
):
    """Health check comprehensivo con detalles de todos los servicios"""
    try:
        health_data = await advanced_health_monitor.comprehensive_health_check()
        return health_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@router.get("/metrics", summary="Métricas Prometheus", response_class=PlainTextResponse)
async def prometheus_metrics():
    """Endpoint de métricas en formato Prometheus"""
    try:
        # Actualizar métricas del sistema antes de exportar
        lms_metrics.update_system_metrics()
        
        metrics_data = generate_metrics()
        return Response(
            content=metrics_data,
            media_type=get_metrics_content_type(),
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metrics generation failed: {str(e)}")

@router.get("/metrics/json", summary="Métricas en formato JSON")
async def metrics_json(
    current_user: User = Depends(get_current_admin_user),
    range_hours: int = Query(1, description="Hours of historical data", ge=1, le=168)
):
    """Métricas del sistema en formato JSON para dashboards"""
    try:
        from ....infrastructure.monitoring.prometheus_metrics import MetricsCollector
        from motor.motor_asyncio import AsyncIOMotorClient
        
        # Configurar cliente MongoDB
        mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        mongo_client = AsyncIOMotorClient(mongo_url)
        
        collector = MetricsCollector(lms_metrics, mongo_client)
        
        # Recopilar métricas actuales
        current_metrics = await collector._collect_application_metrics()
        performance_metrics = await collector._collect_performance_metrics()
        
        # Simular datos históricos (en producción esto vendría de una base de datos de métricas)
        historical_data = []
        for i in range(range_hours * 6):  # Datos cada 10 minutos
            timestamp = datetime.utcnow() - timedelta(minutes=i * 10)
            historical_data.append({
                "timestamp": timestamp.isoformat(),
                "cpu_usage_percent": 45 + (i % 20),
                "memory_usage_percent": 60 + (i % 15),
                "disk_usage_percent": 70 + (i % 10),
                "response_time_ms": 200 + (i % 100),
                "requests_per_minute": 50 + (i % 30),
                "error_rate_percent": 0.5 + (i % 2),
                "active_users": current_metrics["users"]["active_24h"]
            })
        
        return {
            "current": {
                "timestamp": datetime.utcnow().isoformat(),
                "cpu_usage_percent": 45.2,  # Placeholder
                "memory_usage_percent": 62.1,  # Placeholder
                "disk_usage_percent": 75.8,  # Placeholder
                "response_time_ms": 245,  # Placeholder
                "requests_per_minute": 85,  # Placeholder
                "error_rate_percent": 0.8,  # Placeholder
                "active_users": current_metrics["users"]["active_24h"]
            },
            "historical": list(reversed(historical_data)),
            "application_metrics": current_metrics,
            "performance_metrics": performance_metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JSON metrics failed: {str(e)}")

@router.get("/alerts", summary="Alertas del Sistema")
async def get_alerts(
    current_user: User = Depends(get_current_admin_user),
    active_only: bool = Query(True, description="Only show active alerts"),
    hours: int = Query(24, description="Hours of alert history", ge=1, le=168)
):
    """Obtener alertas del sistema"""
    try:
        if active_only:
            alerts = alert_manager.get_active_alerts()
        else:
            alerts = alert_manager.get_alert_history(hours=hours)
        
        # Convertir alertas a diccionarios para serialización JSON
        alerts_data = [alert.to_dict() for alert in alerts]
        
        stats = alert_manager.get_alert_stats(hours=hours)
        
        return {
            "alerts": alerts_data,
            "stats": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")

@router.post("/alerts/{alert_id}/resolve", summary="Resolver Alerta")
async def resolve_alert(
    alert_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """Resolver una alerta manualmente"""
    try:
        success = await alert_manager.resolve_alert(alert_id, current_user.email)
        
        if success:
            return {
                "message": f"Alert {alert_id} resolved successfully",
                "resolved_by": current_user.email,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Alert not found or already resolved")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve alert: {str(e)}")

@router.get("/system/status", summary="Estado del Sistema")
async def system_status():
    """Estado simplificado del sistema para checks rápidos"""
    try:
        # Health check rápido
        health_data = await advanced_health_monitor.comprehensive_health_check()
        
        return {
            "status": health_data["overall_status"],
            "timestamp": health_data["timestamp"],
            "services": {
                service: data["status"] 
                for service, data in health_data["services"].items()
            },
            "summary": health_data["summary"]
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

@router.post("/test-alert", summary="Probar Sistema de Alertas")
async def test_alert_system(
    current_user: User = Depends(get_current_admin_user),
    level: str = Query("warning", description="Alert level to test")
):
    """Endpoint para probar el sistema de alertas (solo desarrollo)"""
    if os.getenv("ENVIRONMENT") == "production":
        raise HTTPException(status_code=403, detail="Test alerts not allowed in production")
    
    try:
        from ....infrastructure.monitoring.alerting_system import Alert, AlertLevel, AlertChannel
        
        # Crear alerta de prueba
        test_alert = Alert(
            id=f"test_{int(datetime.utcnow().timestamp())}",
            level=AlertLevel(level),
            service="test",
            title="Test Alert",
            message=f"This is a test alert triggered by {current_user.email}",
            timestamp=datetime.utcnow(),
            details={"test": True, "user": current_user.email},
            channels=[AlertChannel.EMAIL, AlertChannel.DATABASE]
        )
        
        # Enviar alerta
        await alert_manager._send_alert_notifications(test_alert)
        
        return {
            "message": "Test alert sent successfully",
            "alert_id": test_alert.id,
            "triggered_by": current_user.email
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test alert: {str(e)}")

@router.get("/logs", summary="Logs del Sistema")
async def get_system_logs(
    current_user: User = Depends(get_current_admin_user),
    level: str = Query("INFO", description="Log level filter"),
    lines: int = Query(100, description="Number of log lines", ge=1, le=1000),
    service: Optional[str] = Query(None, description="Filter by service")
):
    """Obtener logs del sistema (implementación básica)"""
    try:
        # En producción esto se conectaría a un sistema de logs centralizado
        # Por ahora retornamos logs simulados
        
        logs = []
        for i in range(lines):
            timestamp = datetime.utcnow() - timedelta(minutes=i)
            logs.append({
                "timestamp": timestamp.isoformat(),
                "level": level,
                "service": service or "stegmaier-lms",
                "message": f"Sample log entry {i}",
                "module": "monitoring",
                "request_id": f"req-{i}"
            })
        
        return {
            "logs": logs,
            "total": len(logs),
            "filters": {
                "level": level,
                "service": service,
                "lines": lines
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get logs: {str(e)}")

@router.get("/performance", summary="Métricas de Performance")
async def get_performance_metrics(
    current_user: User = Depends(get_current_admin_user)
):
    """Métricas detalladas de performance de la aplicación"""
    try:
        from ....middleware.performance import request_metrics
        
        # Obtener métricas del middleware
        middleware_metrics = request_metrics.get_metrics()
        
        # Métricas adicionales del sistema
        import psutil
        
        performance_data = {
            "api_metrics": middleware_metrics,
            "system_metrics": {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent,
                "network_io": {
                    "bytes_sent": psutil.net_io_counters().bytes_sent,
                    "bytes_recv": psutil.net_io_counters().bytes_recv
                }
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return performance_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get performance metrics: {str(e)}")

@router.get("/status", summary="Estado General del Sistema")
async def system_status():
    """Estado general del sistema para páginas de status públicas"""
    health_result = await advanced_health_monitor.comprehensive_health_check()
    
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
