/**
 * Review Types - Matches backend domain models
 */

export interface Review {
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

export interface CourseRating {
  course_id: string;
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>; // Percentage per star (1-5)
  rating_counts: Record<number, number>; // Count per star (1-5)
}

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  status: ReviewReportStatus;
  created_at: string;
  updated_at: string;
}

export type ReviewReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'action_taken';

export type ReviewSortBy = 'recent' | 'helpful' | 'rating_high' | 'rating_low';
