// src/types/email.ts

export interface EmailPayload {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    service?: string;
    subject?: string;
    message: string;
  }
  
  export interface EmailResponse {
    success: boolean;
    message: string;
    error?: string;
  }
  
  export interface EmailProvider {
    send(payload: EmailPayload): Promise<EmailResponse>;
  }