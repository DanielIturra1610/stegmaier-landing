import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '../types/auth';
import { authService } from '../services/auth.service';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  clearError: () => void;
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
      } catch (profileError) {
        // Si hay error al cargar el perfil completo, usamos los datos básicos de la autenticación
        console.error('Error al cargar perfil completo:', profileError);
        
        // Crear objeto de usuario a partir de los datos de la respuesta
        const user: User = {
          id: authResponse.user_id,
          email: authResponse.email,
          firstName: authResponse.first_name || '', 
          lastName: authResponse.last_name || '', 
          full_name: authResponse.full_name || `${authResponse.first_name || ''} ${authResponse.last_name || ''}`.trim(),
          role: authResponse.role as any,
          verified: true,
          createdAt: authResponse.created_at || new Date().toISOString(),
          updatedAt: authResponse.updated_at || new Date().toISOString()
        };
        
        setState({
          user,
          token: authResponse.access_token,
          isAuthenticated: true,
          isVerified: true,
          isLoading: false,
          error: null,
        });
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

  // Valores del contexto
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    clearError,
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
