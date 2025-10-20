/**
 * Context para manejo de temas (dark/light mode)
 * Implementa principios de desarrollo responsivo, mantenible y escalable
 * Respeta preferencias del sistema y persiste selección del usuario
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark'; // El tema real aplicado
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Estado del tema seleccionado por el usuario
  const [theme, setThemeState] = useState<Theme>(() => {
    // Recuperar tema guardado o usar 'system' por defecto
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  // Función para obtener el tema real basado en la selección y preferencias del sistema
  const getActualTheme = (selectedTheme: Theme): 'light' | 'dark' => {
    if (selectedTheme !== 'system') {
      return selectedTheme;
    }
    
    // Usar preferencias del sistema
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return 'light'; // Fallback
  };

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => getActualTheme(theme));

  // Función para cambiar tema
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    const actualTheme = getActualTheme(newTheme);
    setActualTheme(actualTheme);
    
    // Aplicar clase al documentElement
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(actualTheme);
    }
  };

  // Función para alternar entre light/dark
  const toggleTheme = () => {
    const newTheme = actualTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Effect para escuchar cambios en preferencias del sistema
  useEffect(() => {
    if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        const newActualTheme = e.matches ? 'dark' : 'light';
        setActualTheme(newActualTheme);
        
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newActualTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Effect inicial para aplicar tema
  useEffect(() => {
    const actualTheme = getActualTheme(theme);
    setActualTheme(actualTheme);
    
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(actualTheme);
    }
  }, []);

  const value = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
