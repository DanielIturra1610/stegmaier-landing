"""
Sistema de alerting automático integrado con notificaciones existentes
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json
import os
from pathlib import Path

logger = logging.getLogger(__name__)

class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class AlertChannel(Enum):
    EMAIL = "email"
    SLACK = "slack"
    WEBHOOK = "webhook"
    DATABASE = "database"
    SENTRY = "sentry"

@dataclass
class Alert:
    id: str
    level: AlertLevel
    service: str
    title: str
    message: str
    timestamp: datetime
    details: Dict[str, Any]
    channels: List[AlertChannel]
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    escalated: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "level": self.level.value,
            "service": self.service,
            "title": self.title,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
            "details": self.details,
            "channels": [c.value for c in self.channels],
            "resolved": self.resolved,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolved_by": self.resolved_by,
            "escalated": self.escalated
        }

@dataclass 
class AlertRule:
    name: str
    condition: Callable[[Dict[str, Any]], bool]
    level: AlertLevel
    channels: List[AlertChannel]
    cooldown_minutes: int = 15
    escalation_minutes: int = 60
    auto_resolve: bool = False
    description: str = ""

class AlertManager:
    """Gestor central de alertas del sistema"""
    
    def __init__(self):
        self.rules: List[AlertRule] = []
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.last_alert_times: Dict[str, datetime] = {}
        self.notification_handlers = {}
        self._setup_default_rules()
        self._setup_notification_handlers()
    
    def _setup_default_rules(self):
        """Configurar reglas de alerta por defecto para el LMS"""
        
        # Reglas de performance
        self.add_rule(AlertRule(
            name="high_response_time",
            condition=lambda data: data.get("avg_response_time_ms", 0) > 2000,
            level=AlertLevel.WARNING,
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK],
            cooldown_minutes=10,
            description="API response time above 2 seconds"
        ))
        
        self.add_rule(AlertRule(
            name="critical_response_time", 
            condition=lambda data: data.get("avg_response_time_ms", 0) > 5000,
            level=AlertLevel.CRITICAL,
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.SENTRY],
            cooldown_minutes=5,
            escalation_minutes=30,
            description="API response time critically high (>5s)"
        ))
        
        # Reglas de errores
        self.add_rule(AlertRule(
            name="high_error_rate",
            condition=lambda data: data.get("error_rate_percent", 0) > 5,
            level=AlertLevel.ERROR,
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK],
            cooldown_minutes=5,
            description="Error rate above 5%"
        ))
        
        self.add_rule(AlertRule(
            name="database_connection_failure",
            condition=lambda data: data.get("database_status") == "unhealthy",
            level=AlertLevel.CRITICAL,
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.WEBHOOK],
            cooldown_minutes=1,
            escalation_minutes=15,
            description="Database connection lost"
        ))
        
        # Reglas de recursos del sistema
        self.add_rule(AlertRule(
            name="high_cpu_usage",
            condition=lambda data: data.get("cpu_usage_percent", 0) > 85,
            level=AlertLevel.WARNING,
            channels=[AlertChannel.EMAIL],
            cooldown_minutes=20,
            description="CPU usage above 85%"
        ))
        
        self.add_rule(AlertRule(
            name="high_memory_usage",
            condition=lambda data: data.get("memory_usage_percent", 0) > 90,
            level=AlertLevel.ERROR,
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK],
            cooldown_minutes=15,
            description="Memory usage above 90%"
        ))
        
        self.add_rule(AlertRule(
            name="low_disk_space",
            condition=lambda data: data.get("disk_free_percent", 100) < 10,
            level=AlertLevel.CRITICAL,
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.WEBHOOK],
            cooldown_minutes=30,
            escalation_minutes=120,
            description="Disk space critically low (<10%)"
        ))
        
        # Reglas específicas del LMS
        self.add_rule(AlertRule(
            name="failed_enrollments",
            condition=lambda data: data.get("failed_enrollments_1h", 0) > 10,
            level=AlertLevel.WARNING,
            channels=[AlertChannel.EMAIL],
            cooldown_minutes=60,
            description="High number of failed enrollments in the last hour"
        ))
        
        self.add_rule(AlertRule(
            name="video_streaming_failures",
            condition=lambda data: data.get("video_error_rate_percent", 0) > 15,
            level=AlertLevel.ERROR,
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK],
            cooldown_minutes=10,
            description="High video streaming failure rate"
        ))
        
        self.add_rule(AlertRule(
            name="user_authentication_failures",
            condition=lambda data: data.get("auth_failure_rate_percent", 0) > 20,
            level=AlertLevel.WARNING,
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK],
            cooldown_minutes=15,
            description="High authentication failure rate"
        ))
    
    def _setup_notification_handlers(self):
        """Configurar handlers de notificación"""
        self.notification_handlers = {
            AlertChannel.EMAIL: self._send_email_alert,
            AlertChannel.SLACK: self._send_slack_alert,
            AlertChannel.WEBHOOK: self._send_webhook_alert,
            AlertChannel.DATABASE: self._store_alert_in_db,
            AlertChannel.SENTRY: self._send_sentry_alert
        }
    
    def add_rule(self, rule: AlertRule):
        """Agregar regla de alerta"""
        self.rules.append(rule)
        logger.info(f"Added alert rule: {rule.name}")
    
    async def check_conditions(self, metrics_data: Dict[str, Any]) -> List[Alert]:
        """Verificar condiciones y generar alertas"""
        triggered_alerts = []
        
        for rule in self.rules:
            try:
                if rule.condition(metrics_data):
                    alert = await self._create_alert(rule, metrics_data)
                    if alert:
                        triggered_alerts.append(alert)
            except Exception as e:
                logger.error(f"Error checking rule {rule.name}: {str(e)}")
        
        return triggered_alerts
    
    async def _create_alert(self, rule: AlertRule, metrics_data: Dict[str, Any]) -> Optional[Alert]:
        """Crear alerta si las condiciones se cumplen"""
        alert_key = f"{rule.name}_{rule.level.value}"
        current_time = datetime.utcnow()
        
        # Verificar cooldown
        if alert_key in self.last_alert_times:
            last_alert = self.last_alert_times[alert_key]
            if current_time - last_alert < timedelta(minutes=rule.cooldown_minutes):
                return None
        
        # Crear alerta
        alert_id = f"{alert_key}_{int(current_time.timestamp())}"
        alert = Alert(
            id=alert_id,
            level=rule.level,
            service="stegmaier-lms",
            title=rule.name.replace("_", " ").title(),
            message=rule.description,
            timestamp=current_time,
            details=self._extract_relevant_metrics(metrics_data, rule),
            channels=rule.channels
        )
        
        # Guardar alerta
        self.active_alerts[alert_id] = alert
        self.alert_history.append(alert)
        self.last_alert_times[alert_key] = current_time
        
        # Enviar notificaciones
        await self._send_alert_notifications(alert)
        
        # Programar escalación si es necesario
        if rule.escalation_minutes > 0:
            asyncio.create_task(self._schedule_escalation(alert, rule.escalation_minutes))
        
        logger.warning(f"Alert triggered: {alert.title} ({alert.level.value})")
        return alert
    
    def _extract_relevant_metrics(self, metrics_data: Dict[str, Any], rule: AlertRule) -> Dict[str, Any]:
        """Extraer métricas relevantes para la alerta"""
        relevant_keys = {
            "high_response_time": ["avg_response_time_ms", "p95_response_time_ms", "total_requests"],
            "critical_response_time": ["avg_response_time_ms", "p99_response_time_ms", "slow_requests"],
            "high_error_rate": ["error_rate_percent", "total_errors", "total_requests"],
            "database_connection_failure": ["database_status", "database_response_time_ms"],
            "high_cpu_usage": ["cpu_usage_percent", "cpu_count"],
            "high_memory_usage": ["memory_usage_percent", "memory_available_gb"],
            "low_disk_space": ["disk_free_percent", "disk_free_gb", "disk_total_gb"],
            "failed_enrollments": ["failed_enrollments_1h", "total_enrollments_1h"],
            "video_streaming_failures": ["video_error_rate_percent", "video_streams_1h"],
            "user_authentication_failures": ["auth_failure_rate_percent", "auth_attempts_1h"]
        }
        
        keys = relevant_keys.get(rule.name, [])
        return {key: metrics_data.get(key) for key in keys if key in metrics_data}
    
    async def _send_alert_notifications(self, alert: Alert):
        """Enviar notificaciones por todos los canales configurados"""
        for channel in alert.channels:
            try:
                handler = self.notification_handlers.get(channel)
                if handler:
                    await handler(alert)
            except Exception as e:
                logger.error(f"Failed to send alert via {channel.value}: {str(e)}")
    
    async def _send_email_alert(self, alert: Alert):
        """Enviar alerta por email usando el sistema existente"""
        try:
            # Integrar con el sistema de email existente
            from ...infrastructure.email.email_service import EmailService
            
            email_service = EmailService()
            
            # Email del administrador desde variables de entorno
            admin_email = os.getenv("ADMIN_EMAIL", "admin@stegmaier-lms.com")
            
            subject = f"🚨 {alert.level.value.upper()}: {alert.title}"
            
            html_content = f"""
            <html>
            <body>
                <h2 style="color: {'#dc3545' if alert.level in [AlertLevel.ERROR, AlertLevel.CRITICAL] else '#ffc107'};">
                    {alert.title}
                </h2>
                <p><strong>Nivel:</strong> {alert.level.value.upper()}</p>
                <p><strong>Servicio:</strong> {alert.service}</p>
                <p><strong>Mensaje:</strong> {alert.message}</p>
                <p><strong>Timestamp:</strong> {alert.timestamp.isoformat()}</p>
                
                <h3>Detalles:</h3>
                <ul>
                    {"".join([f"<li><strong>{k}:</strong> {v}</li>" for k, v in alert.details.items()])}
                </ul>
                
                <hr>
                <p><small>Stegmaier LMS - Sistema de Monitoreo</small></p>
            </body>
            </html>
            """
            
            await email_service.send_email(
                to_email=admin_email,
                subject=subject,
                html_content=html_content
            )
            
            logger.info(f"Email alert sent for {alert.id}")
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {str(e)}")
    
    async def _send_slack_alert(self, alert: Alert):
        """Enviar alerta a Slack"""
        try:
            slack_webhook = os.getenv("SLACK_WEBHOOK_URL")
            if not slack_webhook:
                logger.warning("SLACK_WEBHOOK_URL not configured")
                return
            
            color = {
                AlertLevel.INFO: "#36a64f",
                AlertLevel.WARNING: "#ff9f00", 
                AlertLevel.ERROR: "#ff0000",
                AlertLevel.CRITICAL: "#8B0000"
            }.get(alert.level, "#808080")
            
            slack_payload = {
                "username": "Stegmaier LMS Monitor",
                "icon_emoji": ":warning:",
                "attachments": [{
                    "color": color,
                    "title": f"{alert.level.value.upper()}: {alert.title}",
                    "text": alert.message,
                    "fields": [
                        {"title": "Service", "value": alert.service, "short": True},
                        {"title": "Time", "value": alert.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"), "short": True}
                    ] + [
                        {"title": k, "value": str(v), "short": True}
                        for k, v in alert.details.items()
                    ],
                    "footer": "Stegmaier LMS Monitoring",
                    "ts": int(alert.timestamp.timestamp())
                }]
            }
            
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(slack_webhook, json=slack_payload)
                response.raise_for_status()
            
            logger.info(f"Slack alert sent for {alert.id}")
            
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {str(e)}")
    
    async def _send_webhook_alert(self, alert: Alert):
        """Enviar alerta a webhook personalizado"""
        try:
            webhook_url = os.getenv("ALERT_WEBHOOK_URL")
            if not webhook_url:
                logger.warning("ALERT_WEBHOOK_URL not configured")
                return
            
            webhook_payload = {
                "alert": alert.to_dict(),
                "source": "stegmaier-lms-monitor",
                "environment": os.getenv("ENVIRONMENT", "production")
            }
            
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json=webhook_payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
            
            logger.info(f"Webhook alert sent for {alert.id}")
            
        except Exception as e:
            logger.error(f"Failed to send webhook alert: {str(e)}")
    
    async def _store_alert_in_db(self, alert: Alert):
        """Almacenar alerta en base de datos"""
        try:
            # Usar el sistema de base de datos existente
            from motor.motor_asyncio import AsyncIOMotorClient
            
            mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
            client = AsyncIOMotorClient(mongo_url)
            db = client[os.getenv("DATABASE_NAME", "stegmaier_lms")]
            
            alert_doc = alert.to_dict()
            await db.alerts.insert_one(alert_doc)
            
            logger.info(f"Alert stored in database: {alert.id}")
            
        except Exception as e:
            logger.error(f"Failed to store alert in database: {str(e)}")
    
    async def _send_sentry_alert(self, alert: Alert):
        """Enviar alerta a Sentry"""
        try:
            import sentry_sdk
            
            with sentry_sdk.configure_scope() as scope:
                scope.set_tag("alert_level", alert.level.value)
                scope.set_tag("service", alert.service)
                scope.set_context("alert_details", alert.details)
                
                if alert.level == AlertLevel.CRITICAL:
                    sentry_sdk.capture_message(
                        f"CRITICAL ALERT: {alert.title} - {alert.message}",
                        level="error"
                    )
                elif alert.level == AlertLevel.ERROR:
                    sentry_sdk.capture_message(
                        f"ERROR ALERT: {alert.title} - {alert.message}",
                        level="warning"
                    )
            
            logger.info(f"Sentry alert sent for {alert.id}")
            
        except Exception as e:
            logger.error(f"Failed to send Sentry alert: {str(e)}")
    
    async def _schedule_escalation(self, alert: Alert, escalation_minutes: int):
        """Programar escalación de alerta"""
        await asyncio.sleep(escalation_minutes * 60)
        
        # Verificar si la alerta sigue activa
        if alert.id in self.active_alerts and not alert.resolved:
            alert.escalated = True
            
            # Escalación: enviar a canales adicionales
            escalation_channels = [AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.WEBHOOK]
            
            escalated_alert = Alert(
                id=f"{alert.id}_escalated",
                level=AlertLevel.CRITICAL,
                service=alert.service,
                title=f"ESCALATED: {alert.title}",
                message=f"Alert not resolved after {escalation_minutes} minutes: {alert.message}",
                timestamp=datetime.utcnow(),
                details={**alert.details, "escalated_from": alert.id, "original_level": alert.level.value},
                channels=escalation_channels,
                escalated=True
            )
            
            await self._send_alert_notifications(escalated_alert)
            logger.error(f"Alert escalated: {alert.id}")
    
    async def resolve_alert(self, alert_id: str, resolved_by: str = "system") -> bool:
        """Resolver alerta manualmente"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.resolved = True
            alert.resolved_at = datetime.utcnow()
            alert.resolved_by = resolved_by
            
            del self.active_alerts[alert_id]
            
            logger.info(f"Alert resolved: {alert_id} by {resolved_by}")
            return True
        
        return False
    
    def get_active_alerts(self, level: Optional[AlertLevel] = None) -> List[Alert]:
        """Obtener alertas activas"""
        alerts = list(self.active_alerts.values())
        if level:
            alerts = [a for a in alerts if a.level == level]
        return sorted(alerts, key=lambda x: x.timestamp, reverse=True)
    
    def get_alert_history(self, hours: int = 24, level: Optional[AlertLevel] = None) -> List[Alert]:
        """Obtener historial de alertas"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        alerts = [a for a in self.alert_history if a.timestamp >= cutoff_time]
        
        if level:
            alerts = [a for a in alerts if a.level == level]
        
        return sorted(alerts, key=lambda x: x.timestamp, reverse=True)
    
    def get_alert_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Obtener estadísticas de alertas"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        recent_alerts = [a for a in self.alert_history if a.timestamp >= cutoff_time]
        
        stats = {
            "total_alerts": len(recent_alerts),
            "active_alerts": len(self.active_alerts),
            "by_level": {
                level.value: len([a for a in recent_alerts if a.level == level])
                for level in AlertLevel
            },
            "by_service": {},
            "resolution_time_avg_minutes": 0,
            "escalated_alerts": len([a for a in recent_alerts if a.escalated])
        }
        
        # Estadísticas por servicio
        for alert in recent_alerts:
            service = alert.service
            if service not in stats["by_service"]:
                stats["by_service"][service] = 0
            stats["by_service"][service] += 1
        
        # Tiempo promedio de resolución
        resolved_alerts = [a for a in recent_alerts if a.resolved and a.resolved_at]
        if resolved_alerts:
            total_resolution_time = sum([
                (a.resolved_at - a.timestamp).total_seconds() / 60
                for a in resolved_alerts
            ])
            stats["resolution_time_avg_minutes"] = round(total_resolution_time / len(resolved_alerts), 2)
        
        return stats

class AlertingBackgroundTask:
    """Tarea en background para monitoreo continuo"""
    
    def __init__(self, alert_manager: AlertManager, metrics_collector_func: Callable):
        self.alert_manager = alert_manager
        self.metrics_collector_func = metrics_collector_func
        self.running = False
        self.check_interval = 60  # 1 minuto
    
    async def start(self):
        """Iniciar monitoreo en background"""
        self.running = True
        logger.info("Starting alerting background task")
        
        while self.running:
            try:
                # Recopilar métricas
                metrics = await self.metrics_collector_func()
                
                # Verificar condiciones de alerta
                if metrics:
                    await self.alert_manager.check_conditions(metrics)
                
                # Esperar siguiente ciclo
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"Error in alerting background task: {str(e)}")
                await asyncio.sleep(self.check_interval)
    
    def stop(self):
        """Detener monitoreo"""
        self.running = False
        logger.info("Stopping alerting background task")

# Instancia global
alert_manager = AlertManager()

async def start_alerting_system(metrics_collector_func: Callable):
    """Iniciar sistema de alerting"""
    task = AlertingBackgroundTask(alert_manager, metrics_collector_func)
    asyncio.create_task(task.start())
    return task
