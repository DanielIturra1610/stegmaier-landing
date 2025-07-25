import React, { useEffect, useState } from 'react';
import { MissionSpotlightProps } from './types';

/**
 * MissionSpotlight Component
 * 
 * Creates a spotlight effect to highlight a specific element on the page
 * Uses only Tailwind CSS classes for styling with fixed positioning
 */
const MissionSpotlight: React.FC<MissionSpotlightProps> = ({ 
  targetElement,
  currentMission
}) => {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0
  });

  useEffect(() => {
    if (!targetElement || !currentMission) {
      return;
    }

    // Find the target element in the DOM
    const element = document.querySelector(targetElement);
    
    if (!element) {
      console.warn(`Target element not found: ${targetElement}`);
      return;
    }

    // Get element position and dimensions - Actualizado para responder al scroll
    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      
      setPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    };

    // Initial position
    updatePosition();

    // Update position on resize AND scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetElement, currentMission]);

  if (!targetElement || !currentMission) {
    return null;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none">
      {/* Non-intrusive highlight with fixed position */}
      <div 
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
          zIndex: 40, // Ajustado para estar por encima del contenido pero por debajo de tooltips
        }}
        className="pointer-events-none"
      >
        {/* Elegant highlight ring around the element */}
        <div 
          className="absolute inset-0 ring-2 ring-accent-500 ring-offset-2 rounded transition-all duration-300 ease-out animate-pulse"
        />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 -m-1 rounded-lg bg-accent-500 opacity-5 blur-sm"></div>
      </div>
    </div>
  );
};

export default MissionSpotlight;
