import React, { useEffect, useState } from 'react';
import { MissionSpotlightProps } from './types';

/**
 * MissionSpotlight Component
 * 
 * Creates a spotlight effect to highlight a specific element on the page
 * Uses only Tailwind CSS classes for styling
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

    // Get element position and dimensions
    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
    };

    // Initial position
    updatePosition();

    // Update position on resize and scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

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
      {/* Non-intrusive highlight for target element - no fullscreen overlay */}
      <div 
        style={{
          position: 'absolute',
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
          zIndex: 40,
        }}
        className="pointer-events-none"
      >
        {/* Elegant highlight ring around the element */}
        <div 
          className="absolute inset-0 ring-4 ring-accent-500 ring-offset-4 rounded transition-all duration-300 ease-out animate-pulse"
        />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 -m-2 rounded-lg bg-accent-500 opacity-10 blur-sm"></div>
      </div>
    </div>
  );
};

export default MissionSpotlight;
