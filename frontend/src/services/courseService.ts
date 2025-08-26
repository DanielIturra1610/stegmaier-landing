import axios from 'axios';
import { 
  CourseDetail, 
  CourseDetailPageData, 
  CourseResponse, 
  LessonOverview,
  UserCourseAccess 
} from '../types/course';
import { LessonResponse } from '../types/lesson';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Interface para lección individual
export interface LessonDetail {
  id: string;
  title: string;
  order: number;
  content_type: string;
  content_text?: string;
  content_url?: string;
  duration: number;
  is_free_preview: boolean;
}

// Interfaces para tipado
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor?: string;
  instructor_id?: string;
  // ✅ CORREGIDO: Usar nombres de campos que devuelve el backend
  total_duration: number;  // Backend devuelve "total_duration" 
  lessons_count?: number;   // Backend devuelve "lessons_count"
  // ✅ ACTUALIZADO: lessons puede ser array de objetos o número
  lessons?: LessonDetail[] | number;  // Backend puede devolver array completo o número
  // Mantener compatibilidad con nombres anteriores
  duration?: number;       // Alias para total_duration
  completedLessons?: number;
  progress?: number;
  thumbnail?: string;
  cover_image?: string;    // Backend devuelve "cover_image"
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
  async getAvailableCourses(page: number = 1, limit: number = 10): Promise<Course[] | CoursesResponse> {
    try {
      console.log('🔍 [courseService] Calling getAvailableCourses with params:', { page, limit });
      const response = await axios.get(`${API_BASE_URL}/api/v1/courses/available`, {
        headers: {
          ...this.getAuthHeaders(),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: { page, limit }
      });
      console.log('🔍 [courseService] Response from API:', response.data);
      console.log('🔍 [courseService] Response status:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching available courses:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener cursos disponibles');
    }
  }

  // ✅ ELIMINADO: Función duplicada - usar la versión robusta al final del archivo

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

  /**
   * Obtener detalle completo de un curso por ID
   */
  async getCourseDetail(courseId: string): Promise<CourseResponse> {
    try {
      console.log('🔍 [courseService] Getting course detail for ID:', courseId);
      
      const response = await axios.get(`${API_BASE_URL}/api/v1/courses/${courseId}`, {
        headers: this.getAuthHeaders()
      });
      
      console.log('✅ [courseService] Course detail retrieved:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [courseService] Error getting course detail:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener detalle del curso');
    }
  }

  /**
   * Obtener curso completo con lecciones y permisos de usuario
   */
  async getCourseWithLessons(courseId: string): Promise<CourseDetailPageData> {
    try {
      console.log('🎯 [courseService] Getting complete course data for ID:', courseId);
      
      // Obtener curso y lecciones en paralelo
      const [courseResponse, lessonsResponse] = await Promise.all([
        this.getCourseDetail(courseId),
        this.getCourseLessons(courseId)
      ]);
      
      // Transformar respuesta del curso a CourseDetail
      const courseDetail: CourseDetail = {
        ...courseResponse,
        instructor: {
          id: courseResponse.instructor_id,
          name: 'Instructor', // TODO: Obtener info real del instructor
          avatar: undefined,
          bio: undefined
        },
        stats: {
          enrollments_count: courseResponse.total_students,
          lessons_count: lessonsResponse.length,
          reviews_count: 0 // TODO: Implementar reviews
        }
      };
      
      // Transformar lecciones a LessonOverview
      const lessons: LessonOverview[] = lessonsResponse.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        content_type: lesson.content_type as 'video' | 'text' | 'quiz',
        duration: lesson.duration,
        is_free_preview: lesson.is_free_preview,
        has_access: lesson.is_free_preview || courseDetail.user_enrollment?.status === 'active' || false,
        is_completed: false // TODO: Obtener progreso real
      }));
      
      // Determinar acceso del usuario
      const userAccess: UserCourseAccess = {
        can_view_detail: true,
        is_enrolled: !!courseDetail.user_enrollment,
        can_enroll: !courseDetail.user_enrollment && courseDetail.is_published,
        enrollment_status: courseDetail.user_enrollment?.status,
        access_type: courseDetail.user_enrollment ? 'premium' : 'free',
        restrictions: []
      };
      
      console.log('✅ [courseService] Complete course data processed');
      return {
        course: courseDetail,
        lessons,
        user_access: userAccess
      };
    } catch (error: any) {
      console.error('❌ [courseService] Error getting complete course data:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener datos completos del curso');
    }
  }

  /**
   * Verificar si un curso existe y está disponible
   */
  async checkCourseAvailability(courseId: string): Promise<{ exists: boolean; published: boolean; accessible: boolean }> {
    try {
      const course = await this.getCourseDetail(courseId);
      return {
        exists: true,
        published: course.is_published,
        accessible: course.is_published || false // TODO: Verificar permisos de instructor/admin
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { exists: false, published: false, accessible: false };
      }
      throw error;
    }
  }

  // ✅ FIX CRÍTICO: Método para obtener lecciones de un curso específico
  async getCourseLessons(courseId: string): Promise<LessonResponse[]> {
    try {
      console.log('🔍 [CourseService] Getting lessons for course:', courseId);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/lessons/course/${courseId}`,
        { headers: this.getAuthHeaders() }
      );
      
      console.log('✅ [CourseService] Lessons fetched successfully:', response.data?.length || 0);
      return response.data || [];
    } catch (error: any) {
      console.error('❌ [CourseService] Error fetching course lessons:', error);
      console.error('❌ [CourseService] Response:', error.response?.data);
      
      // ✅ ROBUSTEZ: Devolver array vacío en lugar de crash
      return [];
    }
  }

  // ✅ FIX CRÍTICO: Método para obtener curso con verificación robusta
  async getCourse(courseId: string): Promise<Course | null> {
    try {
      console.log('🔍 [CourseService] Getting course:', courseId);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/courses/${courseId}`,
        { headers: this.getAuthHeaders() }
      );
      
      const course = response.data;
      
      // ✅ NORMALIZACIÓN: Asegurar que lessons sea array
      if (course && !Array.isArray(course.lessons)) {
        course.lessons = [];
      }
      
      console.log('✅ [CourseService] Course fetched successfully:', course?.title);
      console.log('📋 [CourseService] Course lessons count:', course?.lessons?.length || 0);
      
      return course;
    } catch (error: any) {
      console.error('❌ [CourseService] Error fetching course:', error);
      
      if (error.response?.status === 404) {
        return null;
      }
      
      throw error;
    }
  }
}

export const courseService = new CourseService();
export default courseService;
