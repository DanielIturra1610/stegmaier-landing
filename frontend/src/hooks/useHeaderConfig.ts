/**
 * Hook para configuración y datos del header contextual
 * Implementa principios de desarrollo responsivo, mantenible y escalable
 * Actualizado con React Query para cache compartido
 */
import { useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getHeaderConfigForRoute } from '../components/header/config';
import { HeaderConfig, HeaderData, HeaderContextValue } from '../components/header/types';
import { useUserAnalyticsByPeriod } from './queries/useAnalyticsQueries';
import { useProgressSummary } from './queries/useProgressQueries';

interface UserAnalyticsResponse {
  learning_stats: {
    courses_completed: number;
    courses_enrolled: number;
    completion_rate: number;
    total_watch_time_seconds: number;
  };
  engagement_stats: {
    login_streak: number;
    activity_score: number;
    lessons_completed: number;
  };
  recent_activity: Array<{
    date: string;
    activity: string;
    course_title: string;
    details: string;
  }>;
}

export function useHeaderConfig(): HeaderContextValue {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Estados locales
  const [period, setPeriod] = useState('30');

  // Configuración basada en ruta
  const config = useMemo(() => {
    return getHeaderConfigForRoute(location.pathname);
  }, [location.pathname]);

  // React Query hooks para datos
  const { 
    data: analyticsData, 
    isLoading: analyticsLoading, 
    error: analyticsError,
    refetch: refetchAnalytics 
  } = useUserAnalyticsByPeriod(period);
  
  const { 
    data: progressData, 
    isLoading: progressLoading, 
    error: progressError,
    refetch: refetchProgress 
  } = useProgressSummary();

  // Formatear tiempo de watch
  const formatWatchTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  // Procesar datos para el header
  const headerData = useMemo((): HeaderData => {
    if (!config || config.variant !== 'analytics' || !isAuthenticated) {
      return {};
    }

    let completionRate = 0;
    let totalWatchTimeFormatted = '0m';
    let streakDays = 0;

    // Datos de analytics
    if (analyticsData) {
      completionRate = analyticsData.learning_stats?.completion_rate || 0;
      const watchTimeSeconds = analyticsData.learning_stats?.total_watch_time_seconds || 0;
      totalWatchTimeFormatted = formatWatchTime(watchTimeSeconds);
      streakDays = analyticsData.engagement_stats?.login_streak || 0;
    }

    // Fallback con datos de progreso
    if (progressData && completionRate === 0) {
      completionRate = progressData.completion_percentage || 0;
    }

    return {
      completionRate,
      totalWatchTimeFormatted,
      streakDays,
      loading: false,
      error: null
    };
  }, [config, isAuthenticated, analyticsData, progressData, formatWatchTime]);

  // Estados combinados
  const loading = analyticsLoading || progressLoading;
  const error = analyticsError || progressError;

  // Función de refresh que invalida cache
  const refresh = useCallback(async () => {
    await Promise.all([
      refetchAnalytics(),
      refetchProgress()
    ]);
  }, [refetchAnalytics, refetchProgress]);

  // Memoización del valor de retorno
  const contextValue = useMemo((): HeaderContextValue => ({
    config,
    data: headerData,
    period,
    setPeriod,
    refresh,
    loading,
    error: error?.message || null
  }), [config, headerData, period, setPeriod, refresh, loading, error]);

  return contextValue;
}
