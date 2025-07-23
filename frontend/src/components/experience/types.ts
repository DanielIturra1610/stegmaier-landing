/**
 * Types for the Experience Bar component
 */

export interface ExperienceBarProps {
  /** Total experience points accumulated by the user */
  totalXP: number;
  /** Current user level */
  currentLevel: number;
  /** XP required to reach next level */
  xpForNextLevel: number;
  /** XP accumulated in the current level */
  currentLevelXP: number;
  /** Number of courses completed */
  coursesCompleted: number;
  /** Number of lessons completed */
  lessonsCompleted: number;
  /** Number of certificates earned */
  certificates: number;
}

export interface LevelTitleConfig {
  /** Maximum level in the system */
  maxLevel: number;
  /** Base XP required for level 1 */
  baseXP: number;
  /** Multiplier for XP growth between levels */
  multiplier: number;
  /** Array of title prefixes based on level ranges */
  titles: string[];
}
