/**
 * Configuración centralizada de API para Stegmaier LMS
 * Elimina inconsistencias y URLs relativas
 */

// Configuración base de la API
export const API_CONFIG = {
  // URL base del backend - FORZAR HTTPS SIEMPRE EN PRODUCCIÓN
  BASE_URL: (() => {
    const envUrl = (import.meta as any).env.VITE_API_BASE_URL;
    const fallbackUrl = 'https://stegmaierplatform.com/api/v1';
    
    // 🚨 CRÍTICO: FORZAR HTTPS en TODO momento en producción
    if ((import.meta as any).env.PROD || 
        (typeof window !== 'undefined' && window.location.protocol === 'https:') ||
        (import.meta as any).env.VITE_ENVIRONMENT === 'production') {
      
      // SIEMPRE forzar backend local con HTTPS
      const httpsUrl = 'https://stegmaierplatform.com/api/v1';
      console.log('🔐 [API Config] FORCING HTTPS backend URL:', httpsUrl);
      return httpsUrl;
    }
    
    // Fallback con conversión a HTTPS si es necesario
    if (envUrl && envUrl.startsWith('http://')) {
      const httpsConverted = envUrl.replace('http://', 'https://');
      console.log('🔐 [API Config] Converting to HTTPS:', httpsConverted);
      return httpsConverted;
    }
    
    return envUrl || fallbackUrl;
  })(),
  
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

import { forceHttps } from '../utils/forceHttps';

/**
 * Construye una URL completa para un endpoint del API
 * @param endpoint - El endpoint relativo (ej: '/auth/login')
 * @returns La URL completa del API
 */
export function buildApiUrl(endpoint: string): string {
  // Asegurar que el endpoint empiece con /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Log para debug
  const fullUrl = `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
  
  // SIEMPRE forzar HTTPS en producción
  const secureUrl = forceHttps(fullUrl);
  
  if (secureUrl !== fullUrl) {
    console.log('🔐 [API Config] FORCING HTTPS:', secureUrl);
  }
  
  return secureUrl;
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

// Debug logging EN PRODUCCIÓN para diagnosticar problema
console.log('🔧 [API Config] Base URL:', API_CONFIG.BASE_URL);
console.log('🔧 [API Config] Environment:', (import.meta as any).env?.VITE_ENVIRONMENT);
console.log('🔧 [API Config] Protocol:', typeof window !== 'undefined' ? window.location.protocol : 'server');
console.log('🔧 [API Config] VITE_API_BASE_URL:', (import.meta as any).env.VITE_API_BASE_URL);
console.log('🔧 [API Config] Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server');

// Export default para compatibilidad
export default API_CONFIG;
