import { ChallengeCategory } from '../components/challenges/types';

type CategoryTranslations = {
  [key in ChallengeCategory]: string;
};

export const CATEGORY_TRANSLATIONS: CategoryTranslations = {
  safety_prevention: 'Prevención de Riesgos',
  iso_standards: 'Normas ISO',
  business_management: 'Gestión Empresarial',
  risk_assessment: 'Evaluación de Riesgos',
  compliance: 'Cumplimiento Normativo',
  environmental: 'Medio Ambiente',
  quality_control: 'Control de Calidad'
};

export const translateCategory = (category: ChallengeCategory): string => {
  return CATEGORY_TRANSLATIONS[category] || category;
};
