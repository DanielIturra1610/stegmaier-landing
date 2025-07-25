import { FirstDayMission, MissionProgress } from './types';
import { ANALYTICS_EVENTS, STORAGE_KEYS, XP_CONFIG, TIMING } from './constants';

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
    localStorage.setItem(STORAGE_KEYS.USER_EXPERIENCE, JSON.stringify(progress));
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
    const saved = localStorage.getItem(STORAGE_KEYS.USER_EXPERIENCE);
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
 * Setup detection for mission completion based on mission type with advanced validation
 * @param mission - Mission to detect completion for
 * @param onComplete - Callback when mission is completed
 * @returns Cleanup function to remove event listeners
 */
export const setupMissionDetection = (
  mission: FirstDayMission,
  onComplete: () => void
): (() => void) => {
  // Find the target element with retries
  const findTargetWithRetries = (selector: string): Promise<Element | null> => {
    let attempts = 0;
    const maxAttempts = TIMING.MAX_RETRIES;
    
    return new Promise(resolve => {
      const attemptFind = () => {
        const element = document.querySelector(selector);
        if (element) {
          console.log(`[Onboarding] Target element found for mission: ${mission.id}`, element);
          resolve(element);
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          console.warn(`[Onboarding] Failed to find target element after ${maxAttempts} attempts for mission: ${mission.id}`);
          resolve(null);
          return;
        }
        
        setTimeout(attemptFind, TIMING.RETRY_INTERVAL);
      };
      
      attemptFind();
    });
  };
  
  // Cleanup functions array
  const cleanupFunctions: (() => void)[] = [];
  
  // Setup detection based on mission type
  const setupDetection = async () => {
    console.log(`[Onboarding] Setting up detection for mission: ${mission.id}, type: ${mission.type}`);
    
    // Attempt to find the target element
    const targetElement = await findTargetWithRetries(mission.targetElement);
    
    if (!targetElement) {
      console.warn(`[Onboarding] Target element not found for mission: ${mission.id}`);
      return;
    }
    
    let timeoutId: number;
    const validationRules = mission.validationRules || {};
    
    // Set timeout for mission completion if specified
    if (validationRules.timeout) {
      timeoutId = window.setTimeout(() => {
        console.log(`[Onboarding] Mission timed out: ${mission.id}`);
        // We don't auto-complete on timeout, just log it
      }, validationRules.timeout);
      
      cleanupFunctions.push(() => window.clearTimeout(timeoutId));
    }
    
    // Different detection based on mission type
    switch (mission.type) {
      case 'click': {
        // Prevent auto-completion if specified
        if (validationRules.preventAutoComplete) {
          // We rely on the actual user click, tracked elsewhere
          // This helps ensure legitimate user interaction
          console.log(`[Onboarding] Click mission requires manual completion: ${mission.id}`);
          return;
        }
        
        const handleClick = (e: Event) => {
          console.log(`[Onboarding] Click detected on target for mission: ${mission.id}`, e);
          trackMissionEvent(ANALYTICS_EVENTS.MISSION_COMPLETED, mission.id, {
            completionMethod: 'user_click',
            element: mission.targetElement
          });
          onComplete();
        };
        
        targetElement.addEventListener('click', handleClick);
        console.log(`[Onboarding] Click listener attached for: ${mission.id}`);
        
        cleanupFunctions.push(() => targetElement.removeEventListener('click', handleClick));
        break;
      }
      
      case 'read': {
        // Use Intersection Observer to track if element is visible
        let visibleTime = 0;
        let lastTimestamp = 0;
        const requiredTime = mission.minimumTime || TIMING.READ_MIN_TIME;
        const threshold = validationRules.threshold || 0.7; // Default 70% visible
        
        console.log(`[Onboarding] Setting up read detection with threshold ${threshold} and required time ${requiredTime}ms`);
        
        const observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            const currentTime = Date.now();
            
            if (entry.isIntersecting) {
              // Element is visible
              console.log(`[Onboarding] Target visible for read mission: ${mission.id}, intersection ratio: ${entry.intersectionRatio}`);
              
              // Start counting time if not already
              if (lastTimestamp === 0) {
                lastTimestamp = currentTime;
                console.log(`[Onboarding] Started timing for read mission: ${mission.id}`);
              }
              
              // If we've been viewing long enough, complete the mission
              const timeElapsed = currentTime - lastTimestamp;
              if (timeElapsed >= requiredTime) {
                console.log(`[Onboarding] Read time threshold reached: ${timeElapsed}ms for mission ${mission.id}`);
                observer.disconnect();
                
                trackMissionEvent(ANALYTICS_EVENTS.MISSION_COMPLETED, mission.id, {
                  completionMethod: 'read_time_threshold',
                  timeSpent: timeElapsed,
                  element: mission.targetElement
                });
                
                onComplete();
              }
            } else if (lastTimestamp > 0) {
              // Element not visible anymore, add to total time
              visibleTime += currentTime - lastTimestamp;
              lastTimestamp = 0;
              
              console.log(`[Onboarding] Target no longer visible for read mission: ${mission.id}, accumulated time: ${visibleTime}ms`);
              
              // Check if threshold reached
              if (visibleTime >= requiredTime) {
                console.log(`[Onboarding] Read time threshold reached (accumulated): ${visibleTime}ms for mission ${mission.id}`);
                observer.disconnect();
                
                trackMissionEvent(ANALYTICS_EVENTS.MISSION_COMPLETED, mission.id, {
                  completionMethod: 'read_time_accumulated',
                  timeSpent: visibleTime,
                  element: mission.targetElement
                });
                
                onComplete();
              }
            }
          },
          { threshold }
        );
        
        observer.observe(targetElement);
        console.log(`[Onboarding] Intersection observer attached for: ${mission.id}`);
        
        cleanupFunctions.push(() => observer.disconnect());
        break;
      }
      
      case 'interact': {
        let hasHovered = false;
        let hoverStartTime = 0;
        let hasClicked = false;
        const requireClick = validationRules.requireClick !== false; // Default to true
        const hoverTime = mission.validationRules?.hoverTime || TIMING.HOVER_TIME;
        
        console.log(`[Onboarding] Setting up interact detection with requireClick: ${requireClick}, hoverTime: ${hoverTime}ms`);
        
        const checkCompletion = () => {
          // If we only need hover, or if we have both hover and click when required
          if (hasHovered && (!requireClick || (requireClick && hasClicked))) {
            console.log(`[Onboarding] Interact conditions met for mission: ${mission.id}`);
            
            trackMissionEvent(ANALYTICS_EVENTS.MISSION_COMPLETED, mission.id, {
              completionMethod: requireClick ? 'hover_and_click' : 'hover_only',
              element: mission.targetElement
            });
            
            onComplete();
          }
        };
        
        const handleMouseEnter = () => {
          console.log(`[Onboarding] Mouse enter detected for mission: ${mission.id}`);
          hoverStartTime = Date.now();
        };
        
        const handleMouseLeave = () => {
          if (hoverStartTime > 0) {
            const hoverDuration = Date.now() - hoverStartTime;
            console.log(`[Onboarding] Mouse leave detected, hover duration: ${hoverDuration}ms`);
            
            if (hoverDuration >= hoverTime) {
              console.log(`[Onboarding] Hover threshold reached for mission: ${mission.id}`);
              hasHovered = true;
              checkCompletion();
            }
          }
        };
        
        const handleClick = () => {
          console.log(`[Onboarding] Click detected for interact mission: ${mission.id}`);
          hasClicked = true;
          
          // If we click, we assume we've also hovered
          hasHovered = true;
          checkCompletion();
        };
        
        targetElement.addEventListener('mouseenter', handleMouseEnter);
        targetElement.addEventListener('mouseleave', handleMouseLeave);
        
        if (requireClick) {
          targetElement.addEventListener('click', handleClick);
          cleanupFunctions.push(() => targetElement.removeEventListener('click', handleClick));
        }
        
        cleanupFunctions.push(() => {
          targetElement.removeEventListener('mouseenter', handleMouseEnter);
          targetElement.removeEventListener('mouseleave', handleMouseLeave);
        });
        
        break;
      }
      
      case 'navigate': {
        // Set up route change detection
        const setupRouteDetection = () => {
          const targetRoute = mission.targetRoute;
          if (!targetRoute) {
            console.warn(`[Onboarding] No target route specified for navigation mission: ${mission.id}`);
            return;
          }
          
          console.log(`[Onboarding] Setting up navigation detection for route: ${targetRoute}`);
          
          // Listen for history changes (URL changes)
          const handleRouteChange = () => {
            const currentPath = window.location.pathname;
            const exactMatch = validationRules.exactMatch !== false; // Default to true
            
            console.log(`[Onboarding] Route changed to: ${currentPath}, checking against: ${targetRoute}`);
            
            const isMatch = exactMatch 
              ? currentPath === targetRoute
              : currentPath.includes(targetRoute);
            
            if (isMatch) {
              console.log(`[Onboarding] Navigation target reached for mission: ${mission.id}`);
              
              trackMissionEvent(ANALYTICS_EVENTS.MISSION_COMPLETED, mission.id, {
                completionMethod: 'navigation',
                targetRoute,
                currentPath
              });
              
              onComplete();
              window.removeEventListener('popstate', handleRouteChange);
            }
          };
          
          // Check current route first (might already be on the target route)
          setTimeout(handleRouteChange, 0);
          
          // Listen for route changes
          window.addEventListener('popstate', handleRouteChange);
          
          // Also listen for click on the target element
          const handleClick = () => {
            console.log(`[Onboarding] Click detected on navigation element for mission: ${mission.id}`);
            // We'll check the route change in the popstate event
          };
          
          targetElement.addEventListener('click', handleClick);
          
          cleanupFunctions.push(() => {
            window.removeEventListener('popstate', handleRouteChange);
            targetElement.removeEventListener('click', handleClick);
          });
        };
        
        setupRouteDetection();
        break;
      }
      
      default:
        console.warn(`[Onboarding] Unknown mission type: ${mission.type} for mission: ${mission.id}`);
        break;
    }
  };
  
  // Start the detection setup
  setupDetection().catch(error => {
    console.error(`[Onboarding] Error setting up detection for mission ${mission.id}:`, error);
  });
  
  // Return combined cleanup function
  return () => {
    console.log(`[Onboarding] Cleaning up detection for mission: ${mission.id}`);
    cleanupFunctions.forEach(cleanup => cleanup());
  };
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

