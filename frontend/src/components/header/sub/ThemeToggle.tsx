/**
 * Componente para cambiar tema (light/dark/system)
 * Implementa principios de desarrollo responsivo, mantenible y escalable
 */
import React, { useState } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { headerAnimations } from '../animations';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean; // Versión compacta para header
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const { theme, actualTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = [
    { 
      key: 'light' as const, 
      label: 'Claro', 
      icon: Sun,
      description: 'Tema claro'
    },
    { 
      key: 'dark' as const, 
      label: 'Oscuro', 
      icon: Moon,
      description: 'Tema oscuro'
    },
    { 
      key: 'system' as const, 
      label: 'Sistema', 
      icon: Monitor,
      description: 'Seguir preferencias del sistema'
    }
  ];

  const getCurrentTheme = () => {
    return themeOptions.find(option => option.key === theme) || themeOptions[0];
  };

  const currentTheme = getCurrentTheme();
  const CurrentIcon = currentTheme.icon;

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center space-x-1 px-2 py-1.5 rounded-lg
            ${headerAnimations.actions.button}
            text-sm font-medium
            bg-gray-100 dark:bg-gray-800
            text-gray-700 dark:text-gray-300
            hover:bg-gray-200 dark:hover:bg-gray-700
          `}
          aria-label={`Tema actual: ${currentTheme.label}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <CurrentIcon className="w-4 h-4" aria-hidden="true" />
          <ChevronDown 
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            
            {/* Dropdown */}
            <div className={`
              absolute right-0 top-full mt-1 z-20
              ${headerAnimations.actions.dropdown}
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              rounded-lg shadow-lg
              min-w-[160px]
            `}>
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.key;
                
                return (
                  <button
                    key={option.key}
                    onClick={() => {
                      setTheme(option.key);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-2 px-3 py-2 text-left
                      ${headerAnimations.actions.button}
                      ${isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                      first:rounded-t-lg last:rounded-b-lg
                    `}
                    aria-pressed={isSelected}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm font-medium">{option.label}</span>
                    {isSelected && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Versión completa para settings
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Tema de la interfaz
      </label>
      
      <div className="grid grid-cols-1 gap-2">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.key;
          
          return (
            <button
              key={option.key}
              onClick={() => setTheme(option.key)}
              className={`
                flex items-center space-x-3 p-3 rounded-lg border-2
                ${headerAnimations.actions.button}
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              aria-pressed={isSelected}
            >
              <Icon 
                className={`w-5 h-5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                aria-hidden="true"
              />
              <div className="text-left">
                <div className={`font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  {option.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
              {isSelected && (
                <div className="ml-auto w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Tema actual: <span className="font-medium">{actualTheme === 'light' ? 'Claro' : 'Oscuro'}</span>
      </div>
    </div>
  );
};

export default ThemeToggle;
