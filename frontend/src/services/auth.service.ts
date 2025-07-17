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
    // Transformamos las credenciales al formato esperado por el backend
    // El backend espera username o email, así que enviamos el email como username
    const backendCredentials = {
      username: credentials.email,  // El backend puede autenticar con username o email
      password: credentials.password
    };
    
    const response = await api.post<AuthResponse>('/auth/login', backendCredentials);
    
    // Guardar el token y los datos del usuario en localStorage para mantener la sesión
    if (response.data && response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      // Guardar información del usuario para acceso rápido
      const userData = {
        id: response.data.user_id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      };
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }
    
    return response.data;
  },

  /**
   * Registrar un nuevo usuario
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    
    // Guardar el token y los datos del usuario en localStorage para mantener la sesión
    if (response.data && response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      // Guardar información del usuario para acceso rápido
      const userData = {
        id: response.data.user_id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      };
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }
    
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
