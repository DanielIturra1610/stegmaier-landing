/**
 * React Query hooks para analytics
 * Cache compartido y gestión de estado optimizada
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import analyticsService from '../../services/analyticsService';
import { queryKeys } from '../../lib/queryClient';

export interface UserAnalyticsData {
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

/**
 * Hook para obtener estadísticas del usuario actual
 */
export function useUserAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.userStats(),
    queryFn: async () => {
      const response = await analyticsService.getUserAnalytics();
      return response.data as UserAnalyticsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para obtener estadísticas con período específico
 * Nota: El backend actual no soporta period_days, pero preparamos para futuro
 */
export function useUserAnalyticsByPeriod(period: string = '30') {
  return useQuery({
    queryKey: queryKeys.analytics.userStatsByPeriod(period),
    queryFn: async () => {
      // Por ahora usamos el endpoint actual
      const response = await analyticsService.getUserAnalytics();
      const data = response.data as UserAnalyticsData;
      
      // TODO: Implementar filtrado client-side o cuando backend soporte period_days
      return {
        ...data,
        period: period,
        filtered: false // Indicador de que no está filtrado por período aún
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos para períodos específicos
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para track de actividades con invalidación de cache
 */
export function useTrackActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activityData: {
      activity_type: string;
      course_id?: string;
      lesson_id?: string;
      video_id?: string;
      metadata?: Record<string, any>;
    }) => {
      return analyticsService.trackActivity(activityData);
    },
    onSuccess: () => {
      // Invalidar cache de analytics para refrescar datos
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.all
      });
    },
  });
}
