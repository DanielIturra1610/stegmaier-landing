import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsEvent {
  activity_type: string;
  metadata?: Record<string, any>;
  course_id?: string;
  lesson_id?: string;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackActivity = useCallback(async (event: AnalyticsEvent) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await fetch('/api/v1/analytics/activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Error tracking analytics:', error);
      // No lanzamos el error para no interrumpir la experiencia del usuario
    }
  }, [user]);

  // Eventos específicos para diferentes acciones
  const trackPageView = useCallback(async (page: string, additionalData?: Record<string, any>) => {
    await trackActivity({
      activity_type: 'page_view',
      metadata: {
        page,
        timestamp: new Date().toISOString(),
        ...additionalData
      }
    });
  }, [trackActivity]);

  const trackLessonStart = useCallback(async (courseId: string, lessonId: string, lessonTitle?: string) => {
    await trackActivity({
      activity_type: 'lesson_start',
      course_id: courseId,
      lesson_id: lessonId,
      metadata: {
        lesson_title: lessonTitle,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackLessonComplete = useCallback(async (courseId: string, lessonId: string, watchTime?: number, lessonTitle?: string) => {
    await trackActivity({
      activity_type: 'lesson_complete',
      course_id: courseId,
      lesson_id: lessonId,
      metadata: {
        lesson_title: lessonTitle,
        watch_time_seconds: watchTime,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackCourseEnrollment = useCallback(async (courseId: string, courseTitle?: string) => {
    await trackActivity({
      activity_type: 'course_enrollment',
      course_id: courseId,
      metadata: {
        course_title: courseTitle,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackCourseComplete = useCallback(async (courseId: string, courseTitle?: string, totalWatchTime?: number) => {
    await trackActivity({
      activity_type: 'course_complete',
      course_id: courseId,
      metadata: {
        course_title: courseTitle,
        total_watch_time_seconds: totalWatchTime,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackVideoProgress = useCallback(async (
    courseId: string, 
    lessonId: string, 
    progress: number,
    watchTime: number,
    totalDuration: number
  ) => {
    await trackActivity({
      activity_type: 'video_progress',
      course_id: courseId,
      lesson_id: lessonId,
      metadata: {
        progress_percentage: progress,
        watch_time_seconds: watchTime,
        total_duration_seconds: totalDuration,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackLogin = useCallback(async () => {
    await trackActivity({
      activity_type: 'login',
      metadata: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: 'client' // El backend puede obtener la IP real
      }
    });
  }, [trackActivity]);

  const trackLogout = useCallback(async () => {
    await trackActivity({
      activity_type: 'logout',
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackSearch = useCallback(async (searchTerm: string, resultsCount?: number) => {
    await trackActivity({
      activity_type: 'search',
      metadata: {
        search_term: searchTerm,
        results_count: resultsCount,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackDownload = useCallback(async (resourceType: string, resourceId: string, resourceName?: string) => {
    await trackActivity({
      activity_type: 'download',
      metadata: {
        resource_type: resourceType,
        resource_id: resourceId,
        resource_name: resourceName,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackQuizStart = useCallback(async (courseId: string, quizId: string, quizTitle?: string) => {
    await trackActivity({
      activity_type: 'quiz_start',
      course_id: courseId,
      metadata: {
        quiz_id: quizId,
        quiz_title: quizTitle,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackQuizComplete = useCallback(async (
    courseId: string, 
    quizId: string, 
    score: number,
    timeSpent?: number,
    quizTitle?: string
  ) => {
    await trackActivity({
      activity_type: 'quiz_complete',
      course_id: courseId,
      metadata: {
        quiz_id: quizId,
        quiz_title: quizTitle,
        score,
        time_spent_seconds: timeSpent,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackCertificateEarned = useCallback(async (courseId: string, certificateId: string, courseTitle?: string) => {
    await trackActivity({
      activity_type: 'certificate_earned',
      course_id: courseId,
      metadata: {
        certificate_id: certificateId,
        course_title: courseTitle,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackActivity]);

  const trackError = useCallback(async (errorType: string, errorMessage: string, context?: Record<string, any>) => {
    await trackActivity({
      activity_type: 'error',
      metadata: {
        error_type: errorType,
        error_message: errorMessage,
        context,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href
      }
    });
  }, [trackActivity]);

  // Función helper para tracking automático de tiempo en página
  const trackTimeOnPage = useCallback((pageName: string) => {
    const startTime = Date.now();
    
    const cleanup = () => {
      const timeSpent = Date.now() - startTime;
      trackActivity({
        activity_type: 'time_on_page',
        metadata: {
          page: pageName,
          time_spent_seconds: Math.floor(timeSpent / 1000),
          timestamp: new Date().toISOString()
        }
      });
    };

    // Cleanup cuando se desmonte el componente o cambie la página
    window.addEventListener('beforeunload', cleanup);
    
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [trackActivity]);

  // Batch tracking para múltiples eventos
  const trackBatch = useCallback(async (events: AnalyticsEvent[]) => {
    if (!user || events.length === 0) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await fetch('/api/v1/analytics/activity/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.error('Error batch tracking analytics:', error);
    }
  }, [user]);

  return {
    // Core tracking function
    trackActivity,
    
    // Specific event trackers
    trackPageView,
    trackLessonStart,
    trackLessonComplete,
    trackCourseEnrollment,
    trackCourseComplete,
    trackVideoProgress,
    trackLogin,
    trackLogout,
    trackSearch,
    trackDownload,
    trackQuizStart,
    trackQuizComplete,
    trackCertificateEarned,
    trackError,
    
    // Helper functions
    trackTimeOnPage,
    trackBatch
  };
};

export default useAnalytics;
