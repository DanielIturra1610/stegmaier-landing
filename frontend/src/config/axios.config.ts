/**
 * Configuración global de Axios con interceptores
 * Agrega automáticamente el token de autenticación a todas las peticiones
 */
import axios from 'axios';
import { getAuthHeaders } from './api.config';

console.log('🚀 [Axios Config] Initializing axios interceptors...');

// Interceptor de peticiones: agrega automáticamente el token de autenticación
axios.interceptors.request.use(
  (config) => {
    // Obtener headers de autenticación (incluye token y tenant_id si existen)
    const authHeaders = getAuthHeaders();

    // Combinar headers existentes con headers de autenticación
    // Los authHeaders tienen prioridad para sobrescribir cualquier header duplicado
    config.headers = {
      ...config.headers,
      ...authHeaders,
    };

    // Debug log detallado
    console.log('🔍 [Axios Interceptor] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!authHeaders.Authorization,
      authToken: authHeaders.Authorization ? authHeaders.Authorization.substring(0, 30) + '...' : 'NONE',
      hasTenant: !!authHeaders['X-Tenant-ID'],
      allHeaders: Object.keys(config.headers || {})
    });

    return config;
  },
  (error) => {
    console.error('❌ [Axios] Request error:', error);
    return Promise.reject(error);
  }
);

console.log('✅ [Axios Config] Interceptors configured successfully');

// Interceptor de respuestas: maneja errores globales
axios.interceptors.response.use(
  (response) => {
    // Debug log en desarrollo
    if (import.meta.env.DEV) {
      console.log('✅ [Axios] Response:', {
        status: response.status,
        url: response.config.url,
      });
    }
    return response;
  },
  (error) => {
    // Manejo de errores específicos
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url;

      // Error 401: Token inválido o expirado
      if (status === 401) {
        console.warn('⚠️ [Axios] 401 Unauthorized:', url);

        // NO limpiar sesión automáticamente - dejar que AuthContext maneje esto
        // Solo registrar el error para debugging
      }

      // Error 403: Sin permisos
      if (status === 403) {
        console.error('❌ [Axios] 403 Forbidden:', url);
      }

      // Error 500: Error del servidor
      if (status >= 500) {
        console.error('❌ [Axios] Server error:', status, url);
      }
    } else if (error.request) {
      // Error de red: no se recibió respuesta
      console.error('❌ [Axios] Network error - no response received');
    } else {
      // Error en la configuración de la petición
      console.error('❌ [Axios] Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axios;
