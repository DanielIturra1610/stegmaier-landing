/**
 * Hook personalizado para gestión de progreso
 */
import { useState, useEffect, useCallback } from 'react';
import progressService from '../services/progressService';
import { 
  LessonProgressResponse, 
  CourseProgressResponse, 
  UserProgressSummaryResponse,
  ProgressStatus 
} from '../types/progress';

// Hook para progreso de lección individual
export const useLessonProgress = (lessonId: string | null) => {
  const [progress, setProgress] = useState<LessonProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!lessonId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await progressService.getLessonProgress(lessonId);
      setProgress(data);
    } catch (err) {
      setError('Error cargando progreso de lección');
      console.error('Error loading lesson progress:', err);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const startLesson = useCallback(async (courseId: string, enrollmentId: string) => {
    if (!lessonId) return;
    
    try {
      setError(null);
      const result = await progressService.startLesson(lessonId, courseId, enrollmentId);
      await loadProgress(); // Recargar progreso
      return result;
    } catch (err) {
      setError('Error iniciando lección');
      console.error('Error starting lesson:', err);
      throw err;
    }
  }, [lessonId, loadProgress]);

  const completeLesson = useCallback(async (courseId: string, enrollmentId: string) => {
    if (!lessonId) return;
    
    try {
      setError(null);
      const result = await progressService.completeLesson(lessonId, courseId, enrollmentId);
      await loadProgress(); // Recargar progreso
      return result;
    } catch (err) {
      setError('Error completando lección');
      console.error('Error completing lesson:', err);
      throw err;
    }
  }, [lessonId, loadProgress]);

  const updateProgress = useCallback(async (
    courseId: string, 
    enrollmentId: string, 
    progressData: {
      progress_percentage?: number;
      time_spent_delta: number;
      video_position?: number;
      quiz_score?: number;
    }
  ) => {
    if (!lessonId) return;
    
    try {
      setError(null);
      const result = await progressService.updateLessonProgress(
        lessonId, 
        courseId, 
        enrollmentId, 
        progressData
      );
      await loadProgress(); // Recargar progreso
      return result;
    } catch (err) {
      setError('Error actualizando progreso');
      console.error('Error updating lesson progress:', err);
      
      // Guardar para sync offline
      progressService.savePendingProgress(lessonId, progressData);
      throw err;
    }
  }, [lessonId, loadProgress]);

  useEffect(() => {
    if (lessonId) {
      loadProgress();
    }
  }, [lessonId, loadProgress]);

  return {
    progress,
    loading,
    error,
    startLesson,
    completeLesson,
    updateProgress,
    reload: loadProgress
  };
};

// Hook para progreso de curso completo
export const useCourseProgress = (courseId: string | null) => {
  const [progress, setProgress] = useState<CourseProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await progressService.getCourseProgress(courseId);
      setProgress(data);
    } catch (err) {
      setError('Error cargando progreso del curso');
      console.error('Error loading course progress:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      loadProgress();
    }
  }, [courseId, loadProgress]);

  const getNextLesson = useCallback(() => {
    return progress?.next_lesson || null;
  }, [progress]);

  const getCourseStats = useCallback(() => {
    if (!progress?.course_progress) return null;
    
    const cp = progress.course_progress;
    return {
      completion_percentage: progress.completion_percentage,
      lessons_completed: cp.lessons_completed,
      total_lessons: cp.total_lessons,
      total_time_spent: cp.total_time_spent,
      certificate_available: progress.certificate_available,
      status: cp.status
    };
  }, [progress]);

  return {
    progress,
    loading,
    error,
    nextLesson: getNextLesson(),
    stats: getCourseStats(),
    reload: loadProgress
  };
};

// Hook para resumen general del usuario
export const useUserProgressSummary = () => {
  const [summary, setSummary] = useState<UserProgressSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await progressService.getUserProgressSummary();
      setSummary(data);
    } catch (err) {
      setError('Error cargando resumen de progreso');
      console.error('Error loading user progress summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const getCompletionRate = useCallback(() => {
    return summary?.summary.completion_rate || 0;
  }, [summary]);

  const getActiveCourses = useCallback(() => {
    return summary?.recent_courses.filter(
      course => course.status === ProgressStatus.IN_PROGRESS
    ) || [];
  }, [summary]);

  const getTotalStats = useCallback(() => {
    if (!summary) return null;
    
    return {
      total_courses: summary.summary.total_courses_enrolled,
      completed_courses: summary.summary.courses_completed,
      in_progress_courses: summary.summary.courses_in_progress,
      total_time: summary.summary.total_time_spent,
      certificates: summary.summary.certificates_earned,
      completion_rate: summary.summary.completion_rate
    };
  }, [summary]);

  return {
    summary,
    loading,
    error,
    completionRate: getCompletionRate(),
    activeCourses: getActiveCourses(),
    totalStats: getTotalStats(),
    reload: loadSummary
  };
};

// Hook para sincronización offline
export const useOfflineSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const syncPendingProgress = useCallback(async () => {
    try {
      setSyncing(true);
      const result = await progressService.syncPendingProgress();
      setLastSync(new Date());
      return result;
    } catch (error) {
      console.error('Error syncing offline progress:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, []);

  const hasPendingUpdates = useCallback(() => {
    const pendingData = localStorage.getItem('pending_progress');
    return !!pendingData && JSON.parse(pendingData);
  }, []);

  // Auto-sync cuando se recupera conexión
  useEffect(() => {
    const handleOnline = async () => {
      if (hasPendingUpdates()) {
        try {
          await syncPendingProgress();
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncPendingProgress, hasPendingUpdates]);

  return {
    syncing,
    lastSync,
    syncPendingProgress,
    hasPendingUpdates: hasPendingUpdates()
  };
};

// Hook combinado para dashboard de curso
export const useCourseProgressDashboard = (courseId: string) => {
  const courseProgress = useCourseProgress(courseId);
  const offlineSync = useOfflineSync();

  const refreshAll = useCallback(async () => {
    await Promise.all([
      courseProgress.reload(),
      offlineSync.hasPendingUpdates ? offlineSync.syncPendingProgress() : Promise.resolve()
    ]);
  }, [courseProgress, offlineSync]);

  return {
    ...courseProgress,
    ...offlineSync,
    refreshAll
  };
};
