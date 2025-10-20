/**
 * Configuraciones de temas para el sistema de headers
 * Implementa principios de desarrollo responsivo, mantenible y escalable
 */

export interface ThemeConfig {
  // Colores de fondo y backdrop
  backdrop: string;
  background: string;
  surface: string;
  
  // Colores de texto
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Colores de interacción
  interactive: string;
  interactiveHover: string;
  focus: string;
  
  // Bordes y divisores
  border: string;
  divider: string;
  
  // Sombras
  shadow: string;
  shadowHover: string;
  
  // Estados
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Efectos especiales
  glow: string;
  gradient: string;
}

export const lightTheme: ThemeConfig = {
  backdrop: 'backdrop-blur-sm bg-white/80',
  background: 'bg-white',
  surface: 'bg-gray-50',
  
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-700',
  textMuted: 'text-gray-500',
  
  interactive: 'text-blue-600 hover:text-blue-700',
  interactiveHover: 'hover:bg-gray-100',
  focus: 'focus:ring-blue-500',
  
  border: 'border-gray-200',
  divider: 'divide-gray-200',
  
  shadow: 'shadow-sm',
  shadowHover: 'hover:shadow-md',
  
  success: 'text-green-600 bg-green-50 border-green-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  
  glow: '',
  gradient: 'bg-gradient-to-r from-blue-600 to-purple-600'
};

export const darkTheme: ThemeConfig = {
  backdrop: 'backdrop-blur-sm bg-gray-900/80',
  background: 'bg-gray-900',
  surface: 'bg-gray-800',
  
  textPrimary: 'text-white',
  textSecondary: 'text-gray-200',
  textMuted: 'text-gray-400',
  
  interactive: 'text-blue-400 hover:text-blue-300',
  interactiveHover: 'hover:bg-gray-800',
  focus: 'focus:ring-blue-400',
  
  border: 'border-gray-700',
  divider: 'divide-gray-700',
  
  shadow: 'shadow-lg',
  shadowHover: 'hover:shadow-xl',
  
  success: 'text-green-400 bg-green-900/30 border-green-700',
  warning: 'text-yellow-400 bg-yellow-900/30 border-yellow-700',
  error: 'text-red-400 bg-red-900/30 border-red-700',
  info: 'text-blue-400 bg-blue-900/30 border-blue-700',
  
  glow: 'ring-1 ring-white/10',
  gradient: 'bg-gradient-to-r from-blue-500 to-purple-500'
};

export const brandTheme: ThemeConfig = {
  backdrop: 'backdrop-blur-sm bg-gradient-to-r from-blue-600/90 to-purple-600/90',
  background: 'bg-gradient-to-r from-blue-600 to-purple-600',
  surface: 'bg-blue-50 dark:bg-blue-900/20',
  
  textPrimary: 'text-white',
  textSecondary: 'text-blue-100',
  textMuted: 'text-blue-200',
  
  interactive: 'text-white hover:text-blue-100',
  interactiveHover: 'hover:bg-white/10',
  focus: 'focus:ring-white',
  
  border: 'border-white/20',
  divider: 'divide-white/20',
  
  shadow: 'shadow-lg',
  shadowHover: 'hover:shadow-2xl',
  
  success: 'text-green-100 bg-green-600/30 border-green-400',
  warning: 'text-yellow-100 bg-yellow-600/30 border-yellow-400',
  error: 'text-red-100 bg-red-600/30 border-red-400',
  info: 'text-blue-100 bg-blue-600/30 border-blue-400',
  
  glow: 'ring-1 ring-white/20',
  gradient: 'bg-gradient-to-r from-white/10 to-white/5'
};

// Mapeo de temas
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  brand: brandTheme
} as const;

// Función para obtener configuración de tema
export const getThemeConfig = (
  themeName: keyof typeof themes = 'light',
  actualTheme: 'light' | 'dark' = 'light'
): ThemeConfig => {
  if (themeName === 'brand') {
    return brandTheme;
  }
  
  return themes[actualTheme];
};

// Hook para obtener clases de tema dinámicamente
export const useThemeClasses = (
  themeName: keyof typeof themes = 'light',
  actualTheme: 'light' | 'dark' = 'light'
) => {
  return getThemeConfig(themeName, actualTheme);
};
