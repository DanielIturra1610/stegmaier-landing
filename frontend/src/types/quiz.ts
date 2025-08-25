/**
 * Tipos TypeScript para el sistema de quizzes.
 */

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice", 
  MULTIPLE_SELECT = "multiple_select",
  TRUE_FALSE = "true_false",
  FILL_IN_BLANK = "fill_in_blank",
  ESSAY = "essay",
  ORDERING = "ordering",
  MATCHING = "matching"
}

export enum QuizStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived"
}

// Type alias para compatibilidad con string literals
export type QuizStatusType = "draft" | "published" | "archived";

export enum AttemptStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  SUBMITTED = "submitted",
  GRADED = "graded",
  EXPIRED = "expired"
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
  explanation?: string;
  order: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  text: string;
  content: string;
  explanation?: string;
  points: number;
  time_limit?: number;
  options: QuestionOption[];
  correct_answers: string[];
  case_sensitive: boolean;
  pairs: Array<{ [key: string]: string }>;
  order?: number;
  tags: string[];
  difficulty: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface QuizConfiguration {
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  show_results_immediately?: boolean;
  show_correct_answers: boolean;
  allow_retakes?: boolean;
  allow_review: boolean;
  max_attempts?: number;
  passing_score?: number;
  time_limit?: number;
  time_limit_enabled: boolean;
  available_from?: string;
  available_until?: string;
  require_proctor?: boolean;
  proctoring_enabled: boolean;
  require_webcam: boolean;
  prevent_copy_paste: boolean;
  randomize_from_pool?: boolean;
  randomize_order: boolean;
  questions_per_attempt?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions: string;
  course_id: string;
  module_id?: string;
  lesson_id?: string;
  questions: Question[];
  question_pool: string[];
  config: QuizConfiguration;
  status: QuizStatus;
  total_points: number;
  estimated_duration: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  created_by: string;
  total_attempts: number;
  average_score: number;
  completion_rate: number;
  is_available: boolean;
  
  // Propiedades adicionales para compatibilidad
  time_limit_minutes?: number;
  max_attempts?: number;
  passing_score?: number;
  shuffle_questions?: boolean;
  show_results?: boolean;
  allow_review?: boolean;
  tags?: string[];
}

export interface QuizListItem {
  id: string;
  title: string;
  description: string;
  course_id: string;
  module_id?: string;
  lesson_id?: string;
  status: QuizStatus;
  total_points: number;
  estimated_duration: number;
  total_attempts: number;
  average_score: number;
  completion_rate: number;
  created_at: string;
  // Propiedades adicionales necesarias para AdminQuizzes
  questions?: Question[];
  time_limit_minutes?: number;
  published_at?: string;
  created_by: string;
  is_available: boolean;
}

// Student quiz progress definition will be completed later

export interface StudentAnswer {
  question_id: string;
  answer: any;
  time_spent: number;
  is_correct?: boolean;
  points_earned?: number;
}

// DTOs para crear/actualizar
export interface QuestionCreate {
  type: QuestionType;
  title: string;
  content: string;
  explanation?: string;
  points: number;
  time_limit?: number;
  options: Array<{
    text: string;
    is_correct: boolean;
    explanation?: string;
    order: number;
  }>;
  correct_answers: string[];
  case_sensitive: boolean;
  pairs: Array<{ [key: string]: string }>;
  tags: string[];
  difficulty: string;
}

export interface QuizCreate {
  title: string;
  description: string;
  instructions: string;
  course_id: string;
  module_id?: string;
  lesson_id?: string;
  questions: Question[];
  question_pool: string[];
  config: QuizConfiguration;
  estimated_duration: number;
  status?: QuizStatus;
  time_limit_minutes?: number;
  max_attempts?: number;
  passing_score?: number;
  shuffle_questions?: boolean;
  show_results?: boolean;
  allow_review?: boolean;
  tags?: string[];
}

export interface QuizUpdate {
  title?: string;
  description?: string;
  instructions?: string;
  questions?: string[];
  question_pool?: string[];
  config?: QuizConfiguration;
  estimated_duration?: number;
  status?: QuizStatus;
}

// Estados del componente QuizTaker
export interface QuizState {
  quiz: Quiz | null;
  attempt: QuizAttempt | null;
  currentQuestionIndex: number;
  answers: Map<string, any>;
  timeRemaining?: number;
  isSubmitting: boolean;
  showResults: boolean;
  error?: string;
}

// Props para componentes
export interface QuizTakerProps {
  quizId: string;
  onComplete?: (attempt: QuizAttempt) => void;
  onError?: (error: string) => void;
  onNavigateBack?: () => void;
}

export interface QuestionRendererProps {
  question: Question;
  answer?: any;
  onAnswerChange: (answer: any) => void;
  disabled?: boolean;
  showCorrectAnswer?: boolean;
  timeRemaining?: number;
}

export interface QuizResultsProps {
  quiz: Quiz;
  attempt: QuizAttempt;
  onRetake?: () => void;
  onClose?: () => void;
  onNavigateBack?: () => void;
}

export interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
  timeRemaining?: number;
  duration?: number;
}

export interface QuizTimerProps {
  timeRemaining: number;
  onTimeUp: () => void;
  showWarnings?: boolean;
}

// Utilidades para validación
export interface QuestionValidation {
  isValid: boolean;
  message?: string;
}

// Estadísticas del quiz
export interface QuizStatistics {
  quiz_id: string;
  quiz_title: string;
  total_attempts: number;
  unique_students: number;
  average_score: number;
  median_score: number;
  pass_rate: number;
  completion_rate: number;
  average_time: number;
  question_statistics: Array<{
    question_id: string;
    question_title: string;
    correct_percentage: number;
    average_time: number;
    skip_rate: number;
  }>;
}

// DTOs para crear y actualizar quizzes
export interface QuizCreate {
  title: string;
  description: string;
  instructions: string;
  course_id: string;
  module_id?: string;
  lesson_id?: string;
  question_ids: string[]; // Using string[] for consistency
  config: QuizConfiguration;
  status?: QuizStatus;
}

export interface QuizUpdate {
  title?: string;
  description?: string;
  instructions?: string;
  question_ids?: string[]; // Using string[] for consistency
  config?: QuizConfiguration; // Using full type for consistency
  status?: QuizStatus;
}

// Tipos para attempts y answers
export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  attempt_number: number;
  status: AttemptStatus;
  started_at: string;
  submitted_at?: string;
  score?: number;
  score_percentage: number;
  percentage?: number;
  is_passing: boolean;
  time_spent: number;
  time_remaining?: number;
  answers: StudentAnswer[];
  points_earned: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAnswer {
  question_id: string;
  answer: any;
  is_correct: boolean;
  points_earned: number;
  time_spent: number;
}

export interface StudentAnswer {
  question_id: string;
  answer: any;
  time_spent: number;
  created_at: string;
}

export interface StudentQuizProgress {
  student_id: string;
  course_id: string;
  quizzes_available: number;
  quizzes_attempted: number;
  quizzes_completed: number;
  quizzes_passed: number;
  average_score: number;
  total_time_spent: number;
}
