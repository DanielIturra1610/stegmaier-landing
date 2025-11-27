import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/api.config';

// Debug para verificar la URL en producción
console.log('🔍 API_URL configurada:', API_CONFIG.BASE_URL);
console.log('🔍 Todas las variables:', (import.meta as any).env);

// Instancia de axios configurada
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS
});

// Interceptor para requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant ID header for multi-tenancy
    const tenantId = localStorage.getItem('current_tenant_id');
    if (tenantId && tenantId.trim() !== '' && tenantId !== 'null' && tenantId !== 'undefined') {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
