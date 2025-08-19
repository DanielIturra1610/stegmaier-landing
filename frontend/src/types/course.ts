/**
 * Tipos TypeScript para cursos
 * Basados en los DTOs del backend
 */

// Enums que coinciden con el backend
export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate', 
  ADVANCED = 'advanced'
}

export enum CourseCategory {
  TECHNOLOGY = 'technology',
  BUSINESS = 'business',
  DESIGN = 'design',
  MARKETING = 'marketing',
  HEALTH = 'health',
  LANGUAGE = 'language',
  MUSIC = 'music',
  PHOTOGRAPHY = 'photography',
  COOKING = 'cooking',
  FITNESS = 'fitness',
  PROGRAMMING = 'programming',
  STRATEGY = 'strategy'
}

// Interface para lección individual (compatible con courseService)
export interface LessonDetail {
  id: string;
  title: string;
  order: number;
  content_type: string;
  content_text?: string;
  content_url?: string;
  duration: number;
  is_free_preview: boolean;
}

// Interfaz básica de curso - coincide con Course en courseService.ts
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor?: string;
  instructor_id?: string;
  instructor_name?: string;
  total_duration?: number;
  lessons_count?: number;
  // ✅ CORREGIDO: lessons puede ser array de objetos o número (compatible con courseService)
  lessons?: LessonDetail[] | number;
  // Mantener compatibilidad con nombres anteriores
  duration?: number;
  completedLessons?: number;
  progress?: number;
  thumbnail?: string;
  cover_image?: string;
  category?: string;
  level?: string;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interfaz de curso para listados - basada en CourseListResponse del backend
export interface CourseListResponse {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  cover_image?: string;
  price?: number;
  discount_price?: number;
  level: CourseLevel;
  category: CourseCategory;
  tags: string[];
  total_duration: number;
  total_students: number;
  average_rating: number;
  is_published: boolean;
  created_at: string;
}

// Interfaz completa de curso - basada en CourseResponse del backend
export interface CourseResponse {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  cover_image?: string;
  price?: number;
  discount_price?: number;
  level: CourseLevel;
  category: CourseCategory;
  tags: string[];
  requirements: string[];
  what_you_will_learn: string[];
  lessons: string[]; // IDs de lecciones
  total_duration: number;
  total_students: number;
  average_rating: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Interfaz extendida para página de detalle
export interface CourseDetail extends CourseResponse {
  instructor: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
    title?: string;
    rating?: number;
    total_courses?: number;
    total_students?: number;
  };
  stats: {
    enrollments_count: number;
    lessons_count: number;
    reviews_count: number;
    completion_rate?: number;
  };
  // Información de enrollment del usuario actual (si está logueado)
  user_enrollment?: {
    enrolled_at: string;
    progress: number;
    status: 'active' | 'completed' | 'cancelled';
    last_accessed?: string;
  };
}

// Respuesta de la API para obtener cursos
export interface CoursesResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
}

// Datos completos para la página de detalle
export interface CourseDetailPageData {
  course: CourseDetail;
  lessons: LessonOverview[];
  user_access: UserCourseAccess;
}

// Información de acceso del usuario al curso
export interface UserCourseAccess {
  can_view_detail: boolean;
  is_enrolled: boolean;
  can_enroll: boolean;
  enrollment_status?: 'active' | 'completed' | 'cancelled';
  access_type: 'free' | 'premium' | 'instructor' | 'admin';
  restrictions: string[]; // Mensajes de restricción si los hay
}

// Lección básica para overview del curso
export interface LessonOverview {
  id: string;
  title: string;
  order: number;
  content_type: 'video' | 'text' | 'quiz';
  duration: number;
  is_free_preview: boolean;
  has_access: boolean;
  is_completed?: boolean;
  description?: string;
}

// Para creación de cursos (formularios admin)
export interface CourseCreate {
  title: string;
  description: string;
  cover_image?: string;
  price?: number;
  discount_price?: number;
  level: CourseLevel;
  category: CourseCategory;
  tags: string[];
  requirements: string[];
  what_you_will_learn: string[];
}

// Para actualización de cursos
export interface CourseUpdate {
  title?: string;
  description?: string;
  cover_image?: string;
  price?: number;
  discount_price?: number;
  level?: CourseLevel;
  category?: CourseCategory;
  tags?: string[];
  requirements?: string[];
  what_you_will_learn?: string[];
}

// Filtros para búsqueda de cursos
export interface CourseFilters {
  category?: CourseCategory;
  level?: CourseLevel;
  is_published?: boolean;
  price_min?: number;
  price_max?: number;
  search_query?: string;
  tags?: string[];
}

// Parámetros de paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

// Respuesta de búsqueda
export interface CourseSearchResponse {
  courses: CourseListResponse[];
  total: number;
  page: number;
  limit: number;
  query: string;
}

// Estados de loading para UI
export interface CourseDetailState {
  course: CourseDetail | null;
  lessons: LessonOverview[];
  loading: boolean;
  error: string | null;
  enrollment_loading: boolean;
}

export default CourseDetail;
