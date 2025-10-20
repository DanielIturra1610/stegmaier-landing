/**
 * Analytics Service - Frontend service for analytics and metrics
 * ✅ CORREGIDO: URLs centralizadas, headers centralizados, sin URLs relativas
 */
import { API_CONFIG, API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../config/api.config';

export interface PlatformMetrics {
  users: {
    total_users: number;
    active_users: number;
    new_users: number;
    user_growth_rate: number;
  };
  content: {
    total_courses: number;
    total_enrollments: number;
    completion_rate: number;
    completed_enrollments: number;
  };
  engagement: {
    total_watch_time_seconds: number;
    average_watch_time_per_user: number;
  };
}

export interface PopularCourse {
  course_id: string;
  course_title: string;
  enrollment_count: number;
  average_rating: number;
  completion_rate: number;
}

export interface RevenueData {
  total_revenue: number;
  monthly_revenue: number;
  revenue_growth: number;
  top_earning_courses: Array<{
    course_id: string;
    course_title: string;
    revenue: number;
    enrollments: number;
  }>;
}

class AnalyticsService {

  private async makeAuthenticatedRequest<T>(endpoint: string): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    if (!token || token === 'null' || token === 'undefined') {
      console.warn('📊 [analyticsService] Analytics request failed: No valid authentication token');
      throw new Error('No authentication token found');
    }

    console.log('📊 [analyticsService] Making request to:', endpoint);
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ANALYTICS}${endpoint}`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      if (response.status === 403) {
        throw new Error('Admin access required');
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ [analyticsService] Request successful:', endpoint);
    return result.data;
  }

  /**
   * Obtiene métricas generales de la plataforma
   */
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    console.log('📈 [analyticsService] Getting platform metrics');
    return this.makeAuthenticatedRequest<PlatformMetrics>('/platform');
  }

  /**
   * Obtiene cursos más populares
   */
  async getPopularCourses(periodDays: string = '30'): Promise<{ courses: PopularCourse[] }> {
    console.log('🏆 [analyticsService] Getting popular courses for period:', periodDays);
    return this.makeAuthenticatedRequest<{ courses: PopularCourse[] }>(`/courses/popular?period_days=${periodDays}`);
  }

  /**
   * Obtiene datos de ingresos
   */
  async getRevenueData(): Promise<RevenueData> {
    console.log('💰 [analyticsService] Getting revenue data');
    return this.makeAuthenticatedRequest<RevenueData>('/revenue');
  }

  /**
   * Obtiene analytics específicos de un curso
   */
  async getCourseAnalytics(courseId: string): Promise<any> {
    console.log('📚 [analyticsService] Getting course analytics for:', courseId);
    return this.makeAuthenticatedRequest<any>(`/courses/${courseId}`);
  }

  /**
   * Obtiene analytics personales del usuario
   * ✅ CORREGIDO: Logging exhaustivo y manejo de errores robusto
   */
  async getUserAnalytics(): Promise<any> {
    console.group('👤 [analyticsService] Getting user analytics');
    
    try {
      console.log('📡 [analyticsService] Making request to /my-stats endpoint');
      console.log('🔑 [analyticsService] Auth token available:', !!localStorage.getItem('auth_token'));
      
      const result = await this.makeAuthenticatedRequest<any>('/my-stats');
      
      console.log('📨 [analyticsService] Raw response received:', result);
      console.log('📊 [analyticsService] Response keys:', Object.keys(result || {}));
      
      // VALIDACIÓN CRÍTICA DE ESTRUCTURA
      const validatedResult = this.validateAndFixAnalyticsStructure(result);
      
      console.log('✅ [analyticsService] Validated result:', validatedResult);
      console.groupEnd();
      
      return validatedResult;
      
    } catch (error) {
      console.group('❌ [analyticsService] Error in getUserAnalytics');
      console.error('Error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      
      console.log('🔄 [analyticsService] Returning safe fallback data');
      console.groupEnd();
      
      // Devolver estructura segura para prevenir crashes
      return this.getSafeAnalyticsFallback();
    }
  }

  /**
   * Valida y corrige la estructura de analytics para prevenir undefined errors
   */
  private validateAndFixAnalyticsStructure(data: any): any {
    console.log('🔍 [analyticsService] Validating analytics structure');
    
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ [analyticsService] Invalid data structure, using fallback');
      return this.getSafeAnalyticsFallback();
    }

    // Estructura esperada por MyProgressPage.tsx
    const validated = {
      period: {
        start_date: data.period?.start_date || new Date().toISOString(),
        end_date: data.period?.end_date || new Date().toISOString(),
        days: data.period?.days || 30
      },
      user: {
        user_id: data.user?.user_id || '',
        name: data.user?.name || 'Usuario',
        joined_date: data.user?.joined_date || new Date().toISOString()
      },
      learning: {
        courses_enrolled: Number(data.learning?.courses_enrolled) || 0,
        courses_completed: Number(data.learning?.courses_completed) || 0,
        courses_in_progress: Number(data.learning?.courses_in_progress) || 0,
        completion_rate: Number(data.learning?.completion_rate) || 0,
        total_watch_time_seconds: Number(data.learning?.total_watch_time_seconds) || 0,
        total_watch_time_hours: Number(data.learning?.total_watch_time_hours) || 0,
        average_session_duration: Number(data.learning?.average_session_duration) || 0
      },
      engagement: {
        login_streak: Number(data.engagement?.login_streak) || 0,
        total_logins: Number(data.engagement?.total_logins) || 0,
        last_login: data.engagement?.last_login || new Date().toISOString(),
        favorite_category: data.engagement?.favorite_category || 'General',
        activity_score: Number(data.engagement?.activity_score) || 0,
        lessons_completed: Number(data.engagement?.lessons_completed) || 0
      },
      achievements: {
        certificates_earned: Number(data.achievements?.certificates_earned) || 0,
        badges_earned: Array.isArray(data.achievements?.badges_earned) ? data.achievements.badges_earned : [],
        milestones: Array.isArray(data.achievements?.milestones) ? data.achievements.milestones : []
      },
      recent_activity: Array.isArray(data.recent_activity) ? data.recent_activity : []
    };

    // Log de validaciones específicas
    console.log('✅ [analyticsService] completion_rate validated:', validated.learning.completion_rate);
    console.log('✅ [analyticsService] All required fields present');
    
    return validated;
  }

  /**
   * Datos de fallback seguros para prevenir crashes
   */
  private getSafeAnalyticsFallback(): any {
    console.log('🛡️ [analyticsService] Providing safe analytics fallback');
    
    return {
      period: {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString(),
        days: 30
      },
      user: {
        user_id: 'fallback-user',
        name: 'Usuario',
        joined_date: new Date().toISOString()
      },
      learning: {
        courses_enrolled: 0,
        courses_completed: 0,
        courses_in_progress: 0,
        completion_rate: 0,
        total_watch_time_seconds: 0,
        total_watch_time_hours: 0,
        average_session_duration: 0
      },
      engagement: {
        login_streak: 0,
        total_logins: 0,
        last_login: new Date().toISOString(),
        favorite_category: 'General',
        activity_score: 0,
        lessons_completed: 0
      },
      achievements: {
        certificates_earned: 0,
        badges_earned: [],
        milestones: []
      },
      recent_activity: []
    };
  }

  /**
   * Función de tracking de eventos (compatibilidad con código existente)
   */
  trackEvent(eventName: string, eventData?: Record<string, any>): void {
    this.trackActivity({
      activity_type: eventName,
      metadata: eventData
    });
  }

  /**
   * Registra una actividad del usuario
   */
  async trackActivity(activityData: {
    activity_type: string;
    course_id?: string;
    lesson_id?: string;
    video_id?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('⚠️ [analyticsService] No token available for activity tracking');
      return;
    }

    try {
      console.log('📝 [analyticsService] Tracking activity:', activityData.activity_type);
      await fetch(buildApiUrl(`${API_ENDPOINTS.ANALYTICS}/activity`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(activityData),
      });
      console.log('✅ [analyticsService] Activity tracked successfully');
    } catch (error) {
      console.error('❌ [analyticsService] Error tracking activity:', error);
      // No lanzamos el error para no interrumpir la UX
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
