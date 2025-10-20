/**
 * Hook personalizado para gestionar la experiencia del usuario
 * Mantiene estado local y se comunica con ExperienceService
 * Soporta sistema híbrido de persistencia (local + futuro backend)
 * Integrado con sistema de validación automática de misiones
 */

import { useState, useEffect, useCallback } from 'react';
import experienceService, { UserProgress } from '../services/experienceService';
import { trackMissionEvent } from '../components/onboarding/utils';
import { ANALYTICS_EVENTS } from '../components/onboarding/constants';

interface UseUserExperienceProps {
  userId: string;
}

interface UseUserExperienceReturn {
  // Datos de experiencia del usuario
  totalXP: number;
  currentLevel: number;
  completedMissions: string[];
  
  // Estado de onboarding
  isOnboardingComplete: boolean;
  
  // Estado de nivel
  isLeveledUp: boolean;
  
  // Estado de carga y errores
  loading: boolean;
  error: Error | null;
  
  // Métodos para actualizar experiencia
  updateUserXP: (earnedXP: number) => Promise<UserProgress>;
  markOnboardingComplete: () => Promise<boolean>;
  completeMission: (missionId: string, xpReward: number) => Promise<string[]>;
  
  // Métodos para cálculos de nivel
  calculateNextLevelXP: () => number;
  calculateLevelProgress: () => number;
  resetLevelUp: () => void;
}

export const useUserExperience = ({ userId }: UseUserExperienceProps): UseUserExperienceReturn => {
  // Estado local de experiencia
  const [progress, setProgress] = useState<UserProgress | null>(null);
  
  // Estado de carga y errores
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Estado de onboarding y nivel
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [isLeveledUp, setIsLeveledUp] = useState<boolean>(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        console.log(`🚀 [Experience] Initializing experience system for user: ${userId}`);
        
        // Cargar datos de progreso
        const userProgress = await experienceService.getUserProgress(userId);
        setProgress(userProgress);
        
        // Verificar estado de onboarding
        const onboardingComplete = await experienceService.isOnboardingCompleted(userId);
        setIsOnboardingComplete(onboardingComplete);
        
        setLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error loading experience data');
        console.error('[Experience] Error loading user experience data:', error);
        setError(error);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [userId]);

  // Escuchar eventos de actualización de XP
  useEffect(() => {
    const handleXPUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<UserProgress>;
      const updatedProgress = customEvent.detail;
      
      // Comprobar si hubo un level up
      if (progress && updatedProgress.currentLevel > progress.currentLevel) {
        setIsLeveledUp(true);
        
        // Registrar evento de subida de nivel para analytics
        trackMissionEvent(ANALYTICS_EVENTS.LEVEL_UP, 'level_up', {
          userId,
          previousLevel: progress.currentLevel,
          newLevel: updatedProgress.currentLevel,
          totalXP: updatedProgress.totalXP
        });
      }
      
      setProgress(updatedProgress);
    };
    
    window.addEventListener('userXPUpdated', handleXPUpdate);
    
    return () => {
      window.removeEventListener('userXPUpdated', handleXPUpdate);
    };
  }, [progress, userId]);

  // Actualizar XP del usuario
  const updateUserXP = useCallback(async (earnedXP: number): Promise<UserProgress> => {
    if (!userId) throw new Error('No user ID provided');
    
    try {
      const updatedProgress = await experienceService.updateUserXP(userId, earnedXP);
      setProgress(updatedProgress);
      return updatedProgress;
    } catch (error) {
      console.error('Error updating user XP:', error);
      throw error;
    }
  }, [userId]);

  // Marcar onboarding como completado
  const markOnboardingComplete = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const result = await experienceService.markOnboardingComplete(userId);
      setIsOnboardingComplete(result);
      return result;
    } catch (error) {
      console.error('[Experience] Error marking onboarding complete:', error);
      return false;
    }
  }, [userId]);

  // Completar una misión y otorgar XP
  const completeMission = useCallback(async (missionId: string, xpReward: number): Promise<string[]> => {
    if (!userId) return [];
    
    try {
      // Guardar el progreso de la misión
      const updatedMissions = await experienceService.saveMissionProgress(userId, missionId);
      
      // Otorgar XP al usuario por completar la misión
      if (xpReward > 0) {
        const updatedProgress = await experienceService.updateUserXP(userId, xpReward);
        setProgress(updatedProgress);
        
        // Registrar analítica de completado de misión con XP
        trackMissionEvent(ANALYTICS_EVENTS.MISSION_COMPLETED, missionId, {
          userId,
          xpReward,
          totalXP: updatedProgress.totalXP,
          currentLevel: updatedProgress.currentLevel
        });
      } else {
        // Actualizar solo las misiones completadas si no hay XP
        if (progress) {
          setProgress({
            ...progress,
            completedMissions: updatedMissions
          });
        }
      }
      
      return updatedMissions;
    } catch (error) {
      console.error(`[Experience] Error completing mission ${missionId}:`, error);
      return [];
    }
  }, [userId, progress]);

  // Calcular XP necesario para el siguiente nivel
  const calculateNextLevelXP = useCallback((): number => {
    if (!progress) return 0;
    
    const currentLevel = progress.currentLevel;
    const nextLevel = currentLevel + 1;
    
    // XP requerido para el siguiente nivel usando fórmula inversa
    return Math.pow(nextLevel, 2) * 50;
  }, [progress]);

  // Calcular porcentaje de progreso hacia el siguiente nivel
  const calculateLevelProgress = useCallback((): number => {
    if (!progress) return 0;
    
    const currentXP = progress.totalXP;
    const currentLevel = progress.currentLevel;
    
    // XP al inicio del nivel actual
    const currentLevelXP = Math.pow(currentLevel, 2) * 50;
    
    // XP para el siguiente nivel
    const nextLevelXP = Math.pow(currentLevel + 1, 2) * 50;
    
    // Calcular porcentaje de progreso
    const xpForThisLevel = nextLevelXP - currentLevelXP;
    const xpIntoThisLevel = currentXP - currentLevelXP;
    
    return Math.min(100, Math.floor((xpIntoThisLevel / xpForThisLevel) * 100));
  }, [progress]);

  // Resetear flag de level up
  const resetLevelUp = useCallback(() => {
    setIsLeveledUp(false);
  }, []);

  return {
    // Datos de experiencia del usuario
    totalXP: progress?.totalXP || 0,
    currentLevel: progress?.currentLevel || 0,
    completedMissions: progress?.completedMissions || [],
    
    // Estado de onboarding
    isOnboardingComplete,
    
    // Estado de nivel
    isLeveledUp,
    
    // Estado de carga y errores
    loading,
    error,
    
    // Métodos para actualizar experiencia
    updateUserXP,
    markOnboardingComplete,
    completeMission,
    
    // Métodos para cálculos de nivel
    calculateNextLevelXP,
    calculateLevelProgress,
    resetLevelUp
  };
};

export default useUserExperience;
