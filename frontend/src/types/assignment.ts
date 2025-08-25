/**
 * Tipos TypeScript para el sistema de assignments
 * Basado en los DTOs del backend
 */

export enum AssignmentType {
  ESSAY = "essay",
  FILE_UPLOAD = "file_upload", 
  PROJECT = "project",
  PRESENTATION = "presentation",
  RESEARCH = "research",
  PRACTICAL = "practical",
  PORTFOLIO = "portfolio"
}

export enum SubmissionStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress", 
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  GRADED = "graded",
  RETURNED = "returned",
  LATE_SUBMISSION = "late_submission",
  MISSING = "missing"
}

export enum GradeStatus {
  NOT_GRADED = "not_graded",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed", 
  NEEDS_REVISION = "needs_revision"
}

export enum FileType {
  DOCUMENT = "document",
  IMAGE = "image",
  VIDEO = "video", 
  AUDIO = "audio",
  PRESENTATION = "presentation",
  SPREADSHEET = "spreadsheet",
  ARCHIVE = "archive",
  CODE = "code"
}

export interface AssignmentFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: FileType;
  file_size: number;
  mime_type: string;
  file_path: string;
  uploaded_at: string;
  uploaded_by: string;
  is_template: boolean;
  description?: string;
}

export interface RubricLevel {
  name: string;
  points: number;
  description: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  max_points: number;
  weight: number;
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  name: string;
  description: string;
  criteria: RubricCriterion[];
  total_points: number;
  created_by: string;
  created_at: string;
  is_template: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  assignment_type: AssignmentType;
  course_id: string;
  module_id?: string;
  lesson_id?: string;
  
  // Files and resources
  attachments: AssignmentFile[];
  template_files: AssignmentFile[];
  
  // Submission configuration
  max_file_size: number;
  allowed_file_types: string[];
  max_files: number;
  allow_multiple_submissions: boolean;
  
  // Dates
  available_from?: string;
  due_date?: string;
  late_penalty_per_day: number;
  accept_late_submissions: boolean;
  
  // Evaluation
  rubric?: Rubric;
  max_points: number;
  passing_score: number;
  
  // Advanced configuration
  peer_review_enabled: boolean;
  peer_reviews_required: number;
  anonymous_grading: boolean;
  plagiarism_check_enabled: boolean;
  
  // State
  is_published: boolean;
  estimated_duration: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  created_by: string;
  
  // Statistics
  total_submissions: number;
  graded_submissions: number;
  average_grade: number;
  on_time_submissions: number;
  late_submissions: number;
  
  // Computed properties
  is_available: boolean;
  is_overdue: boolean;
  days_until_due?: number;
}

