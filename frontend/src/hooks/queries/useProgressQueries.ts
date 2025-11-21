/**
 * React Query hooks para progress
 * Cache compartido y gestión de estado optimizada
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import progressService from '../../services/progressService';
import { queryKeys } from '../../lib/queryClient';

export interface ProgressSummaryData {
  total_videos: number;
  completed_videos: number;
  completion_percentage: number;
  total_watch_time: number;
  recent_activity: Array<{
    lesson_id: string;
    video_id: string;
    current_position: number;
    duration: number;
    watch_percentage: number;
    is_completed: boolean;
    last_watched: string | null;
  }>;
}

/**
 * Hook para obtener resumen de progreso del usuario
 */
export function useProgressSummary(courseId?: string) {
  return useQuery({
    queryKey: courseId
      ? queryKeys.progress.summaryByCourse(courseId)
      : queryKeys.progress.summary(),
    queryFn: async () => {
      const data = await progressService.getMyProgressSummary();
      return data as ProgressSummaryData;
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para actualizar progreso con invalidación optimista
 */
export function useUpdateVideoProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      lessonId: string;
      videoId: string;
      progressData: {
        current_position: number;
        duration: number;
        session_time?: number;
      };
    }) => {
      const { lessonId, videoId, progressData } = params;
      return progressService.updateVideoProgress(lessonId, videoId, progressData);
    },
    onSuccess: () => {
      // Invalidar cache de progreso para refrescar
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.all
      });
      // También invalidar analytics ya que el progreso afecta las stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.all
      });
    },
  });
}
