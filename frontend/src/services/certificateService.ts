import axios from 'axios';
import { buildApiUrl, getAuthHeaders } from '../config/api.config';

interface APIError {
  response?: {
    status: number;
    data: {
      detail: string;
    };
  };
}

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
      // El endpoint correcto en backend es /certificates/user, no /my-certificates
      const fullUrl = buildApiUrl(`${this.baseUrl}/user`);
      console.log('🔍 [certificateService] Fetching user certificates from:', fullUrl);
      
      const response = await axios.get(fullUrl, { headers: getAuthHeaders() });
      console.log('✅ [certificateService] User certificates loaded:', response.data?.length || 0, 'certificates');
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [certificateService] Get user certificates error:', apiError);
      const errorMessage = apiError.response?.data?.detail || 'Error fetching user certificates';
      throw new Error(errorMessage);
    }
  }

  /**
   * Generar un nuevo certificado para una inscripción completada
   */
  async generateCertificate(data: CertificateGenerationData): Promise<Certificate> {
    try {
      console.log('🔍 [certificateService] Generating certificate for enrollment:', data.enrollmentId);
      const response = await axios.post(buildApiUrl(`${this.baseUrl}/generate`), data, { headers: getAuthHeaders() });
      console.log('✅ [certificateService] Certificate generated successfully:', response.data?.id);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [certificateService] Generate certificate error:', apiError);
      const errorMessage = apiError.response?.data?.detail || 'Error generating certificate';
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtener un certificado específico por ID
   */
  async getCertificate(certificateId: string): Promise<Certificate> {
    try {
      console.log('🔍 [certificateService] Fetching certificate:', certificateId);
      const response = await axios.get(buildApiUrl(`${this.baseUrl}/${certificateId}/verify`), { headers: getAuthHeaders() });
      console.log('✅ [certificateService] Certificate loaded:', response.data?.verificationCode);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [certificateService] Get certificate error:', apiError);
      const errorMessage = apiError.response?.data?.detail || 'Error fetching certificate';
      throw new Error(errorMessage);
    }
  }

  /**
   * Descargar certificado en PDF
   */
  async downloadCertificate(certificateId: string): Promise<Blob> {
    try {
      console.log('🔍 [certificateService] Downloading certificate:', certificateId);
      const response = await axios.get(buildApiUrl(`${this.baseUrl}/${certificateId}/download`), { headers: getAuthHeaders(), responseType: 'blob' });
      console.log('✅ [certificateService] Certificate downloaded, size:', response.data?.size || 'unknown');
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [certificateService] Download certificate error:', apiError);
      const errorMessage = apiError.response?.data?.detail || 'Error downloading certificate';
      throw new Error(errorMessage);
    }
  }

  /**
   * Verificar autenticidad de un certificado
   */
  async verifyCertificate(verificationCode: string): Promise<CertificateVerification> {
    try {
      console.log('🔍 [certificateService] Verifying certificate code:', verificationCode);
      const response = await axios.get(buildApiUrl(`${this.baseUrl}/verify/${verificationCode}`), { headers: getAuthHeaders() });
      console.log('✅ [certificateService] Certificate verification result:', response.data?.isValid ? 'VALID' : 'INVALID');
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [certificateService] Verify certificate error:', apiError);
      const errorMessage = apiError.response?.data?.detail || 'Error verifying certificate';
      throw new Error(errorMessage);
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
