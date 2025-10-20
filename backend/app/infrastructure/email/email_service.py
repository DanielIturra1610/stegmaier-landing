"""
Servicio de infraestructura para envío de emails
Integrado con el sistema de notificaciones de Stegmaier LMS
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
from jinja2 import Environment, FileSystemLoader
from pathlib import Path

from ...core.config import get_settings
from ...domain.entities.notification import NotificationType

settings = get_settings()


class EmailService:
    """Servicio para envío de emails con templates HTML"""

    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_use_tls = getattr(settings, 'SMTP_USE_TLS', True)
        self.from_email = settings.FROM_EMAIL
        self.from_name = getattr(settings, 'FROM_NAME', 'Stegmaier LMS')
        
        # Configurar Jinja2 para templates
        template_dir = Path(__file__).parent / 'templates'
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=True
        )

    async def send_email(
        self,
        to_email: str,
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        attachments: Optional[List[str]] = None
    ) -> bool:
        """Envía un email usando un template HTML"""
        try:
            # Renderizar template
            html_content = self._render_template(template_name, context)
            
            # Crear mensaje
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Agregar contenido HTML
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Agregar archivos adjuntos si existen
            if attachments:
                for file_path in attachments:
                    self._add_attachment(msg, file_path)
            
            # Enviar email
            await self._send_smtp_email(msg, to_email)
            return True
            
        except Exception as e:
            print(f"Error enviando email a {to_email}: {e}")
            return False

    async def send_welcome_email(
        self,
        user_email: str,
        user_name: str,
        verification_token: Optional[str] = None
    ) -> bool:
        """Envía email de bienvenida a nuevo usuario"""
        context = {
            'user_name': user_name,
            'login_url': f"{settings.FRONTEND_URL}/login",
            'verification_url': f"{settings.FRONTEND_URL}/verify-email?token={verification_token}" if verification_token else None,
            'platform_name': 'Stegmaier LMS',
            'support_email': settings.SUPPORT_EMAIL,
            'year': 2024
        }
        
        return await self.send_email(
            to_email=user_email,
            subject="¡Bienvenido a Stegmaier LMS!",
            template_name="welcome.html",
            context=context
        )

    async def send_course_completion_email(
        self,
        user_email: str,
        user_name: str,
        course_title: str,
        course_id: str,
        completion_date: str,
        certificate_url: Optional[str] = None
    ) -> bool:
        """Envía email de felicitación por completar curso"""
        context = {
            'user_name': user_name,
            'course_title': course_title,
            'completion_date': completion_date,
            'certificate_url': certificate_url,
            'course_url': f"{settings.FRONTEND_URL}/platform/courses/{course_id}",
            'certificates_url': f"{settings.FRONTEND_URL}/platform/certificates",
            'platform_name': 'Stegmaier LMS',
            'year': 2024
        }
        
        return await self.send_email(
            to_email=user_email,
            subject=f"¡Felicitaciones! Has completado {course_title}",
            template_name="course_completion.html",
            context=context
        )

    async def send_course_reminder_email(
        self,
        user_email: str,
        user_name: str,
        course_title: str,
        course_id: str,
        progress_percentage: int,
        last_activity: str
    ) -> bool:
        """Envía recordatorio para continuar curso"""
        context = {
            'user_name': user_name,
            'course_title': course_title,
            'progress_percentage': progress_percentage,
            'last_activity': last_activity,
            'course_url': f"{settings.FRONTEND_URL}/platform/courses/{course_id}",
            'dashboard_url': f"{settings.FRONTEND_URL}/platform/dashboard",
            'platform_name': 'Stegmaier LMS',
            'year': 2024
        }
        
        return await self.send_email(
            to_email=user_email,
            subject=f"Continúa tu progreso en {course_title}",
            template_name="course_reminder.html",
            context=context
        )

    async def send_new_course_notification_email(
        self,
        user_email: str,
        user_name: str,
        course_title: str,
        course_id: str,
        instructor_name: str,
        course_description: str
    ) -> bool:
        """Envía notificación de nuevo curso disponible"""
        context = {
            'user_name': user_name,
            'course_title': course_title,
            'instructor_name': instructor_name,
            'course_description': course_description,
            'course_url': f"{settings.FRONTEND_URL}/platform/courses/{course_id}",
            'courses_url': f"{settings.FRONTEND_URL}/platform/courses",
            'platform_name': 'Stegmaier LMS',
            'year': 2024
        }
        
        return await self.send_email(
            to_email=user_email,
            subject=f"Nuevo curso disponible: {course_title}",
            template_name="new_course.html",
            context=context
        )

    async def send_password_reset_email(
        self,
        user_email: str,
        user_name: str,
        reset_token: str
    ) -> bool:
        """Envía email para restablecer contraseña"""
        context = {
            'user_name': user_name,
            'reset_url': f"{settings.FRONTEND_URL}/reset-password?token={reset_token}",
            'platform_name': 'Stegmaier LMS',
            'support_email': settings.SUPPORT_EMAIL,
            'year': 2024
        }
        
        return await self.send_email(
            to_email=user_email,
            subject="Restablece tu contraseña - Stegmaier LMS",
            template_name="password_reset.html",
            context=context
        )

    async def send_notification_summary_email(
        self,
        user_email: str,
        user_name: str,
        notifications: List[Dict[str, Any]],
        period: str = "semanal"
    ) -> bool:
        """Envía resumen de notificaciones por email"""
        context = {
            'user_name': user_name,
            'notifications': notifications,
            'period': period,
            'notifications_count': len(notifications),
            'dashboard_url': f"{settings.FRONTEND_URL}/platform/dashboard",
            'notifications_url': f"{settings.FRONTEND_URL}/platform/notifications",
            'platform_name': 'Stegmaier LMS',
            'year': 2024
        }
        
        return await self.send_email(
            to_email=user_email,
            subject=f"Resumen {period} de actividades - Stegmaier LMS",
            template_name="notification_summary.html",
            context=context
        )

    def _render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """Renderiza un template HTML con Jinja2"""
        try:
            template = self.jinja_env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            print(f"Error renderizando template {template_name}: {e}")
            # Fallback a template básico
            return self._get_fallback_template(context)

    def _get_fallback_template(self, context: Dict[str, Any]) -> str:
        """Template HTML básico como fallback"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Stegmaier LMS</title>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Stegmaier LMS</h2>
            <p>Hola {context.get('user_name', 'Usuario')},</p>
            <p>Tienes una nueva notificación en la plataforma.</p>
            <p><a href="{context.get('dashboard_url', '#')}" style="color: #2563eb;">Ir al dashboard</a></p>
            <hr>
            <p style="font-size: 12px; color: #666;">
                Este es un email automático de Stegmaier LMS.
            </p>
        </body>
        </html>
        """

    def _add_attachment(self, msg: MIMEMultipart, file_path: str) -> None:
        """Agrega un archivo adjunto al email"""
        try:
            with open(file_path, "rb") as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())

            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {os.path.basename(file_path)}'
            )
            msg.attach(part)
        except Exception as e:
            print(f"Error agregando adjunto {file_path}: {e}")

    async def _send_smtp_email(self, msg: MIMEMultipart, to_email: str) -> None:
        """Envía email via SMTP"""
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            
            if self.smtp_use_tls:
                server.starttls()
                
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            
            server.send_message(msg)
            server.quit()
            
        except Exception as e:
            print(f"Error SMTP enviando a {to_email}: {e}")
            raise e

    def get_notification_email_template(self, notification_type: NotificationType) -> str:
        """Retorna el nombre del template según el tipo de notificación"""
        template_map = {
            NotificationType.COURSE_COMPLETION: "course_completion.html",
            NotificationType.NEW_COURSE: "new_course.html", 
            NotificationType.ENROLLMENT: "enrollment_confirmation.html",
            NotificationType.CERTIFICATE_AWARDED: "certificate_awarded.html",
            NotificationType.COURSE_PROGRESS: "course_reminder.html",
            NotificationType.SYSTEM_UPDATE: "system_update.html"
        }
        return template_map.get(notification_type, "generic_notification.html")