export interface SubmissionComment {
  id: string;
  content: string;
  author_id: string;
  author_name?: string;
  author_role: string;
  is_private: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SubmissionGrade {
  criterion_id?: string;
  criterion_name?: string;
  points_earned: number;
  points_possible: number;
  feedback: string;
  grader_id: string;
  grader_name?: string;
  graded_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  assignment_title: string;
  student_id: string;
  student_name?: string;
  
  // Content
  text_content: string;
  files: AssignmentFile[];
  
  // State
  status: SubmissionStatus;
  submission_number: number;
  is_final: boolean;
  
  // Dates
  started_at?: string;
  submitted_at?: string;
  last_modified_at: string;
  
  // Grading
  grade_status: GradeStatus;
  grades: SubmissionGrade[];
  total_points_earned: number;
  total_points_possible: number;
  percentage_grade: number;
  letter_grade?: string;
  is_passing: boolean;
  
  // Late penalty
  is_late: boolean;
  days_late: number;
  penalty_applied: number;
  
  // Feedback
  instructor_feedback: string;
  comments: SubmissionComment[];
  
  // Metadata
  plagiarism_score?: number;
  similarity_report?: string;
}

export interface PeerReview {
  id: string;
  assignment_id: string;
  submission_id: string;
  reviewer_id: string;
  reviewer_name?: string;
  feedback: string;
  scores: Record<string, number>;
  overall_score: number;
  is_completed: boolean;
  is_anonymous: boolean;
  assigned_at: string;
  submitted_at?: string;
  due_date?: string;
}

// DTOs for API calls
export interface AssignmentCreateDTO {
  title: string;
  description: string;
  instructions: string;
  assignment_type: AssignmentType;
  course_id: string;
  module_id?: string;
  lesson_id?: string;
  max_file_size?: number;
  allowed_file_types?: string[];
  max_files?: number;
  allow_multiple_submissions?: boolean;
  available_from?: string;
  due_date?: string;
  late_penalty_per_day?: number;
  accept_late_submissions?: boolean;
  rubric_id?: string;
  max_points?: number;
  passing_score?: number;
  peer_review_enabled?: boolean;
  peer_reviews_required?: number;
  anonymous_grading?: boolean;
  plagiarism_check_enabled?: boolean;
  estimated_duration?: number;
}

export interface AssignmentUpdateDTO {
  title?: string;
  description?: string;
  instructions?: string;
  max_file_size?: number;
  allowed_file_types?: string[];
  max_files?: number;
  allow_multiple_submissions?: boolean;
  available_from?: string;
  due_date?: string;
  late_penalty_per_day?: number;
  accept_late_submissions?: boolean;
  rubric_id?: string;
  max_points?: number;
  passing_score?: number;
  peer_review_enabled?: boolean;
  peer_reviews_required?: number;
  anonymous_grading?: boolean;
  plagiarism_check_enabled?: boolean;
  estimated_duration?: number;
  is_published?: boolean;
}

export interface SubmissionCreateDTO {
  assignment_id: string;
  text_content: string;
  is_final?: boolean;
}

export interface SubmissionUpdateDTO {
  text_content?: string;
  is_final?: boolean;
  status?: SubmissionStatus;
}

export interface SubmissionCommentCreateDTO {
  content: string;
  is_private?: boolean;
}

export interface SubmissionGradeCreateDTO {
  criterion_id?: string;
  points_earned: number;
  points_possible: number;
  feedback?: string;
}

export interface BulkGradeCreateDTO {
  submission_ids: string[];
  grades: SubmissionGradeCreateDTO[];
  feedback?: string;
}

// Statistics and analytics
export interface AssignmentStatistics {
  assignment_id: string;
  assignment_title: string;
  total_students: number;
  total_submissions: number;
  graded_submissions: number;
  average_grade: number;
  median_grade: number;
  pass_rate: number;
  on_time_rate: number;
  grade_distribution: Record<string, number>;
  submission_timeline: Array<{
    date: string;
    submissions: number;
  }>;
}

export interface StudentAssignmentProgress {
  student_id: string;
  course_id: string;
  assignments_available: number;
  assignments_submitted: number;
  assignments_graded: number;
  assignments_passed: number;
  average_grade: number;
  total_late_submissions: number;
  pending_assignments: string[];
}

// UI Component Props
export interface AssignmentSubmissionProps {
  assignment: Assignment;
  existingSubmission?: AssignmentSubmission;
  onSubmissionUpdate?: (submission: AssignmentSubmission) => void;
  onError?: (error: string) => void;
}

export interface FileUploaderProps {
  onFilesUploaded: (files: AssignmentFile[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  acceptedMimeTypes?: string[];
  className?: string;
}

export interface AssignmentGradingProps {
  assignment: Assignment;
  submissions: AssignmentSubmission[];
  onGradeSubmitted?: (submissionId: string, grades: SubmissionGrade[]) => void;
  onBulkGrade?: (submissionIds: string[], grades: SubmissionGrade[]) => void;
  onGradeUpdate?: () => void | Promise<void>;
}

export interface SubmissionHistoryProps {
  submissions: AssignmentSubmission[];
  assignment: Assignment;
  studentView?: boolean;
}

export interface GradeViewerProps {
  submission: AssignmentSubmission;
  assignment: Assignment;
  showRubric?: boolean;
  allowComments?: boolean;
}

// Upload progress interface
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadItem {
  id: string;
  file: File;
  progress: FileUploadProgress;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: AssignmentFile;
}
