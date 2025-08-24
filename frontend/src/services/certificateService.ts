import api from './api';

export interface Certificate {
  id: string;
  enrollmentId: string;
  courseId: string;
  courseName: string;
  studentName: string;
  instructorName: string;
  issueDate: string;
  completionDate: string;
  verificationCode: string;
  category: string;
  level: string;
  downloadUrl: string;
  verificationUrl: string;
  // Additional properties for template and UI
  courseCategory?: string;
  courseDuration?: string;
  grade?: string;
  title?: string;
  date?: string;
  status?: 'completed' | 'available';
  image?: string;
  progress?: number;
}

export interface CertificateGenerationData {
  enrollmentId: string;
  template?: string;
}

export interface CertificateVerification {
  isValid: boolean;
  certificate?: Certificate;
  message: string;
}

class CertificateService {
  private readonly baseUrl = '/certificates';

  /**
   * Obtener todos los certificados del usuario actual
   */
  async getUserCertificates(): Promise<Certificate[]> {
    try {
      const response = await api.get(`${this.baseUrl}/my-certificates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user certificates:', error);
      throw error;
    }
  }

  /**
   * Generar un nuevo certificado para una inscripción completada
   */
  async generateCertificate(data: CertificateGenerationData): Promise<Certificate> {
    try {
      const response = await api.post(`${this.baseUrl}/generate`, data);
      return response.data;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }

  /**
   * Obtener un certificado específico por ID
   */
  async getCertificate(certificateId: string): Promise<Certificate> {
    try {
      const response = await api.get(`${this.baseUrl}/${certificateId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate:', error);
      throw error;
    }
  }

  /**
   * Descargar certificado en PDF
   */
  async downloadCertificate(certificateId: string): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseUrl}/${certificateId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  }

  /**
   * Verificar autenticidad de un certificado
   */
  async verifyCertificate(verificationCode: string): Promise<CertificateVerification> {
    try {
      const response = await api.get(`${this.baseUrl}/verify/${verificationCode}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  }

  /**
   * Obtener URL para compartir certificado
   */
  getShareableUrl(verificationCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/certificates/verify/${verificationCode}`;
  }

  /**
   * Generar URL de vista previa del certificado
   */
  getPreviewUrl(certificateId: string): string {
    return `${this.baseUrl}/${certificateId}/download`;
  }
}

export default new CertificateService();
