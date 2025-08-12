/**
 * Componente de breadcrumbs accesible para el header
 * Implementa WCAG AA y navegación semántica
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { Crumb } from '../types';

interface HeaderBreadcrumbsProps {
  breadcrumbs: Crumb[];
  className?: string;
}

export const HeaderBreadcrumbs: React.FC<HeaderBreadcrumbsProps> = ({ 
  breadcrumbs, 
  className = '' 
}) => {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={`flex ${className}`}>
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={`breadcrumb-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon 
                  className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" 
                  aria-hidden="true"
                />
              )}
              
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm px-1"
                  aria-label={`Navegar a ${crumb.label}`}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span 
                  className={`text-sm font-medium ${
                    isLast 
                      ? 'text-gray-900' 
                      : 'text-gray-500'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default HeaderBreadcrumbs;
