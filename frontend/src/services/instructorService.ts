import api from './api';

export interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  pendingReviews: number;
  newEnrollments: number;
  activeQuizzes: number;
}

export interface RecentActivity {
  id: string;
  type: 'enrollment' | 'quiz_completion' | 'course_progress' | 'review';
  message: string;
  timestamp: string;
  studentName?: string;
  courseName?: string;
}

export interface InstructorCourse {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  is_published: boolean;
  total_students: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
  lessons_count: number;
  total_duration: number;
}

export interface StudentProgress {
  student_id: string;
  student_name: string;
  student_email: string;
  enrollment_date: string;
  progress_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  last_activity: string;
  quiz_scores: Array<{
    quiz_id: string;
    quiz_title: string;
    score: number;
    completed_at: string;
  }>;
}

class InstructorService {
  private baseUrl = '/api/v1/instructor';

  // Dashboard methods
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get(`${this.baseUrl}/dashboard/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data for development
      return {
        totalCourses: 5,
        totalStudents: 147,
        averageRating: 4.7,
        pendingReviews: 8,
        newEnrollments: 23,
        activeQuizzes: 12
      };
    }
  }

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const response = await api.get(`${this.baseUrl}/dashboard/activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Return mock data for development
      return [
        {
          id: '1',
          type: 'enrollment',
          message: 'María González se inscribió en "Fundamentos de SICMON"',
          timestamp: 'Hace 2 horas',
          studentName: 'María González',
          courseName: 'Fundamentos de SICMON'
        },
        {
          id: '2',
          type: 'quiz_completion',
          message: 'Carlos López completó el quiz "Evaluación Módulo 1" con 95%',
          timestamp: 'Hace 4 horas',
          studentName: 'Carlos López'
        }
      ];
    }
  }

  // Course management
  async getMyCourses(params?: {
    page?: number;
    limit?: number;
    status?: 'published' | 'draft' | 'all';
  }): Promise<{ courses: InstructorCourse[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const response = await api.get(`${this.baseUrl}/courses?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      throw error;
    }
  }

  async getCourseStudents(
    courseId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: 'name' | 'progress' | 'enrollment_date';
      order?: 'asc' | 'desc';
    }
  ): Promise<{ students: StudentProgress[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.order) queryParams.append('order', params.order);

      const response = await api.get(`${this.baseUrl}/courses/${courseId}/students?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course students:', error);
      throw error;
    }
  }

  async getAllMyStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ students: StudentProgress[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const response = await api.get(`${this.baseUrl}/students?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all students:', error);
      throw error;
    }
  }

  async publishCourse(courseId: string): Promise<void> {
    await api.post(`${this.baseUrl}/courses/${courseId}/publish`);
  }

  async unpublishCourse(courseId: string): Promise<void> {
    await api.post(`${this.baseUrl}/courses/${courseId}/unpublish`);
  }
}

export const instructorService = new InstructorService();