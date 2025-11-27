/**
 * Componente de acciones para el header
 * Incluye período selector, refresh, indicador online y menu toggle
 */
import React, { useState, useEffect } from 'react';
import { WifiIcon, WifiOffIcon, MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Indicador de conexión */}
      {showOnlineIndicator && (
        <Badge
          variant={isOnline ? 'secondary' : 'destructive'}
          className="gap-1.5"
        >
          {isOnline ? (
            <>
              <WifiIcon className="w-3 h-3" aria-hidden="true" />
              <span className="text-xs">En línea</span>
            </>
          ) : (
            <>
              <WifiOffIcon className="w-3 h-3" aria-hidden="true" />
              <span className="text-xs">Sin conexión</span>
            </>
          )}
        </Badge>
      )}

      {/* Selector de período */}
      {showPeriodSelector && onPeriodChange && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="period-selector"
            className="text-sm font-medium text-muted-foreground"
          >
            Período:
          </label>
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger id="period-selector" className="w-[160px]" aria-label="Seleccionar período de tiempo">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="365">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Botón de menú móvil */}
      {showMenuButton && onMenuClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="Abrir menú de navegación"
        >
          <MenuIcon className="w-5 h-5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
};

export default HeaderActions;
