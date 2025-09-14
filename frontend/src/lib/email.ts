// src/lib/email.ts
import type { EmailPayload, EmailResponse } from '../types/email';
import { buildApiUrl } from '../config/api.config';

/**
 * ✅ SEGURIDAD: Email service refactorizado para usar backend API
 * 
 * PROBLEMA ANTERIOR:
 * - Frontend intentaba acceder a process.env.SENDGRID_API_KEY
 * - Credenciales backend expuestas en cliente
 * - Violación de seguridad crítica
 * 
 * SOLUCIÓN:
 * - Delegar envío de emails al backend
 * - Frontend solo envía payload al endpoint seguro
 * - Backend maneja credenciales de manera segura
 */

// Función principal exportada - Ahora usa backend API
export async function sendMail(payload: EmailPayload): Promise<EmailResponse> {
  try {
    console.log('📧 [EmailService] Sending email via backend API');
    
    const response = await fetch(buildApiUrl('/contact/send-email'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No auth required for contact form
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ [EmailService] Email sent successfully');
    return {
      success: true,
      message: result.message || 'Email enviado correctamente',
      messageId: result.messageId
    };
    
  } catch (error: any) {
    console.error('❌ [EmailService] Failed to send email:', error);
    
    return {
      success: false,
      message: 'Error al enviar el email. Por favor intenta nuevamente.',
      error: error.message
    };
  }
}

/**
 * Función de respaldo para casos donde el backend no esté disponible
 * Muestra mensaje apropiado al usuario
 */
export async function sendMailFallback(payload: EmailPayload): Promise<EmailResponse> {
  console.warn('⚠️ [EmailService] Using fallback - backend unavailable');
  
  // En un caso real, podrías:
  // 1. Guardar en localStorage para reintento posterior
  // 2. Mostrar información de contacto alternativa
  // 3. Usar un servicio de terceros directo (si tienes API keys públicas)
  
  return {
    success: false,
    message: 'Servicio de email temporalmente no disponible. Contacta directamente a contacto@stegmaierconsulting.cl',
    error: 'Backend service unavailable'
  };
}

/**
 * Utilidad para validar payload antes del envío
 */
export function validateEmailPayload(payload: EmailPayload): string[] {
  const errors: string[] = [];
  
  if (!payload.name?.trim()) {
    errors.push('Nombre es requerido');
  }
  
  if (!payload.email?.trim()) {
    errors.push('Email es requerido');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push('Email inválido');
  }
  
  if (!payload.message?.trim()) {
    errors.push('Mensaje es requerido');
  }
  
  if (payload.message && payload.message.length > 5000) {
    errors.push('Mensaje demasiado largo (máx. 5000 caracteres)');
  }
  
  return errors;
}