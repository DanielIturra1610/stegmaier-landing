import { FirstDayMission, MissionProgress } from './types';
import { STORAGE_KEY, ANALYTICS_EVENTS, TIME_CONFIG } from './constants';

// Type declaration for window.analytics
declare global {
  interface Window {
    analytics?: {
      track: (eventName: string, properties?: Record<string, any>) => void;
    };
  }
}

/**
 * Utility functions for the FirstDayExperience onboarding system
 */

/**
 * Check if a user is new and should see the onboarding
 * @param currentLevel - User's current level
 * @param totalXP - User's total XP
 * @returns Boolean indicating if user is new
 */
export const isNewUser = (currentLevel: number, totalXP: number): boolean => {
  return currentLevel === 0 || totalXP < 50;
};

/**
 * Calculate the position for the tooltip relative to the target element
 * @param targetElement - Element to position tooltip around
 * @returns Object with position and transform classes
 */
export const calculateTooltipPosition = (targetElement: HTMLElement | null): {
  positionClasses: string;
  transformClasses: string;
} => {
  if (!targetElement) {
    return {
      positionClasses: 'top-1/4 left-1/2',
      transformClasses: 'transform -translate-x-1/2'
    };
  }

  const rect = targetElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  // Default position (above the element)
  let positionClasses = 'top-0 left-1/2';
  let transformClasses = 'transform -translate-y-full -translate-x-1/2';
  
  // Check if enough space above
  if (rect.top < 200) {
    // Not enough space above, try below
    if (viewportHeight - rect.bottom > 200) {
      // Enough space below
      positionClasses = 'top-full left-1/2';
      transformClasses = 'transform translate-y-4 -translate-x-1/2';
    } else {
      // Not enough space below either, try right
      if (viewportWidth - rect.right > 300) {
        positionClasses = 'top-1/2 left-full';
        transformClasses = 'transform -translate-y-1/2 translate-x-4';
      } else {
        // Try left as last resort
        positionClasses = 'top-1/2 right-full';
        transformClasses = 'transform -translate-y-1/2 -translate-x-4';
      }
    }
  }
  
  return { positionClasses, transformClasses };
};

/**
 * Track mission progress for analytics
 * @param eventName - Analytics event name
 * @param missionId - ID of the mission
 * @param additionalData - Any additional data to track
 */
export const trackMissionEvent = (
  eventName: string, 
  missionId: string, 
  additionalData?: Record<string, any>
): void => {
  try {
    // Implementation depends on analytics provider
    // This is a placeholder that would be replaced with actual analytics implementation
    console.log('Analytics event:', {
      event: eventName,
      missionId,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
    
    // If window.analytics exists (e.g., Segment), use that
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track(eventName, {
        missionId,
        timestamp: new Date().toISOString(),
        ...additionalData
      });
    }
  } catch (error) {
    console.error('Failed to track mission event:', error);
  }
};

/**
 * Save mission progress to localStorage
 * @param progress - Current mission progress object
 */
export const saveMissionProgress = (progress: MissionProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save mission progress:', error);
  }
};

/**
 * Load mission progress from localStorage
 * @returns Saved mission progress or null if not found
 */
export const loadMissionProgress = (): MissionProgress | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as MissionProgress : null;
  } catch (error) {
    console.error('Failed to load mission progress:', error);
    return null;
  }
};

/**
 * Initialize mission progress tracking
 * @param missions - Array of all missions
 * @returns New mission progress object
 */
export const initializeMissionProgress = (missions: FirstDayMission[]): MissionProgress => {
  const attempts: Record<string, number> = {};
  const timeSpent: Record<string, number> = {};
  
  // Initialize tracking for each mission
  missions.forEach(mission => {
    attempts[mission.id] = 0;
    timeSpent[mission.id] = 0;
  });
  
  return {
    completedMissions: [],
    totalXP: 0,
    startTimestamp: Date.now(),
    attempts,
    timeSpent
  };
};

/**
 * Update mission attempt counter
 * @param progress - Current mission progress
 * @param missionId - ID of mission being attempted
 * @returns Updated mission progress
 */
export const incrementMissionAttempts = (
  progress: MissionProgress, 
  missionId: string
): MissionProgress => {
  return {
    ...progress,
    attempts: {
      ...progress.attempts,
      [missionId]: (progress.attempts[missionId] || 0) + 1
    }
  };
};

