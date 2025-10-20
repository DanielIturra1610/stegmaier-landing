import { FirstDayMission } from './types';

/**
 * Constants for the FirstDayExperience onboarding system
 */

/**
 * Analytics event names for tracking user progress
 */
export const ANALYTICS_EVENTS = {
  MISSION_STARTED: 'onboarding_mission_started',
  MISSION_COMPLETED: 'onboarding_mission_completed',
  MISSION_SKIPPED: 'onboarding_mission_skipped',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned',
  LEVEL_UP: 'user_level_up',
  XP_GAINED: 'user_xp_gained'
};

/**
 * Timing constants for mission validation (milliseconds)
 */
export const TIMING = {
  // Tiempos de validación de misiones
  HOVER_TIME: 2000,                    // 2 segundos de hover requerido
  READ_MIN_TIME: 5000,                 // 5 segundos mínimo de lectura
  RETRY_INTERVAL: 500,                 // 500ms entre intentos de encontrar elemento
  MAX_RETRIES: 10,                     // Máximo número de intentos
  
  // Tiempos adicionales del sistema
  TOOLTIP_DELAY: 500,                  // Tiempo de espera antes de mostrar tooltip
  FINAL_CELEBRATION_DURATION: 4000,    // Duración de la celebración final
  NAVIGATION_DEBOUNCE: 500             // Debounce para eventos de navegación
};

/**
 * Storage keys for hybrid persistence system
 */
export const STORAGE_KEYS = {
  // Claves específicas
  ONBOARDING_COMPLETED: 'stegmaier_first_day_completed',
  USER_EXPERIENCE: 'stegmaier_user_experience',
  COMPLETED_MISSIONS: 'stegmaier_completed_missions',
  
  // Prefijos y patrones (para sistema futuro)
  PREFIX: 'stegmaier_',
  PROGRESS_PATTERN: 'progress_',
  ONBOARDING_PATTERN: 'onboarding_',
  MISSION_PATTERN: 'mission_'
};

/**
 * XP Configuration for leveling system
 */
export const XP_CONFIG = {
  BASE_LEVEL_XP: 50,       // XP necesario para nivel 1 (base para cálculos)
  LEVEL_MULTIPLIER: 2,     // Cada nivel requiere 2x más XP que el anterior
  NEW_USER_THRESHOLD: 170, // Usuarios con menos de este XP son considerados nuevos
  LEVEL_1_XP: 50,          // XP para alcanzar nivel 1
  LEVEL_2_XP: 200          // XP para alcanzar nivel 2
};

