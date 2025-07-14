// src/types/email.ts

export interface EmailPayload {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  service: string;
  message: string;
  subject?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
  status_code?: number;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<EmailResponse>;
}

export interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
  _gotcha: string;
}