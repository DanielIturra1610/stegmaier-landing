/**
 * Tipos TypeScript para el sistema de enrollments
 * Basados en los DTOs del backend
 */

// Enum para estados de enrollment - debe coincidir con backend
export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// Interfaz principal de enrollment
export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress: number; // 0-100
  completed_lessons: string[]; // IDs de lecciones completadas
  enrollment_date: string; // ISO string
  expiry_date?: string; // ISO string, nullable
  last_accessed?: string; // ISO string, nullable
  certificate_issued: boolean;
  certificate_url?: string; // nullable
  user_role: string; // Rol del usuario en el curso
}

// DTO para crear nuevo enrollment
export interface EnrollmentCreate {
  course_id: string;
  student_id?: string; // Solo para admins
  expiry_date?: string; // ISO string
}

// DTO para actualizar enrollment
export interface EnrollmentUpdate {
  status?: EnrollmentStatus;
  progress?: number;
  completed_lessons?: string[];
  expiry_date?: string;
}

// DTO para marcar lección como completada
export interface LessonCompletionUpdate {
  lesson_id: string;
  completed?: boolean;
}

// Respuesta de progreso de inscripción - coincide con EnrollmentResponse del backend
export interface EnrollmentProgressResponse {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress: number;
  completed_lessons: string[];
  enrollment_date: string;
  expiry_date?: string;
  last_accessed?: string;
  certificate_issued: boolean;
  certificate_url?: string;
  user_role: string; // Rol del usuario en el curso
  // Campos adicionales para UI (snake_case from backend)
  enrolled_at?: string;
  completion_date?: string;
  expected_completion_date?: string;
  time_spent_minutes?: number;
  time_spent?: number; // En segundos
  completed_lessons_count?: number;
  total_lessons_count?: number;
  total_lessons?: number; // Alias para total_lessons_count
  last_activity?: string;
  // CamelCase versions (transformed by axios)
  enrolledAt?: string;
  completionDate?: string;
  expectedCompletionDate?: string;
  timeSpentMinutes?: number;
  timeSpent?: number;
  completedLessonsCount?: number;
  totalLessonsCount?: number;
  totalLessons?: number;
  lastActivity?: string;
}

// Curso con información de inscripción
export interface EnrolledCourse {
  course: {
    id: string;
    title: string;
    description: string;
    instructor_id: string;
    instructor_name?: string;
    level: string;
    category: string;
    is_published: boolean;
    lessons_count?: number;
    enrollments_count?: number;
    created_at: string;
    updated_at: string;
  };
  // Información de la inscripción del usuario
  enrollment: EnrollmentProgressResponse;
}

// Estadísticas de enrollment para admins/instructores
export interface EnrollmentStats {
  course_id: string;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  cancelled_enrollments: number;
  average_progress: number;
  completion_rate: number; // percentage
  enrollments_by_month: {
    month: string;
    count: number;
  }[];
}

// Respuesta paginada de enrollments
export interface EnrollmentsResponse {
  enrollments: Enrollment[];
  total: number;
  page: number;
  limit: number;
}

// Estado de enrollment para un curso específico
export interface CourseEnrollmentStatus {
  course_id: string;
  is_enrolled: boolean;
  enrollment?: Enrollment;
  can_enroll: boolean;
  enrollment_restrictions?: string[]; // Razones por las que no puede inscribirse
}
