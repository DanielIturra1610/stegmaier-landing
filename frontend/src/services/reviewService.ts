/**
 * Review Service - Handles all review-related API calls
 * Backend endpoints: internal/controllers/reviews.go
 */
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.config';

// ============================================================
// TypeScript Interfaces (matching backend DTOs)
// ============================================================

export interface CreateReviewRequest {
  course_id: string;
  rating: number;
  title?: string;
  comment?: string;
  is_public: boolean;
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  is_public?: boolean;
}

export interface ReportReviewRequest {
  review_id: string;
  reason: string;
}

export interface VoteReviewRequest {
  review_id: string;
  is_helpful: boolean;
}

export interface ReviewResponse {
  id: string;
  course_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title?: string;
  comment?: string;
  is_public: boolean;
  is_edited: boolean;
  helpful_count: number;
  unhelpful_count: number;
  user_voted?: boolean | null; // null = not voted, true = helpful, false = not helpful
  created_at: string;
  updated_at: string;
}

export interface ReviewListResponse {
  reviews: ReviewResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CourseRatingResponse {
  course_id: string;
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>; // Percentage per star (1-5)
  rating_counts: Record<number, number>; // Count per star (1-5)
}

export interface ReviewReportResponse {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  created_at: string;
  updated_at: string;
}

export interface GetReviewsFilter {
  course_id?: string;
  user_id?: string;
  rating?: number;
  is_public?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
}

// ============================================================
// Review Service Class
// ============================================================

class ReviewService {
  /**
   * Create a new review for a course
   * POST /api/v1/reviews
   */
  async createReview(data: CreateReviewRequest): Promise<ReviewResponse> {
    try {
      console.log('📝 [reviewService] Creating review for course:', data.course_id);

      const response = await axios.post<ReviewResponse>(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews`),
        data,
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Review created:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ [reviewService] Error creating review:', error);
      throw new Error(error.response?.data?.error || 'Failed to create review');
    }
  }

  /**
   * Get a review by ID
   * GET /api/v1/reviews/:id
   */
  async getReview(reviewId: string): Promise<ReviewResponse> {
    try {
      console.log('🔍 [reviewService] Getting review:', reviewId);

      const response = await axios.get<ReviewResponse>(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/${reviewId}`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Review retrieved');
      return response.data;
    } catch (error: any) {
      console.error('❌ [reviewService] Error getting review:', error);
      throw new Error(error.response?.data?.error || 'Failed to get review');
    }
  }

  /**
   * Get current user's reviews
   * GET /api/v1/reviews/my
   */
  async getMyReviews(page = 1, pageSize = 10): Promise<ReviewListResponse> {
    try {
      console.log('📚 [reviewService] Getting my reviews');

      const response = await axios.get<ReviewListResponse>(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/my`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );

      console.log('✅ [reviewService] Retrieved my reviews:', response.data.totalCount);
      return response.data;
    } catch (error: any) {
      console.error('❌ [reviewService] Error getting my reviews:', error);
      throw new Error(error.response?.data?.error || 'Failed to get my reviews');
    }
  }

  /**
   * Get reviews for a course
   * GET /api/v1/courses/:courseId/reviews
   */
  async getCourseReviews(courseId: string, filter?: GetReviewsFilter): Promise<ReviewListResponse> {
    try {
      console.log('📚 [reviewService] Getting course reviews:', courseId);

      const params = {
        page: filter?.page || 1,
        pageSize: filter?.pageSize || 10,
        sortBy: filter?.sortBy || 'recent',
        rating: filter?.rating,
        is_public: filter?.is_public
      };

      const response = await axios.get<ReviewListResponse>(
        buildApiUrl(`${API_ENDPOINTS.COURSES}/${courseId}/reviews`),
        {
          headers: getAuthHeaders(),
          params
        }
      );

      console.log('✅ [reviewService] Retrieved course reviews:', response.data.totalCount);
      return response.data;
    } catch (error: any) {
      console.error('❌ [reviewService] Error getting course reviews:', error);
      throw new Error(error.response?.data?.error || 'Failed to get course reviews');
    }
  }

  /**
   * Get course rating statistics
   * GET /api/v1/courses/:courseId/rating
   */
  async getCourseRating(courseId: string): Promise<CourseRatingResponse> {
    try {
      console.log('⭐ [reviewService] Getting course rating:', courseId);

      const response = await axios.get<CourseRatingResponse>(
        buildApiUrl(`${API_ENDPOINTS.COURSES}/${courseId}/rating`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Course rating retrieved:', response.data.average_rating);
      return response.data;
    } catch (error: any) {
      console.error('❌ [reviewService] Error getting course rating:', error);
      throw new Error(error.response?.data?.error || 'Failed to get course rating');
    }
  }

  /**
   * Get user's review for a specific course
   * GET /api/v1/courses/:courseId/my-review
   */
  async getUserReviewForCourse(courseId: string): Promise<ReviewResponse | null> {
    try {
      console.log('🔍 [reviewService] Getting user review for course:', courseId);

      const response = await axios.get<ReviewResponse>(
        buildApiUrl(`${API_ENDPOINTS.COURSES}/${courseId}/my-review`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] User review retrieved');
      return response.data;
    } catch (error: any) {
      // If no review exists, return null instead of throwing
      if (error.response?.status === 404) {
        console.log('ℹ️ [reviewService] No review found for this course');
        return null;
      }
      console.error('❌ [reviewService] Error getting user review:', error);
      throw new Error(error.response?.data?.error || 'Failed to get user review');
    }
  }

  /**
   * Update a review
   * PATCH /api/v1/reviews/:id
   */
  async updateReview(reviewId: string, data: UpdateReviewRequest): Promise<ReviewResponse> {
    try {
      console.log('✏️ [reviewService] Updating review:', reviewId);

      const response = await axios.patch<ReviewResponse>(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/${reviewId}`),
        data,
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Review updated');
      return response.data;
    } catch (error: any) {
      console.error('❌ [reviewService] Error updating review:', error);
      throw new Error(error.response?.data?.error || 'Failed to update review');
    }
  }

  /**
   * Delete a review
   * DELETE /api/v1/reviews/:id
   */
  async deleteReview(reviewId: string): Promise<void> {
    try {
      console.log('🗑️ [reviewService] Deleting review:', reviewId);

      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/${reviewId}`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Review deleted');
    } catch (error: any) {
      console.error('❌ [reviewService] Error deleting review:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete review');
    }
  }

  /**
   * Vote on review helpfulness
   * POST /api/v1/reviews/:id/vote
   */
  async voteReview(reviewId: string, isHelpful: boolean): Promise<void> {
    try {
      console.log('👍 [reviewService] Voting on review:', { reviewId, isHelpful });

      await axios.post(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/${reviewId}/vote`),
        { review_id: reviewId, is_helpful: isHelpful },
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Vote recorded');
    } catch (error: any) {
      console.error('❌ [reviewService] Error voting on review:', error);
      throw new Error(error.response?.data?.error || 'Failed to vote on review');
    }
  }

