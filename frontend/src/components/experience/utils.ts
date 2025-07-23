/**
 * Utility functions for the Experience Bar component
 */

import { LEVEL_CONFIG } from './constants';

/**
 * Calculates the progress percentage between current XP and XP required for next level
 * @param currentXP - Current XP in the level
 * @param xpForNext - Total XP required for next level
 * @returns Progress percentage (0-100)
 */
export const calculateProgress = (currentXP: number, xpForNext: number): number => {
  if (xpForNext <= 0) return 100;
  const progress = Math.min(Math.round((currentXP / xpForNext) * 100), 100);
  return progress;
};

/**
 * Generates a dynamic level title based on user's current level
 * @param level - Current user level
 * @returns Level title string
 */
export const getLevelTitle = (level: number): string => {
  const { titles } = LEVEL_CONFIG;
  
  // Determine the appropriate title based on level ranges
  let titleIndex = 0;
  
  if (level >= 30) {
    titleIndex = 4; // Maestro (levels 30+)
  } else if (level >= 20) {
    titleIndex = 3; // Experto (levels 20-29)
  } else if (level >= 10) {
    titleIndex = 2; // Estratega (levels 10-19)
  } else if (level >= 5) {
    titleIndex = 1; // Consultor (levels 5-9)
  }
  
  // Special formatting for high levels
  let formattedTitle = `${titles[titleIndex]} Consultor Nivel ${level}`;
  
  // Add sparkles to high levels
  if (level >= 30) {
    formattedTitle = `✨ ${formattedTitle} ✨`;
  }
  
  return formattedTitle;
};

/**
 * Calculates the XP multiplier for level progression
 * Creates exponential growth in XP requirements
 * @param level - Target level to calculate multiplier for
 * @returns XP multiplier value
 */
export const getXPMultiplier = (level: number): number => {
  const { multiplier, baseXP } = LEVEL_CONFIG;
  
  // Exponential growth formula
  // Each level requires more XP than the previous
  return baseXP * Math.pow(multiplier, level - 1);
};

/**
 * Helper function to format large numbers with commas
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
