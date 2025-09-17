/**
 * Tipos TypeScript para lecciones
 * Basados en los DTOs del backend
 */

// Enum para tipos de contenido - debe coincidir con backend
export enum ContentType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz',
  DOCUMENT = 'document',
  INTERACTIVE = 'interactive'
}

// Interfaz básica de lección - coincide exactamente con backend LessonResponse DTO
export interface LessonResponse {
  id: string;
  title: string;
  course_id: string;
  order: number;
  content_type: ContentType;
  content_url?: string;
  content_text?: string;
  duration: number;
  is_free_preview: boolean;
  attachments: string[];
  created_at: string;
  updated_at: string;
}

// Interfaz extendida para detalle de lección
export interface LessonDetail extends LessonResponse {
  description?: string;
  transcript?: string;
  resources: LessonResource[];
  quiz?: QuizData;
  user_progress?: LessonProgress;
  access_info: LessonAccessInfo;
}

// Recursos de una lección
export interface LessonResource {
  id: string;
  name: string;
  type: 'pdf' | 'document' | 'video' | 'link' | 'code';
  url: string;
  size?: number;
  description?: string;
}

// Datos del quiz (si la lección es tipo quiz)
export interface QuizData {
  id: string;
  questions: QuizQuestion[];
  passing_score: number;
  max_attempts?: number;
  time_limit_minutes?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'open_text';
  options?: string[];
  correct_answer?: string | number;
  explanation?: string;
  points: number;
}

// Progreso del usuario en la lección
export interface LessonProgress {
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  progress_percentage: number;
  time_spent_seconds: number;
  last_accessed: string;
  completion_date?: string;
  quiz_attempts?: QuizAttempt[];
}

export interface QuizAttempt {
  id: string;
  attempt_number: number;
  score: number;
  max_score: number;
  passed: boolean;
  started_at: string;
  completed_at?: string;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  question_id: string;
  user_answer: string | number;
  is_correct: boolean;
  points_earned: number;
}

// Información de acceso a la lección
export interface LessonAccessInfo {
  has_access: boolean;
  access_type: 'free' | 'premium' | 'enrolled' | 'instructor';
  restrictions: string[];
  can_download_resources: boolean;
  can_take_quiz: boolean;
}

// Lección para overview del curso (versión simplificada)
export interface LessonOverview {
  id: string;
  title: string;
  order: number;
  content_type: ContentType;
  duration: number;
  is_free_preview: boolean;
  has_access: boolean;
  is_completed?: boolean;
  description?: string;
  thumbnail?: string;
}

// Para creación de lecciones - coincide exactamente con backend LessonCreate DTO
export interface LessonCreate {
  title: string;
  course_id: string;
  order: number;
  content_type: ContentType;
  content_url?: string;
  content_text?: string;
  duration: number;
  is_free_preview: boolean;
  attachments: string[];
}

// Para actualización de lecciones
export interface LessonUpdate {
  title?: string;
  order?: number;
  content_type?: ContentType;
  content_url?: string;
  content_text?: string;
  duration?: number;
  is_free_preview?: boolean;
  attachments?: string[];
  description?: string;
}

// Para reordenar lecciones
export interface LessonOrderUpdate {
  lesson_id: string;
  order: number;
}

// Estados de loading para UI
export interface LessonDetailState {
  lesson: LessonDetail | null;
  loading: boolean;
  error: string | null;
  playing: boolean;
  current_time: number;
  playback_speed: number;
}

// Respuesta de la API para lecciones de un curso
export interface CourseLessonsResponse {
  lessons: LessonResponse[];
  total_duration: number;
  total_lessons: number;
  free_lessons_count: number;
}

// Filtros para lecciones
export interface LessonFilters {
  content_type?: ContentType;
  is_free_preview?: boolean;
  order_min?: number;
  order_max?: number;
}

// Evento de progreso de lección (para analytics)
export interface LessonProgressEvent {
  lesson_id: string;
  course_id: string;
  event_type: 'lesson_started' | 'lesson_paused' | 'lesson_resumed' | 'lesson_completed' | 'video_progress';
  timestamp: string;
  progress_percentage?: number;
  time_position_seconds?: number;
  additional_data?: Record<string, any>;
}

// Para player de video
export interface VideoPlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  fullscreen: boolean;
  quality: string;
  buffered: number;
}

export interface VideoPlayerActions {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  toggleFullscreen: () => void;
  setQuality: (quality: string) => void;
}

export default LessonDetail;
