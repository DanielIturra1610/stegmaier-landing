import React, { useState, useEffect, useCallback } from 'react';
import { FirstDayExperienceProps, FirstDayMission, MissionProgress, CelebrationConfig, User } from './types';
import { FIRST_DAY_MISSIONS, REWARD_CONFIG, ANALYTICS_EVENTS, TIMING, STORAGE_KEYS } from './constants';
import {
  isNewUser,
  saveMissionProgress,
  loadMissionProgress,
  initializeMissionProgress,
  setupMissionDetection,
  getProgressPercentage,
  trackMissionEvent,
  completeMission,
  updateMissionTimeSpent
} from './utils';
import MissionSpotlight from './MissionSpotlight';
import MissionTooltip from './MissionTooltip';
import CelebrationModal from './CelebrationModal';

/**
 * FirstDayExperience Component
 * 
 * A gamified onboarding system that guides new users through key platform features
 * Uses only Tailwind CSS classes for styling
 */
const FirstDayExperience: React.FC<FirstDayExperienceProps> = ({
  user,
  onMissionComplete,
  onFirstDayComplete,
  isVisible
}) => {
  // Check if user should see onboarding
  const shouldShowOnboarding = isNewUser(user?.currentLevel || 0, user?.totalXP || 0) && isVisible;
  
  // Add debug logging
  console.log('🔍 [FirstDayExperience] Evaluating shouldShowOnboarding:', {
    isNewUser: isNewUser(user?.currentLevel || 0, user?.totalXP || 0),
    userLevel: user?.currentLevel || 0,
    userXP: user?.totalXP || 0,
    isVisible,
    result: shouldShowOnboarding
  });
  
  // Track current mission index
  const [currentMissionIndex, setCurrentMissionIndex] = useState<number>(0);
  
  // Track completed missions
  const [missionProgress, setMissionProgress] = useState<MissionProgress | null>(null);
  
  // Track current mission start time
  const [missionStartTime, setMissionStartTime] = useState<number>(Date.now());
  
  // Show celebration modal
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  
  // Celebration configuration
  const [celebrationConfig, setCelebrationConfig] = useState<CelebrationConfig>({
    title: '',
    message: '',
    xpEarned: 0,
    isFinal: false
  });

  // Get current mission
  const currentMission = shouldShowOnboarding 
    ? FIRST_DAY_MISSIONS[currentMissionIndex]
    : null;
  
  // Initialize or load progress
  useEffect(() => {
    if (!shouldShowOnboarding) return;
    
    // Check localStorage for existing progress
    const savedProgress = loadMissionProgress();
    
    if (savedProgress) {
      // Resume from saved progress
      setMissionProgress(savedProgress);
      
      // Find first incomplete mission
      const nextMissionIndex = FIRST_DAY_MISSIONS.findIndex(
        mission => !savedProgress.completedMissions.includes(mission.id)
      );
      
      // If all missions complete, show final celebration
      if (nextMissionIndex === -1) {
        handleAllMissionsComplete();
      } else {
        setCurrentMissionIndex(nextMissionIndex);
      }
    } else {
      // Initialize new progress tracking
      const initialProgress = initializeMissionProgress(FIRST_DAY_MISSIONS);
      setMissionProgress(initialProgress);
      saveMissionProgress(initialProgress);
      
      // Track start of onboarding
      trackMissionEvent(
        ANALYTICS_EVENTS.MISSION_STARTED,
        FIRST_DAY_MISSIONS[0].id,
        { isFirstMission: true }
      );
    }
    
    // Set initial mission start time
    setMissionStartTime(Date.now());
  }, [shouldShowOnboarding]);

  // Setup detection for current mission
  useEffect(() => {
    if (!shouldShowOnboarding || !currentMission || !missionProgress) return;
    
    // Track mission start
    trackMissionEvent(
      ANALYTICS_EVENTS.MISSION_STARTED,
      currentMission.id
    );
    
    // Setup detection based on mission type
    const cleanupDetection = setupMissionDetection(
      currentMission,
      () => handleMissionComplete()
    );
    
    return () => {
      cleanupDetection();
    };
  }, [currentMission, shouldShowOnboarding, missionProgress]);

  // Handle mission complete
  const handleMissionComplete = useCallback(() => {
    if (!currentMission || !missionProgress) return;
    
    // Calculate time spent on this mission
    const timeSpent = Math.floor((Date.now() - missionStartTime) / 1000);
    
    // Update mission progress
    const updatedProgress = completeMission(
      updateMissionTimeSpent(missionProgress, currentMission.id, timeSpent),
      currentMission
    );
    
    // Save progress
    setMissionProgress(updatedProgress);
    saveMissionProgress(updatedProgress);
    
    // Track completion
    trackMissionEvent(
      ANALYTICS_EVENTS.MISSION_COMPLETED,
      currentMission.id,
      { timeSpent, attempts: missionProgress.attempts[currentMission.id] || 1 }
    );
    
    // Call onMissionComplete callback
    onMissionComplete(currentMission.id, currentMission.xpReward);
    
    // Show micro celebration
    setCelebrationConfig({
      title: '¡Misión completada!',
      message: 'Has completado una misión importante',
      xpEarned: currentMission.xpReward,
      isFinal: false
    });
    setShowCelebration(true);
    
    // Move to next mission or finish
    const nextMissionIndex = currentMissionIndex + 1;
    
    if (nextMissionIndex < FIRST_DAY_MISSIONS.length) {
      setCurrentMissionIndex(nextMissionIndex);
      setMissionStartTime(Date.now());
    } else {
      handleAllMissionsComplete();
    }
  }, [currentMission, currentMissionIndex, missionProgress, missionStartTime, onMissionComplete]);
  
  // Handle skip mission
  const handleSkipMission = useCallback(() => {
    if (!currentMission || !missionProgress) return;
    
    // Track skip
    trackMissionEvent(
      ANALYTICS_EVENTS.MISSION_SKIPPED,
      currentMission.id
    );
    
    // Move to next mission
    const nextMissionIndex = currentMissionIndex + 1;
    
    if (nextMissionIndex < FIRST_DAY_MISSIONS.length) {
      setCurrentMissionIndex(nextMissionIndex);
      setMissionStartTime(Date.now());
    } else {
      handleAllMissionsComplete();
    }
  }, [currentMission, currentMissionIndex, missionProgress]);
  
  // Handle all missions complete
  const handleAllMissionsComplete = useCallback(() => {
    if (!missionProgress) return;
    
    // Update progress with end timestamp
    const finalProgress = {
      ...missionProgress,
      endTimestamp: Date.now()
    };
    
    // Save final progress
    setMissionProgress(finalProgress);
    saveMissionProgress(finalProgress);
    
    // Track onboarding completion
    trackMissionEvent(
      ANALYTICS_EVENTS.ONBOARDING_COMPLETED,
      'all',
      {
        totalTimeSpent: Object.values(finalProgress.timeSpent).reduce((a, b) => a + b, 0),
        totalXP: finalProgress.totalXP
      }
    );
    
    // Show final celebration
    setCelebrationConfig({
      title: '¡Primer día completado!',
      message: 'Has completado con éxito tu primera experiencia en la plataforma',
      xpEarned: REWARD_CONFIG.totalPossibleXP,
      isFinal: true
    });
    setShowCelebration(true);
    
    // Call onFirstDayComplete callback
    onFirstDayComplete(finalProgress.totalXP);
  }, [missionProgress, onFirstDayComplete]);
  
  // Handle close celebration modal
  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);
  
  // Don't render anything if onboarding shouldn't be shown
  if (!shouldShowOnboarding || !missionProgress) {
    return null;
  }
  
  // Calculate progress percentage
  const progressPercentage = getProgressPercentage(
    missionProgress.completedMissions,
    FIRST_DAY_MISSIONS.length
  );

  return (
    <>
      {/* Non-blocking floating progress indicator */}
      <div 
        className="fixed top-4 right-4 bg-white shadow-lg rounded-full px-3 py-1 text-sm font-medium z-40 flex items-center space-x-2"
        aria-label="Onboarding Progress"
      >
        <div className="flex items-center">
          <span className="text-primary-700 font-medium">Misión {missionProgress.completedMissions.length + 1}/{FIRST_DAY_MISSIONS.length}</span>
        </div>
        
        {/* Mini progress bar */}
        <div className="w-16 bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-primary-600 rounded-full h-1.5 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        
        {/* Skip button */}
        <button
          onClick={handleSkipMission}
          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full p-0.5"
          aria-label="Omitir misión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 10-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Mission spotlight - non-intrusive */}
      {currentMission && (
        <MissionSpotlight
          targetElement={currentMission.targetElement}
          currentMission={currentMission}
        />
      )}
      
      {/* Mission tooltip - non-intrusive */}
      {currentMission && (
        <MissionTooltip
          mission={currentMission}
          onComplete={handleMissionComplete}
          onSkip={handleSkipMission}
        />
      )}
      
      {/* Bottom sheet for mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg rounded-t-xl transform transition-transform duration-300 ease-in-out">
        <div className="w-full flex justify-center py-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
        <div className="px-4 py-3 max-h-[40vh] overflow-y-auto">
          <h3 className="text-base font-bold text-gray-800 mb-1.5">
            {currentMission?.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {currentMission?.description}
          </p>
          <button
            onClick={handleMissionComplete}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors duration-200"
          >
            Completar misión
          </button>
        </div>
      </div>
      
      {/* Celebration modal */}
      <div className="relative z-50">
        <CelebrationModal
          isVisible={showCelebration}
          config={celebrationConfig}
          onClose={handleCloseCelebration}
        />
      </div>
    </>
  );
};

export default FirstDayExperience;
