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
    <div 
      className="fixed inset-0 z-40 pointer-events-none"
      aria-hidden="true"
    >
      {/* Spotlight overlay that darkens everything except the target */}
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm">
        {/* Cut out for the spotlight effect */}
        <div 
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            height: `${position.height}px`,
            boxShadow: '0 0 0 9999px rgba(17, 24, 39, 0.5)'
          }}
          className="ring-4 ring-accent-500 ring-offset-4 shadow-2xl shadow-accent-500/50 animate-pulse rounded"
        />
      </div>
    </div>
  );
};

export default MissionSpotlight;
