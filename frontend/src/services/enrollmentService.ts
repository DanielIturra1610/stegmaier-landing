/**
 * Enrollment Service - Updated to match new backend API
 * ✅ Synchronized with backend controllers (25 endpoints)
 * Backend: internal/core/enrollments/controllers/enrollments.go
 */
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.config';
import type { CourseEnrollmentStatus, Enrollment } from '../types/enrollment';

// ============================================================
// TypeScript Interfaces (matching backend DTOs)
// ============================================================

export interface EnrollInCourseRequest {
  courseId: string;
  enrollmentType?: 'direct' | 'request';
  message?: string;
}

export interface EnrollmentResponse {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  courseId: string;
  courseName?: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  enrolledAt: string;
  expiresAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  progressPercentage: number;
  certificateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentDetailResponse extends EnrollmentResponse {
  courseDetails?: {
    title: string;
    description: string;
    instructorName: string;
    totalLessons: number;
    totalQuizzes: number;
    estimatedDuration: number;
  };
  progressDetails?: {
    completedLessons: number;
    completedQuizzes: number;
    totalTimeSpent: number;
    lastActivity: string;
  };
}

export interface EnrollmentRequestResponse {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  courseId: string;
  courseName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEnrollmentProgressRequest {
  progressPercentage?: number;
  lastAccessedAt?: string;
}

export interface ExtendEnrollmentRequest {
  expiresAt: string;
  reason?: string;
}

export interface ApproveEnrollmentRequestRequest {
  expiresAt?: string;
  message?: string;
}

export interface RejectEnrollmentRequestRequest {
  rejectionReason: string;
}

export interface EnrollmentProgressResponse {
  enrollmentId: string;
  courseId: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  completedQuizzes: number;
  totalQuizzes: number;
  isCompleted: boolean;
  certificateId?: string;
}

export interface EnrollmentStatsResponse {
  courseId: string;
  courseName?: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  expiredEnrollments: number;
  cancelledEnrollments: number;
  averageProgress: number;
  completionRate: number;
  averageTimeSpent: number;
}

export interface ListEnrollmentsResponse {
  enrollments: EnrollmentResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListEnrollmentRequestsResponse {
  requests: EnrollmentRequestResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// Enrollment Service Class
// ============================================================

class EnrollmentService {
  // ============================================================
  // Student Enrollment Operations
  // ============================================================

  /**
   * Enroll in a course (direct enrollment)
   * POST /api/v1/enrollments/enroll
   */
  async enrollInCourse(courseId: string): Promise<EnrollmentResponse> {
    try {
      console.log('🎓 [enrollmentService] Enrolling in course:', courseId);

      const response = await axios.post<EnrollmentResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/enroll`),
        { courseId },
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Successfully enrolled:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error enrolling:', error);
      throw new Error(error.response?.data?.error || 'Failed to enroll in course');
    }
  }

  /**
   * Get my enrollments (paginated)
   * GET /api/v1/enrollments/my
   */
  async getMyEnrollments(page = 1, pageSize = 20, status?: string): Promise<ListEnrollmentsResponse> {
    try {
      console.log('📚 [enrollmentService] Getting my enrollments');

      const params: any = { page, pageSize };
      if (status) params.status = status;

      const response = await axios.get<ListEnrollmentsResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/my`),
        { headers: getAuthHeaders(), params }
      );

      console.log('✅ [enrollmentService] Retrieved enrollments:', response.data.totalCount);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting enrollments:', error);
      throw new Error(error.response?.data?.error || 'Failed to get enrollments');
    }
  }

  /**
   * Alias for getMyEnrollments() for backwards compatibility
   * Returns just the enrollments array without pagination
   */
  async getUserEnrolledCourses(): Promise<EnrollmentResponse[]> {
    const response = await this.getMyEnrollments(1, 100); // Get first 100 enrollments
    return response.enrollments;
  }

