import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Tipos para el contexto de autenticación
interface AuthState {
  isAuthenticated: boolean;
  isVerified: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isVerified: boolean;
  isLoading: boolean;
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el proveedor
interface AuthProviderProps {
  children: ReactNode;
}

// Proveedor del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Estado inicial
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem('auth_token');
    // Si hay un token en localStorage, consideramos al usuario como autenticado
    // pero necesitamos verificar si el token es válido
    return {
      isAuthenticated: !!token,
      isVerified: false, // Por defecto, asumimos que no está verificado hasta comprobar
      isLoading: !!token, // Si hay token, estamos cargando la verificación
      user: null,
      token
    };
  });

  // Efecto para verificar el token al cargar
  useEffect(() => {
    const verifyToken = async () => {
      if (state.token) {
        try {
          // Simulamos una llamada a la API para verificar el token
          // En un entorno real, esto sería una llamada a tu backend
          const response = await new Promise<User>((resolve) => {
            setTimeout(() => {
              resolve({
                id: '1',
                name: 'Usuario Demo',
                email: 'demo@stegmaier.cl',
                isVerified: true
              });
            }, 1000);
          });

          setState({
            ...state,
            isAuthenticated: true,
            isVerified: response.isVerified,
            isLoading: false,
            user: response
          });
        } catch (error) {
          console.error('Error al verificar token:', error);
          // Si hay un error, limpiamos el estado y el token
          localStorage.removeItem('auth_token');
          setState({
            isAuthenticated: false,
            isVerified: false,
            isLoading: false,
            user: null,
            token: null
          });
        }
      } else {
        // Si no hay token, no estamos cargando
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (state.isLoading) {
      verifyToken();
    }
  }, [state.token, state.isLoading]);

  // Función para iniciar sesión
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      // Simulamos una llamada a la API para iniciar sesión
      // En un entorno real, esto sería una llamada a tu backend
      const response = await new Promise<{ token: string; user: User }>((resolve, reject) => {
        setTimeout(() => {
          // Validación simple para demo
          if (credentials.email === 'demo@stegmaier.cl' && credentials.password === 'password') {
            resolve({
              token: 'fake_jwt_token',
              user: {
                id: '1',
                name: 'Usuario Demo',
                email: 'demo@stegmaier.cl',
                isVerified: true
              }
            });
          } else {
            reject(new Error('Credenciales inválidas'));
          }
        }, 1000);
      });

      // Guardar el token en localStorage
      localStorage.setItem('auth_token', response.token);

      // Actualizar el estado
      setState({
        isAuthenticated: true,
        isVerified: response.user.isVerified,
        isLoading: false,
        user: response.user,
        token: response.token
      });
    } catch (error) {
      throw error;
    }
  };

  // Función para registrarse
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      // Simulamos una llamada a la API para registrarse
      // En un entorno real, esto sería una llamada a tu backend
      const response = await new Promise<{ token: string; user: User }>((resolve, reject) => {
        setTimeout(() => {
          // En un escenario real, verificaríamos si el email ya existe
          resolve({
            token: 'fake_jwt_token',
            user: {
              id: '2',
              name: credentials.name,
              email: credentials.email,
              isVerified: false // Por defecto, un usuario nuevo no está verificado
            }
          });
        }, 1000);
      });

      // Guardar el token en localStorage
      localStorage.setItem('auth_token', response.token);

      // Actualizar el estado
      setState({
        isAuthenticated: true,
        isVerified: response.user.isVerified,
        isLoading: false,
        user: response.user,
        token: response.token
      });
    } catch (error) {
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = (): void => {
    // Eliminar el token de localStorage
    localStorage.removeItem('auth_token');

    // Actualizar el estado
    setState({
      isAuthenticated: false,
      isVerified: false,
      isLoading: false,
      user: null,
      token: null
    });
  };

  // Función para verificar el email
  const verifyEmail = async (token: string): Promise<void> => {
    try {
      // Simulamos una llamada a la API para verificar el email
      // En un entorno real, esto sería una llamada a tu backend
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // Simulamos una verificación exitosa
          resolve();
        }, 1000);
      });

      // Actualizar el estado si el usuario está autenticado
      if (state.user) {
        setState({
          ...state,
          isVerified: true,
          user: {
            ...state.user,
            isVerified: true
          }
        });
      }
    } catch (error) {
      throw error;
    }
  };

  // Función para reenviar el email de verificación
  const resendVerification = async (): Promise<void> => {
    try {
      // Simulamos una llamada a la API para reenviar el email de verificación
      // En un entorno real, esto sería una llamada a tu backend
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // Simulamos un reenvío exitoso
          resolve();
        }, 1000);
      });
    } catch (error) {
      throw error;
    }
  };

  // Valor del contexto
  const contextValue: AuthContextType = {
    isAuthenticated: state.isAuthenticated,
    isVerified: state.isVerified,
    isLoading: state.isLoading,
    user: state.user,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
