/**
 * Tipos TypeScript para sistema de progreso
 * Incluye video progress, lesson progress, y course progress
 */

// Enums
export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused'
}

export enum ContentType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz',
  INTERACTIVE = 'interactive',
  DOCUMENT = 'document'
}

// Interfaces existentes de video progress (mantener compatibilidad)
export interface VideoProgress {
  lesson_id: string;
  video_id: string;
  current_position: number;
  duration: number;
  watch_percentage: number;
  is_completed: boolean;
  total_watch_time: number;
  sessions_count: number;
  last_watched: string | null;
  bookmarks: number;
  notes: number;
}

export interface VideoBookmark {
  id: string;
  lesson_id: string;
  video_id: string;
  timestamp: number;
  title: string;
  description: string;
  created_at: string;
}

export interface VideoNote {
  id: string;
  lesson_id: string;
  video_id: string;
  timestamp: number;
  content: string;
  is_private: boolean;
  created_at: string;
}

// Nuevos interfaces para lesson y course progress
export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  enrollment_id: string;
  
  // Status tracking
  status: ProgressStatus;
  started_at?: string;
  completed_at?: string;
  last_accessed_at?: string;
  
  // Progress details
  progress_percentage: number; // 0.0 to 100.0
  time_spent: number; // seconds
  
  // Content specific
  content_type: ContentType;
  video_position?: number; // seconds for video lessons
  video_duration?: number; // seconds
  quiz_score?: number; // 0.0 to 100.0 for quiz lessons
  quiz_attempts: number;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string;
  
  // Progress summary
  progress_percentage: number; // 0.0 to 100.0
  status: ProgressStatus;
  
  // Lesson tracking
  lessons_completed: number;
  total_lessons: number;
  lessons_in_progress: number;
  
  // Time tracking
  total_time_spent: number; // seconds
  estimated_remaining_time?: number; // seconds
  
  // Dates
  started_at?: string;
  last_accessed_at?: string;
  completed_at?: string;
  target_completion_date?: string;
  
  // Achievements
  certificate_issued: boolean;
  certificate_issued_at?: string;
  certificate_url?: string;
  
  // Stats
  average_lesson_score?: number;
  streak_days: number;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

export interface CourseProgressDetailed extends CourseProgress {
  lessons_progress: LessonProgress[];
  course: {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    instructor_name?: string;
  };
  next_lesson?: {
    id: string;
    title: string;
    content_type: ContentType;
    order: number;
  };
}

export interface ProgressSummary {
  user_id: string;
  
  // Course stats
  total_courses_enrolled: number;
  courses_completed: number;
  courses_in_progress: number;
  courses_not_started: number;
  
  // Time stats
  total_time_spent: number; // seconds
  average_daily_time: number; // seconds
  
  // Activity stats
  current_streak: number; // días consecutivos
  longest_streak: number;
  last_activity?: string;
  
  // Achievement stats
  certificates_earned: number;
  total_lessons_completed: number;
  
  // Recent activity
  recent_courses: CourseProgress[];
  
  // Calculated properties
  completion_rate: number; // percentage
}

// Request/Response interfaces
export interface UpdateLessonProgressRequest {
  progress_percentage?: number;
  time_spent_delta?: number; // incremental seconds
  video_position?: number;
  quiz_score?: number;
  status?: ProgressStatus;
}

export interface UpdateVideoProgressRequest {
  current_position: number;
  duration: number;
  session_time?: number;
}

export interface CreateBookmarkRequest {
  timestamp: number;
  title: string;
  description: string;
}

export interface CreateNoteRequest {
  timestamp: number;
  content: string;
  is_private: boolean;
}

export interface BatchProgressUpdate {
  lesson_id: string;
  updates: UpdateLessonProgressRequest;
}

export interface BatchSyncRequest {
  updates: BatchProgressUpdate[];
}

export interface BatchSyncResponse {
  success: boolean;
  synced_count: number;
  failed_count: number;
  conflicts?: {
    lesson_id: string;
    reason: string;
  }[];
}

