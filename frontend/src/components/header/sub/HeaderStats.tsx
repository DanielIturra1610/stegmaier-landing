/**
 * Componente de estadísticas para el header analytics
 * Muestra KPIs con iconos y colores
 */
import React from 'react';
import { HeaderStat } from '../types';

interface HeaderStatsProps {
  stats: HeaderStat[];
  loading?: boolean;
  className?: string;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({ 
  stats, 
  loading = false,
  className = '' 
}) => {
  if (!stats || stats.length === 0) {
    return null;
  }

  const getStatColor = (color?: string) => {
    switch (color) {
      case 'green': return 'text-green-600';
      case 'blue': return 'text-blue-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-900';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-6 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-6 ${className}`}>
      {stats.map((stat, index) => (
        <div 
          key={`stat-${index}`}
          className="text-center group"
          title={stat.hint}
        >
          <div className="flex items-center justify-center space-x-1 mb-1">
            {stat.icon && (
              <span className={`${getStatColor(stat.color)}`}>
                {stat.icon}
              </span>
            )}
            <span className={`text-lg font-semibold ${getStatColor(stat.color)}`}>
              {stat.value}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default HeaderStats;
