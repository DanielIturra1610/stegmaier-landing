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
      if (state.token) {
        try {
          const user: User = await authService.getCurrentUser();
          setState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            isVerified: user.verified,
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          console.error('Token verification failed', error);
          // Limpiar datos si el token no es válido
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setState({
            ...initialState,
            isLoading: false,
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
      
      // Crear objeto de usuario a partir de los datos de la respuesta
      const user: User = {
        id: authResponse.user_id,
        email: authResponse.email,
        firstName: '', // Estos campos no vienen en la respuesta
        lastName: '',  // pero son necesarios para el tipo User
        role: authResponse.role as any,
        verified: true, // Asumimos que está verificado si puede iniciar sesión
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setState({
        user,
        token: authResponse.access_token,
        isAuthenticated: true,
        isVerified: true,
        isLoading: false,
        error: null,
      });
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
      
      // El token ya se guarda en el servicio de autenticación
      // No es necesario volver a guardarlo aquí
      
      // Crear objeto de usuario a partir de los datos de la respuesta
      const user: User = {
        id: authResponse.user_id,
        email: authResponse.email,
        firstName: userData.firstName, // Usamos los datos que se enviaron al registrar
        lastName: userData.lastName,
        role: authResponse.role as any,
        verified: false, // Por defecto el usuario no estará verificado al registrarse
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setState({
        user,
        token: authResponse.access_token,
        isAuthenticated: true,
        isVerified: false,
        isLoading: false,
        error: null,
      });
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
    authService.logout();
    setState({
      ...initialState,
      isLoading: false,
    });
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
