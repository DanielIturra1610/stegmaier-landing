/**
 * Configuración centralizada de API
 */

// Helper simple para detectar producción
const isProduction = () => {
  return (import.meta as any).env.PROD || 
         (import.meta as any).env.VITE_ENVIRONMENT === 'production' ||
         (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
};

// Logger simple
const logger = {
  info: (message: string, ...args: any[]) => console.log(`ℹ️ ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`⚠️ ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`❌ ${message}`, ...args),
  debug: (message: string, ...args: any[]) => {
    if (!isProduction()) console.debug(`🐛 ${message}`, ...args);
  }
};

// Configuración base de la API
export const API_CONFIG = {
  // URL base del backend - Dinámico y seguro
  BASE_URL: (() => {
    const envUrl = (import.meta as any).env.VITE_API_BASE_URL;
    const isProductionEnv = isProduction();

    // En producción, usar variable de entorno o construir automáticamente
    if (isProductionEnv) {
      // Si hay URL de entorno, usarla
      if (envUrl) {
        const secureUrl = envUrl.replace(/^http:\/\//, 'https://');
        logger.info('[API Config] Using environment API URL', secureUrl);
        return secureUrl;
      }

      // Construir URL basada en el hostname actual
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const constructedUrl = `${protocol}//${hostname}/api/v1`;
        logger.info('[API Config] Constructed API URL from hostname', constructedUrl);
        return constructedUrl;
      }

      // Fallback para SSR
      return '/api/v1';
    }

    // En desarrollo, usar URL relativa para aprovechar el proxy de Vite
    // El proxy en vite.config.ts redirige /api/* a http://localhost:8000
    return envUrl || '/api/v1';
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
  // Base (for generic endpoints)
  BASE: '',

  // Auth
  AUTH: '/auth',
  USERS: '/users',

  // Courses
  COURSES: '/courses',
  COURSES_AVAILABLE: '/courses',
  COURSES_STUDENT: '/courses/student',

  // Lessons
  LESSONS: '/lessons',

  // Modules
  MODULES: '/modules',

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
  ASSIGNMENTS_URL: '/assignments',

  // Reviews
  REVIEWS: '/reviews',

  // Certificates
  CERTIFICATES: '/certificates',

  // Instructor
  INSTRUCTOR: '/instructor',

  // Admin
  ADMIN: '/admin',

  // SuperAdmin & Tenants
  SUPERADMIN: '/superadmin',
  TENANTS: '/superadmin/tenants',

  // Notifications
  NOTIFICATIONS: '/notifications',

  // Push subscriptions
  PUSH_SUBSCRIPTIONS: '/push-subscriptions',

  // Profile
  PROFILE: '/profile'
} as const;

/**
 * Construye una URL completa para un endpoint del API
 * @param endpoint - El endpoint relativo (ej: '/auth/login')
 * @returns La URL completa del API
 */
export function buildApiUrl(endpoint: string): string {
  // Asegurar que el endpoint empiece con /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Construir URL completa
  const fullUrl = `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
  
  // En producción, forzar HTTPS si es necesario
  if (isProduction() && fullUrl.startsWith('http://')) {
    const secureUrl = fullUrl.replace('http://', 'https://');
    logger.warn('[API Config] Converting to HTTPS', secureUrl);
    return secureUrl;
  }
  
  return fullUrl;
}

/**
 * Obtiene headers de autenticación con validación de token
 * Incluye X-Tenant-ID si está disponible para multi-tenancy
 */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  const tenantId = localStorage.getItem('current_tenant_id');

  const headers: Record<string, string> = {
    ...API_CONFIG.DEFAULT_HEADERS
  };

  // Agregar token de autenticación si existe
  if (token && token.trim() !== '' && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;

    // Log para debugging en desarrollo
    if (!isProduction()) {
      logger.debug('[API Config] Using auth token:', token.substring(0, 20) + '...');
    }
  } else {
    logger.warn('[API Config] No valid auth token found, user may need to login again');
    // Limpiar token corrupto
    localStorage.removeItem('auth_token');
  }

  // Agregar X-Tenant-ID si existe (para multi-tenancy)
  if (tenantId && tenantId.trim() !== '' && tenantId !== 'null' && tenantId !== 'undefined') {
    headers['X-Tenant-ID'] = tenantId;

    // Log para debugging en desarrollo
    if (!isProduction()) {
      logger.debug('[API Config] Using tenant ID:', tenantId);
    }
  }

  return headers;
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

// Debug logging solo en desarrollo
if (!isProduction()) {
  logger.debug('[API Config] Base URL:', API_CONFIG.BASE_URL);
  logger.debug('[API Config] Timeout:', API_CONFIG.TIMEOUT);
}

// Validation en producción
if (isProduction() && !API_CONFIG.BASE_URL) {
  logger.error('[API Config] No API base URL configured for production!');
}

// Export default para compatibilidad
export default API_CONFIG;
