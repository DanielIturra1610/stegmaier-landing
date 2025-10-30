"""
Sistema de alertas y notificaciones para producción
"""
import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import httpx
import os

logger = logging.getLogger(__name__)

class AlertLevel(str, Enum):
    INFO = "info"
    WARNING = "warning" 
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class Alert:
    level: AlertLevel
    service: str
    message: str
    timestamp: datetime
    details: Dict[str, Any] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    notification_sent: bool = False

class AlertManager:
    """Gestor de alertas y notificaciones"""
    
    def __init__(self):
        self.alerts_history: List[Alert] = []
        self.active_alerts: Dict[str, Alert] = {}
        self.notification_channels = self._setup_notification_channels()
        
    def _setup_notification_channels(self) -> Dict[str, Any]:
        """Configurar canales de notificación"""
        return {
            "email": {
                "enabled": bool(os.getenv("SMTP_HOST")),
                "smtp_host": os.getenv("SMTP_HOST"),
                "smtp_port": int(os.getenv("SMTP_PORT", "587")),
                "smtp_user": os.getenv("SMTP_USER"),
                "smtp_password": os.getenv("SMTP_PASSWORD"),
                "from_email": os.getenv("ALERT_FROM_EMAIL", "alerts@stegmaier-lms.com"),
                "to_emails": os.getenv("ALERT_TO_EMAILS", "").split(",")
            },
            "webhook": {
                "enabled": bool(os.getenv("ALERT_WEBHOOK_URL")),
                "url": os.getenv("ALERT_WEBHOOK_URL"),
                "headers": {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {os.getenv('ALERT_WEBHOOK_TOKEN', '')}"
                }
            },
            "slack": {
                "enabled": bool(os.getenv("SLACK_WEBHOOK_URL")),
                "webhook_url": os.getenv("SLACK_WEBHOOK_URL"),
                "channel": os.getenv("SLACK_CHANNEL", "#alerts")
            }
        }
    
    def create_alert(self, 
                    level: AlertLevel, 
                    service: str, 
                    message: str, 
                    details: Dict[str, Any] = None) -> Alert:
        """Crear nueva alerta"""
        alert = Alert(
            level=level,
            service=service,
            message=message,
            timestamp=datetime.utcnow(),
            details=details or {}
        )
        
        # Generar ID único para la alerta
        alert_id = f"{service}_{level}_{int(alert.timestamp.timestamp())}"
        
        # Agregar a historial
        self.alerts_history.append(alert)
        
        # Si es crítica o error, mantener activa
        if level in [AlertLevel.CRITICAL, AlertLevel.ERROR]:
            self.active_alerts[alert_id] = alert
        
        logger.info(f"Alert created: {alert_id} - {level} - {message}")
        
        return alert
    
    async def send_alert(self, alert_data: Dict[str, Any]):
        """Enviar alerta a todos los canales configurados"""
        alert = Alert(
            level=AlertLevel(alert_data["level"]),
            service=alert_data["service"],
            message=alert_data["message"],
            timestamp=datetime.utcnow(),
            details=alert_data.get("details", {})
        )
        
        # Enviar por email
        if self.notification_channels["email"]["enabled"]:
            await self._send_email_alert(alert)
        
        # Enviar por webhook
        if self.notification_channels["webhook"]["enabled"]:
            await self._send_webhook_alert(alert)
        
        # Enviar a Slack
        if self.notification_channels["slack"]["enabled"]:
            await self._send_slack_alert(alert)
        
        alert.notification_sent = True
        self.alerts_history.append(alert)
    
    async def _send_email_alert(self, alert: Alert):
        """Enviar alerta por email"""
        try:
            config = self.notification_channels["email"]
            
            # Crear mensaje
            msg = MimeMultipart()
            msg['From'] = config["from_email"]
            msg['To'] = ", ".join(config["to_emails"])
            msg['Subject'] = f"[{alert.level.upper()}] {alert.service}: {alert.message}"
            
            # Cuerpo del email
            body = f"""
            Alerta del Sistema LMS Stegmaier
            
            Nivel: {alert.level.upper()}
            Servicio: {alert.service}
            Mensaje: {alert.message}
            Timestamp: {alert.timestamp.isoformat()}
            
            Detalles:
            {json.dumps(alert.details, indent=2)}
            
            ---
            Sistema de Monitoreo LMS Stegmaier
            """
            
            msg.attach(MimeText(body, 'plain'))
            
            # Enviar
            server = smtplib.SMTP(config["smtp_host"], config["smtp_port"])
            server.starttls()
            server.login(config["smtp_user"], config["smtp_password"])
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email alert sent for {alert.service}")
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {str(e)}")
    
    async def _send_webhook_alert(self, alert: Alert):
        """Enviar alerta via webhook"""
        try:
            config = self.notification_channels["webhook"]
            
            payload = {
                "alert": {
                    "level": alert.level,
                    "service": alert.service,
                    "message": alert.message,
                    "timestamp": alert.timestamp.isoformat(),
                    "details": alert.details
                },
                "source": "stegmaier-lms",
                "environment": os.getenv("ENVIRONMENT", "production")
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    config["url"],
                    json=payload,
                    headers=config["headers"],
                    timeout=10.0
                )
                response.raise_for_status()
            
            logger.info(f"Webhook alert sent for {alert.service}")
            
        except Exception as e:
            logger.error(f"Failed to send webhook alert: {str(e)}")
    
    async def _send_slack_alert(self, alert: Alert):
        """Enviar alerta a Slack"""
        try:
            config = self.notification_channels["slack"]
            
            # Color según nivel
            color_map = {
                AlertLevel.INFO: "#36a64f",      # Verde
                AlertLevel.WARNING: "#ff9500",   # Naranja
                AlertLevel.ERROR: "#ff0000",     # Rojo
                AlertLevel.CRITICAL: "#8B0000"   # Rojo oscuro
            }
            
            # Emoji según nivel
            emoji_map = {
                AlertLevel.INFO: "ℹ️",
                AlertLevel.WARNING: "⚠️",
                AlertLevel.ERROR: "🚨",
                AlertLevel.CRITICAL: "🆘"
            }
            
            payload = {
                "channel": config["channel"],
                "username": "LMS Monitor",
                "icon_emoji": ":warning:",
                "attachments": [
                    {
                        "color": color_map.get(alert.level, "#cccccc"),
                        "title": f"{emoji_map.get(alert.level, '🔔')} {alert.level.upper()} Alert",
                        "fields": [
                            {
                                "title": "Service",
                                "value": alert.service,
                                "short": True
                            },
                            {
                                "title": "Message",
                                "value": alert.message,
                                "short": False
                            },
                            {
                                "title": "Timestamp",
                                "value": alert.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"),
                                "short": True
                            }
                        ],
                        "footer": "Stegmaier LMS Monitoring",
                        "ts": int(alert.timestamp.timestamp())
                    }
                ]
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    config["webhook_url"],
                    json=payload,
                    timeout=10.0
                )
                response.raise_for_status()
            
            logger.info(f"Slack alert sent for {alert.service}")
            
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {str(e)}")
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Marcar alerta como resuelta"""
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id].resolved = True
            self.active_alerts[alert_id].resolved_at = datetime.utcnow()
            del self.active_alerts[alert_id]
            logger.info(f"Alert resolved: {alert_id}")
            return True
        return False
    
    async def get_recent_alerts(self, limit: int = 50) -> Dict[str, Any]:
        """Obtener alertas recientes"""
        # Ordenar por timestamp descendente
        recent_alerts = sorted(
            self.alerts_history[-limit:], 
            key=lambda x: x.timestamp, 
            reverse=True
        )
        
        return {
            "total": len(self.alerts_history),
            "active_alerts": len(self.active_alerts),
            "recent_alerts": [
                {
                    "level": alert.level,
                    "service": alert.service,
                    "message": alert.message,
                    "timestamp": alert.timestamp.isoformat(),
                    "resolved": alert.resolved,
                    "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
                    "notification_sent": alert.notification_sent
                } for alert in recent_alerts
            ]
        }
    
    def get_alert_statistics(self) -> Dict[str, Any]:
        """Estadísticas de alertas"""
        if not self.alerts_history:
            return {"total": 0, "by_level": {}, "by_service": {}}
        
        # Contar por nivel
        by_level = {}
        for alert in self.alerts_history:
            level = alert.level
            by_level[level] = by_level.get(level, 0) + 1
        
        # Contar por servicio
        by_service = {}
        for alert in self.alerts_history:
            service = alert.service
            by_service[service] = by_service.get(service, 0) + 1
        
        # Alertas en las últimas 24 horas
        last_24h = datetime.utcnow() - timedelta(hours=24)
        alerts_24h = len([
            alert for alert in self.alerts_history 
            if alert.timestamp >= last_24h
        ])
        
        return {
            "total": len(self.alerts_history),
            "active": len(self.active_alerts),
            "last_24h": alerts_24h,
            "by_level": by_level,
            "by_service": by_service
        }

class HealthMonitoringService:
    """Servicio de monitoreo continuo"""
    
    def __init__(self, alert_manager: AlertManager):
        self.alert_manager = alert_manager
        self.monitoring_active = False
        self.monitoring_interval = int(os.getenv("MONITORING_INTERVAL", "300"))  # 5 minutos
    
    async def start_monitoring(self):
        """Iniciar monitoreo continuo"""
        self.monitoring_active = True
        logger.info("Health monitoring started")
        
        while self.monitoring_active:
            try:
                await self._check_and_alert()
                await asyncio.sleep(self.monitoring_interval)
            except Exception as e:
                logger.error(f"Error in monitoring loop: {str(e)}")
                await asyncio.sleep(60)  # Esperar 1 minuto antes de reintentar
    
    def stop_monitoring(self):
        """Detener monitoreo"""
        self.monitoring_active = False
        logger.info("Health monitoring stopped")
    
    async def _check_and_alert(self):
        """Verificar estado y enviar alertas si es necesario"""
        from app.monitoring.health_checks import health_monitor
        
        try:
            health_result = await health_monitor.comprehensive_health_check()
            
            # Verificar servicios unhealthy
            for service_name, service_data in health_result["services"].items():
                if service_data["status"] == "unhealthy":
                    alert = self.alert_manager.create_alert(
                        AlertLevel.CRITICAL,
                        service_name,
                        f"Service is unhealthy: {service_data['message']}",
                        service_data
                    )
                    await self.alert_manager.send_alert(asdict(alert))
                
                elif service_data["status"] == "degraded":
                    alert = self.alert_manager.create_alert(
                        AlertLevel.WARNING,
                        service_name,
                        f"Service is degraded: {service_data['message']}",
                        service_data
                    )
                    await self.alert_manager.send_alert(asdict(alert))
            
            # Verificar estado general
            if health_result["overall_status"] == "unhealthy":
                alert = self.alert_manager.create_alert(
                    AlertLevel.CRITICAL,
                    "system",
                    "System overall status is unhealthy",
                    {"summary": health_result["summary"]}
                )
                await self.alert_manager.send_alert(asdict(alert))
                
        except Exception as e:
            logger.error(f"Error in health check monitoring: {str(e)}")
            alert = self.alert_manager.create_alert(
                AlertLevel.ERROR,
                "monitoring_system",
                f"Health check monitoring failed: {str(e)}",
                {"error": str(e)}
            )
            await self.alert_manager.send_alert(asdict(alert))

# Instancias globales
alert_manager = AlertManager()
monitoring_service = HealthMonitoringService(alert_manager)
