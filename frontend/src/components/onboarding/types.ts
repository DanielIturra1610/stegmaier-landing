import { User as BaseUser } from '../../types/auth';

/**
 * Types for the FirstDayExperience onboarding system
 */

// Extended User interface with experience properties
export interface User extends BaseUser {
  /** Current user level */
  currentLevel: number;
  /** Total experience points accumulated */
  totalXP: number;
}

export interface FirstDayMission {
  /** Unique identifier for the mission */
  id: string;
  /** Display title of the mission */
  title: string;
  /** Detailed description of what the user needs to do */
  description: string;
  /** CSS selector for the target element */
  targetElement: string;
  /** XP points awarded on mission completion */
  xpReward: number;
  /** Type of interaction required to complete the mission */
  type: 'click' | 'read' | 'interact' | 'navigate';
  /** Specific criteria that must be met to complete this mission */
  completionCriteria: string;
  /** Business context explaining the value of this mission */
  businessContext: string;
}

export interface FirstDayExperienceProps {
  /** User object with experience data */
  user: User;
  /** Callback fired when a single mission is completed */
  onMissionComplete: (missionId: string, xpReward: number) => void;
  /** Callback fired when all missions are completed */
  onFirstDayComplete: (totalXpEarned: number) => void;
  /** Whether the onboarding experience should be visible */
  isVisible: boolean;
}

export interface MissionProgress {
  /** IDs of completed missions */
  completedMissions: string[];
  /** Total XP earned from completed missions */
  totalXP: number;
  /** Timestamp when the first day experience began */
  startTimestamp: number;
  /** Timestamp when the first day experience was completed */
  endTimestamp?: number;
  /** Number of attempts made on each mission {missionId: attempts} */
  attempts: Record<string, number>;
  /** Time spent on each mission in seconds {missionId: timeSeconds} */
  timeSpent: Record<string, number>;
}

export interface CelebrationConfig {
  /** Title of the celebration */
  title: string;
  /** Message to show during celebration */
  message: string;
  /** XP earned that triggered this celebration */
  xpEarned: number;
  /** Whether this is the final celebration */
  isFinal: boolean;
}

export interface MissionSpotlightProps {
  /** Target element to spotlight */
  targetElement: string | null;
  /** Current mission being highlighted */
  currentMission: FirstDayMission | null;
}

export interface MissionTooltipProps {
  /** Current mission being explained */
  mission: FirstDayMission;
  /** Called when user completes the mission */
  onComplete: () => void;
  /** Called when user requests to skip the mission */
  onSkip: () => void;
}

export interface CelebrationModalProps {
  /** Whether the celebration is visible */
  isVisible: boolean;
  /** Configuration for the celebration */
  config: CelebrationConfig;
  /** Called when the celebration is acknowledged */
  onClose: () => void;
}
