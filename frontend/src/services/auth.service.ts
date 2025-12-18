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
    // El backend espera email y password
    const backendCredentials = {
      email: credentials.email,
      password: credentials.password
    };

    const response = await axios.post(buildApiUrl('/auth/login'), backendCredentials);

    // El backend envuelve la respuesta en { success, message, data }
    const authData = response.data.data as AuthResponse;

    console.log('🔍 [authService] Login response received:', {
      hasToken: !!authData?.access_token,
      tokenPreview: authData?.access_token?.substring(0, 20) + '...'
    });

    // Guardar el token y los datos del usuario en localStorage para mantener la sesión
    if (authData && authData.access_token) {
      console.log('🔍 [authService] Saving token to localStorage...');
      localStorage.setItem('auth_token', authData.access_token);

      // Verificar que se guardó correctamente
      const savedToken = localStorage.getItem('auth_token');
      console.log('🔍 [authService] Token saved verification:', {
        saved: !!savedToken,
        matches: savedToken === authData.access_token
      });

      // Guardar información del usuario para acceso rápido
      const userData = {
        id: authData.user?.id,
        username: authData.user?.full_name,
        email: authData.user?.email,
        role: authData.user?.role
      };
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }

    return authData;
  },

  /**
   * Registrar un nuevo usuario
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    // Transformar los datos del frontend al formato esperado por el backend
    const backendPayload = {
      email: userData.email,
      password: userData.password,
      full_name: `${userData.firstName} ${userData.lastName}`.trim(),
      role: 'student' // Rol por defecto
    };

    const response = await axios.post(buildApiUrl('/auth/register'), backendPayload);

    // El backend envuelve la respuesta en { success, message, data }
    const authData = response.data.data as AuthResponse;

    // Guardar el token y los datos del usuario en localStorage para mantener la sesión
    if (authData && authData.access_token) {
      localStorage.setItem('auth_token', authData.access_token);
      // Guardar información del usuario para acceso rápido
      const userData = {
        id: authData.user?.id,
        username: authData.user?.full_name,
        email: authData.user?.email,
        role: authData.user?.role
      };
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }

    return authData;
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
    console.log('🔍 [authService] getCurrentUser called');
    const tokenBeforeCall = localStorage.getItem('auth_token');
    console.log('🔍 [authService] Token in localStorage before API call:', tokenBeforeCall ? tokenBeforeCall.substring(0, 20) + '...' : 'NO TOKEN');

    // El interceptor de axios agregará automáticamente los headers de autenticación
    const response = await axios.get(buildApiUrl('/auth/me'));

    // El backend envuelve la respuesta en { success, message, data }
    const apiData = response.data.data;

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
      // Campos de rol (multi-rol support)
      role: apiData.role || 'student',
      roles: apiData.roles || [apiData.role || 'student'],
      active_role: apiData.active_role || apiData.role || 'student',
      has_multiple_roles: apiData.has_multiple_roles || false,
      // Otros campos
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

  /**
   * Cambiar el rol activo del usuario (para usuarios con múltiples roles)
   */
  switchRole: async (role: 'student' | 'instructor' | 'admin' | 'superadmin'): Promise<AuthResponse> => {
    const response = await axios.post(
      buildApiUrl('/auth/switch-role'),
      { role },
      { headers: getAuthHeaders() }
    );

    // El backend envuelve la respuesta en { success, message, data }
    const authData = response.data.data as AuthResponse;

    // Actualizar el token con el nuevo rol activo
    if (authData && authData.access_token) {
      localStorage.setItem('auth_token', authData.access_token);

      // Actualizar información del usuario con el nuevo rol activo
      if (authData.user) {
        const userData = {
          id: authData.user.id,
          username: authData.user.full_name,
          email: authData.user.email,
          role: authData.user.role,
          roles: authData.user.roles || authData.roles,
          active_role: authData.user.active_role || authData.active_role,
          has_multiple_roles: authData.user.has_multiple_roles || authData.has_multiple_roles
        };
        localStorage.setItem('auth_user', JSON.stringify(userData));
      }
    }

    return authData;
  },
};
