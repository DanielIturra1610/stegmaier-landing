import React, { useState, useEffect, useCallback } from 'react';
import { FirstDayExperienceProps, FirstDayMission, MissionProgress, CelebrationConfig, User } from './types';
import { FIRST_DAY_MISSIONS, STORAGE_KEY, REWARD_CONFIG, ANALYTICS_EVENTS, TIME_CONFIG } from './constants';
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
    <div 
      className="fixed inset-0 z-50 backdrop-blur-sm bg-gray-900/50 flex flex-col items-center justify-start"
      role="region"
      aria-label="Onboarding"
    >
      {/* Header with progress */}
      <div className="w-full bg-white px-4 py-3 shadow-md">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            Experiencia de primer día
          </h2>
          
          <p className="text-sm text-gray-600 mb-2">
            Completa {FIRST_DAY_MISSIONS.length} misiones para desbloquear todas las funcionalidades
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 rounded-full h-2 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          
          {/* Missions count */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{missionProgress.completedMissions.length} de {FIRST_DAY_MISSIONS.length} misiones completadas</span>
            <span>XP ganado: {missionProgress.totalXP}</span>
          </div>
        </div>
      </div>
      
      {/* Mission spotlight */}
      {currentMission && (
        <MissionSpotlight
          targetElement={currentMission.targetElement}
          currentMission={currentMission}
        />
      )}
      
      {/* Mission tooltip */}
      {currentMission && (
        <MissionTooltip
          mission={currentMission}
          onComplete={handleMissionComplete}
          onSkip={handleSkipMission}
        />
      )}
      
      {/* Celebration modal */}
      <CelebrationModal
        isVisible={showCelebration}
        config={celebrationConfig}
        onClose={handleCloseCelebration}
      />
    </div>
  );
};

export default FirstDayExperience;
