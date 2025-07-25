import React, { useEffect, useState } from 'react';
import { MissionTooltipProps } from './types';
import { ANALYTICS_EVENTS } from './constants';

/**
 * MissionTooltip Component
 * 
 * Displays information about the current mission with intelligent positioning
 * Uses only Tailwind CSS classes for styling
 */
const MissionTooltip: React.FC<MissionTooltipProps> = ({
  mission,
  onComplete,
  onSkip
}) => {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: 'bottom',
    arrowPosition: ''
  });

  useEffect(() => {
    // Find the target element and calculate position
    const targetElement = document.querySelector(mission.targetElement) as HTMLElement;
    
    if (!targetElement) {
      console.warn(`Target element not found: ${mission.targetElement}`);
      return;
    }
    
    const calculateIntelligentPosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Tooltip dimensions (estimate)
      const tooltipHeight = 220;
      const tooltipWidth = Math.min(300, viewportWidth * 0.8);
      
      // Default offsets for spacing
      const spacing = 16;
      
      let newTop = 0;
      let newLeft = 0;
      let placement = 'bottom';
      let arrowPosition = '';
      
      // Check if there's space below
      if (rect.bottom + tooltipHeight + spacing < viewportHeight) {
        // Place below
        newTop = rect.bottom + window.scrollY + spacing;
        newLeft = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        placement = 'top';
        arrowPosition = 'left-1/2 -translate-x-1/2 -top-2';
      } 
      // Check if there's space above
      else if (rect.top - tooltipHeight - spacing > 0) {
        // Place above
        newTop = rect.top + window.scrollY - tooltipHeight - spacing;
        newLeft = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        placement = 'bottom';
        arrowPosition = 'left-1/2 -translate-x-1/2 -bottom-2';
      }
      // Check if there's space on the right
      else if (rect.right + tooltipWidth + spacing < viewportWidth) {
        // Place to the right
        newTop = rect.top + window.scrollY + (rect.height / 2) - (tooltipHeight / 2);
        newLeft = rect.right + window.scrollX + spacing;
        placement = 'left';
        arrowPosition = 'top-1/2 -translate-y-1/2 -left-2';
      }
      // Default to left side
      else {
        // Place to the left
        newTop = rect.top + window.scrollY + (rect.height / 2) - (tooltipHeight / 2);
        newLeft = rect.left + window.scrollX - tooltipWidth - spacing;
        placement = 'right';
        arrowPosition = 'top-1/2 -translate-y-1/2 -right-2';
      }
      
      // Ensure tooltip stays within viewport bounds
      newLeft = Math.max(spacing, Math.min(newLeft, viewportWidth - tooltipWidth - spacing));
      newTop = Math.max(spacing, Math.min(newTop, viewportHeight + window.scrollY - tooltipHeight - spacing));
      
      return { top: newTop, left: newLeft, placement, arrowPosition };
    };
    
    // Set initial position
    setPosition(calculateIntelligentPosition());
    
    // Recalculate on resize
    const handleResize = () => {
      setPosition(calculateIntelligentPosition());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [mission.targetElement]);

  return (
    <div 
      className="fixed z-50 pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="dialog"
      aria-labelledby="mission-title"
      aria-describedby="mission-description"
    >
      <div className="bg-white shadow-xl border border-gray-200 rounded-lg p-4 max-w-xs transition-all duration-300 ease-out">
        {/* Arrow indicator based on position */}
        <div className={`absolute ${position.arrowPosition} h-4 w-4 bg-white border-t border-l border-gray-200 transform rotate-45`} />
        
        {/* XP Badge & Close */}
        <div className="flex justify-between items-start mb-3">
          <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
            +{mission.xpReward} XP
          </span>
          
          <button 
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full p-0.5"
            aria-label="Omitir misión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Mission Title */}
        <h3 
          id="mission-title"
          className="text-base font-bold text-gray-800 mb-1.5"
        >
          {mission.title}
        </h3>

        {/* Mission Description */}
        <p 
          id="mission-description"
          className="text-sm text-gray-600 mb-3"
        >
          {mission.description}
        </p>

        {/* Action Button */}
        <button
          onClick={onComplete}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 rounded-md text-sm transition-colors duration-200"
        >
          Completar misión
        </button>
      </div>
    </div>
  );
};

export default MissionTooltip;