  /**
   * Get my enrollment details for a specific enrollment
   * GET /api/v1/enrollments/my/:enrollmentId
   */
  async getMyEnrollment(enrollmentId: string): Promise<EnrollmentDetailResponse> {
    try {
      console.log('🔍 [enrollmentService] Getting enrollment details:', enrollmentId);

      const response = await axios.get<EnrollmentDetailResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/my/${enrollmentId}`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Retrieved enrollment details');
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting enrollment:', error);
      throw new Error(error.response?.data?.error || 'Failed to get enrollment details');
    }
  }

  /**
   * Cancel my enrollment
   * POST /api/v1/enrollments/my/:enrollmentId/cancel
   */
  async cancelMyEnrollment(enrollmentId: string, reason?: string): Promise<void> {
    try {
      console.log('🔄 [enrollmentService] Cancelling enrollment:', enrollmentId);

      await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/my/${enrollmentId}/cancel`),
        { reason },
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Enrollment cancelled');
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error cancelling enrollment:', error);
      throw new Error(error.response?.data?.error || 'Failed to cancel enrollment');
    }
  }

  /**
   * Check if I have access to a course
   * GET /api/v1/enrollments/courses/:courseId/access
   */
  async checkCourseAccess(courseId: string): Promise<{ hasAccess: boolean; enrollment?: EnrollmentResponse }> {
    try {
      console.log('🔑 [enrollmentService] Checking course access:', courseId);

      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/courses/${courseId}/access`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Access check completed');
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error checking access:', error);
      return { hasAccess: false };
    }
  }

  /**
   * Record course access (for tracking last accessed)
   * POST /api/v1/enrollments/courses/:courseId/access
   */
  async recordCourseAccess(courseId: string): Promise<void> {
    try {
      console.log('📊 [enrollmentService] Recording course access:', courseId);

      await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/courses/${courseId}/access`),
        {},
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Course access recorded');
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error recording access:', error);
      // Don't throw - this is a tracking operation
    }
  }

  // ============================================================
  // Enrollment Request Operations (Approval-based enrollment)
  // ============================================================