  /**
   * Remove vote from review
   * DELETE /api/v1/reviews/:id/vote
   */
  async removeVote(reviewId: string): Promise<void> {
    try {
      console.log('🚫 [reviewService] Removing vote from review:', reviewId);

      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/${reviewId}/vote`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Vote removed');
    } catch (error: any) {
      console.error('❌ [reviewService] Error removing vote:', error);
      throw new Error(error.response?.data?.error || 'Failed to remove vote');
    }
  }

  /**
   * Report a review
   * POST /api/v1/reviews/:id/report
   */
  async reportReview(reviewId: string, reason: string): Promise<void> {
    try {
      console.log('🚨 [reviewService] Reporting review:', reviewId);

      await axios.post(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/${reviewId}/report`),
        { review_id: reviewId, reason },
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Review reported');
    } catch (error: any) {
      console.error('❌ [reviewService] Error reporting review:', error);
      throw new Error(error.response?.data?.error || 'Failed to report review');
    }
  }

  /**
   * Get reports for a review (admin only)
   * GET /api/v1/reviews/:id/reports
   */
  async getReviewReports(reviewId: string): Promise<ReviewReportResponse[]> {
    try {
      console.log('📋 [reviewService] Getting review reports:', reviewId);

      const response = await axios.get<ReviewReportResponse[]>(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/${reviewId}/reports`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Retrieved review reports:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [reviewService] Error getting review reports:', error);
      throw new Error(error.response?.data?.error || 'Failed to get review reports');
    }
  }

  /**
   * Get pending reports (admin only)
   * GET /api/v1/reviews/reports/pending
   */
  async getPendingReports(): Promise<ReviewReportResponse[]> {
    try {
      console.log('📋 [reviewService] Getting pending reports');

      const response = await axios.get<ReviewReportResponse[]>(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/reports/pending`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Retrieved pending reports:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [reviewService] Error getting pending reports:', error);
      throw new Error(error.response?.data?.error || 'Failed to get pending reports');
    }
  }

  /**
   * Update report status (admin only)
   * PATCH /api/v1/reviews/reports/:reportId/status
   */
  async updateReportStatus(
    reportId: string,
    status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
  ): Promise<void> {
    try {
      console.log('✏️ [reviewService] Updating report status:', { reportId, status });

      await axios.patch(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/reports/${reportId}/status`),
        { status },
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Report status updated');
    } catch (error: any) {
      console.error('❌ [reviewService] Error updating report status:', error);
      throw new Error(error.response?.data?.error || 'Failed to update report status');
    }
  }

  /**
   * Delete review by admin (admin only)
   * DELETE /api/v1/reviews/:id/admin
   */
  async deleteReviewByAdmin(reviewId: string): Promise<void> {
    try {
      console.log('🗑️ [reviewService] Admin deleting review:', reviewId);

      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.BASE}/reviews/${reviewId}/admin`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [reviewService] Review deleted by admin');
    } catch (error: any) {
      console.error('❌ [reviewService] Error deleting review by admin:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete review');
    }
  }
}

// Export singleton instance
const reviewService = new ReviewService();
export default reviewService;
