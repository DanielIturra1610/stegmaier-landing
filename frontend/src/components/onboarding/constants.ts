import { FirstDayMission } from './types';

/**
 * Constants for the FirstDayExperience onboarding system
 */

/** 
 * First day experience missions
 * Each mission guides the user through a specific part of the platform
 */
export const FIRST_DAY_MISSIONS: FirstDayMission[] = [
  {
    id: 'explore_dashboard',
    title: 'Conoce tu Panel de Control ISO',
    description: 'Explora las diferentes secciones de tu dashboard para entender qué información tienes disponible para gestionar tu capacitación ISO.',
    targetElement: '#dashboard-overview',
    xpReward: 15,
    type: 'read',
    completionCriteria: 'Permanecer en la sección por al menos 10 segundos',
    businessContext: 'El panel de control te proporciona una visión panorámica de tu progreso en la plataforma. Entender esta información es fundamental para gestionar eficientemente tu tiempo de capacitación y preparar estratégicamente tu certificación ISO.'
  },
  {
    id: 'certification_path',
    title: 'Explora tu Ruta de Certificación',
    description: 'Navega a la sección de cursos para conocer tu camino hacia la certificación profesional ISO.',
    targetElement: '#certification-path-link',
    xpReward: 20,
    type: 'navigate',
    completionCriteria: 'Navegar a la página de cursos',
    businessContext: 'Las certificaciones ISO son reconocidas internacionalmente y aumentan significativamente tu valor profesional en el mercado. Conocer tu ruta personalizada te ayudará a planificar tu desarrollo profesional a corto y largo plazo.'
  },
  {
    id: 'weekly_challenges',
    title: 'Comprende los Desafíos Empresariales',
    description: 'Interactúa con la sección de desafíos semanales para entender cómo aplicar los conocimientos ISO en situaciones reales de negocio.',
    targetElement: '#weekly-challenges',
    xpReward: 25,
    type: 'interact',
    completionCriteria: 'Hacer hover y click en al menos un desafío',
    businessContext: 'Los desafíos semanales simulan situaciones reales que enfrentarás en tu rol profesional. Resolverlos te ayudará a desarrollar pensamiento crítico y aplicar normativas ISO en contextos prácticos de negocio.'
  },
  {
    id: 'profile_setup',
    title: 'Configura tu Perfil Profesional',
    description: 'Completa los datos de tu perfil profesional para personalizar tu experiencia de capacitación y facilitar la conexión con otros profesionales.',
    targetElement: '#profile-settings',
    xpReward: 20,
    type: 'click',
    completionCriteria: 'Abrir el modal de edición de perfil',
    businessContext: 'Un perfil completo mejora la personalización de tu experiencia y te conecta con otros profesionales del sector. Facilita la formación de redes profesionales y aumenta tu visibilidad en la comunidad especializada en sistemas de gestión.'
  },
  {
    id: 'first_competency',
    title: 'Descubre tu Primera Competencia ISO',
    description: 'Abre el primer curso sugerido para familiarizarte con el formato de aprendizaje y los conceptos fundamentales de sistemas ISO.',
    targetElement: '#suggested-course',
    xpReward: 30,
    type: 'click',
    completionCriteria: 'Abrir el detalle del curso recomendado',
    businessContext: 'Las competencias ISO son habilidades específicas altamente valoradas en roles de gestión, calidad y consultoría. Iniciar con la competencia sugerida establecerá una base sólida para tu desarrollo profesional especializado.'
  },
  {
    id: 'weekly_goal',
    title: 'Establece tu Meta de Capacitación',
    description: 'Selecciona un objetivo semanal de tiempo de estudio para mantener un ritmo constante en tu capacitación.',
    targetElement: '#learning-goals',
    xpReward: 25,
    type: 'click',
    completionCriteria: 'Seleccionar un objetivo semanal',
    businessContext: 'Establecer metas medibles mejora significativamente las tasas de finalización de capacitación. Los profesionales que definen objetivos claros tienen un 76% más de probabilidades de completar su certificación en el tiempo previsto.'
  },
  {
    id: 'join_community',
    title: 'Únete a la Comunidad Empresarial',
    description: 'Accede a la sección de comunidad para conectar con otros profesionales, consultar dudas y compartir experiencias sobre implementación de sistemas ISO.',
    targetElement: '#community-access',
    xpReward: 35,
    type: 'navigate',
    completionCriteria: 'Navegar a la sección de comunidad',
    businessContext: 'Las conexiones profesionales son fundamentales para el crecimiento laboral. Nuestra comunidad reúne a consultores, auditores y gerentes de calidad, creando oportunidades de mentoría y colaboración en proyectos reales de implementación ISO.'
  }
];

/**
 * Local storage key for saving first day progress
 */
export const STORAGE_KEY = 'stegmaier_first_day_progress';

/**
 * Configuration for XP rewards and notifications
 */
export const REWARD_CONFIG = {
  /** Total XP earned from completing all missions */
  totalPossibleXP: FIRST_DAY_MISSIONS.reduce((sum, mission) => sum + mission.xpReward, 0),
  /** Badge awarded for completing all missions */
  completionBadge: 'Pionero Empresarial',
  /** Level unlocked after completing all missions */
  unlockedLevel: 1
};

/**
 * Configuration for analytics tracking
 */
export const ANALYTICS_EVENTS = {
  MISSION_STARTED: 'onboarding_mission_started',
  MISSION_COMPLETED: 'onboarding_mission_completed',
  MISSION_SKIPPED: 'onboarding_mission_skipped',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned'
};

/**
 * Time thresholds for mission tracking (in milliseconds)
 */
export const TIME_CONFIG = {
  /** Minimum time to consider a reading mission complete */
  READ_THRESHOLD: 10000,
  /** Time to wait before showing tooltip */
  TOOLTIP_DELAY: 500,
  /** Duration of the confetti celebration */
  FINAL_CELEBRATION_DURATION: 4000
};
