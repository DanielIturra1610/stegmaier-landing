/**
 * Utilidad para manejar errores de API de forma centralizada
 * Especialmente errores 401 de autenticación
 */

// Función para limpiar sesión cuando el token es inválido
export const clearAuthSession = () => {
  // Limpiar localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('user_role');

  // Limpiar sessionStorage si se usa
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('user_data');

  console.log('🔑 [Auth] Session cleared due to invalid token');
};

// Función para redirigir al login
export const redirectToLogin = (currentPath?: string) => {
  // Guardar la página actual para redireccionar después del login
  if (currentPath && !currentPath.includes('/auth/')) {
    localStorage.setItem('redirect_after_login', currentPath);
  }

  // Redirigir al login
  window.location.href = '/auth/login';
};

// Función principal para manejar errores de autenticación
export const handleAuthError = (error: any, currentPath?: string) => {
  console.error('🚨 [Auth Error]', error);

  // Verificar si es error 401
  if (error?.response?.status === 401) {
    console.warn('🔑 [Auth] Token invalid or expired, clearing session...');

    // Mostrar mensaje al usuario
    if (typeof window !== 'undefined' && window.confirm) {
      const shouldRelogin = window.confirm(
        'Tu sesión ha expirado. ¿Quieres iniciar sesión nuevamente?'
      );

      if (shouldRelogin) {
        clearAuthSession();
        redirectToLogin(currentPath);
      }
    } else {
      // Si no hay interfaz, limpiar automáticamente
      clearAuthSession();
      redirectToLogin(currentPath);
    }

    return true; // Indica que se manejó el error
  }

  return false; // No es un error de autenticación
};

// Función genérica para manejar cualquier error de API
export const handleApiError = (error: any, context?: string, currentPath?: string) => {
  const errorMessage = error?.response?.data?.detail ||
                      error?.response?.data?.message ||
                      error?.message ||
                      'Error desconocido';

  console.error(`❌ [API Error] ${context || 'Unknown'}:`, {
    status: error?.response?.status,
    message: errorMessage,
    url: error?.config?.url,
    method: error?.config?.method
  });

  // Intentar manejar como error de autenticación
  if (handleAuthError(error, currentPath)) {
    return; // Se manejó como error de auth
  }

  // Manejar otros tipos de errores
  switch (error?.response?.status) {
    case 403:
      console.warn('🚫 [API] Access forbidden');
      break;
    case 404:
      console.warn('🔍 [API] Resource not found');
      break;
    case 422:
      console.warn('📝 [API] Validation error');
      break;
    case 500:
      console.error('💥 [API] Server error');
      break;
    default:
      console.error('🌐 [API] Network or unknown error');
  }

  // Retornar mensaje de error formateado
  return errorMessage;
};

// Hook personalizado para usar en componentes React
export const useApiErrorHandler = () => {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return {
    handleError: (error: any, context?: string) =>
      handleApiError(error, context, currentPath),
    handleAuthError: (error: any) =>
      handleAuthError(error, currentPath),
    clearSession: clearAuthSession,
    redirectToLogin: () => redirectToLogin(currentPath)
  };
};

export default {
  handleApiError,
  handleAuthError,
  clearAuthSession,
  redirectToLogin,
  useApiErrorHandler
};