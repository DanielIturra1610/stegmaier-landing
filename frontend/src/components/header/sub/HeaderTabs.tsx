/**
 * Componente de tabs accesible para el header
 * Implementa ARIA roles y navegación por teclado
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { HeaderTab } from '../types';

interface HeaderTabsProps {
  tabs: HeaderTab[];
  className?: string;
}

export const HeaderTabs: React.FC<HeaderTabsProps> = ({ 
  tabs, 
  className = '' 
}) => {
  const location = useLocation();

  if (!tabs || tabs.length === 0) {
    return null;
  }

  const handleTabClick = (tab: HeaderTab, event: React.MouseEvent) => {
    // Por ahora solo manejar anchors/hashes
    if (tab.to.startsWith('#')) {
      event.preventDefault();
      const element = document.getElementById(tab.to.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      // Actualizar URL hash
      window.history.replaceState(null, '', `${location.pathname}${tab.to}`);
    }
  };

  const getActiveTab = () => {
    const hash = location.hash;
    if (hash) {
      return tabs.find(tab => tab.to === hash);
    }
    return tabs[0]; // Primer tab activo por defecto
  };

  const activeTab = getActiveTab();

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8" role="tablist" aria-label="Navegación de pestañas">
        {tabs.map((tab, index) => {
          const isActive = activeTab?.to === tab.to;
          
          return (
            <button
              key={`tab-${index}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={tab.ariaControls}
              aria-current={isActive ? 'page' : undefined}
              onClick={(e) => handleTabClick(tab, e)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:rounded-sm
                ${isActive 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default HeaderTabs;
