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
    
    // Usar la API key correcta
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SendGrid API Key no encontrada");
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: process.env.SENDGRID_TO || 'contacto@stegmaierconsulting.cl',
      from: process.env.SENDGRID_FROM || 'daniel.eduardo1610@gmail.com',
      replyTo: payload.email,
      subject: `Nuevo contacto: ${payload.subject || 'Formulario web'}`,
      text: this.generatePlainText(payload),
      html: this.generateHtml(payload),
      categories: ['landing-contact'],
    };

    try {
      const response = await sgMail.send(msg);
      return { 
        success: true, 
        message: 'Email enviado correctamente',
        messageId: response[0]?.messageId // Agregamos el messageId para debug
      };
    } catch (error: any) {
      console.error('SendGrid error:', error);
      return { 
        success: false, 
        message: 'Error al enviar el email',
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
      ${payload.company ? `Empresa: ${payload.company}` : ''}
      ${payload.phone ? `Teléfono: ${payload.phone}` : ''}
      ${payload.service ? `Servicio: ${payload.service}` : ''}
      
      Mensaje:
      ${payload.message}
    `;
  }

  private generateHtml(payload: EmailPayload): string {
    return `
      <h2>Nuevo mensaje desde stegmaierconsulting.cl</h2>
      <p><strong>Nombre:</strong> ${this.sanitizeHtml(payload.name)}</p>
      <p><strong>Email:</strong> ${this.sanitizeHtml(payload.email)}</p>
      ${payload.company ? `<p><strong>Empresa:</strong> ${this.sanitizeHtml(payload.company)}</p>` : ''}
      ${payload.phone ? `<p><strong>Teléfono:</strong> ${this.sanitizeHtml(payload.phone)}</p>` : ''}
      ${payload.service ? `<p><strong>Servicio:</strong> ${this.sanitizeHtml(payload.service)}</p>` : ''}
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