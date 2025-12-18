import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '../types/auth';
import { Tenant } from '../types/tenant';
import { authService } from '../services/auth.service';
import tenantService from '../services/tenantService';

/**
 * Decode JWT payload without verification (client-side only)
 * Used to extract role from token since JWT is the source of truth
 */
function decodeJwtPayload(token: string): { role?: string; tenant_id?: string; user_id?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Base64 URL decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User) => void;
  switchRole: (role: 'student' | 'instructor' | 'admin' | 'superadmin') => Promise<void>;
  // Tenant management
  currentTenantId: string | null;
  setCurrentTenantId: (tenantId: string) => Promise<void>;
  availableTenants: Tenant[];
  loadAvailableTenants: () => Promise<void>;
}

// Crear contexto con valor predeterminado
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Estado inicial de autenticación
const initialState: AuthState = {
  user: null as User | null,
  token: null,
  isAuthenticated: false,
  isVerified: false,
  isLoading: true,
  error: null,
};

interface AuthProviderProps {
  children: ReactNode;
}

// Proveedor del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Estado de autenticación
  const [state, setState] = useState<AuthState>(() => {
    // Recuperar datos de almacenamiento al iniciar
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    let user: User | null = null;

    try {
      if (userStr) {
        user = JSON.parse(userStr) as User;
      }
    } catch (error) {
      console.error('Error parsing user from localStorage', error);
    }

    return {
      ...initialState,
      user,
      token,
      isAuthenticated: !!token,
      isVerified: user ? (user.verified || false) : false,
      isLoading: !!token, // Si hay token, verificaremos su validez
    };
  });

  // Estado de tenants
  const [currentTenantId, setCurrentTenantIdState] = useState<string | null>(() => {
    return localStorage.getItem('current_tenant_id');
  });

  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);

  // Verificar token al inicio
  useEffect(() => {
    const verifyToken = async () => {
      // Si hay redirección después de logout, no verificamos el token
      // Esto previene cualquier intento de restaurar la sesión durante el proceso de logout
      const isLoggingOut = document.referrer.includes(window.location.origin) && 
                          window.location.pathname === '/';
                          
      if (state.token && !isLoggingOut) {
        try {
          const userData = await authService.getCurrentUser();
          // Asegurarnos de que tengamos el full_name y createdAt
          const user: User = {
            ...userData,
            full_name: userData.full_name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            createdAt: userData.createdAt || new Date().toISOString()
          };

          // IMPORTANTE: El JWT es la fuente de verdad para el rol
          // El backend /auth/me devuelve el rol global, pero el JWT tiene el rol del tenant
          const savedTenantId = localStorage.getItem('current_tenant_id');
          const currentToken = localStorage.getItem('auth_token');

          console.log('🔍 [AuthContext] verifyToken - savedTenantId:', savedTenantId);
          console.log('🔍 [AuthContext] verifyToken - userData.role from backend /auth/me:', userData.role);

          // Si hay un tenant seleccionado Y hay un token, extraer el rol del JWT
          // El JWT es la fuente de verdad porque el backend lo genera con el rol correcto del tenant
          if (savedTenantId && currentToken) {
            const jwtPayload = decodeJwtPayload(currentToken);
            console.log('🔍 [AuthContext] verifyToken - JWT payload:', jwtPayload);

            if (jwtPayload?.role) {
              console.log('✅ [AuthContext] Using role from JWT:', jwtPayload.role, '(backend returned:', userData.role, ')');
              user.role = jwtPayload.role as 'student' | 'instructor' | 'admin' | 'superadmin';
            } else {
              console.log('⚠️ [AuthContext] No role in JWT, using backend role:', userData.role);
            }
          } else {
            console.log('ℹ️ [AuthContext] No tenant selected or no token, using backend role:', userData.role);
          }

          // Guardar el usuario actualizado en localStorage con el rol correcto del JWT
          localStorage.setItem('auth_user', JSON.stringify(user));
          console.log('✅ [AuthContext] verifyToken - final user.role:', user.role);

          setState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            isVerified: true, // Para la plataforma de cursos, consideramos todos verificados
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          console.error('Token verification failed', error);
          // Limpiar datos completamente si el token no es válido
          localStorage.clear(); // Limpieza completa
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isVerified: false,
            isLoading: false,
            error: null
          });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (state.isLoading) {
      verifyToken();
    }
  }, [state.token, state.isLoading]);

  // Iniciar sesión
  const login = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const authResponse = await authService.login(credentials);
      
      // El token ya se guarda en el servicio de autenticación
      // No es necesario volver a guardarlo aquí
      
      try {
        // Obtener el perfil completo del usuario inmediatamente después del login
        const fullUserData = await authService.getCurrentUser();

        // Actualizar el estado con los datos completos del usuario
        setState({
          user: fullUserData,
          token: authResponse.access_token,
          isAuthenticated: true,
          isVerified: true,
          isLoading: false,
          error: null,
        });

        // Cargar tenants disponibles DESPUÉS de que el login complete
        await loadAvailableTenants();
      } catch (profileError) {
        // Si hay error al cargar el perfil completo, usamos los datos básicos de la autenticación
        console.error('Error al cargar perfil completo:', profileError);
        
        // Crear usuario a partir de la respuesta del backend
        const jwtPayload = decodeJwtPayload(authResponse.access_token);
        const user: User = {
          id: jwtPayload?.user_id || authResponse.user_id,
          email: authResponse.email,
          firstName: authResponse.first_name || authResponse.full_name?.split(' ')[0] || '',
          lastName: authResponse.last_name || authResponse.full_name?.split(' ').slice(1).join(' ') || '',
          full_name: authResponse.full_name || authResponse.username,
          role: (jwtPayload?.role || authResponse.role) as any,
          roles: (authResponse.user?.roles || authResponse.roles) as ('student' | 'instructor' | 'admin' | 'superadmin')[] | undefined,
          active_role: (authResponse.user?.active_role || authResponse.active_role) as ('student' | 'instructor' | 'admin' | 'superadmin') | undefined,
          has_multiple_roles: authResponse.user?.has_multiple_roles || authResponse.has_multiple_roles,
          verified: authResponse.user?.verified || true,
          createdAt: authResponse.created_at || new Date().toISOString(),
          updatedAt: authResponse.updated_at || new Date().toISOString(),
        };
        
        setState({
          user,
          token: authResponse.access_token,
          isAuthenticated: true,
          isVerified: true,
          isLoading: false,
          error: null,
        });

        // Cargar tenants disponibles incluso si hubo error al cargar el perfil
        try {
          await loadAvailableTenants();
        } catch (tenantError) {
          console.error('Error loading tenants after login:', tenantError);
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al iniciar sesión';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  };

  // Registrar usuario
  const register = async (userData: RegisterData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const authResponse = await authService.register(userData);
      
      try {
        // Obtener el perfil completo del usuario inmediatamente después del registro
        const fullUserData = await authService.getCurrentUser();
        
        // Actualizar el estado con los datos completos del usuario
        setState({
          user: fullUserData,
          token: authResponse.access_token,
          isAuthenticated: true,
          isVerified: fullUserData.verified,
          isLoading: false,
          error: null,
        });

        // Cargar tenants disponibles DESPUÉS de que el registro complete
        await loadAvailableTenants();
      } catch (profileError) {
        // Si hay error al cargar el perfil completo, usamos los datos básicos del registro
        console.error('Error al cargar perfil completo después del registro:', profileError);
        
        // Crear usuario a partir de los datos del registro
        const user: User = {
          id: authResponse.user_id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          full_name: `${userData.firstName} ${userData.lastName}`.trim(),
          role: authResponse.role as any,
          verified: false, // Por defecto, los usuarios nuevos no están verificados
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setState({
          user,
          token: authResponse.access_token,
          isAuthenticated: true,
          isVerified: false,
          isLoading: false,
          error: null,
        });

        // Cargar tenants disponibles incluso si hubo error al cargar el perfil
        try {
          await loadAvailableTenants();
        } catch (tenantError) {
          console.error('Error loading tenants after register:', tenantError);
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al registrar usuario';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  };

  // Cerrar sesión
  const logout = () => {
    // Preparamos la redirección hacia la página principal
    const homeUrl = window.location.origin + '/';
    
    // Primero actualizamos el estado con un estado consistente para evitar parpadeos en la UI
    // Es importante hacer esto antes de limpiar el localStorage
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isVerified: false, // Esto es clave para evitar el problema con el botón
      isLoading: false,
      error: null
    });
    
    // Ahora llamamos al servicio de autenticación para limpiar el localStorage
    // El servicio elimina inmediatamente todas las claves del localStorage
    authService.logout();
    
    // Como último paso, forzamos una recarga completa de la página
    // usando replace para evitar entradas adicionales en el historial
    // Esto garantiza un estado completamente limpio
    window.location.replace(homeUrl);
  };
  
  // Verificar email
  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await authService.verifyEmail(token);
      
      if (response.success && state.user) {
        // Actualizar estado del usuario como verificado
        const updatedUser = { ...state.user, verified: true };
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        
        setState(prev => ({
          ...prev,
          user: updatedUser,
          isVerified: true,
          isLoading: false,
          error: null,
        }));
      }
      
      return response.success;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al verificar correo';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  };

  // Reenviar verificación
  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await authService.resendVerification(email);
      setState(prev => ({ ...prev, isLoading: false }));
      return response.success;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al reenviar verificación';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  };

  // Limpiar errores
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // ============================================
  // Tenant Management Functions
  // ============================================

  /**
   * Establece el tenant actual, llama al backend para obtener nuevo JWT y persiste en localStorage
   * IMPORTANTE: También actualiza el rol del usuario basándose en su membership en el tenant
   */
  const setCurrentTenantId = async (tenantId: string) => {
    try {
      console.log('🔍 [AuthContext] Setting current tenant:', tenantId);

      // Llamar al backend para seleccionar el tenant y obtener nuevo JWT con tenant_id
      const response = await tenantService.selectTenant(tenantId);

      console.log('🔍 [AuthContext] SelectTenant response:', JSON.stringify(response, null, 2));

      // Verificar que tenemos una respuesta válida
      if (!response) {
        console.error('❌ [AuthContext] SelectTenant returned null/undefined response');
        throw new Error('Invalid response from selectTenant');
      }

      // Actualizar el token con el nuevo JWT que incluye tenant_id
      const newToken = response.token;
      const newRole = response.role;

      console.log('🔍 [AuthContext] Extracted from response - token:', newToken ? 'present' : 'missing', 'role:', newRole);

      if (newToken) {
        localStorage.setItem('auth_token', newToken);
        console.log('✅ [AuthContext] New token saved to localStorage');

        // Actualizar estado del token Y el rol del usuario basándose en la membership del tenant
        // El rol devuelto por selectTenant es el rol de la membership en ese tenant específico
        if (newRole) {
          // Actualizar el usuario con el nuevo rol FUERA del setState para garantizar que se guarda
          const currentUserStr = localStorage.getItem('auth_user');
          if (currentUserStr) {
            try {
              const currentUser = JSON.parse(currentUserStr);
              const updatedUser = {
                ...currentUser,
                role: newRole
              };
              localStorage.setItem('auth_user', JSON.stringify(updatedUser));
              console.log('✅ [AuthContext] User role saved to localStorage:', newRole);

              // Ahora actualizar el estado de React
              setState(prev => ({
                ...prev,
                token: newToken,
                user: prev.user ? { ...prev.user, role: newRole as 'student' | 'instructor' | 'admin' | 'superadmin' } : prev.user
              }));
            } catch (e) {
              console.error('❌ [AuthContext] Error parsing current user from localStorage:', e);
            }
          } else {
            console.warn('⚠️ [AuthContext] No user in localStorage to update role');
            setState(prev => ({
              ...prev,
              token: newToken
            }));
          }
        } else {
          console.warn('⚠️ [AuthContext] No role in selectTenant response');
          setState(prev => ({
            ...prev,
            token: newToken
          }));
        }
      } else {
        console.warn('⚠️ [AuthContext] No token in selectTenant response');
      }

      // Persistir el tenant_id actual
      localStorage.setItem('current_tenant_id', tenantId);
      setCurrentTenantIdState(tenantId);

      console.log('✅ [AuthContext] Tenant selected successfully:', response.tenant_name, 'with role:', newRole);

      // IMPORTANTE: Obtener datos completos del usuario desde /auth/me para refrescar roles, has_multiple_roles, etc.
      console.log('🔄 [AuthContext] Fetching complete user data after tenant selection...');
      const fullUserData = await authService.getCurrentUser();
      
      // Actualizar estado con datos completos (fullUserData ya es un User válido)
      setState(prev => ({ ...prev, user: fullUserData }));
      console.log('✅ [AuthContext] User data refreshed - has_multiple_roles:', fullUserData.has_multiple_roles, 'roles:', fullUserData.roles);
    } catch (error) {
      console.error('❌ [AuthContext] Error setting tenant:', error);
      throw error;
    }
  };

  /**
   * Cargar tenants disponibles para el usuario
   */
  const loadAvailableTenants = async () => {
    try {
      console.log('🔍 [AuthContext] Loading available tenants...');

      // Si es superadmin, cargar todos los tenants del sistema
      if (state.user?.role === 'superadmin') {
        const response = await tenantService.getTenants(0, 100);
        setAvailableTenants(response.tenants);
        console.log('✅ [AuthContext] Loaded superadmin tenants:', response.tenants.length);
      } else {
        // Para usuarios normales, cargar tenants donde tienen memberships activas
        const userTenants = await tenantService.getUserTenants();
        setAvailableTenants(userTenants);
        console.log('✅ [AuthContext] Loaded user tenants:', userTenants.length);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error loading tenants:', error);
      setAvailableTenants([]);
    }
  };

  /**
   * Actualizar información del usuario manualmente
   */
  const setUser = (user: User) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: true,
      isVerified: user.verified || false
    }));
    
    // Actualizar localStorage
    localStorage.setItem('auth_user', JSON.stringify(user));
  };

  /**
   * Cambiar el rol activo del usuario (para usuarios con múltiples roles)
   */
  const switchRole = async (role: 'student' | 'instructor' | 'admin' | 'superadmin') => {
    try {
      console.log('🔍 [AuthContext] Switching role to:', role);
      
      const response = await authService.switchRole(role);
      
      // Actualizar estado con nuevo token y rol activo
      if (response && response.access_token) {
        const updatedUser: User = {
          ...state.user!,
          role,
          active_role: role,
          roles: (response.user?.roles || response.roles || state.user?.roles) as ('student' | 'instructor' | 'admin' | 'superadmin')[] | undefined,
          has_multiple_roles: response.user?.has_multiple_roles || response.has_multiple_roles
        };

        setState(prev => ({
          ...prev,
          user: updatedUser,
          token: response.access_token
        }));

        console.log('✅ [AuthContext] Role switched successfully to:', role);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error switching role:', error);
      throw error;
    }
  };

  // Cargar tenants disponibles al autenticarse
  // DESACTIVADO: Ahora se carga manualmente después de login/register para evitar race conditions
  // useEffect(() => {
  //   if (state.isAuthenticated && state.user) {
  //     loadAvailableTenants();
  //   }
  // }, [state.isAuthenticated, state.user?.id]);

  // Valores del contexto
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    clearError,
    setUser,
    switchRole,
    // Tenant management
    currentTenantId,
    setCurrentTenantId,
    availableTenants,
    loadAvailableTenants,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

export default AuthContext;
