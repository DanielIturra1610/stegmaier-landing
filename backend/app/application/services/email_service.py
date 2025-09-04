"""
Servicio para el envío de correos electrónicos
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from pathlib import Path
from ...core.config import get_settings
from ...domain.entities.user import User

logger = logging.getLogger(__name__)

class EmailService:
    """
    Servicio para el envío de correos electrónicos usando SMTP
    """
    
    def __init__(self):
        self.settings = get_settings()
        
    async def send_welcome_email(self, user: User, verification_token: str) -> bool:
        """
        Envía un correo de bienvenida con enlace de verificación
        
        Args:
            user: Usuario al que enviar el correo
            verification_token: Token de verificación
            
        Returns:
            True si el correo se envió exitosamente, False en caso contrario
        """
        try:
            # Construir el enlace de verificación
            verification_link = f"{self.settings.FRONTEND_URL}/verify-email/{verification_token}"
            
            # Leer el template HTML
            template_path = Path(__file__).parent.parent.parent / "templates" / "email" / "welcome.html"
            
            if template_path.exists():
                with open(template_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Reemplazar variables en el template
                html_content = html_content.replace("{{user_name}}", user.first_name or user.email)
                html_content = html_content.replace("{{verification_link}}", verification_link)
                html_content = html_content.replace("{{user_email}}", user.email)
            else:
                # Template de fallback si no existe el archivo
                html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Bienvenido a Stegmaier LMS</title>
                </head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">¡Bienvenido a Stegmaier LMS!</h2>
                    <p>Hola {user.first_name or user.email},</p>
                    <p>Gracias por registrarte en nuestra plataforma de aprendizaje. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_link}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verificar Correo Electrónico</a>
                    </div>
                    <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
                    <p style="word-break: break-all; color: #666;">{verification_link}</p>
                    <p>Este enlace expirará en 24 horas.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 14px;">Saludos,<br>El equipo de Stegmaier LMS</p>
                </body>
                </html>
                """
            
            # Crear el mensaje
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "Verifica tu correo electrónico - Stegmaier LMS"
            msg['From'] = self.settings.EMAIL_FROM
            msg['To'] = user.email
            
            # Crear parte HTML
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Enviar el correo
            with smtplib.SMTP(self.settings.SMTP_SERVER, self.settings.SMTP_PORT) as server:
                server.starttls()
                server.login(self.settings.SMTP_USERNAME, self.settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Correo de verificación enviado exitosamente a {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error al enviar correo de verificación a {user.email}: {str(e)}")
            return False
    
    async def send_password_reset_email(self, user: User, reset_token: str) -> bool:
        """
        Envía un correo para restablecer contraseña
        
        Args:
            user: Usuario al que enviar el correo
            reset_token: Token de restablecimiento
            
        Returns:
            True si el correo se envió exitosamente, False en caso contrario
        """
        try:
            # Construir el enlace de restablecimiento
            reset_link = f"{self.settings.FRONTEND_URL}/reset-password/{reset_token}"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Restablecer Contraseña - Stegmaier LMS</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Restablecer Contraseña</h2>
                <p>Hola {user.first_name or user.email},</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer Contraseña</a>
                </div>
                <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
                <p>Este enlace expirará en 1 hora por seguridad.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 14px;">Saludos,<br>El equipo de Stegmaier LMS</p>
            </body>
            </html>
            """
            
            # Crear el mensaje
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "Restablecer Contraseña - Stegmaier LMS"
            msg['From'] = self.settings.EMAIL_FROM
            msg['To'] = user.email
            
            # Crear parte HTML
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Enviar el correo
            with smtplib.SMTP(self.settings.SMTP_SERVER, self.settings.SMTP_PORT) as server:
                server.starttls()
                server.login(self.settings.SMTP_USERNAME, self.settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Correo de restablecimiento enviado exitosamente a {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error al enviar correo de restablecimiento a {user.email}: {str(e)}")
            return False
