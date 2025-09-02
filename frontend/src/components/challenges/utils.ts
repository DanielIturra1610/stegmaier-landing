/**
 * Utility functions for Weekly Challenges
 */
import { 
  Challenge, 
  ChallengeStatus, 
  CelebrationLevel, 
  ChallengeProgress, 
  ChallengeDifficulty 
} from './types';
import { DIFFICULTY_COLORS, EXPIRING_THRESHOLD_DAYS } from './constants';

/**
 * Calcula el porcentaje de progreso para un desafío
 * @param challenge Desafío a evaluar
 * @returns Porcentaje de progreso (0-100)
 */
export const calculateProgress = (challenge: Challenge): number => {
  if (!challenge.currentValue || challenge.targetValue <= 0) {
    return 0;
  }
  
  const progress = Math.min(challenge.currentValue / challenge.targetValue, 1) * 100;
  return Math.floor(progress);
};

/**
 * Determina estilos de tarjeta según la dificultad
 * @param difficulty Nivel de dificultad
 * @returns Objeto con estilos CSS
 */
export const getCardStyle = (difficulty: ChallengeDifficulty) => {
  return DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.medium;
};

/**
 * Verifica si un desafío está próximo a expirar
 * @param challenge Desafío a evaluar
 * @returns Verdadero si expira en menos del umbral de días
 */
export const isExpiringSoon = (challenge: Challenge): boolean => {
  if (!challenge.deadline) return false;
  
  const now = new Date();
  const diffMs = challenge.deadline.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays > 0 && diffDays <= EXPIRING_THRESHOLD_DAYS;
};

/**
 * Verifica si un desafío ya expiró
 * @param challenge Desafío a evaluar
 * @returns Verdadero si la fecha límite ya pasó
 */
export const isExpired = (challenge: Challenge): boolean => {
  if (!challenge.deadline) return false;
  
  const now = new Date();
  return challenge.deadline < now;
};

/**
 * Determina el estado actual de un desafío
 * @param challenge Desafío a evaluar
 * @param completedChallenges Lista de IDs de desafíos completados
 * @returns Estado del desafío
 */
export const getChallengeStatus = (
  challenge: Challenge, 
  completedChallenges: string[]
): ChallengeStatus => {
  // Verificar si está completado
  if (completedChallenges.includes(challenge.id)) {
    return 'completed';
  }
  
  // Verificar si está bloqueado por requisitos
  if (challenge.requirements && challenge.requirements.length > 0) {
    const allRequirementsMet = challenge.requirements.every(req => 
      completedChallenges.includes(req)
    );
    if (!allRequirementsMet) {
      return 'locked';
    }
  }
  
  // Verificar si expiró
  if (isExpired(challenge)) {
    return 'expired';
  }
  
  // Verificar si está por expirar
  if (isExpiringSoon(challenge)) {
    return 'expiring';
  }
  
  // En progreso por defecto
  return 'in_progress';
};

/**
 * Determina el nivel de celebración para animaciones
 * @param challenge Desafío a evaluar
 * @param previousProgress Progreso anterior
 * @param currentProgress Progreso actual
 * @returns Nivel de celebración
 */
export const getCelebrationLevel = (
  challenge: Challenge,
  previousProgress: number,
  currentProgress: number
): CelebrationLevel => {
  // Si se completó el desafío
  if (previousProgress < 100 && currentProgress >= 100) {
    return CelebrationLevel.MEDIUM;
  }
  
  // Verificar si se alcanzó un hito
  if (challenge.milestones && challenge.milestones.length > 0) {
    const prevValue = (previousProgress / 100) * challenge.targetValue;
    const currValue = (currentProgress / 100) * challenge.targetValue;
    
    for (const milestone of challenge.milestones) {
      if (prevValue < milestone && currValue >= milestone) {
        return CelebrationLevel.SMALL;
      }
    }
  }
  
  return CelebrationLevel.NONE;
};

/**
 * Formatea el tiempo restante para un desafío
 * @param deadline Fecha límite
 * @returns Texto formateado del tiempo restante
 */
export const formatTimeRemaining = (deadline?: Date): string => {
  if (!deadline) return '';
  
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Expirado';
  }
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`;
  }
  
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  
  return `${diffMinutes}m`;
};

/**
 * Genera el texto descriptivo del progreso para lectores de pantalla
 * @param challenge Desafío
 * @param progress Porcentaje de progreso
 * @returns Texto accesible
 */
export const getProgressDescription = (challenge: Challenge, progress: number): string => {
  return `${progress}% completado. ${challenge.currentValue || 0} de ${challenge.targetValue} ${challenge.description.toLowerCase()}`;
};

/**
 * Determina si un usuario ha alcanzado un nuevo hito en un desafío
 * @param challenge Desafío
 * @param userProgress Progreso del usuario
 * @returns Arreglo con los hitos alcanzados o vacío
 */
export const getNewlyReachedMilestones = (
  challenge: Challenge,
  userProgress: ChallengeProgress
): number[] => {
  if (!challenge.milestones || challenge.milestones.length === 0) {
    return [];
  }

  const progress = userProgress[challenge.id];
  if (!progress) return [];

  const currentValue = progress.currentValue;
  const reachedMilestones = (Array.isArray(challenge.milestones) ? challenge.milestones : []).filter(m => currentValue >= m);
  const newlyReached = (Array.isArray(reachedMilestones) ? reachedMilestones : []).filter(
    m => !progress.milestoneReached?.includes(m)
  );
  
  return newlyReached;
};
