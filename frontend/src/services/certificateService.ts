/**
 * Certificate Service
 * Manages certificate generation, verification, and template management
 * Synchronized with backend Certificates Controller (18 endpoints)
 */

import axios from 'axios';
import { API_ENDPOINTS, getAuthHeaders, buildApiUrl } from '../config/api.config';

// ============================================================
// TypeScript Interfaces matching Backend DTOs
// ============================================================

export enum CertificateStatus {
  ISSUED = 'issued',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export interface GenerateCertificateRequest {
  userId: string;
  courseId: string;
  enrollmentId: string;
  progressId: string;
  completionDate?: string; // ISO 8601 format
  grade?: number; // 0-100
  templateId?: string;
}

export interface VerifyCertificateRequest {
  certificateNumber: string;
  verificationCode: string;
}

export interface RevokeCertificateRequest {
  reason: string; // Min 10 characters, max 500
}

export interface ListCertificatesRequest {
  page?: number;
  pageSize?: number;
  userId?: string;
  courseId?: string;
  status?: CertificateStatus;
  issuedAfter?: string; // ISO 8601 format
  issuedBefore?: string; // ISO 8601 format
  sortBy?: 'issued_at' | 'certificate_number' | 'completion_date';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTemplateRequest {
  name: string; // Min 3 characters
  description?: string;
  templatePath: string;
  configuration?: string;
}

export interface UpdateTemplateRequest {
  name?: string; // Min 3 characters
  description?: string;
  templatePath?: string;
  configuration?: string;
}

export interface CertificateResponse {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  courseId: string;
  courseName?: string;
  enrollmentId: string;
  progressId: string;
  certificateNumber: string;
  status: CertificateStatus;
  issuedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  templateId?: string;
  completionDate: string;
  grade?: number;
  totalTimeSpent: number;
  isValid: boolean;
  isExpired: boolean;
  isRevoked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateDetailResponse extends CertificateResponse {
  verificationCode: string;
  metadata?: Record<string, string>;
  downloadUrl: string;
  verificationUrl: string;
}

export interface CertificateVerificationResponse {
  isValid: boolean;
  certificateNumber: string;
  status: CertificateStatus;
  userName?: string;
  courseName?: string;
  issuedAt: string;
  completionDate: string;
  expiresAt?: string;
  revokedAt?: string;
  revocationReason?: string;
}

export interface CertificateTemplateResponse {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  templatePath: string;
  isDefault: boolean;
  isActive: boolean;
  configuration: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListCertificatesResponse {
  certificates: CertificateResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CertificateStatisticsResponse {
  totalCertificates: number;
  issuedCertificates: number;
  revokedCertificates: number;
  expiredCertificates: number;
  averageGrade: number;
  averageTimeSpent: number; // Minutes
}

export interface CourseStatisticsResponse {
  courseId: string;
  courseName?: string;
  totalCertificates: number;
  issuedCertificates: number;
  revokedCertificates: number;
  averageGrade: number;
  averageTimeSpent: number;
}

// ============================================================
// Certificate Service Class
// ============================================================

class CertificateService {
  // ============================================================
  // Student Operations (3 endpoints)
  // ============================================================

  /**
   * GET /api/v1/certificates/my
   * List all certificates for current user
   */
  async getMyCertificates(
    page = 1,
    pageSize = 20
  ): Promise<ListCertificatesResponse> {
    try {
      console.log('📜 [certificateService] Getting my certificates');
      const response = await axios.get<ListCertificatesResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/my`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );
      console.log('✅ [certificateService] My certificates retrieved:', response.data.totalCount, 'certificates');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error getting my certificates:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/certificates/my/courses/:courseId
   * Get certificate for a specific course
   */
  async getMyCertificate(courseId: string): Promise<CertificateDetailResponse> {
    try {
      console.log('📜 [certificateService] Getting my certificate for course:', courseId);
      const response = await axios.get<CertificateDetailResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/my/courses/${courseId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Certificate retrieved:', response.data.certificateNumber);
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error getting my certificate:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/certificates/:certificateId/download
   * Download certificate PDF
   */
  async downloadCertificate(certificateId: string): Promise<Blob> {
    try {
      console.log('📜 [certificateService] Downloading certificate:', certificateId);
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/${certificateId}/download`),
        {
          headers: getAuthHeaders(),
          responseType: 'blob'
        }
      );
      console.log('✅ [certificateService] Certificate downloaded, size:', response.data.size, 'bytes');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error downloading certificate:', error);
      throw error;
    }
  }

