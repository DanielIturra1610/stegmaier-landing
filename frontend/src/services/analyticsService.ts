/**
 * Servicio para manejar todas las llamadas de analytics
 */

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
  private baseURL = '/api/v1/analytics';

  private async makeAuthenticatedRequest<T>(endpoint: string): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    if (!token || token === 'null' || token === 'undefined') {
      console.warn('Analytics request failed: No valid authentication token');
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
    return result.data;
  }

  /**
   * Obtiene métricas generales de la plataforma
   */
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    return this.makeAuthenticatedRequest<PlatformMetrics>('/platform');
  }

  /**
   * Obtiene cursos más populares
   */
  async getPopularCourses(periodDays: string = '30'): Promise<{ courses: PopularCourse[] }> {
    return this.makeAuthenticatedRequest<{ courses: PopularCourse[] }>(`/courses/popular?period_days=${periodDays}`);
  }

  /**
   * Obtiene datos de ingresos
   */
  async getRevenueData(): Promise<RevenueData> {
    return this.makeAuthenticatedRequest<RevenueData>('/revenue');
  }

  /**
   * Obtiene analytics específicos de un curso
   */
  async getCourseAnalytics(courseId: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>(`/courses/${courseId}`);
  }

  /**
   * Obtiene analytics personales del usuario
   */
  async getUserAnalytics(): Promise<any> {
    return this.makeAuthenticatedRequest<any>('/my-stats');
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
      console.warn('No token available for activity tracking');
      return;
    }

    try {
      await fetch(`${this.baseURL}/activity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
      // No lanzamos el error para no interrumpir la UX
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
