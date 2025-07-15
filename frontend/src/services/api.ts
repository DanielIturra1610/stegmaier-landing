import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Interceptor de respuestas para manejar errores comunes
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const { response } = error;
    
    // Manejar error de autenticación (401)
    if (response?.status === 401) {
      // Si el token expiró, limpiar almacenamiento local
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Opcional: Redirigir a login
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
