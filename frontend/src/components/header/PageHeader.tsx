/**
 * Componente principal del header contextual
 * Implementa principios de desarrollo responsivo, mantenible y escalable
 * Accesible (WCAG AA) con navegación semántica
 */
import React from 'react';
import { Award, Activity, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useHeaderConfig } from '../../hooks/useHeaderConfig';
import HeaderBreadcrumbs from './sub/HeaderBreadcrumbs';
import HeaderTitle from './sub/HeaderTitle';
import HeaderStats from './sub/HeaderStats';
import HeaderActions from './sub/HeaderActions';
import HeaderTabs from './sub/HeaderTabs';
import HeaderNotifications from './sub/HeaderNotifications';
import ThemeToggle from './sub/ThemeToggle';
import TenantSelector from '../tenant/TenantSelector';
import CommandPaletteTrigger from '../command/CommandPaletteTrigger';
import { HeaderStat } from './types';
import { headerAnimations, themeAnimations } from './animations';

interface PageHeaderProps {
  onMenuClick?: () => void;
  onCommandPaletteOpen?: () => void;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  onMenuClick,
  onCommandPaletteOpen,
  className = ''
}) => {
  const { config, data, period, setPeriod, refresh, loading, error } = useHeaderConfig();

  // Si no hay configuración para esta ruta, no renderizar nada
  if (!config) {
    return null;
  }

  // Preparar stats para variant analytics
  const prepareAnalyticsStats = (): HeaderStat[] => {
    if (config.variant !== 'analytics') return [];

    return [
      {
        label: 'Tasa de Finalización',
        value: data.completionRate ? `${data.completionRate.toFixed(0)}%` : '0%',
        icon: <Award className="w-4 h-4" />,
        color: 'green',
        hint: 'Porcentaje de cursos completados'
      },
      {
        label: 'Tiempo de Estudio',
        value: data.totalWatchTimeFormatted || '0m',
        icon: <Clock className="w-4 h-4" />,
        color: 'blue',
        hint: 'Tiempo total de visualización'
      },
      {
        label: 'Racha de Días',
        value: data.streakDays || 0,
        icon: <Activity className="w-4 h-4" />,
        color: 'yellow',
        hint: 'Días consecutivos de estudio'
      }
    ];
  };

  const stats = config.variant === 'analytics' ? prepareAnalyticsStats() : (config.stats || []);

  // Aplicar tema y animaciones
  const themeClasses = themeAnimations[config.theme || 'light'];
  
  return (
    <header 
      role="banner" 
      aria-label="Encabezado de página" 
      className={`
        sticky top-0 z-40 
        ${themeClasses.backdrop} 
        border-b border-gray-200 
        ${themeClasses.shadow}
        ${headerAnimations.header.transition}
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sección principal del header */}
        <div className="flex flex-col space-y-4 py-4">
          
          {/* Fila superior: Breadcrumbs y acciones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {config.breadcrumbs && (
                <HeaderBreadcrumbs
                  breadcrumbs={config.breadcrumbs}
                  className="hidden sm:flex"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Command Palette Trigger */}
              {onCommandPaletteOpen && (
                <CommandPaletteTrigger onClick={onCommandPaletteOpen} />
              )}

              {/* Selector de Tenant (solo para superadmin con múltiples tenants) */}
              <TenantSelector showLabel={false} />

              {/* Notificaciones */}
              {config.showNotifications && (
                <HeaderNotifications />
              )}

              {/* Toggle de tema */}
              <ThemeToggle compact />

              {/* Acciones principales */}
              <HeaderActions
                period={period}
                onPeriodChange={config.variant === 'analytics' ? setPeriod : undefined}
                onRefresh={config.variant === 'analytics' ? refresh : undefined}
                onMenuClick={onMenuClick}
                loading={loading}
                showPeriodSelector={config.variant === 'analytics'}
                showOnlineIndicator={config.variant === 'analytics'}
                showMenuButton={true}
              />
            </div>
          </div>

          {/* Fila intermedia: Título y stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <HeaderTitle
              title={config.title || 'Página'}
              data={data}
              subtitle={config.variant === 'analytics' ? 'Tu progreso de aprendizaje y actividad en la plataforma' : undefined}
            />
            
            {stats.length > 0 && (
              <HeaderStats
                stats={stats}
                loading={loading}
                className="hidden lg:flex"
              />
            )}
          </div>

          {/* Stats móviles */}
          {stats.length > 0 && (
            <div className="lg:hidden">
              <HeaderStats
                stats={stats}
                loading={loading}
              />
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error cargando datos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Tabs (si existen)
        {config.tabs && config.tabs.length > 0 && (
          <HeaderTabs tabs={config.tabs} />
        )}*/}
      </div>
    </header>
  );
};

export default PageHeader;
