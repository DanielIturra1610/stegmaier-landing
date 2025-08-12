/**
 * Utilidades de animación para el sistema de headers
 * Implementa principios de desarrollo responsivo, mantenible y escalable
 * Respeta preferencias de accesibilidad (prefers-reduced-motion)
 */

// Clases base de animación que respetan prefers-reduced-motion
export const baseAnimations = {
  // Transición suave para elementos interactivos
  interactive: 'transition-all duration-200 ease-in-out motion-reduce:transition-none',
  
  // Fade in/out para elementos que aparecen/desaparecen
  fade: 'transition-opacity duration-300 ease-in-out motion-reduce:transition-none',
  
  // Transform para elementos que se mueven
  transform: 'transition-transform duration-250 ease-out motion-reduce:transition-none',
  
  // Para elementos que cambian color
  color: 'transition-colors duration-150 ease-in-out motion-reduce:transition-none',
  
  // Loading states
  pulse: 'animate-pulse motion-reduce:animate-none',
  
  // Bounce suave para notificaciones
  bounce: 'animate-bounce motion-reduce:animate-none',
  
  // Spin para loading spinners
  spin: 'animate-spin motion-reduce:animate-none'
};

// Estados de animación para diferentes componentes
export const headerAnimations = {
  // Header principal - entrada suave
  header: {
    initial: 'transform -translate-y-2 opacity-0',
    animate: 'transform translate-y-0 opacity-100',
    exit: 'transform -translate-y-2 opacity-0',
    transition: baseAnimations.fade
  },
  
  // Breadcrumbs - fade in secuencial
  breadcrumb: {
    container: `${baseAnimations.fade}`,
    item: 'transform translate-x-1 opacity-0 animate-in slide-in-from-left-1 fade-in duration-300',
    separator: `${baseAnimations.fade} delay-100`
  },
  
  // Stats - entrance con scale
  stats: {
    container: 'space-y-1',
    item: `${baseAnimations.transform} hover:scale-105 active:scale-95`,
    loading: `${baseAnimations.pulse} bg-gray-200 rounded`,
    value: `${baseAnimations.color} font-semibold`,
    icon: `${baseAnimations.transform} group-hover:rotate-12`
  },
  
  // Tabs - underline animation
  tabs: {
    container: 'relative',
    tab: `${baseAnimations.color} relative overflow-hidden`,
    activeIndicator: 'absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-300 ease-out transform origin-left',
    content: `${baseAnimations.fade}`
  },
  
  // Actions - button states
  actions: {
    button: `${baseAnimations.interactive} transform hover:scale-105 active:scale-95 focus:ring-2 focus:ring-offset-2`,
    icon: `${baseAnimations.transform} group-hover:rotate-180`,
    dropdown: `${baseAnimations.fade} ${baseAnimations.transform} origin-top-right scale-95 opacity-0 animate-in slide-in-from-top-2 fade-in zoom-in-95`
  },
  
  // Online indicator - pulse
  onlineIndicator: {
    online: `${baseAnimations.pulse} text-green-500`,
    offline: `${baseAnimations.color} text-red-500`,
    connecting: `${baseAnimations.bounce} text-yellow-500`
  },
  
  // Error states - shake animation
  error: {
    container: 'animate-in slide-in-from-top-1 fade-in duration-300',
    content: `${baseAnimations.fade} bg-red-50 border border-red-200`,
    dismiss: `${baseAnimations.interactive} hover:bg-red-100`
  },
  
  // Loading skeleton
  skeleton: {
    base: `${baseAnimations.pulse} bg-gray-200 rounded`,
    text: 'h-4 w-24',
    title: 'h-6 w-48',
    stat: 'h-8 w-16'
  }
};

// Variants específicos por tema
export const themeAnimations = {
  light: {
    backdrop: 'backdrop-blur-sm bg-white/80',
    shadow: 'shadow-sm hover:shadow-md',
    glow: ''
  },
  
  dark: {
    backdrop: 'backdrop-blur-sm bg-gray-900/80',
    shadow: 'shadow-lg hover:shadow-xl',
    glow: 'ring-1 ring-white/10'
  },
  
  brand: {
    backdrop: 'backdrop-blur-sm bg-gradient-to-r from-blue-600/90 to-purple-600/90',
    shadow: 'shadow-lg hover:shadow-2xl',
    glow: 'ring-1 ring-white/20'
  }
};

// Utilidades para aplicar animaciones condicionalmente
export const getAnimationClasses = (
  variant: keyof typeof headerAnimations,
  state: string = 'default',
  theme: keyof typeof themeAnimations = 'light'
) => {
  const baseClasses = headerAnimations[variant] || {};
  const themeClasses = themeAnimations[theme] || {};
  
  return {
    ...baseClasses,
    ...themeClasses
  };
};

// Hook para detectar preferencias de animación
export const useAnimationPreference = () => {
  if (typeof window === 'undefined') return { reducedMotion: false };
  
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return { reducedMotion };
};
