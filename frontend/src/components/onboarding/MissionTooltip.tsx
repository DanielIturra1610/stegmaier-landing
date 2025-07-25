import React, { useEffect, useState } from 'react';
import { MissionTooltipProps } from './types';

/**
 * MissionTooltip Component
 * 
 * Displays information about the current mission with dynamic positioning
 * Uses only Tailwind CSS classes for styling
 */
const MissionTooltip: React.FC<MissionTooltipProps> = ({
  mission,
  onComplete,
  onSkip,
  targetElement
}) => {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    arrowPosition: 'top' // Puede ser: top, right, bottom, left
  });

  useEffect(() => {
    if (!targetElement) return;

    const positionTooltip = () => {
      const element = document.querySelector(targetElement);
      if (!element) return;

      const elementRect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const tooltipWidth = 320; // Ancho del tooltip definido en el estilo
      const tooltipHeight = 150; // Altura aproximada del tooltip
      const margin = 20; // Margen para separar el tooltip del elemento

      let newTop, newLeft, newArrowPosition;

      // Determinar la mejor posición basada en el espacio disponible
      const spaceAbove = elementRect.top;
      const spaceBelow = viewportHeight - elementRect.bottom;
      const spaceLeft = elementRect.left;
      const spaceRight = viewportWidth - elementRect.right;

      // Verificar si es la primera misión (panel de control ISO)
      const isFirstMission = targetElement === '[data-onboarding="dashboard-main"]' || 
                            targetElement.includes('dashboard');
      
      // Para la primera misión o si hay suficiente espacio arriba, posicionar arriba
      if (isFirstMission || spaceAbove >= (tooltipHeight / 2)) {
        // Forzar posición arriba para primera misión o cuando haya espacio suficiente
        newTop = Math.max(margin, elementRect.top - tooltipHeight - margin);
        newLeft = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
        newArrowPosition = 'bottom';
      } else if (spaceBelow >= tooltipHeight + margin) {
        // Posicionar debajo si no es posible arriba
        newTop = elementRect.bottom + margin;
        newLeft = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
        newArrowPosition = 'top';
      } else if (spaceRight >= tooltipWidth + margin) {
        // Posicionar a la derecha si no hay espacio vertical
        newTop = elementRect.top + (elementRect.height / 2) - (tooltipHeight / 2);
        newLeft = elementRect.right + margin;
        newArrowPosition = 'left';
      } else {
        // Posicionar a la izquierda como última opción
        newTop = elementRect.top + (elementRect.height / 2) - (tooltipHeight / 2);
        newLeft = elementRect.left - tooltipWidth - margin;
        newArrowPosition = 'right';
      }

      // Asegurar que el tooltip no se salga de la ventana
      newLeft = Math.max(margin, Math.min(newLeft, viewportWidth - tooltipWidth - margin));
      newTop = Math.max(margin, Math.min(newTop, viewportHeight - tooltipHeight - margin));

      setPosition({
        top: newTop,
        left: newLeft,
        arrowPosition: newArrowPosition
      });
    };

    // Posicionar inicialmente y actualizar en scroll/resize
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('resize', positionTooltip);
      window.removeEventListener('scroll', positionTooltip);
    };
  }, [targetElement]);

  // Renderizar flechas según la posición
  const renderArrow = () => {
    switch (position.arrowPosition) {
      case 'top':
        return (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
            <div className="border-8 border-transparent border-b-white"></div>
          </div>
        );
      case 'bottom':
        return (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="border-8 border-transparent border-t-white"></div>
          </div>
        );
      case 'left':
        return (
          <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2">
            <div className="border-8 border-transparent border-r-white"></div>
          </div>
        );
      case 'right':
        return (
          <div className="absolute top-1/2 right-0 translate-x-full -translate-y-1/2">
            <div className="border-8 border-transparent border-l-white"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-xl p-4 pointer-events-auto relative"
      style={{ 
        width: '320px',
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Flecha del tooltip */}
      {renderArrow()}

      {/* Encabezado */}
      <div className="flex items-center mb-3">
        <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full mr-3">
          <span className="text-primary-600 text-lg">
            {mission.type === 'click' ? '👆' :
             mission.type === 'read' ? '📖' :
             mission.type === 'navigate' ? '🧭' :
             mission.type === 'interact' ? '✨' : '🎯'}
          </span>
        </div>
        <h3 className="font-medium text-gray-800">{mission.title}</h3>
      </div>

      {/* Descripción */}
      <p className="text-sm text-gray-600 mb-4">
        {mission.description}
      </p>

      {/* Botones de acción */}
      <div className="flex justify-between gap-2">
        <button
          onClick={onSkip}
          className="flex-1 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium py-1.5 px-3 rounded-md text-sm transition-colors duration-200"
        >
          Omitir
        </button>
        <button
          onClick={onComplete}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 rounded-md text-sm transition-colors duration-200"
        >
          Completar
        </button>
      </div>
    </div>
  );
};

export default MissionTooltip;
