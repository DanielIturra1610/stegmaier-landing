/**
 * Servicio para gestión de enrollments (inscripciones) 
 * ✅ CORREGIDO: URLs centralizadas, sin duplicación /api/v1/api/v1
 */
import axios from 'axios';
import { Course } from '../types/course';
import {
  Enrollment,
  EnrollmentStatus,
  EnrolledCourse,
  CourseEnrollmentStatus,
  EnrollmentProgressResponse,
  EnrollmentStats
} from '../types/enrollment';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.config';

// Interface for API error responses
interface APIError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

// Tipos para requests internos
interface EnrollmentCreate {
  course_id: string;
}

interface LessonCompletionUpdate {
  lesson_id: string;
  completed: boolean;
}

class EnrollmentService {
  /**
   * Inscribirse en un curso
   */
  async enrollInCourse(courseId: string): Promise<Enrollment> {
    try {
      console.log('🎓 [enrollmentService] Enrolling in course:', courseId);
      
      const enrollmentData: EnrollmentCreate = {
        course_id: courseId
      };

      const response = await axios.post<Enrollment>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/`),
        enrollmentData,
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Successfully enrolled:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [enrollmentService] Error enrolling in course:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al inscribirse en el curso');
    }
  }

  /**
   * Obtener cursos en los que el usuario está inscrito
   */
  async getUserEnrolledCourses(status?: EnrollmentStatus): Promise<EnrolledCourse[]> {
    try {
      console.log('📚 [enrollmentService] Getting user enrolled courses');
      
      const params: Record<string, string> = {};
      if (status) {
        params.status = status;
      }

      // Obtener enrollments del usuario - ✅ CORREGIDO: Sin duplicación API path
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/`),
        { 
          headers: getAuthHeaders(),
          params 
        }
      );

      const enrollments = response.data;
      console.log('✅ [enrollmentService] Retrieved enrollments:', enrollments.length);

      // Para cada enrollment, obtener información del curso
      const enrolledCourses = await Promise.all(
        enrollments.map(async (enrollment: Enrollment) => {
          try {
            // ✅ CORREGIDO: URL correcta sin duplicación
            const courseResponse = await axios.get(
              buildApiUrl(`${API_ENDPOINTS.COURSES}/${enrollment.course_id}`),
              { headers: getAuthHeaders() }
            );
            
            return {
              course: {
                id: courseResponse.data.id,
                title: courseResponse.data.title,
                description: courseResponse.data.description || '',
                instructor_id: courseResponse.data.instructor_id,
                instructor_name: courseResponse.data.instructor_name,
                level: courseResponse.data.level,
                category: courseResponse.data.category,
                is_published: courseResponse.data.is_published,
                lessons_count: courseResponse.data.lessons_count,
                enrollments_count: courseResponse.data.enrollments_count,
                created_at: courseResponse.data.created_at,
                updated_at: courseResponse.data.updated_at
              },
              enrollment: {
                id: enrollment.id,
                user_id: enrollment.user_id,
                course_id: enrollment.course_id,
                status: enrollment.status,
                progress: enrollment.progress,
                completed_lessons: enrollment.completed_lessons,
                enrollment_date: enrollment.enrollment_date,
                expiry_date: enrollment.expiry_date,
                last_accessed: enrollment?.last_accessed || null,
                certificate_issued: enrollment.certificate_issued,
                certificate_url: enrollment.certificate_url,
                user_role: enrollment.user_role || 'student',
                enrolled_at: enrollment.enrollment_date
              }
            };
          } catch (error) {
            console.error(`Error fetching course ${enrollment.course_id}:`, error);
            // Fallback para cursos no disponibles
            return {
              course: {
                id: enrollment.course_id,
                title: 'Curso no disponible',
                description: 'Error al cargar información del curso',
                instructor_id: '',
                level: 'unknown',
                category: 'unknown',
                is_published: false,
                lessons_count: 0,
                enrollments_count: 0,
                created_at: '',
                updated_at: ''
              },
              enrollment: {
                id: enrollment.id,
                user_id: enrollment.user_id,
                course_id: enrollment.course_id,
                status: enrollment.status,
                progress: enrollment.progress,
                completed_lessons: enrollment.completed_lessons,
                enrollment_date: enrollment.enrollment_date,
                expiry_date: enrollment.expiry_date,
                last_accessed: enrollment?.last_accessed || null,
                certificate_issued: enrollment.certificate_issued,
                certificate_url: enrollment.certificate_url,
                user_role: enrollment.user_role || 'student',
                enrolled_at: enrollment.enrollment_date
              }
            };
          }
        })
      );
      
