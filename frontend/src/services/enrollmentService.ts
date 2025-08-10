/**
 * Servicio para gestión de enrollments (inscripciones)
 * Conecta con el backend de enrollments
 */
import axios from 'axios';
import {
  Enrollment,
  EnrollmentCreate,
  EnrollmentUpdate,
  EnrollmentStatus,
  LessonCompletionUpdate,
  EnrollmentProgressResponse,
  EnrolledCourse,
  EnrollmentStats,
  EnrollmentsResponse,
  CourseEnrollmentStatus
} from '../types/enrollment';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.stegmaier.com' 
  : 'http://localhost:8000';

class EnrollmentService {
  /**
   * Obtiene headers de autenticación
   */
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }

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
        `${API_BASE_URL}/api/v1/enrollments/`,
        enrollmentData,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Successfully enrolled:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error enrolling in course:', error);
      throw new Error(error.response?.data?.detail || 'Error al inscribirse en el curso');
    }
  }

  /**
   * Obtener cursos en los que el usuario está inscrito
   */
  async getUserEnrolledCourses(status?: EnrollmentStatus): Promise<EnrolledCourse[]> {
    try {
      console.log('📚 [enrollmentService] Getting user enrolled courses');
      
      const params: any = {};
      if (status) {
        params.status = status;
      }

      // Obtener enrollments del usuario
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/enrollments/`,
        { 
          headers: this.getAuthHeaders(),
          params 
        }
      );

      const enrollments = response.data;
      console.log('✅ [enrollmentService] Retrieved enrollments:', enrollments.length);

      // Para cada enrollment, obtener información del curso
      const enrolledCourses = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          try {
            // Obtener información del curso
            const courseResponse = await axios.get(
              `${API_BASE_URL}/api/v1/courses/${enrollment.course_id}`,
              { headers: this.getAuthHeaders() }
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
                last_accessed: enrollment.last_accessed,
                certificate_issued: enrollment.certificate_issued,
                certificate_url: enrollment.certificate_url,
                enrolled_at: enrollment.enrollment_date // alias
              }
            };
          } catch (error) {
            console.error(`Error fetching course ${enrollment.course_id}:`, error);
            // En caso de error, crear un curso mínimo con información disponible
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
                last_accessed: enrollment.last_accessed,
                certificate_issued: enrollment.certificate_issued,
                certificate_url: enrollment.certificate_url,
                enrolled_at: enrollment.enrollment_date
              }
            };
          }
        })
      );
      
      console.log('✅ [enrollmentService] Processed enrolled courses:', enrolledCourses.length);
      return enrolledCourses;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting enrolled courses:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener cursos inscritos');
    }
  }

  /**
   * Verificar estado de inscripción en un curso específico
   */
  async getEnrollmentStatus(courseId: string): Promise<CourseEnrollmentStatus> {
    try {
      console.log('🔍 [enrollmentService] Checking enrollment status for course:', courseId);
      
      // Obtener todas las inscripciones del usuario
      const enrollments = await this.getUserEnrolledCourses();
      
      // Buscar si está inscrito en este curso
      const enrolledCourse = enrollments.find(e => e.course.id === courseId);
      
      const status: CourseEnrollmentStatus = {
        course_id: courseId,
        is_enrolled: !!enrolledCourse,
        enrollment: enrolledCourse?.enrollment,
        can_enroll: !enrolledCourse, // Si no está inscrito, puede inscribirse
        enrollment_restrictions: enrolledCourse ? ['Ya está inscrito en este curso'] : []
      };

      console.log('✅ [enrollmentService] Enrollment status:', status);
      return status;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error checking enrollment status:', error);
      // En caso de error, asumir que puede inscribirse
      return {
        course_id: courseId,
        is_enrolled: false,
        can_enroll: true,
        enrollment_restrictions: []
      };
    }
  }

  /**
   * Desinscribirse de un curso (cancelar enrollment)
   */
  async unenrollFromCourse(courseId: string): Promise<void> {
    try {
      console.log(' [enrollmentService] Unenrolling from course:', courseId);
      
      await axios.delete(
        `${API_BASE_URL}/api/v1/enrollments/${courseId}/`,
        { headers: this.getAuthHeaders() }
      );

      console.log(' [enrollmentService] Successfully unenrolled from course');
    } catch (error: any) {
      console.error(' [enrollmentService] Error unenrolling from course:', error);
      throw new Error(error.response?.data?.detail || 'Error al desinscribirse del curso');
    }
  }

  /**
   * Obtener progreso detallado de una inscripción
   */
  async getEnrollmentProgress(enrollmentId: string): Promise<EnrollmentProgressResponse> {
    try {
      console.log('📊 [enrollmentService] Getting enrollment progress:', enrollmentId);
      
      const response = await axios.get<EnrollmentProgressResponse>(
        `${API_BASE_URL}/api/v1/enrollments/${enrollmentId}/progress/`,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Retrieved enrollment progress:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting enrollment progress:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener progreso de inscripción');
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
        `${API_BASE_URL}/api/v1/enrollments/${enrollmentId}/complete-lesson/`,
        completionData,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Successfully marked lesson as completed');
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error marking lesson as completed:', error);
      throw new Error(error.response?.data?.detail || 'Error al marcar lección como completada');
    }
  }

  /**
   * Emitir certificado de finalización
   */
  async issueCertificate(enrollmentId: string): Promise<void> {
    try {
      console.log('🏆 [enrollmentService] Issuing certificate for enrollment:', enrollmentId);
      
      await axios.put(
        `${API_BASE_URL}/api/v1/enrollments/${enrollmentId}/issue-certificate/`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Successfully issued certificate');
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error issuing certificate:', error);
      throw new Error(error.response?.data?.detail || 'Error al emitir certificado');
    }
  }

  /**
   * Obtener estadísticas de enrollments de un curso (solo para instructores/admins)
   */
  async getCourseEnrollmentStats(courseId: string): Promise<EnrollmentStats> {
    try {
      console.log('📈 [enrollmentService] Getting course enrollment stats:', courseId);
      
      const response = await axios.get<EnrollmentStats>(
        `${API_BASE_URL}/api/v1/enrollments/course/${courseId}/stats`,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [enrollmentService] Retrieved course enrollment stats:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting course enrollment stats:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener estadísticas de inscripciones');
    }
  }

  /**
   * Obtener todos los enrollments de un curso (solo para instructores/admins)
   */
  async getCourseEnrollments(courseId: string, status?: EnrollmentStatus): Promise<Enrollment[]> {
    try {
      console.log('👥 [enrollmentService] Getting course enrollments:', courseId);
      
      const params: any = {};
      if (status) {
        params.status = status;
      }

      const response = await axios.get<Enrollment[]>(
        `${API_BASE_URL}/api/v1/enrollments/course/${courseId}`,
        { 
          headers: this.getAuthHeaders(),
          params 
        }
      );

      console.log('✅ [enrollmentService] Retrieved course enrollments:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [enrollmentService] Error getting course enrollments:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener inscripciones del curso');
    }
  }

  /**
   * Verificar si el usuario puede inscribirse en un curso
   */
  async canEnrollInCourse(courseId: string): Promise<boolean> {
    try {
      const status = await this.getEnrollmentStatus(courseId);
      return status.can_enroll;
    } catch (error) {
      console.error('❌ [enrollmentService] Error checking if can enroll:', error);
      return false;
    }
  }

  /**
   * Obtener el enrollment específico de un usuario en un curso
   */
  async getUserCourseEnrollment(courseId: string): Promise<Enrollment | null> {
    try {
      const status = await this.getEnrollmentStatus(courseId);
      return status.enrollment || null;
    } catch (error) {
      console.error('❌ [enrollmentService] Error getting user course enrollment:', error);
      return null;
    }
  }
}

// Exportar instancia singleton
export const enrollmentService = new EnrollmentService();
export default enrollmentService;
