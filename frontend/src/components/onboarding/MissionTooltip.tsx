import React, { useEffect, useState } from 'react';
import { MissionTooltipProps } from './types';
import { calculateTooltipPosition } from './utils';

/**
 * MissionTooltip Component
 * 
 * Displays information about the current mission
 * Uses only Tailwind CSS classes for styling
 */
const MissionTooltip: React.FC<MissionTooltipProps> = ({
  mission,
  onComplete,
  onSkip
}) => {
  const [position, setPosition] = useState({
    positionClasses: 'top-1/4 left-1/2',
    transformClasses: 'transform -translate-x-1/2'
  });

  useEffect(() => {
    // Find the target element and calculate position
    const targetElement = document.querySelector(mission.targetElement);
    const { positionClasses, transformClasses } = calculateTooltipPosition(targetElement as HTMLElement);
    
    setPosition({ positionClasses, transformClasses });

    // Recalculate on resize
    const handleResize = () => {
      const { positionClasses, transformClasses } = calculateTooltipPosition(targetElement as HTMLElement);
      setPosition({ positionClasses, transformClasses });
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mission.targetElement]);

  return (
    <div 
      className={`absolute z-50 ${position.positionClasses} ${position.transformClasses}`}
      role="dialog"
      aria-labelledby="mission-title"
      aria-describedby="mission-description"
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-sm sm:max-w-xs md:max-w-sm">
        {/* XP Badge */}
        <div className="flex justify-between items-start mb-4">
          <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
            +{mission.xpReward} XP
          </span>
          
          <button 
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500"
            aria-label="Omitir misión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Mission Title */}
        <h3 
          id="mission-title"
          className="text-xl font-bold text-gray-800 mb-2"
        >
          {mission.title}
        </h3>

        {/* Mission Description */}
        <p 
          id="mission-description"
          className="text-gray-600 mb-4"
        >
          {mission.description}
        </p>

        {/* Business Context */}
        <div className="bg-primary-50 p-3 rounded-lg mb-4">
          <h4 className="text-sm font-medium text-primary-700 mb-1">
            Contexto empresarial:
          </h4>
          <p className="text-sm text-primary-800">
            {mission.businessContext}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {mission.completionCriteria}
          </span>

          <button
            onClick={onComplete}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500"
          >
            Completar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionTooltip;
