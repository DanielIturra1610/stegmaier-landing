/**
 * Constants for Weekly Challenges
 */
import { ChallengeDifficulty, ChallengeCategory } from './types';

/**
 * Colores de tarjeta según dificultad
 */
export const DIFFICULTY_COLORS: Record<ChallengeDifficulty, {
  background: string;
  border: string;
  text: string;
  badge: string;
  progress: string;
}> = {
  easy: {
    background: '#e6f7ff', // primary-100
    border: '#bae7ff',     // primary-200
    text: '#0070f3',       // primary-600
    badge: '#e6f7ff',      // primary-100
    progress: '#0070f3'    // primary-600
  },
  medium: {
    background: '#fff7e6',  // accent-100
    border: '#ffe7ba',      // accent-200
    text: '#f97316',        // accent-500
    badge: '#fff7e6',       // accent-100
    progress: '#f97316'     // accent-500
  },
  hard: {
    background: '#fffbe6',  // gold-100
    border: '#fff1b8',      // gold-200
    text: '#f59e0b',        // gold-500
    badge: '#fffbe6',       // gold-100
    progress: '#f59e0b'     // gold-500
  }
};

/**
 * Íconos por categoría como strings SVG
 */
export const CATEGORY_ICONS: Record<ChallengeCategory, string> = {
  safety_prevention: 'shield-check', // Prevención de riesgos
  iso_standards: 'document-text',    // Normas ISO
  business_management: 'briefcase',   // Gestión empresarial 
  risk_assessment: 'exclamation',    // Evaluación de riesgos
  compliance: 'shield',              // Cumplimiento normativo
  environmental: 'globe',            // Gestión ambiental
  quality_control: 'clipboard-check' // Control de calidad
};

/**
 * Etiquetas por dificultad
 */
export const DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Intermedio',
  hard: 'Avanzado'
};

/**
 * XP base por dificultad
 */
export const XP_REWARDS: Record<ChallengeDifficulty, number> = {
  easy: 50,
  medium: 100,
  hard: 200
};

/**
 * Configuración de anillos de progreso
 */
export const PROGRESS_RING = {
  radius: 40,
  stroke: 8,
  circumference: 2 * Math.PI * 40
};

/**
 * Configuración de animación
 */
export const ANIMATION_TIMING = {
  stagger: 0.1,  // 100ms entre cada tarjeta
  duration: 0.5, // duración de animaciones
  delay: 0.2     // retraso inicial
};

/**
 * Umbral de días para marcar como "por expirar"
 */
export const EXPIRING_THRESHOLD_DAYS = 2;

/**
 * Desafíos de ejemplo para desarrollo
 */
export const MOCK_CHALLENGES = [
  {
    id: 'challenge-1',
    title: 'Guardián de la Seguridad',
    description: 'Completa 5 simulacros de evacuación en diferentes áreas',
    category: 'safety_prevention' as ChallengeCategory,
    targetValue: 5,
    currentValue: 3,
    reward: {
      type: 'both' as const,
      value: 100,
      badgeName: 'Preventor Elite',
      badgeImage: '/badges/safety.svg'
    },
    difficulty: 'medium' as ChallengeDifficulty,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
    milestones: [1, 3, 5]
  },
  {
    id: 'challenge-2',
    title: 'Experto en ISO 45001',
    description: 'Completa la documentación de 10 procesos según el estándar ISO 45001',
    category: 'iso_standards' as ChallengeCategory,
    targetValue: 10,
    currentValue: 8,
    reward: {
      type: 'xp' as const,
      value: 200
    },
    difficulty: 'hard' as ChallengeDifficulty,
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 día
    milestones: [3, 6, 8, 10]
  },
  {
    id: 'challenge-3',
    title: 'Analista de Indicadores KPI',
    description: 'Evalúa 3 indicadores clave de rendimiento empresarial',
    category: 'business_management' as ChallengeCategory,
    targetValue: 3,
    currentValue: 3,
    reward: {
      type: 'badge' as const,
      value: 1,
      badgeName: 'Estratega Empresarial',
      badgeImage: '/badges/business.svg'
    },
    difficulty: 'easy' as ChallengeDifficulty,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    milestones: [1, 2, 3]
  },
  {
    id: 'challenge-4',
    title: 'Evaluador de Riesgos',
    description: 'Identifica 8 riesgos potenciales en áreas operativas',
    category: 'risk_assessment' as ChallengeCategory,
    targetValue: 8,
    currentValue: 3,
    reward: {
      type: 'xp' as const,
      value: 150
    },
    difficulty: 'medium' as ChallengeDifficulty,
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 días
    milestones: [2, 5, 8]
  },
  {
    id: 'challenge-5',
    title: 'Auditor de Cumplimiento',
    description: 'Verifica el cumplimiento de 5 normativas regulatorias vigentes',
    category: 'compliance' as ChallengeCategory,
    targetValue: 5,
    currentValue: 2,
    reward: {
      type: 'both' as const,
      value: 175,
      badgeName: 'Auditor Certificado',
      badgeImage: '/badges/compliance.svg'
    },
    difficulty: 'hard' as ChallengeDifficulty,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
    milestones: [1, 3, 5]
  },
  {
    id: 'challenge-6',
    title: 'Gestor Ambiental',
    description: 'Implementa 3 iniciativas de reducción de huella de carbono',
    category: 'environmental' as ChallengeCategory,
    targetValue: 3,
    currentValue: 1,
    reward: {
      type: 'xp' as const,
      value: 125
    },
    difficulty: 'medium' as ChallengeDifficulty,
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 días
    milestones: [1, 2, 3]
  },
  {
    id: 'challenge-7',
    title: 'Inspector de Calidad',
    description: 'Realiza 10 inspecciones de control de calidad en productos finales',
    category: 'quality_control' as ChallengeCategory,
    targetValue: 10,
    currentValue: 7,
    reward: {
      type: 'both' as const,
      value: 150,
      badgeName: 'Control de Calidad Total',
      badgeImage: '/badges/quality.svg'
    },
    difficulty: 'medium' as ChallengeDifficulty,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días
    milestones: [3, 7, 10]
  }
];
