/**
 * Progress Service
 * Manages student progress tracking for courses, lessons, and quizzes
 * Synchronized with backend Progress Controller (16 endpoints)
 */

import axios from 'axios';
import { API_ENDPOINTS, getAuthHeaders, buildApiUrl } from '../config/api.config';

// ============================================================
// TypeScript Interfaces matching Backend DTOs
// ============================================================

export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum MilestoneType {
  MILESTONE_25 = '25%',
  MILESTONE_50 = '50%',
  MILESTONE_75 = '75%',
  MILESTONE_100 = '100%',
}

export interface UpdateProgressRequest {
  completedLessons: number;
  completedQuizzes: number;
  timeSpent: number; // Time in minutes
}

export interface RecordActivityRequest {
  lessonId?: string;
  quizId?: string;
  timeSpent: number; // Time in minutes
  completionStatus: boolean;
}

export interface CompleteCourseRequest {
  certificateId?: string;
}

export interface GetProgressHistoryRequest {
  page: number;
  pageSize: number;
  startDate?: string; // RFC3339 format
  endDate?: string; // RFC3339 format
  milestone?: string;
  sortBy?: string; // snapshot_date
  sortOrder?: 'asc' | 'desc';
}

export interface GetCourseStatisticsRequest {
  startDate?: string; // RFC3339 format
  endDate?: string; // RFC3339 format
  status?: ProgressStatus;
}

