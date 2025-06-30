// src/components/ui/SectionConnector.tsx
import { FC } from 'react';

interface SectionConnectorProps {
  fromSection: 'hero' | 'services' | 'process' | 'testimonials' | 'company' | 'history' | 'values' | 'team' | 'certifications';
  toSection: 'services' | 'process' | 'testimonials' | 'contact' | 'history' | 'values' | 'team' | 'certifications' | 'footer';
  type?: 'wave' | 'curve' | 'dots' | 'diagonal' | 'gradient' | 'minimal';
  height?: number;
}

const SectionConnector: FC<SectionConnectorProps> = ({ 
  fromSection, 
  toSection, 
  height = 40 
}) => {
  
  // Función para obtener colores ultra-sutiles
  const getTransitionColors = () => {
    const transitions = {
      'hero-services': {
        from: 'rgba(var(--color-primary-800), 0.3)',
        to: 'rgba(var(--color-primary-750), 0.2)'
      },
      'services-process': {
        from: 'rgba(var(--color-primary-700), 0.2)',
        to: 'rgba(var(--color-primary-650), 0.1)'
      },
      'process-testimonials': {
        from: 'rgba(var(--color-primary-700), 0.1)',
        to: 'rgba(var(--color-primary-750), 0.2)'
      },
      'testimonials-contact': {
        from: 'rgba(var(--color-primary-700), 0.2)',
        to: 'rgba(var(--color-primary-800), 0.3)'
      },
      // Nuevas transiciones para secciones de empresa
      'company-history': {
        from: 'rgba(var(--color-primary-800), 0.3)',
        to: 'rgba(var(--color-primary-750), 0.2)'
      },
      'history-values': {
        from: 'rgba(var(--color-primary-750), 0.2)',
        to: 'rgba(var(--color-primary-700), 0.1)'
      },
      'values-team': {
        from: 'rgba(var(--color-primary-700), 0.1)',
        to: 'rgba(var(--color-primary-750), 0.2)'
      },
      'team-certifications': {
        from: 'rgba(var(--color-primary-750), 0.2)',
        to: 'rgba(var(--color-primary-800), 0.3)'
      },
      'certifications-footer': {
        from: 'rgba(var(--color-primary-800), 0.3)',
        to: 'rgba(var(--color-primary-900), 0.2)'
      }
    };
    
    const key = `${fromSection}-${toSection}` as keyof typeof transitions;
    return transitions[key] || transitions['hero-services'];
  };

  // Renderizado ultra-sutil - solo gradiente muy suave
  const renderSubtleTransition = () => {
    const colors = getTransitionColors();
    
    return (
      <div className="absolute inset-0">
        {/* Gradiente ultra-sutil */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${colors.from} 0%, transparent 50%, ${colors.to} 100%)`,
            opacity: 0.4
          }}
        />
        
        {/* Difuminado adicional para suavizar aún más */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 0%, rgba(var(--color-primary-750), 0.05) 50%, transparent 100%)`,
            filter: 'blur(2px)'
          }}
        />
      </div>
    );
  };

  return (
    <div 
      className="relative overflow-hidden pointer-events-none"
      style={{ 
        position: 'absolute', 
        bottom: '0px',
        left: '0',
        width: '100%',
        height: `${height}px`,
        zIndex: 1 // Reducido para ser menos prominente
      }}
    >
      {renderSubtleTransition()}
    </div>
  );
};

export default SectionConnector;