export const FIRST_DAY_MISSIONS: FirstDayMission[] = [
  {
    id: 'explore_dashboard',
    title: 'Conoce tu Panel de Control ISO',
    description: 'Explora las diferentes secciones de tu dashboard para entender qué información tienes disponible para gestionar tu capacitación ISO.',
    targetElement: '.dashboard-page-container',
    xpReward: 15,
    type: 'read',
    completionCriteria: 'Permanecer en la sección por al menos 10 segundos',
    businessContext: 'El panel de control te proporciona una visión panorámica de tu progreso en la plataforma. Entender esta información es fundamental para gestionar eficientemente tu tiempo de capacitación y preparar estratégicamente tu certificación ISO.',
    requiredAction: 'Observa el dashboard por un momento para familiarizarte con él',
    minimumTime: 10000, // 10 segundos
    validationRules: {
      threshold: 0.5, // 50% visible
      exactMatch: false
    }
  },
  {
    id: 'certification_path',
    title: 'Explora tu Ruta de Certificación',
    description: 'Navega a la sección de cursos para conocer tu camino hacia la certificación profesional ISO.',
    targetElement: '[data-onboarding="nav-item-platform-courses"]',
    xpReward: 20,
    type: 'navigate',
    completionCriteria: 'Navegar a la página de cursos',
    businessContext: 'Las certificaciones ISO son reconocidas internacionalmente y aumentan significativamente tu valor profesional en el mercado. Conocer tu ruta personalizada te ayudará a planificar tu desarrollo profesional a corto y largo plazo.',
    requiredAction: 'Haz clic en "Mis Cursos" en el menú lateral',
    targetRoute: '/platform/courses',
    validationRules: {
      exactMatch: true,
      timeout: 60000 // 60 segundos para completar la navegación
    }
  },
  {
    id: 'weekly_challenges',
    title: 'Comprende los Desafíos Empresariales',
    description: 'Interactúa con la sección de desafíos semanales para entender cómo aplicar los conocimientos ISO en situaciones reales de negocio.',
    targetElement: '[data-onboarding="weekly-challenges"]',
    xpReward: 25,
    type: 'interact',
    completionCriteria: 'Hacer hover y click en al menos un desafío',
    businessContext: 'Los desafíos semanales simulan situaciones reales que enfrentarás en tu rol profesional. Resolverlos te ayudará a desarrollar pensamiento crítico y aplicar normativas ISO en contextos prácticos de negocio.',
    requiredAction: 'Pasa el cursor sobre un desafío y haz clic para ver sus detalles',
    validationRules: {
      hoverTime: 1000, // 1 segundo de hover
      requireClick: true,
      timeout: 30000 // 30 segundos para completar la interacción
    }
  },
  {
    id: 'profile_setup',
    title: 'Configura tu Perfil Profesional',
    description: 'Completa los datos de tu perfil profesional para personalizar tu experiencia de capacitación y facilitar la conexión con otros profesionales.',
    targetElement: '[data-onboarding="profile-settings"]',
    xpReward: 20,
    type: 'click',
    completionCriteria: 'Abrir el modal de edición de perfil',
    businessContext: 'Un perfil completo mejora la personalización de tu experiencia y te conecta con otros profesionales del sector. Facilita la formación de redes profesionales y aumenta tu visibilidad en la comunidad especializada en sistemas de gestión.',
    requiredAction: 'Haz clic en el icono de configuración de perfil',
    validationRules: {
      preventAutoComplete: true,
      timeout: 30000 // 30 segundos para completar
    }
  },
  {
    id: 'first_competency',
    title: 'Descubre tu Primera Competencia ISO',
    description: 'Abre el primer curso sugerido para familiarizarte con el formato de aprendizaje y los conceptos fundamentales de sistemas ISO.',
    targetElement: '[data-onboarding="suggested-course"]',
    xpReward: 30,
    type: 'click',
    completionCriteria: 'Abrir el detalle del curso recomendado',
    businessContext: 'Las competencias ISO son habilidades específicas altamente valoradas en roles de gestión, calidad y consultoría. Iniciar con la competencia sugerida establecerá una base sólida para tu desarrollo profesional especializado.',
    requiredAction: 'Haz clic en el curso recomendado para ver su contenido',
    validationRules: {
      preventAutoComplete: true,
      timeout: 30000 // 30 segundos para completar
    }
  },
  {
    id: 'weekly_goal',
    title: 'Establece tu Meta de Capacitación',
    description: 'Selecciona un objetivo semanal de tiempo de estudio para mantener un ritmo constante en tu capacitación.',
    targetElement: '[data-onboarding="learning-goals"]',
    xpReward: 25,
    type: 'click',
    completionCriteria: 'Seleccionar un objetivo semanal',
    businessContext: 'Establecer metas medibles mejora significativamente las tasas de finalización de capacitación. Los profesionales que definen objetivos claros tienen un 76% más de probabilidades de completar su certificación en el tiempo previsto.',
    requiredAction: 'Haz clic en el selector de metas de aprendizaje',
    validationRules: {
      preventAutoComplete: true,
      timeout: 30000 // 30 segundos para completar
    }
  },
  {
    id: 'join_community',
    title: 'Únete a la Comunidad Empresarial',
    description: 'Accede a la sección de comunidad para conectar con otros profesionales, consultar dudas y compartir experiencias sobre implementación de sistemas ISO.',
    targetElement: '[data-onboarding="challenges-nav"]',
    xpReward: 35,
    type: 'navigate',
    completionCriteria: 'Navegar a la sección de comunidad',
    businessContext: 'Las conexiones profesionales son fundamentales para el crecimiento laboral. Nuestra comunidad reúne a consultores, auditores y gerentes de calidad, creando oportunidades de mentoría y colaboración en proyectos reales de implementación ISO.',
    requiredAction: 'Haz clic en "Comunidad" en el menú lateral',
    targetRoute: '/platform/community',
    validationRules: {
      exactMatch: true,
      timeout: 60000 // 60 segundos para completar la navegación
    }
  }
];

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
