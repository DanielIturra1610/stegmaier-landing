/**
 * Tipos TypeScript para módulos
 * Basados en los DTOs del backend
 */

// Enum para tipos de contenido de lecciones dentro de módulos
export enum ModuleContentType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz',
  WORKSHOP = 'workshop',
  ASSIGNMENT = 'assignment'
}

// Interfaz básica de módulo - basada en ModuleResponse del backend
export interface ModuleResponse {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  lessons: string[]; // IDs de lecciones
  estimated_duration: number;
  is_required: boolean;
  unlock_previous: boolean;
  created_at: string;
  updated_at: string;
}

// Interfaz extendida con lecciones completas
export interface ModuleWithLessons {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  lessons: LessonOverview[]; // Lecciones completas
  lessons_count: number;
  total_duration: number;
  estimated_duration: number;
  is_required: boolean;
  unlock_previous: boolean;
  created_at: string;
  updated_at: string;
  // Estados para UI
  is_expanded?: boolean;
  is_loading?: boolean;
  completion_percentage?: number;
}

// Lección básica para overview del módulo
export interface LessonOverview {
  id: string;
  title: string;
  order: number;
  content_type: ModuleContentType;
  duration: number;
  is_free_preview: boolean;
  has_access: boolean;
  is_completed?: boolean;
  description?: string;
  thumbnail?: string;
}

// Estructura completa del curso con módulos
export interface CourseStructureResponse {
  course_id: string;
  modules: ModuleWithLessons[];
  total_modules: number;
  total_lessons: number;
  total_duration: number;
}

// Para creación de módulos (formularios admin)
export interface ModuleCreate {
  title: string;
  description: string;
  order?: number; // Se auto-asigna si no se proporciona
  estimated_duration: number;
  is_required: boolean;
  unlock_previous: boolean;
}

// Para actualización de módulos
export interface ModuleUpdate {
  title?: string;
  description?: string;
  order?: number;
  estimated_duration?: number;
  is_required?: boolean;
  unlock_previous?: boolean;
}

// Para reordenar módulos
export interface ModuleOrderUpdate {
  module_id: string;
  order: number;
}

// Para asignar lecciones a módulos
export interface LessonAssignment {
  lesson_id: string;
}

// Estados de loading para UI
export interface ModuleDetailState {
  module: ModuleWithLessons | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
  deleting: boolean;
}

// Estado del formulario de módulo
export interface ModuleFormData {
  title: string;
  description: string;
  estimated_duration: number;
  is_required: boolean;
  unlock_previous: boolean;
}

// Validación de formulario
export interface ModuleFormErrors {
  title?: string;
  description?: string;
  estimated_duration?: string;
}

// Filtros para módulos
export interface ModuleFilters {
  course_id?: string;
  is_required?: boolean;
  order_min?: number;
  order_max?: number;
}

// Progreso del usuario en un módulo
export interface ModuleProgress {
  module_id: string;
  user_id: string;
  completed_lessons: string[];
  total_lessons: number;
  completion_percentage: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
  last_accessed: string;
}

// Estructura de navegación para CourseViewPage
export interface CourseNavigation {
  current_module_id?: string;
  current_lesson_id?: string;
  modules: ModuleNavigation[];
  can_navigate_back: boolean;
  can_navigate_forward: boolean;
  next_item?: NavigationItem;
  previous_item?: NavigationItem;
}

export interface ModuleNavigation {
  id: string;
  title: string;
  order: number;
  is_current: boolean;
  is_completed: boolean;
  is_locked: boolean;
  lessons: LessonNavigation[];
}

export interface LessonNavigation {
  id: string;
  title: string;
  order: number;
  content_type: ModuleContentType;
  is_current: boolean;
  is_completed: boolean;
  is_locked: boolean;
  duration: number;
}

export interface NavigationItem {
  type: 'lesson' | 'module';
  id: string;
  title: string;
  module_id?: string;
}

// Para drag & drop de reordenamiento
export interface DragDropModule {
  id: string;
  title: string;
  order: number;
  lessons_count: number;
  total_duration: number;
}

// Eventos de analytics para módulos
export interface ModuleAnalyticsEvent {
  module_id: string;
  course_id: string;
  event_type: 'module_started' | 'module_completed' | 'module_accessed';
  timestamp: string;
  user_id: string;
  additional_data?: Record<string, any>;
}

// Respuesta de la API para módulos de un curso
export interface CourseModulesResponse {
  modules: ModuleResponse[];
  total_modules: number;
  total_duration: number;
}

export default ModuleResponse;
