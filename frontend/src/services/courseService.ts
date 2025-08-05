import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.stegmaier.com' 
  : 'http://localhost:8000';

// Interfaces para tipado
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor?: string;
  duration?: number;
  lessons?: number;
  completedLessons?: number;
  progress?: number;
  thumbnail?: string;
  category?: string;
  level?: string;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CoursesResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
}

class CourseService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Obtener cursos para estudiantes (solo cursos publicados en los que están inscritos o disponibles)
  async getStudentCourses(page: number = 1, limit: number = 10): Promise<CoursesResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/courses/student`, {
        headers: this.getAuthHeaders(),
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching student courses:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener cursos');
    }
  }

  // Obtener cursos disponibles para inscripción
  async getAvailableCourses(page: number = 1, limit: number = 10): Promise<CoursesResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/courses/available`, {
        headers: this.getAuthHeaders(),
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching available courses:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener cursos disponibles');
    }
  }

  // Obtener detalles de un curso específico
  async getCourse(courseId: string): Promise<Course> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/courses/${courseId}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching course:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener el curso');
    }
  }

  // Inscribirse en un curso
  async enrollInCourse(courseId: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/courses/${courseId}/enroll`, {}, {
        headers: this.getAuthHeaders(),
      });
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      throw new Error(error.response?.data?.detail || 'Error al inscribirse en el curso');
    }
  }
}

export const courseService = new CourseService();
export default courseService;
