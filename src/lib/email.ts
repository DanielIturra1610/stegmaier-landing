// src/lib/email.ts
import type { EmailProvider, EmailPayload, EmailResponse } from '../types/email';

// Factory para proveedores de email
const createEmailProvider = (provider: string): EmailProvider => {
  switch (provider.toLowerCase()) {
    case 'sendgrid':
      return new SendGridProvider();
    //case 'ses':
    //  return new SESProvider();
    default:
      throw new Error(`Email provider "${provider}" not supported`);
  }
};

// Función principal exportada
export async function sendMail(payload: EmailPayload): Promise<EmailResponse> {
  const provider = process.env.EMAIL_PROVIDER || 'sendgrid';
  const emailProvider = createEmailProvider(provider);
  return emailProvider.send(payload);
}

// Implementación de SendGrid
class SendGridProvider implements EmailProvider {
  async send(payload: EmailPayload): Promise<EmailResponse> {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_KEY);

    const msg = {
      to: process.env.EMAIL_TO,
      from: process.env.EMAIL_FROM,
      subject: `Nuevo contacto: ${payload.subject || 'Formulario web'}`,
      text: this.generatePlainText(payload),
      html: this.generateHtml(payload),
    };

    try {
      await sgMail.send(msg);
      return { success: true, message: 'Email sent successfully' };
    } catch (error: any) {
      console.error('SendGrid error:', error);
      return { 
        success: false, 
        message: 'Failed to send email',
        error: error.message
      };
    }
  }

  // Helpers para generar contenido del email
  private generatePlainText(payload: EmailPayload): string {
    return `
      Nuevo mensaje de contacto:
      
      Nombre: ${payload.name}
      Email: ${payload.email}
      Empresa: ${payload.company || 'No especificada'}
      Teléfono: ${payload.phone || 'No especificado'}
      Servicio: ${payload.service || 'No especificado'}
      
      Mensaje:
      ${payload.message}
    `;
  }

  private generateHtml(payload: EmailPayload): string {
    return `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${this.sanitizeHtml(payload.name)}</p>
      <p><strong>Email:</strong> ${this.sanitizeHtml(payload.email)}</p>
      <p><strong>Empresa:</strong> ${this.sanitizeHtml(payload.company) || 'No especificada'}</p>
      <p><strong>Teléfono:</strong> ${this.sanitizeHtml(payload.phone) || 'No especificado'}</p>
      <p><strong>Servicio:</strong> ${this.sanitizeHtml(payload.service) || 'No especificado'}</p>
      <p><strong>Mensaje:</strong></p>
      <div style="padding: 15px; background-color: #f7f7f7; border-left: 4px solid #0070f3;">
        ${this.sanitizeHtml(payload.message).replace(/\n/g, '<br>')}
      </div>
    `;
  }

  private sanitizeHtml(input?: string): string {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Stub para futura implementación de SES
//class SESProvider implements EmailProvider {
//  async send(payload: EmailPayload): Promise<EmailResponse> {
//    // Implementación SES para el futuro
//    throw new Error('SES provider not implemented yet');
//  }
//}