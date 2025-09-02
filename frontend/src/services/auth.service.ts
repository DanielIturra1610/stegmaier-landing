import axios from 'axios';
import { buildApiUrl, getAuthHeaders } from '../config/api.config';
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
    
    const response = await axios.post<AuthResponse>(buildApiUrl('/auth/login'), backendCredentials);
    
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
    const response = await axios.post<AuthResponse>(buildApiUrl('/auth/register'), userData);
    
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
    const response = await axios.post<VerificationResponse>(buildApiUrl('/auth/verify-email'), { token });
    return response.data;
  },

  /**
   * Solicitar un nuevo correo de verificación
   */
  resendVerification: async (email: string): Promise<VerificationResponse> => {
    const response = await axios.post<VerificationResponse>(buildApiUrl('/auth/resend-verification'), { email });
    return response.data;
  },

  /**
   * Cerrar sesión (cliente)
   */
  logout: (): void => {
    // Limpieza inmediata del localStorage
    localStorage.clear(); // Limpia todos los items de localStorage para evitar estado persistente
    
    // Como medida adicional, eliminamos explícitamente los elementos clave
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('redirect_after_logout');
    
    // No utilizamos timeout porque la redirección completa en AuthContext
    // se encargará de renovar la página, lo que garantiza un estado limpio
  },

  /**
   * Obtener información del usuario actual
   */
  getCurrentUser: async () => {
    const response = await axios.get(buildApiUrl('/auth/me'), {
      headers: getAuthHeaders()
    });
    const apiData = response.data;
    
    // Console para debugging
    console.log('🔍 [authService] Raw API data:', apiData);
    
    // Mapeo de los datos recibidos del API al formato que espera nuestra aplicación
    const userData = {
      id: apiData._id || apiData.id || '',
      email: apiData.email || '',
      username: apiData.username || '',
      // Manejo de nombres - priorizar full_name del backend
      full_name: apiData.full_name || `${apiData.firstName || apiData.first_name || ''} ${apiData.lastName || apiData.last_name || ''}`.trim() || apiData.username || 'Usuario',
      firstName: apiData.firstName || apiData.first_name || (apiData.full_name ? apiData.full_name.split(' ')[0] : ''),
      lastName: apiData.lastName || apiData.last_name || (apiData.full_name ? apiData.full_name.split(' ').slice(1).join(' ') : ''),
      // Otros campos
      role: apiData.role || 'student',
      verified: apiData.verified || apiData.is_verified || false,
      profileImage: apiData.profileImage || apiData.profile_picture || '',
      // Fechas
      createdAt: apiData.createdAt || apiData.created_at || new Date().toISOString(),
      updatedAt: apiData.updatedAt || apiData.updated_at || new Date().toISOString()
    };
    
    console.log('🔍 [authService] Mapped user data:', userData);
    
    // Guardamos los datos actualizados en localStorage para acceso rápido
    localStorage.setItem('auth_user', JSON.stringify(userData));
    
    return userData;
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Obtener el token de autenticación
   */
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },
};
