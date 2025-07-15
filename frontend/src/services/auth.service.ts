import api from './api';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  VerificationResponse 
} from '../types/auth';

/**
 * Servicio para manejar la autenticación de usuarios
 */
export const authService = {
  /**
   * Iniciar sesión con credenciales
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Registrar un nuevo usuario
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  /**
   * Verificar el correo electrónico con token
   */
  verifyEmail: async (token: string): Promise<VerificationResponse> => {
    const response = await api.post<VerificationResponse>(`/auth/verify-email/${token}`);
    return response.data;
  },

  /**
   * Solicitar un nuevo correo de verificación
   */
  resendVerification: async (email: string): Promise<VerificationResponse> => {
    const response = await api.post<VerificationResponse>('/auth/resend-verification', { email });
    return response.data;
  },

  /**
   * Cerrar sesión (cliente)
   */
  logout: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  /**
   * Obtener información del usuario actual
   */
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};
