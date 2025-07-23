/**
 * Constants for the StreakTracker component
 */

import { ActivityLevel } from './types';

/**
 * Number of days to display in the calendar (Full year: Enero - Diciembre)
 */
export const DAYS_TO_DISPLAY = 365;

/**
 * Day labels for the calendar grid
 */
export const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

/**
 * Month labels (abbreviated)
 */
export const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Colors for activity levels (GitHub style)
 */
export const ACTIVITY_COLORS = {
  [ActivityLevel.NONE]: '#ebedf0',     // GitHub color 0
  [ActivityLevel.LIGHT]: '#9be9a8',    // GitHub color 1
  [ActivityLevel.NORMAL]: '#40c463',   // GitHub color 2
  [ActivityLevel.EXCEPTIONAL]: '#30a14e', // GitHub color 3
  STREAK: '#216e39'                    // GitHub color 4 (más intenso)
};

/**
 * Text color mapping for activity levels
 */
export const ACTIVITY_TEXT_COLORS = {
  [ActivityLevel.NONE]: 'text-gray-500',
  [ActivityLevel.LIGHT]: 'text-primary-700',
  [ActivityLevel.NORMAL]: 'text-white',
  [ActivityLevel.EXCEPTIONAL]: 'text-white',
  STREAK: 'text-gray-900'
};

/**
 * Hover effects for activity cells
 */
export const ACTIVITY_HOVER_EFFECTS = {
  DEFAULT: 'hover:scale-125 hover:shadow-sm transition-transform duration-200',
  STREAK: 'hover:scale-150 hover:shadow-md transition-transform duration-200'
};

/**
 * Emojis used for streak levels
 */
export const STREAK_EMOJIS = {
  low: '💪',
  medium: '⭐',
  high: '🔥'
};

/**
 * Animation variants for Framer Motion
 */
export const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  },
  item: {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 }
  },
  tooltip: {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: 10,
      transition: { 
        duration: 0.2 
      }
    }
  },
  pulse: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.05, 1] }
  },
  // Definición separada para transición para evitar errores de tipo
  pulseTransition: {
    duration: 2,
    repeat: Infinity,
    repeatType: "reverse" as const
  }
};