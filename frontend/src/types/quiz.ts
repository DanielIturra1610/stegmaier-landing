/**
 * Tipos TypeScript para el sistema de quizzes.
 */

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
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
  content: string;
  explanation?: string;
  points: number;
  time_limit?: number;
  options: QuestionOption[];
  correct_answers: string[];
  case_sensitive: boolean;
  pairs: Array<{ [key: string]: string }>;
  tags: string[];
  difficulty: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface QuizConfiguration {
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  show_results_immediately: boolean;
  show_correct_answers: boolean;
  allow_retakes: boolean;
  max_attempts?: number;
  passing_score: number;
  time_limit?: number;
  available_from?: string;
  available_until?: string;
  require_proctor: boolean;
  randomize_from_pool: boolean;
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
  published_at?: string;
  created_by: string;
  is_available: boolean;
}

export interface QuizAnswer {
  question_id: string;
  answer: any;
  time_spent: number;
  is_correct?: boolean;
  points_earned: number;
  submitted_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  status: AttemptStatus;
  attempt_number: number;
  answers: QuizAnswer[];
  current_question_index: number;
  total_points: number;
  points_earned: number;
  score_percentage: number;
  is_passing: boolean;
  started_at: string;
  submitted_at?: string;
  time_spent: number;
  time_remaining?: number;
}

export interface StudentAnswer {
  question_id: string;
  answer: any;
  time_spent: number;
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
  questions: string[];
  question_pool: string[];
  config: QuizConfiguration;
  estimated_duration: number;
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