export interface CourseProgressResponse {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  courseId: string;
  courseName?: string;
  enrollmentId: string;
  status: ProgressStatus;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  completedQuizzes: number;
  totalQuizzes: number;
  totalTimeSpent: number; // Minutes
  completionRate: number; // 0.0 to 1.0
  estimatedTimeLeft?: number; // Minutes
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  certificateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgressDetailResponse extends CourseProgressResponse {
  daysActive: number;
  averageTimePerDay: number; // Minutes
  milestonesAchieved: MilestoneType[];
  recentSnapshots?: ProgressSnapshotResponse[];
  lessonCompletionRate: number; // Percentage
  quizCompletionRate: number; // Percentage
}

export interface ProgressSnapshotResponse {
  id: string;
  userId: string;
  courseId: string;
  progressPercentage: number;
  completedLessons: number;
  completedQuizzes: number;
  totalTimeSpent: number;
  milestoneType: MilestoneType;
  milestoneData?: string;
  snapshotDate: string;
  createdAt: string;
}

export interface ProgressStatisticsResponse {
  courseId: string;
  courseName?: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  notStartedStudents: number;
  averageProgress: number; // Percentage
  averageTimeSpent: number; // Minutes
  completionRate: number; // Percentage
  averageLessonsPerUser: number;
  averageQuizzesPerUser: number;
}

export interface ProgressSummaryResponse {
  totalCourses: number;
  inProgressCourses: number;
  completedCourses: number;
  averageProgress: number; // Percentage
  totalTimeSpent: number; // Minutes
  totalCertificates: number;
}

export interface ListProgressResponse {
  progress: CourseProgressResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListProgressHistoryResponse {
  snapshots: ProgressSnapshotResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProgressAnalyticsResponse {
  [key: string]: any; // Flexible structure for analytics data
}

// ============================================================
// Progress Service Class
// ============================================================

class ProgressService {
  // ============================================================
  // Student Progress Operations (6 endpoints)
  // ============================================================

  /**
   * GET /api/v1/progress/my/summary
   * Get summary of student's progress across all enrolled courses
   */
  async getMyProgressSummary(): Promise<ProgressSummaryResponse> {
    try {
      console.log('📊 [progressService] Getting my progress summary');
      const response = await axios.get<ProgressSummaryResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/my/summary`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [progressService] Progress summary retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error getting progress summary:', error);
      throw error;
    }
  }

  /**
   * Alias for getMyProgressSummary() for backwards compatibility
   */
  async getUserProgressSummary(): Promise<ProgressSummaryResponse> {
    return this.getMyProgressSummary();
  }

  /**
   * GET /api/v1/progress/my
   * Get paginated list of all courses with progress
   */
  async getMyProgressList(
    page = 1,
    pageSize = 20
  ): Promise<ListProgressResponse> {
    try {
      console.log('📊 [progressService] Getting my progress list:', { page, pageSize });
      const response = await axios.get<ListProgressResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/my`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );
      console.log('✅ [progressService] Progress list retrieved:', response.data.totalCount, 'items');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error getting progress list:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/progress/my/courses/:courseId
   * Get detailed progress information for a specific course
   */
  async getMyProgress(courseId: string): Promise<CourseProgressDetailResponse> {
    try {
      console.log('📊 [progressService] Getting my progress for course:', courseId);
      const response = await axios.get<CourseProgressDetailResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/my/courses/${courseId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [progressService] Course progress retrieved:', response.data.progressPercentage + '%');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error getting course progress:', error);
      throw error;
    }
  }

  /**
   * PUT /api/v1/progress/my/courses/:courseId
   * Update progress for a specific course
   */
  async updateMyProgress(
    courseId: string,
    data: UpdateProgressRequest
  ): Promise<CourseProgressResponse> {
    try {
      console.log('📊 [progressService] Updating my progress for course:', courseId);
      const response = await axios.put<CourseProgressResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/my/courses/${courseId}`),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [progressService] Progress updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error updating progress:', error);
      throw error;
    }
  }

  /**
   * POST /api/v1/progress/my/courses/:courseId/activity
   * Record completion of a lesson or quiz
   */
  async recordActivity(
    courseId: string,
    data: RecordActivityRequest
  ): Promise<{ message: string }> {
    try {
      console.log('📊 [progressService] Recording activity for course:', courseId);
      const response = await axios.post<{ message: string }>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/my/courses/${courseId}/activity`),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [progressService] Activity recorded successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error recording activity:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/progress/my/courses/:courseId/history
   * Get historical snapshots of progress with optional filters
   */
  async getMyProgressHistory(
    courseId: string,
    params?: GetProgressHistoryRequest
  ): Promise<ListProgressHistoryResponse> {
    try {
      console.log('📊 [progressService] Getting progress history for course:', courseId);
      const response = await axios.get<ListProgressHistoryResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/my/courses/${courseId}/history`),
        {
          headers: getAuthHeaders(),
          params: params
        }
      );
      console.log('✅ [progressService] Progress history retrieved:', response.data.totalCount, 'snapshots');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error getting progress history:', error);
      throw error;
    }
  }

  // ============================================================
  // Admin/Instructor Progress Management (6 endpoints)
  // ============================================================

  /**
   * GET /api/v1/progress/:progressId
   * Get detailed progress information by progress ID (Admin/Instructor)
   */
  async getProgress(progressId: string): Promise<CourseProgressDetailResponse> {
    try {
      console.log('📊 [progressService] Getting progress by ID:', progressId);
      const response = await axios.get<CourseProgressDetailResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/${progressId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [progressService] Progress retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error getting progress:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/v1/progress/:progressId
   * Permanently delete a progress record (Admin only)
   */
  async deleteProgress(progressId: string): Promise<{ message: string }> {
    try {
      console.log('📊 [progressService] Deleting progress:', progressId);
      const response = await axios.delete<{ message: string }>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/${progressId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [progressService] Progress deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error deleting progress:', error);
      throw error;
    }
  }

  /**
   * POST /api/v1/progress/:progressId/complete
   * Mark progress as completed (Admin/Instructor)
   */
  async markProgressAsCompleted(
    progressId: string,
    data?: CompleteCourseRequest
  ): Promise<{ message: string }> {
    try {
      console.log('📊 [progressService] Marking progress as completed:', progressId);
      const response = await axios.post<{ message: string }>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/${progressId}/complete`),
        data || {},
        { headers: getAuthHeaders() }
      );
      console.log('✅ [progressService] Progress marked as completed');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error marking progress as completed:', error);
      throw error;
    }
  }

  /**
   * POST /api/v1/progress/:progressId/reset
   * Reset progress to initial state (Admin/Instructor)
   */
  async resetProgress(progressId: string): Promise<{ message: string }> {
    try {
      console.log('📊 [progressService] Resetting progress:', progressId);
      const response = await axios.post<{ message: string }>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/${progressId}/reset`),
        {},
        { headers: getAuthHeaders() }
      );
      console.log('✅ [progressService] Progress reset successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error resetting progress:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/progress/users/:userId/courses/:courseId
   * Get progress for a specific user in a specific course (Admin/Instructor)
   */
  async getProgressByUser(
    userId: string,
    courseId: string
  ): Promise<CourseProgressDetailResponse> {
    try {
      console.log('📊 [progressService] Getting progress for user:', userId, 'course:', courseId);
      const response = await axios.get<CourseProgressDetailResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/users/${userId}/courses/${courseId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [progressService] User progress retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error getting user progress:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/progress/courses/:courseId
   * List all progress for a course (Admin/Instructor)
   */
  async listCourseProgress(
    courseId: string,
    page = 1,
    pageSize = 20
  ): Promise<ListProgressResponse> {
    try {
      console.log('📊 [progressService] Listing course progress for:', courseId);
      const response = await axios.get<ListProgressResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/courses/${courseId}`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );
      console.log('✅ [progressService] Course progress list retrieved:', response.data.totalCount, 'items');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error listing course progress:', error);
      throw error;
    }
  }

  // ============================================================
  // Statistics (2 endpoints)
  // ============================================================

  /**
   * GET /api/v1/progress/courses/:courseId/statistics
   * Get comprehensive statistics about student progress (Admin/Instructor)
   */
  async getCourseStatistics(
    courseId: string,
    filters?: GetCourseStatisticsRequest
  ): Promise<ProgressStatisticsResponse> {
    try {
      console.log('📊 [progressService] Getting course statistics for:', courseId);
      const response = await axios.get<ProgressStatisticsResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/courses/${courseId}/statistics`),
        {
          headers: getAuthHeaders(),
          params: filters
        }
      );
      console.log('✅ [progressService] Course statistics retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error getting course statistics:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/progress/courses/:courseId/analytics
   * Get detailed analytics and insights (Admin/Instructor)
   */
  async getProgressAnalytics(
    courseId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProgressAnalyticsResponse> {
    try {
      console.log('📊 [progressService] Getting progress analytics for:', courseId);
      const response = await axios.get<ProgressAnalyticsResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/courses/${courseId}/analytics`),
        {
          headers: getAuthHeaders(),
          params: { startDate, endDate }
        }
      );
      console.log('✅ [progressService] Progress analytics retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error getting progress analytics:', error);
      throw error;
    }
  }

