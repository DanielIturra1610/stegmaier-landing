/**
 * Configuración centralizada de API para Stegmaier LMS
 * Elimina inconsistencias y URLs relativas
 */

// Configuración base de la API
export const API_CONFIG = {
  // URL base del backend - siempre apunta al backend en Railway
  BASE_URL: (import.meta as any).env.VITE_API_BASE_URL || 'https://stegmaier-backend-production.up.railway.app/api/v1',
  
  // Timeout para requests
  TIMEOUT: 30000,
  
  // Headers comunes
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  }
} as const;

// URLs específicas por servicio (sin duplicar /api/v1)
export const API_ENDPOINTS = {
  // Auth
  AUTH: '/auth',
  USERS: '/users',
  // Courses
  COURSES: '/courses',
  COURSES_AVAILABLE: '/courses/available',
  COURSES_STUDENT: '/courses/student',
  // Lessons
  LESSONS: '/lessons',
  // Enrollments
  ENROLLMENTS: '/enrollments',
  // Progress
  PROGRESS: '/progress',
  // Analytics
  ANALYTICS: '/analytics',
  // Media
  MEDIA: '/media',
  // Quizzes
  QUIZZES: '/quizzes',
  // Assignments
  ASSIGNMENTS: '/assignments',
  // Instructor
  INSTRUCTOR: '/instructor',
  
  // Admin
  ADMIN: '/admin',
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  
  // Push subscriptions
  PUSH_SUBSCRIPTIONS: '/push-subscriptions'
} as const;

/**
 * Construye URL completa del endpoint
 */
export function buildApiUrl(endpoint: string): string {
  // Eliminar / inicial si existe para evitar duplicación
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // La BASE_URL ya incluye /api/v1, así que solo concatenamos
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
}

/**
 * Obtiene headers de autenticación
 */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` })
  };
}

/**
 * Headers para FormData (sin Content-Type para multipart)
 */
export function getAuthFormDataHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  
  return {
    ...(token && { Authorization: `Bearer ${token}` })
  };
}

// Debug logging en desarrollo
if ((import.meta as any).env?.DEV) {
  console.log('🔧 [API Config] Base URL:', API_CONFIG.BASE_URL);
  console.log('🔧 [API Config] Environment:', (import.meta as any).env?.VITE_ENVIRONMENT);
}

// Export default para compatibilidad
export default API_CONFIG;
