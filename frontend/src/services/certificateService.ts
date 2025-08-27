import axios from 'axios';
import { buildApiUrl, getAuthHeaders } from '../config/api.config';

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
      const response = await axios.get(buildApiUrl(`${this.baseUrl}/my-certificates`), { headers: getAuthHeaders() });
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
      const response = await axios.post(buildApiUrl(`${this.baseUrl}/generate`), data, { headers: getAuthHeaders() });
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
      const response = await axios.get(buildApiUrl(`${this.baseUrl}/${certificateId}/verify`), { headers: getAuthHeaders() });
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
      const response = await axios.get(buildApiUrl(`${this.baseUrl}/${certificateId}/download`), { headers: getAuthHeaders(), responseType: 'blob' });
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
      const response = await axios.get(buildApiUrl(`${this.baseUrl}/verify/${verificationCode}`), { headers: getAuthHeaders() });
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
