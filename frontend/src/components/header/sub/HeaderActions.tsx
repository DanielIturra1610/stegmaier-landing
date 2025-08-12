/**
 * Componente de acciones para el header
 * Incluye período selector, refresh, indicador online y menu toggle
 */
import React, { useState, useEffect } from 'react';
import { RefreshCwIcon, WifiIcon, WifiOffIcon, MenuIcon } from 'lucide-react';

interface HeaderActionsProps {
  period?: string;
  onPeriodChange?: (period: string) => void;
  onRefresh?: () => void;
  onMenuClick?: () => void;
  loading?: boolean;
  showPeriodSelector?: boolean;
  showOnlineIndicator?: boolean;
  showMenuButton?: boolean;
  className?: string;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
  period = '30',
  onPeriodChange,
  onRefresh,
  onMenuClick,
  loading = false,
  showPeriodSelector = true,
  showOnlineIndicator = true,
  showMenuButton = false,
  className = ''
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Indicador de conexión */}
      {showOnlineIndicator && (
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <>
              <WifiIcon className="w-4 h-4 text-green-500" aria-hidden="true" />
              <span className="text-sm text-green-600">En línea</span>
            </>
          ) : (
            <>
              <WifiOffIcon className="w-4 h-4 text-red-500" aria-hidden="true" />
              <span className="text-sm text-red-600">Sin conexión</span>
            </>
          )}
        </div>
      )}

      {/* Selector de período */}
      {showPeriodSelector && onPeriodChange && (
        <div className="flex items-center space-x-2">
          <label 
            htmlFor="period-selector"
            className="text-sm font-medium text-gray-700"
          >
            Período:
          </label>
          <select
            id="period-selector"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Seleccionar período de tiempo"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Todo el tiempo</option>
          </select>
        </div>
      )}

      {/* Botones no funcionales removidos para simplificar el header */}

      {/* Botón de menú móvil */}
      {showMenuButton && onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Abrir menú de navegación"
        >
          <MenuIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default HeaderActions;
