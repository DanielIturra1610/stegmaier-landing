/**
 * Types for Weekly Challenges component
 */

/**
 * Dificultad de un desafío
 */
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Tipo de recompensa
 */
export type RewardType = 'xp' | 'badge' | 'both';

/**
 * Categoría de desafío relacionada a prevención de riesgos, normas ISO y gestión empresarial
 */
export type ChallengeCategory = 
  | 'safety_prevention' // Prevención de riesgos
  | 'iso_standards'     // Normas ISO
  | 'business_management' // Gestión empresarial
  | 'risk_assessment'   // Evaluación de riesgos
  | 'compliance'        // Cumplimiento normativo
  | 'environmental'     // Gestión ambiental
  | 'quality_control';  // Control de calidad

/**
 * Estado de un desafío
 */
export type ChallengeStatus = 
  | 'completed'  // Completado
  | 'in_progress' // En progreso
  | 'expiring'   // Por expirar (menos de 2 días)
  | 'expired'    // Expirado
  | 'locked';    // Bloqueado (no disponible)

/**
 * Interfaz para un desafío semanal
 */
export interface Challenge {
  /** ID único del desafío */
  id: string;
  /** Título descriptivo del desafío */
  title: string;
  /** Descripción del objetivo */
  description: string;
  /** Categoría del desafío */
  category: ChallengeCategory;
  /** Valor objetivo para completar */
  targetValue: number;
  /** Valor actual del progreso */
  currentValue?: number;
  /** Recompensa por completar (XP, badge o ambos) */
  reward: {
    type: RewardType;
    value: number; // Cantidad de XP o ID de badge
    badgeName?: string; // Nombre del badge si aplica
    badgeImage?: string; // URL de la imagen del badge
  };
  /** Nivel de dificultad */
  difficulty: ChallengeDifficulty;
  /** Ícono representativo - Ya no se usa, reemplazado por iconos SVG */
  icon?: string;
  /** Fecha límite para completar */
  deadline?: Date;
  /** Requisitos para desbloquear (IDs de otros desafíos) */
  requirements?: string[];
  /** Milestones intermedios para celebraciones */
  milestones?: number[];
}

/**
 * Interfaz para el progreso del usuario en desafíos
 */
export interface ChallengeProgress {
  /** Mapa de progreso actual por ID de desafío */
  [challengeId: string]: {
    currentValue: number;
    lastUpdated: Date;
    milestoneReached?: number[];
  }
}

/**
 * Nivel de celebración para animaciones
 */
export enum CelebrationLevel {
  NONE = 0,
  SMALL = 1, // Milestone intermedio alcanzado
  MEDIUM = 2, // Desafío completado
  LARGE = 3  // Todos los desafíos completados
}

/**
 * Props para el componente WeeklyChallenges
 */
export interface WeeklyChallengesProps {
  /** Lista de desafíos activos */
  challenges: Challenge[];
  /** IDs de desafíos completados esta semana */
  completedChallenges: string[];
  /** Progreso actual del usuario */
  userProgress: ChallengeProgress;
  /** Callback cuando se completa un desafío */
  onChallengeCompleted?: (challengeId: string) => void;
  /** Callback cuando se hace clic en un desafío */
  onChallengeClick?: (challenge: Challenge) => void;
}

/**
 * Props para el componente ChallengeCard
 */
export interface ChallengeCardProps {
  /** Datos del desafío */
  challenge: Challenge;
  /** Si el desafío está completado */
  isCompleted: boolean;
  /** Progreso actual del usuario en este desafío */
  progress?: number;
  /** Estado del desafío */
  status: ChallengeStatus;
  /** Nivel de celebración */
  celebrationLevel: CelebrationLevel;
  /** Callback cuando se hace clic en la tarjeta */
  onClick?: () => void;
}