// === API REQUEST/RESPONSE TYPES ===

export interface StartLessonRequest {
  course_id: string;
  enrollment_id: string;
}

export interface CompleteLessonRequest {
  course_id: string;
  enrollment_id: string;
}

export interface LessonProgressUpdateRequest {
  progress_percentage?: number;
  time_spent_delta: number;
  video_position?: number;
  quiz_score?: number;
}

export interface LessonProgressResponse {
  progress: {
    id: string;
    lesson_id: string;
    course_id: string;
    status: ProgressStatus;
    progress_percentage: number;
    time_spent: number;
    content_type: string;
    video_position?: number;
    quiz_score?: number;
    quiz_attempts: number;
    started_at?: string;
    completed_at?: string;
    last_accessed_at?: string;
  } | null;
  message?: string;
}

export interface CourseProgressResponse {
  course_progress: {
    id: string;
    course_id: string;
    progress_percentage: number;
    status: ProgressStatus;
    lessons_completed: number;
    total_lessons: number;
    total_time_spent: number;
    certificate_issued: boolean;
    certificate_url?: string;
    started_at?: string;
    last_accessed_at?: string;
    completed_at?: string;
  } | null;
  lessons_progress: Array<{
    id: string;
    lesson_id: string;
    status: ProgressStatus;
    progress_percentage: number;
    time_spent: number;
    content_type: string;
    completed_at?: string;
  }>;
  next_lesson?: {
    id: string;
    lesson_id: string;
    status: ProgressStatus;
    progress_percentage: number;
    content_type: string;
  };
  completion_percentage: number;
  certificate_available: boolean;
  message?: string;
}

export interface UserProgressSummaryResponse {
  summary: {
    user_id: string;
    total_courses_enrolled: number;
    courses_completed: number;
    courses_in_progress: number;
    courses_not_started: number;
    total_time_spent: number;
    certificates_earned: number;
    total_lessons_completed: number;
    completion_rate: number;
    last_activity?: string;
  };
  recent_courses: Array<{
    course_id: string;
    progress_percentage: number;
    status: ProgressStatus;
    last_accessed_at?: string;
  }>;
}

// Local storage interfaces (para offline support)
export interface LocalProgressCache {
  lesson_id: string;
  pending_updates: UpdateLessonProgressRequest[];
  last_sync_attempt?: string;
  retry_count: number;
}

// API Response interfaces - Legacy (deprecated)
export interface LessonProgressResponseLegacy {
  success: boolean;
  message: string;
  progress: LessonProgress;
}

export interface CourseProgressResponseLegacy {
  success: boolean;
  message: string;
  progress: CourseProgressDetailed;
}

export interface ProgressSummaryResponse {
  success: boolean;
  summary: ProgressSummary;
}

// Dashboard interfaces
export interface ProgressDashboardData {
  summary: ProgressSummary;
  active_courses: CourseProgressDetailed[];
  recent_achievements: {
    type: 'lesson_completed' | 'course_completed' | 'certificate_earned';
    title: string;
    date: string;
    course_name?: string;
  }[];
  weekly_stats: {
    week: string; // ISO week
    time_spent: number;
    lessons_completed: number;
  }[];
}

// Utility types
export type ProgressMetrics = {
  completion_percentage: number;
  time_efficiency: number; // actual_time / estimated_time
  engagement_score: number; // based on activity frequency
  consistency_score: number; // based on streak and regularity
};

export type LearningPath = {
  current_lesson: LessonProgress;
  next_lessons: LessonProgress[];
  completed_lessons: LessonProgress[];
  total_progress: number;
  estimated_completion_date: string;
};

// Form interfaces (para componentes UI)
export interface ProgressFilterOptions {
  status?: ProgressStatus[];
  date_range?: {
    start: string;
    end: string;
  };
  course_ids?: string[];
  content_types?: ContentType[];
}

export interface ProgressSortOptions {
  field: 'progress_percentage' | 'last_accessed_at' | 'time_spent' | 'created_at';
  direction: 'asc' | 'desc';
}