  /**
   * Request enrollment in a course (requires approval)
   * POST /api/v1/enrollment-requests
   */
  async requestEnrollment(courseId: string, message?: string): Promise<EnrollmentRequestResponse> {
    try {
      console.log('📝 [enrollmentService] Requesting enrollment:', courseId);

      const response = await axios.post<EnrollmentRequestResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}-requests`),
        { courseId, message },
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Enrollment request created');
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error requesting enrollment:', error);
      throw new Error(error.response?.data?.error || 'Failed to request enrollment');
    }
  }

  /**
   * Get my enrollment requests
   * GET /api/v1/enrollment-requests/my
   */
  async getMyEnrollmentRequests(page = 1, pageSize = 20): Promise<ListEnrollmentRequestsResponse> {
    try {
      console.log('📋 [enrollmentService] Getting my enrollment requests');

      const response = await axios.get<ListEnrollmentRequestsResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}-requests/my`),
        { headers: getAuthHeaders(), params: { page, pageSize } }
      );

      console.log('✅ [enrollmentService] Retrieved enrollment requests:', response.data.totalCount);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting requests:', error);
      throw new Error(error.response?.data?.error || 'Failed to get enrollment requests');
    }
  }

  /**
   * Cancel an enrollment request
   * POST /api/v1/enrollment-requests/:requestId/cancel
   */
  async cancelEnrollmentRequest(requestId: string): Promise<void> {
    try {
      console.log('🔄 [enrollmentService] Cancelling enrollment request:', requestId);

      await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}-requests/${requestId}/cancel`),
        {},
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Enrollment request cancelled');
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error cancelling request:', error);
      throw new Error(error.response?.data?.error || 'Failed to cancel enrollment request');
    }
  }

  // ============================================================
  // Admin/Instructor Enrollment Management
  // ============================================================

  /**
   * Get enrollment by ID (admin/instructor)
   * GET /api/v1/enrollments/:enrollmentId
   */
  async getEnrollment(enrollmentId: string): Promise<EnrollmentDetailResponse> {
    try {
      console.log('🔍 [enrollmentService] Getting enrollment:', enrollmentId);

      const response = await axios.get<EnrollmentDetailResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Retrieved enrollment');
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting enrollment:', error);
      throw new Error(error.response?.data?.error || 'Failed to get enrollment');
    }
  }

  /**
   * List all enrollments with filters (admin/instructor)
   * GET /api/v1/enrollments
   */
  async listEnrollments(
    page = 1,
    pageSize = 20,
    filters?: { status?: string; courseId?: string; userId?: string }
  ): Promise<ListEnrollmentsResponse> {
    try {
      console.log('📋 [enrollmentService] Listing enrollments');

      const params: any = { page, pageSize, ...filters };

      const response = await axios.get<ListEnrollmentsResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}`),
        { headers: getAuthHeaders(), params }
      );

      console.log('✅ [enrollmentService] Retrieved enrollments:', response.data.totalCount);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error listing enrollments:', error);
      throw new Error(error.response?.data?.error || 'Failed to list enrollments');
    }
  }

  /**
   * Get course enrollments (admin/instructor)
   * GET /api/v1/enrollments/courses/:courseId
   */
  async getCourseEnrollments(courseId: string, page = 1, pageSize = 20): Promise<ListEnrollmentsResponse> {
    try {
      console.log('👥 [enrollmentService] Getting course enrollments:', courseId);

      const response = await axios.get<ListEnrollmentsResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/courses/${courseId}`),
        { headers: getAuthHeaders(), params: { page, pageSize } }
      );

      console.log('✅ [enrollmentService] Retrieved course enrollments:', response.data.totalCount);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting course enrollments:', error);
      throw new Error(error.response?.data?.error || 'Failed to get course enrollments');
    }
  }

  /**
   * Update enrollment progress (admin/instructor)
   * PUT /api/v1/enrollments/:enrollmentId/progress
   */
  async updateEnrollmentProgress(
    enrollmentId: string,
    data: UpdateEnrollmentProgressRequest
  ): Promise<EnrollmentResponse> {
    try {
      console.log('📊 [enrollmentService] Updating enrollment progress:', enrollmentId);

      const response = await axios.put<EnrollmentResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}/progress`),
        data,
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Progress updated');
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error updating progress:', error);
      throw new Error(error.response?.data?.error || 'Failed to update progress');
    }
  }

  /**
   * Complete enrollment (admin/instructor)
   * POST /api/v1/enrollments/:enrollmentId/complete
   */
  async completeEnrollment(enrollmentId: string): Promise<void> {
    try {
      console.log('✅ [enrollmentService] Completing enrollment:', enrollmentId);

      await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}/complete`),
        {},
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Enrollment completed');
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error completing enrollment:', error);
      throw new Error(error.response?.data?.error || 'Failed to complete enrollment');
    }
  }

  /**
   * Cancel enrollment (admin/instructor)
   * POST /api/v1/enrollments/:enrollmentId/cancel
   */
  async cancelEnrollment(enrollmentId: string, reason?: string): Promise<void> {
    try {
      console.log('🔄 [enrollmentService] Cancelling enrollment:', enrollmentId);

      await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}/cancel`),
        { reason },
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Enrollment cancelled');
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error cancelling enrollment:', error);
      throw new Error(error.response?.data?.error || 'Failed to cancel enrollment');
    }
  }

  /**
   * Extend enrollment expiration (admin/instructor)
   * POST /api/v1/enrollments/:enrollmentId/extend
   */
  async extendEnrollment(enrollmentId: string, data: ExtendEnrollmentRequest): Promise<EnrollmentResponse> {
    try {
      console.log('📅 [enrollmentService] Extending enrollment:', enrollmentId);

      const response = await axios.post<EnrollmentResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}/extend`),
        data,
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Enrollment extended');
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error extending enrollment:', error);
      throw new Error(error.response?.data?.error || 'Failed to extend enrollment');
    }
  }

  /**
   * Delete enrollment (admin)
   * DELETE /api/v1/enrollments/:enrollmentId
   */
  async deleteEnrollment(enrollmentId: string): Promise<void> {
    try {
      console.log('🗑️ [enrollmentService] Deleting enrollment:', enrollmentId);

      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Enrollment deleted');
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error deleting enrollment:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete enrollment');
    }
  }

  /**
   * Get enrollment statistics for a course (admin/instructor)
   * GET /api/v1/enrollments/courses/:courseId/stats
   */
  async getCourseEnrollmentStats(courseId: string): Promise<EnrollmentStatsResponse> {
    try {
      console.log('📈 [enrollmentService] Getting enrollment stats:', courseId);

      const response = await axios.get<EnrollmentStatsResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/courses/${courseId}/stats`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Retrieved enrollment stats');
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting stats:', error);
      throw new Error(error.response?.data?.error || 'Failed to get enrollment statistics');
    }
  }

  /**
   * Process expired enrollments (admin - system operation)
   * POST /api/v1/enrollments/process-expired
   */
  async processExpiredEnrollments(): Promise<{ processedCount: number }> {
    try {
      console.log('⏰ [enrollmentService] Processing expired enrollments');

      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/process-expired`),
        {},
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Processed expired enrollments:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error processing expired enrollments:', error);
      throw new Error(error.response?.data?.error || 'Failed to process expired enrollments');
    }
  }

  // ============================================================
  // Enrollment Request Management (Admin/Instructor)
  // ============================================================

  /**
   * Get enrollment request details (admin/instructor)
   * GET /api/v1/enrollment-requests/:requestId
   */
  async getEnrollmentRequest(requestId: string): Promise<EnrollmentRequestResponse> {
    try {
      console.log('🔍 [enrollmentService] Getting enrollment request:', requestId);

      const response = await axios.get<EnrollmentRequestResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}-requests/${requestId}`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Retrieved enrollment request');
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting request:', error);
      throw new Error(error.response?.data?.error || 'Failed to get enrollment request');
    }
  }

  /**
   * List enrollment requests with filters (admin/instructor)
   * GET /api/v1/enrollment-requests
   */
  async listEnrollmentRequests(
    page = 1,
    pageSize = 20,
    filters?: { status?: string; courseId?: string; userId?: string }
  ): Promise<ListEnrollmentRequestsResponse> {
    try {
      console.log('📋 [enrollmentService] Listing enrollment requests');

      const params: any = { page, pageSize, ...filters };

      const response = await axios.get<ListEnrollmentRequestsResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}-requests`),
        { headers: getAuthHeaders(), params }
      );

      console.log('✅ [enrollmentService] Retrieved requests:', response.data.totalCount);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error listing requests:', error);
      throw new Error(error.response?.data?.error || 'Failed to list enrollment requests');
    }
  }

  /**
   * Get pending enrollment requests for a course (admin/instructor)
   * GET /api/v1/enrollment-requests/courses/:courseId/pending
   */
  async getCoursePendingRequests(courseId: string, page = 1, pageSize = 20): Promise<ListEnrollmentRequestsResponse> {
    try {
      console.log('⏳ [enrollmentService] Getting pending requests for course:', courseId);

      const response = await axios.get<ListEnrollmentRequestsResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}-requests/courses/${courseId}/pending`),
        { headers: getAuthHeaders(), params: { page, pageSize } }
      );

      console.log('✅ [enrollmentService] Retrieved pending requests:', response.data.totalCount);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting pending requests:', error);
      throw new Error(error.response?.data?.error || 'Failed to get pending requests');
    }
  }

  /**
   * Approve enrollment request (admin/instructor)
   * POST /api/v1/enrollment-requests/:requestId/approve
   */
  async approveEnrollmentRequest(
    requestId: string,
    data?: ApproveEnrollmentRequestRequest
  ): Promise<EnrollmentResponse> {
    try {
      console.log('✅ [enrollmentService] Approving enrollment request:', requestId);

      const response = await axios.post<EnrollmentResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}-requests/${requestId}/approve`),
        data || {},
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Request approved, enrollment created');
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error approving request:', error);
      throw new Error(error.response?.data?.error || 'Failed to approve enrollment request');
    }
  }

  /**
   * Reject enrollment request (admin/instructor)
   * POST /api/v1/enrollment-requests/:requestId/reject
   */
  async rejectEnrollmentRequest(requestId: string, data: RejectEnrollmentRequestRequest): Promise<void> {
    try {
      console.log('❌ [enrollmentService] Rejecting enrollment request:', requestId);

      await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}-requests/${requestId}/reject`),
        data,
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Request rejected');
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error rejecting request:', error);
      throw new Error(error.response?.data?.error || 'Failed to reject enrollment request');
    }
  }

  /**
   * Get enrollment progress - used by CertificateEligibilityChecker
   * Returns progress data for an enrollment
   */
  async getEnrollmentProgress(enrollmentId: string): Promise<EnrollmentProgressResponse> {
    try {
      console.log('📊 [enrollmentService] Getting enrollment progress:', enrollmentId);
      const response = await axios.get<EnrollmentDetailResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}`),
        { headers: getAuthHeaders() }
      );

      // Transform to EnrollmentProgressResponse format
      const data = response.data;
      return {
        enrollmentId: data.id,
        courseId: data.courseId,
        progressPercentage: data.progressPercentage,
        completedLessons: data.progressDetails?.completedLessons || 0,
        totalLessons: data.courseDetails?.totalLessons || 0,
        completedQuizzes: data.progressDetails?.completedQuizzes || 0,
        totalQuizzes: data.courseDetails?.totalQuizzes || 0,
        isCompleted: data.status === 'completed',
        certificateId: data.certificateId
      };
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting enrollment progress:', error);
      throw error;
    }
  }

  /**
   * Unenroll from a course - used by MyCourses page
   */
  async unenrollFromCourse(courseId: string): Promise<void> {
    try {
      console.log('🚪 [enrollmentService] Unenrolling from course:', courseId);

      // First get my enrollment for this course
      const enrollments = await this.getMyEnrollments();
      const enrollment = enrollments.find(e => e.courseId === courseId);

      if (enrollment) {
        await this.cancelEnrollment(enrollment.id);
      }

      console.log('✅ [enrollmentService] Successfully unenrolled');
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error unenrolling:', error);
      throw error;
    }
  }

  /**
   * Get enrollment status for a specific course
   * Checks if user is enrolled and can enroll
   */
  async getEnrollmentStatus(courseId: string): Promise<CourseEnrollmentStatus> {
    try {
      console.log('🔍 [enrollmentService] Checking enrollment status for course:', courseId);

      // Use checkCourseAccess to determine enrollment status
      const accessCheck = await this.checkCourseAccess(courseId);

      // Transform the response to match CourseEnrollmentStatus interface
      const status: CourseEnrollmentStatus = {
        course_id: courseId,
        is_enrolled: accessCheck.hasAccess,
        enrollment: accessCheck.enrollment ? {
          id: accessCheck.enrollment.id,
          user_id: accessCheck.enrollment.userId,
          course_id: courseId,
          status: accessCheck.enrollment.status as 'active' | 'completed' | 'expired' | 'cancelled',
          progress: 0, // Will be populated if enrollment exists
          completed_lessons: [],
          enrollment_date: accessCheck.enrollment.enrolledAt,
          certificate_issued: false,
          user_role: 'student'
        } : undefined,
        can_enroll: !accessCheck.hasAccess, // Can enroll if not already enrolled
        enrollment_restrictions: accessCheck.hasAccess ? ['Ya está inscrito en este curso'] : []
      };

      console.log('✅ [enrollmentService] Enrollment status:', status);
      return status;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error checking enrollment status:', error);
      // Return default status allowing enrollment on error
      return {
        course_id: courseId,
        is_enrolled: false,
        can_enroll: true,
        enrollment_restrictions: []
      };
    }
  }
}

// Export singleton instance
const enrollmentService = new EnrollmentService();
export default enrollmentService;
