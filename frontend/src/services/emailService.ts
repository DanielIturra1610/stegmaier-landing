/**
 * Email Service - Placeholder para funcionalidad de correo
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  async sendEmail(data: EmailData): Promise<boolean> {
    // Placeholder - en producción se conectaría a un servicio real
    console.log('Email would be sent:', data);
    return true;
  }

  async sendBulkEmails(emails: EmailData[]): Promise<boolean> {
    // Placeholder - en producción se conectaría a un servicio real
    console.log('Bulk emails would be sent:', emails.length, 'emails');
    return true;
  }

  // Alias para compatibilidad con código existente
  async sendBulkEmail(emails: EmailData[]): Promise<boolean> {
    return this.sendBulkEmails(emails);
  }
}

export const emailService = new EmailService();
export default emailService;