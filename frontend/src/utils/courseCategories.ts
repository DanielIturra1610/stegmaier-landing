/**
 * Definiciones y traducciones de categorías de cursos
 * Enfocadas en prevención de riesgos y normas ISO
 */

export interface CategoryOption {
  value: string;
  label: string;
  description: string;
  group: string;
}

export const COURSE_CATEGORIES: CategoryOption[] = [
  // Prevención de Riesgos
  {
    value: 'occupational_safety',
    label: 'Seguridad Ocupacional',
    description: 'Prevención de accidentes y riesgos en el lugar de trabajo',
    group: 'Prevención de Riesgos'
  },
  {
    value: 'industrial_hygiene',
    label: 'Higiene Industrial',
    description: 'Control de factores ambientales que afectan la salud',
    group: 'Prevención de Riesgos'
  },
  {
    value: 'emergency_management',
    label: 'Gestión de Emergencias',
    description: 'Planes de respuesta y manejo de situaciones críticas',
    group: 'Prevención de Riesgos'
  },
  {
    value: 'risk_assessment',
    label: 'Evaluación de Riesgos',
    description: 'Identificación y análisis de riesgos laborales',
    group: 'Prevención de Riesgos'
  },
  {
    value: 'work_safety',
    label: 'Seguridad en el Trabajo',
    description: 'Prácticas seguras y protocolos de trabajo',
    group: 'Prevención de Riesgos'
  },

  // Normas ISO
  {
    value: 'iso_9001',
    label: 'ISO 9001 - Gestión de Calidad',
    description: 'Sistemas de gestión de calidad y mejora continua',
    group: 'Normas ISO'
  },
  {
    value: 'iso_14001',
    label: 'ISO 14001 - Gestión Ambiental',
    description: 'Sistemas de gestión ambiental y sostenibilidad',
    group: 'Normas ISO'
  },
  {
    value: 'iso_45001',
    label: 'ISO 45001 - Seguridad y Salud Ocupacional',
    description: 'Sistemas de gestión de seguridad y salud en el trabajo',
    group: 'Normas ISO'
  },
  {
    value: 'iso_27001',
    label: 'ISO 27001 - Seguridad de la Información',
    description: 'Sistemas de gestión de seguridad de la información',
    group: 'Normas ISO'
  },
  {
    value: 'iso_50001',
    label: 'ISO 50001 - Gestión de Energía',
    description: 'Sistemas de gestión energética y eficiencia',
    group: 'Normas ISO'
  },

  // Categorías Generales
  {
    value: 'regulatory_compliance',
    label: 'Cumplimiento Normativo',
    description: 'Regulaciones y normativas legales aplicables',
    group: 'Categorías Generales'
  },
  {
    value: 'safety_training',
    label: 'Capacitación en Seguridad',
    description: 'Entrenamiento y formación en seguridad laboral',
    group: 'Categorías Generales'
  },
  {
    value: 'other',
    label: 'Otros',
    description: 'Otros temas relacionados',
    group: 'Categorías Generales'
  }
];

/**
 * Obtiene las opciones de categorías agrupadas para select
 */
export const getCategoriesGrouped = () => {
  const groups = COURSE_CATEGORIES.reduce((acc, category) => {
    if (!acc[category.group]) {
      acc[category.group] = [];
    }
    acc[category.group].push(category);
    return acc;
  }, {} as Record<string, CategoryOption[]>);

  return groups;
};

/**
 * Obtiene el label de una categoría por su value
 */
export const getCategoryLabel = (value: string): string => {
  const category = COURSE_CATEGORIES.find(cat => cat.value === value);
  return category?.label || value;
};

/**
 * Obtiene todas las categorías como opciones simples para select
 */
export const getCategoryOptions = () => {
  return COURSE_CATEGORIES.map(cat => ({
    value: cat.value,
    label: cat.label
  }));
};