  // ============================================================
  // Snapshots (2 endpoints)
  // ============================================================

  /**
   * POST /api/v1/progress/my/courses/:courseId/snapshot
   * Create a milestone snapshot (25%, 50%, 75%, 100%)
   */
  async createMilestoneSnapshot(
    courseId: string,
    milestoneType: MilestoneType
  ): Promise<{ message: string }> {
    try {
      console.log('📊 [progressService] Creating milestone snapshot:', milestoneType, 'for course:', courseId);
      const response = await axios.post<{ message: string }>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/my/courses/${courseId}/snapshot`),
        null,
        {
          headers: getAuthHeaders(),
          params: { milestoneType }
        }
      );
      console.log('✅ [progressService] Milestone snapshot created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error creating milestone snapshot:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/progress/my/courses/:courseId/snapshots
   * Get all milestone snapshots for a course
   */
  async getProgressSnapshots(
    courseId: string,
    page = 1,
    pageSize = 20
  ): Promise<ListProgressHistoryResponse> {
    try {
      console.log('📊 [progressService] Getting progress snapshots for course:', courseId);
      const response = await axios.get<ListProgressHistoryResponse>(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/my/courses/${courseId}/snapshots`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );
      console.log('✅ [progressService] Progress snapshots retrieved:', response.data.totalCount, 'snapshots');
      return response.data;
    } catch (error) {
      console.error('❌ [progressService] Error getting progress snapshots:', error);
      throw error;
    }
  }

  // ============================================================
  // Utility Functions
  // ============================================================

  /**
   * Format time in seconds to HH:MM:SS or MM:SS
   */
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format minutes to human-readable duration
   */
  formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }

  /**
   * Calculate progress percentage
   */
  calculateProgressPercentage(completed: number, total: number): number {
    if (total <= 0) return 0;
    return Math.min(Math.round((completed / total) * 100), 100);
  }
}

// Export singleton instance
const progressService = new ProgressService();
export default progressService;