/**
 * Track time spent on a mission
 * @param progress - Current mission progress
 * @param missionId - ID of mission
 * @param secondsSpent - Seconds spent on mission
 * @returns Updated mission progress
 */
export const updateMissionTimeSpent = (
  progress: MissionProgress,
  missionId: string,
  secondsSpent: number
): MissionProgress => {
  return {
    ...progress,
    timeSpent: {
      ...progress.timeSpent,
      [missionId]: (progress.timeSpent[missionId] || 0) + secondsSpent
    }
  };
};

/**
 * Mark a mission as completed
 * @param progress - Current mission progress
 * @param mission - Completed mission
 * @returns Updated mission progress
 */
export const completeMission = (
  progress: MissionProgress,
  mission: FirstDayMission
): MissionProgress => {
  // Don't add if already completed
  if (progress.completedMissions.includes(mission.id)) {
    return progress;
  }
  
  return {
    ...progress,
    completedMissions: [...progress.completedMissions, mission.id],
    totalXP: progress.totalXP + mission.xpReward
  };
};

/**
 * Setup detection for mission completion based on mission type
 * @param mission - Mission to detect completion for
 * @param onComplete - Callback when mission is completed
 * @returns Cleanup function to remove event listeners
 */
export const setupMissionDetection = (
  mission: FirstDayMission,
  onComplete: () => void
): (() => void) => {
  // Target element that needs to be interacted with
  const targetElement = document.querySelector(mission.targetElement);
  
  if (!targetElement) {
    console.warn(`Target element not found for mission: ${mission.id}`);
    return () => {}; // Return empty cleanup function
  }
  
  let timeoutId: number;
  let observer: IntersectionObserver;
  
  // Different detection based on mission type
  switch (mission.type) {
    case 'click': {
      const handleClick = () => {
        onComplete();
      };
      
      targetElement.addEventListener('click', handleClick);
      return () => targetElement.removeEventListener('click', handleClick);
    }
    
    case 'read': {
      // Use Intersection Observer to track if element is visible
      let visibleTime = 0;
      let lastTimestamp = 0;
      
      observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        const currentTime = Date.now();
        
        if (entry.isIntersecting) {
          // Start counting time if not already
          if (lastTimestamp === 0) {
            lastTimestamp = currentTime;
          }
        } else if (lastTimestamp > 0) {
          // Element not visible anymore, add to total time
          visibleTime += currentTime - lastTimestamp;
          lastTimestamp = 0;
          
          // Check if threshold reached
          if (visibleTime >= TIME_CONFIG.READ_THRESHOLD) {
            observer.disconnect();
            onComplete();
          }
        }
      }, { threshold: 0.7 }); // Element must be 70% visible
      
      observer.observe(targetElement);
      return () => observer.disconnect();
    }
    
    case 'interact': {
      let hasHovered = false;
      let hasClicked = false;
      
      const checkCompletion = () => {
        if (hasHovered && hasClicked) {
          onComplete();
        }
      };
      
      const handleMouseEnter = () => {
        hasHovered = true;
        checkCompletion();
      };
      
      const handleClick = () => {
        hasClicked = true;
        checkCompletion();
      };
      
      targetElement.addEventListener('mouseenter', handleMouseEnter);
      targetElement.addEventListener('click', handleClick);
      
      return () => {
        targetElement.removeEventListener('mouseenter', handleMouseEnter);
        targetElement.removeEventListener('click', handleClick);
      };
    }
    
    case 'navigate': {
      // This is typically handled at the router level
      // Implementation would depend on the routing library used
      // For now, we'll simulate with a click handler that assumes
      // clicking the element will cause navigation
      const handleClick = () => {
        // Small delay to allow navigation to happen
        timeoutId = window.setTimeout(() => {
          onComplete();
        }, 500);
      };
      
      targetElement.addEventListener('click', handleClick);
      return () => {
        targetElement.removeEventListener('click', handleClick);
        window.clearTimeout(timeoutId);
      };
    }
    
    default:
      return () => {}; // Empty cleanup function
  }
};

/**
 * Get total progress percentage
 * @param completedMissions - Array of completed mission IDs
 * @param totalMissions - Total number of missions
 * @returns Progress percentage (0-100)
 */
export const getProgressPercentage = (
  completedMissions: string[],
  totalMissions: number
): number => {
  if (totalMissions === 0) return 0;
  return Math.round((completedMissions.length / totalMissions) * 100);
};