/**
 * Calculate XP required for next level based on current level
 * Uses an exponential formula to scale difficulty
 * @param currentLevel - User's current level
 * @returns XP needed to reach next level
 */
export const calculateNextLevelXP = (currentLevel: number): number => {
  // Base XP required for level 1
  const baseXP = XP_CONFIG.BASE_LEVEL_XP || 50;
  
  // Exponential scaling factor
  const scaleFactor = 1.5;
  
  // Calculate required XP with exponential growth
  return Math.round(baseXP * Math.pow(scaleFactor, currentLevel));
};

/**
 * Calculate level based on total XP
 * @param totalXP - User's total XP
 * @returns Object containing current level and progress to next level
 */
export const calculateLevelFromXP = (totalXP: number): {
  currentLevel: number;
  nextLevelXP: number;
  progress: number;
  remainingXP: number;
} => {
  let level = 0;
  let xpThreshold = 0;
  let prevThreshold = 0;
  
  // Find the highest level the user has achieved
  while (true) {
    const nextLevelRequirement = calculateNextLevelXP(level);
    const nextThreshold = xpThreshold + nextLevelRequirement;
    
    if (totalXP < nextThreshold) {
      break;
    }
    
    prevThreshold = xpThreshold;
    xpThreshold = nextThreshold;
    level += 1;
  }
  
  const nextLevelXP = calculateNextLevelXP(level);
  const progress = level > 0 
    ? ((totalXP - prevThreshold) / nextLevelXP) * 100 
    : (totalXP / nextLevelXP) * 100;
  
  return {
    currentLevel: level,
    nextLevelXP,
    progress: Math.min(Math.round(progress), 100),
    remainingXP: nextLevelXP - (totalXP - prevThreshold)
  };
};

/**
 * Creates custom event for experience updates
 * @param detail - Event details
 * @returns CustomEvent that can be dispatched
 */
export const createExperienceUpdateEvent = (detail: {
  totalXP: number;
  currentLevel: number;
  isLevelUp?: boolean;
}): CustomEvent => {
  return new CustomEvent('userXPUpdated', {
    bubbles: true,
    detail
  });
};

/**
 * Safely checks if a user is considered new based on XP threshold
 * @param user - User object which may have experience properties
 * @returns Boolean indicating if user should see onboarding
 */
export const shouldShowOnboarding = (user: any): boolean => {
  // Check if user exists
  if (!user) return true;
  
  // Check if user has required experience properties
  if (typeof user.totalXP !== 'number' || typeof user.currentLevel !== 'number') {
    console.warn('[Onboarding] User object missing experience properties');
    return true; // Assume new user if properties missing
  }
  
  // Check if below threshold
  return user.totalXP < XP_CONFIG.NEW_USER_THRESHOLD;
};