      console.log('✅ [enrollmentService] Processed enrolled courses:', enrolledCourses.length);
      return enrolledCourses;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [enrollmentService] Error getting enrolled courses:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al obtener cursos inscritos');
    }
  }

  /**
   * Verificar estado de inscripción en un curso específico
   */
  async getEnrollmentStatus(courseId: string): Promise<CourseEnrollmentStatus> {
    try {
      console.log('🔍 [enrollmentService] Checking enrollment status for course:', courseId);
      
      const enrollments = await this.getUserEnrolledCourses();
      const enrolledCourse = enrollments.find(e => e.course.id === courseId);
      
      const status: CourseEnrollmentStatus = {
        course_id: courseId,
        is_enrolled: !!enrolledCourse,
        enrollment: enrolledCourse?.enrollment,
        can_enroll: !enrolledCourse,
        enrollment_restrictions: enrolledCourse ? ['Ya está inscrito en este curso'] : []
      };

      console.log('✅ [enrollmentService] Enrollment status:', status);
      return status;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [enrollmentService] Error checking enrollment status:', apiError);
      return {
        course_id: courseId,
        is_enrolled: false,
        can_enroll: true,
        enrollment_restrictions: []
      };
    }
  }

  /**
   * Desinscribirse de un curso
   */
  async unenrollFromCourse(courseId: string): Promise<void> {
    try {
      console.log('🔄 [enrollmentService] Unenrolling from course:', courseId);
      
      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${courseId}/`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Successfully unenrolled from course');
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [enrollmentService] Error unenrolling from course:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al desinscribirse del curso');
    }
  }

  /**
   * Obtener progreso detallado de una inscripción
   */
  async getEnrollmentProgress(enrollmentId: string): Promise<EnrollmentProgressResponse> {
    try {
      console.log('📊 [enrollmentService] Getting enrollment progress:', enrollmentId);
      
      const response = await axios.get<EnrollmentProgressResponse>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}/progress/`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Retrieved enrollment progress:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [enrollmentService] Error getting enrollment progress:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al obtener progreso de inscripción');
    }
  }

  /**
   * Marcar una lección como completada
   */
  async markLessonCompleted(enrollmentId: string, lessonId: string): Promise<void> {
    try {
      console.log('✅ [enrollmentService] Marking lesson as completed:', { enrollmentId, lessonId });
      
      const completionData: LessonCompletionUpdate = {
        lesson_id: lessonId,
        completed: true
      };

      await axios.put(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}/complete-lesson/`),
        completionData,
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Lesson marked as completed');
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [enrollmentService] Error marking lesson as completed:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al marcar lección como completada');
    }
  }

  /**
   * Emitir certificado para curso completado
   */
  async issueCertificate(enrollmentId: string): Promise<void> {
    try {
      console.log('🏆 [enrollmentService] Issuing certificate for enrollment:', enrollmentId);
      
      await axios.put(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/${enrollmentId}/issue-certificate/`),
        {},
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Certificate issued successfully');
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [enrollmentService] Error issuing certificate:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al emitir certificado');
    }
  }

  /**
   * Obtener estadísticas de inscripciones de un curso (para admins/instructores)
   */
  async getCourseEnrollmentStats(courseId: string): Promise<EnrollmentStats> {
    try {
      console.log('📈 [enrollmentService] Getting course enrollment stats:', courseId);
      
      const response = await axios.get<EnrollmentStats>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/course/${courseId}/stats`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Retrieved enrollment stats:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [enrollmentService] Error getting enrollment stats:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al obtener estadísticas de inscripciones');
    }
  }

  /**
   * Obtener todos los enrollments de un curso (para admins/instructores)
   */
  async getCourseEnrollments(courseId: string, status?: EnrollmentStatus): Promise<Enrollment[]> {
    try {
      console.log('👥 [enrollmentService] Getting course enrollments:', { courseId, status });
      
      const params: Record<string, string> = {};
      if (status) {
        params.status = status;
      }

      const response = await axios.get<Enrollment[]>(
        buildApiUrl(`${API_ENDPOINTS.ENROLLMENTS}/course/${courseId}`),
        { 
          headers: getAuthHeaders(),
          params 
        }
      );

      console.log('✅ [enrollmentService] Retrieved course enrollments:', response.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [enrollmentService] Error getting course enrollments:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al obtener inscripciones del curso');
    }
  }
}

// Export singleton instance
const enrollmentService = new EnrollmentService();
export default enrollmentService;