  // ============================================================
  // Admin/Instructor Management (6 endpoints)
  // ============================================================

  /**
   * POST /api/v1/certificates
   * Generate a new certificate (Admin/Instructor)
   */
  async generateCertificate(
    data: GenerateCertificateRequest
  ): Promise<CertificateResponse> {
    try {
      console.log('📜 [certificateService] Generating certificate for user:', data.userId);
      const response = await axios.post<CertificateResponse>(
        buildApiUrl(API_ENDPOINTS.CERTIFICATES),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Certificate generated:', response.data.certificateNumber);
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error generating certificate:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/certificates/:certificateId
   * Get certificate details by ID (Admin/Instructor)
   */
  async getCertificate(certificateId: string): Promise<CertificateDetailResponse> {
    try {
      console.log('📜 [certificateService] Getting certificate:', certificateId);
      const response = await axios.get<CertificateDetailResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/${certificateId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Certificate retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error getting certificate:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/v1/certificates/:certificateId
   * Delete a certificate (Admin only)
   */
  async deleteCertificate(certificateId: string): Promise<{ message: string }> {
    try {
      console.log('📜 [certificateService] Deleting certificate:', certificateId);
      const response = await axios.delete<{ message: string }>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/${certificateId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Certificate deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error deleting certificate:', error);
      throw error;
    }
  }

  /**
   * POST /api/v1/certificates/:certificateId/revoke
   * Revoke a certificate (Admin/Instructor)
   */
  async revokeCertificate(
    certificateId: string,
    data: RevokeCertificateRequest
  ): Promise<{ message: string }> {
    try {
      console.log('📜 [certificateService] Revoking certificate:', certificateId);
      const response = await axios.post<{ message: string }>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/${certificateId}/revoke`),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Certificate revoked successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error revoking certificate:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/certificates/courses/:courseId
   * List all certificates for a course (Admin/Instructor)
   */
  async getCourseCertificates(
    courseId: string,
    page = 1,
    pageSize = 20
  ): Promise<ListCertificatesResponse> {
    try {
      console.log('📜 [certificateService] Getting certificates for course:', courseId);
      const response = await axios.get<ListCertificatesResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/courses/${courseId}`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );
      console.log('✅ [certificateService] Course certificates retrieved:', response.data.totalCount, 'certificates');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error getting course certificates:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/certificates/users/:userId
   * List all certificates for a user (Admin/Instructor)
   */
  async getUserCertificates(
    userId: string,
    page = 1,
    pageSize = 20
  ): Promise<ListCertificatesResponse> {
    try {
      console.log('📜 [certificateService] Getting certificates for user:', userId);
      const response = await axios.get<ListCertificatesResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/users/${userId}`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );
      console.log('✅ [certificateService] User certificates retrieved:', response.data.totalCount, 'certificates');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error getting user certificates:', error);
      throw error;
    }
  }

  // ============================================================
  // Public Verification (1 endpoint)
  // ============================================================

  /**
   * POST /api/v1/certificates/verify
   * Verify certificate authenticity (Public - no auth required)
   */
  async verifyCertificate(
    data: VerifyCertificateRequest
  ): Promise<CertificateVerificationResponse> {
    try {
      console.log('📜 [certificateService] Verifying certificate:', data.certificateNumber);
      // Note: This endpoint doesn't require authentication
      const response = await axios.post<CertificateVerificationResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/verify`),
        data
      );
      console.log('✅ [certificateService] Certificate verification:', response.data.isValid ? 'VALID' : 'INVALID');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error verifying certificate:', error);
      throw error;
    }
  }

  // ============================================================
  // Statistics (2 endpoints)
  // ============================================================

  /**
   * GET /api/v1/certificates/statistics
   * Get overall certificate statistics (Admin/Instructor)
   */
  async getCertificateStatistics(): Promise<CertificateStatisticsResponse> {
    try {
      console.log('📜 [certificateService] Getting certificate statistics');
      const response = await axios.get<CertificateStatisticsResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/statistics`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Statistics retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/certificates/courses/:courseId/statistics
   * Get certificate statistics for a specific course (Admin/Instructor)
   */
  async getCourseStatistics(courseId: string): Promise<CourseStatisticsResponse> {
    try {
      console.log('📜 [certificateService] Getting statistics for course:', courseId);
      const response = await axios.get<CourseStatisticsResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/courses/${courseId}/statistics`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Course statistics retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error getting course statistics:', error);
      throw error;
    }
  }

  // ============================================================
  // Template Management (6 endpoints)
  // ============================================================

  /**
   * POST /api/v1/certificates/templates
   * Create a new certificate template (Admin only)
   */
  async createTemplate(
    data: CreateTemplateRequest
  ): Promise<CertificateTemplateResponse> {
    try {
      console.log('📜 [certificateService] Creating template:', data.name);
      const response = await axios.post<CertificateTemplateResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/templates`),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Template created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error creating template:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/certificates/templates
   * List all certificate templates (Admin/Instructor)
   */
  async getTemplates(): Promise<CertificateTemplateResponse[]> {
    try {
      console.log('📜 [certificateService] Getting certificate templates');
      const response = await axios.get<CertificateTemplateResponse[]>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/templates`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Templates retrieved:', response.data.length, 'templates');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error getting templates:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/certificates/templates/:templateId
   * Get specific template details (Admin/Instructor)
   */
  async getTemplate(templateId: string): Promise<CertificateTemplateResponse> {
    try {
      console.log('📜 [certificateService] Getting template:', templateId);
      const response = await axios.get<CertificateTemplateResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/templates/${templateId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Template retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error getting template:', error);
      throw error;
    }
  }

  /**
   * PUT /api/v1/certificates/templates/:templateId
   * Update a certificate template (Admin only)
   */
  async updateTemplate(
    templateId: string,
    data: UpdateTemplateRequest
  ): Promise<CertificateTemplateResponse> {
    try {
      console.log('📜 [certificateService] Updating template:', templateId);
      const response = await axios.put<CertificateTemplateResponse>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/templates/${templateId}`),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Template updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error updating template:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/v1/certificates/templates/:templateId
   * Delete a certificate template (Admin only)
   */
  async deleteTemplate(templateId: string): Promise<{ message: string }> {
    try {
      console.log('📜 [certificateService] Deleting template:', templateId);
      const response = await axios.delete<{ message: string }>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/templates/${templateId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Template deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error deleting template:', error);
      throw error;
    }
  }

  /**
   * POST /api/v1/certificates/templates/:templateId/set-default
   * Set a template as the default (Admin only)
   */
  async setDefaultTemplate(templateId: string): Promise<{ message: string }> {
    try {
      console.log('📜 [certificateService] Setting default template:', templateId);
      const response = await axios.post<{ message: string }>(
        buildApiUrl(`${API_ENDPOINTS.CERTIFICATES}/templates/${templateId}/set-default`),
        {},
        { headers: getAuthHeaders() }
      );
      console.log('✅ [certificateService] Default template set successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [certificateService] Error setting default template:', error);
      throw error;
    }
  }

  // ============================================================
  // Utility Functions
  // ============================================================

  /**
   * Get shareable verification URL for a certificate
   */
  getShareableUrl(certificateNumber: string, verificationCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/certificates/verify?number=${certificateNumber}&code=${verificationCode}`;
  }

  /**
   * Download certificate and trigger browser download
   */
  async downloadAndSave(certificateId: string, fileName?: string): Promise<void> {
    try {
      const blob = await this.downloadCertificate(certificateId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `certificate-${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('✅ [certificateService] Certificate download initiated');
    } catch (error) {
      console.error('❌ [certificateService] Error downloading and saving certificate:', error);
      throw error;
    }
  }

  /**
   * Format grade to display string
   */
  formatGrade(grade?: number): string {
    if (grade === undefined || grade === null) return 'N/A';
    return `${grade.toFixed(1)}%`;
  }

  /**
   * Format time spent to human-readable string
   */
  formatTimeSpent(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }
}

// Export singleton instance
const certificateService = new CertificateService();
export default certificateService;
