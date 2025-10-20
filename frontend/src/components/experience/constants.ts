/**
 * Configuration constants for the Experience Bar component
 */

import { LevelTitleConfig } from './types';

/**
 * Level system configuration
 * - maxLevel: The maximum level a user can reach
 * - baseXP: Base XP required for level 1
 * - multiplier: Growth factor for XP requirements between levels
 * - titles: Array of titles used for different level ranges
 */
export const LEVEL_CONFIG: LevelTitleConfig = {
  maxLevel: 50,
  baseXP: 100,
  multiplier: 1.5,
  titles: ["Aprendiz", "Consultor", "Estratega", "Experto", "Maestro"]
};

/**
 * Animation variants for Framer Motion
 */
export const ANIMATION_VARIANTS = {
  // Animation for the progress bar width transition
  barAnimation: {
    initial: { width: 0 },
    animate: (progress: number) => ({
      width: `${progress}%`,
      transition: { duration: 1, ease: "easeOut" }
    })
  },
  
  // Animation for level badge pulsing effect
  levelPulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  },
  
  // Animation for container entrance
  containerFadeIn: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }
};
