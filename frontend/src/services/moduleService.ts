/**
 * Servicio para gestión de módulos
 * Comunicación con API backend para operaciones CRUD de módulos
 */
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { 
  ModuleResponse, 
  ModuleCreate, 
  ModuleUpdate, 
  ModuleWithLessons, 
  CourseStructureResponse,
  LessonAssignment,
  CourseModulesResponse
} from '../types/module';
import { buildApiUrl, getAuthHeaders, API_ENDPOINTS } from '../config/api.config';

// Interface for API error responses - Following CLAUDE.md TypeScript best practices
interface APIError extends Error {
  response?: {
    status?: number;
    data?: {
      detail?: string;
      message?: string;
    };
  };
}

class ModuleService {
  private getAuthHeaders(): AxiosRequestConfig {
    return {
      headers: getAuthHeaders()
    };
  }

  /**
   * Crear un nuevo módulo para un curso
   */
  async createModule(courseId: string, moduleData: ModuleCreate): Promise<ModuleResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.COURSES}/${courseId}/modules`);
    console.log('🚀 [moduleService] Creating module for course:', courseId);
    console.log('📤 [moduleService] Request URL:', url);
    console.log('📤 [moduleService] Request payload:', JSON.stringify(moduleData, null, 2));
    console.log('📤 [moduleService] Request headers:', JSON.stringify(this.getAuthHeaders(), null, 2));

    try {
      const response: AxiosResponse<ModuleResponse> = await axios.post(
        url,
        moduleData,
        this.getAuthHeaders()
      );

      console.log('✅ [moduleService] Module created:', response.data.title);
      return response.data;
    } catch (error: any) {
      console.error('❌ [moduleService] Full error object:', error);
      console.error('❌ [moduleService] Error response:', error.response?.data);
      console.error('❌ [moduleService] Error status:', error.response?.status);
      console.error('❌ [moduleService] Error headers:', error.response?.headers);

      const apiError = error as APIError;
      const errorMessage = apiError.response?.data?.detail ||
                          apiError.response?.data?.message ||
                          apiError.message ||
                          'Error al crear módulo';

      throw new Error(errorMessage);
    }
  }

  /**
   * Obtener todos los módulos de un curso
   */
  async getCourseModules(courseId: string): Promise<ModuleResponse[]> {
    console.log('🔍 [moduleService] Getting modules for course:', courseId);
    
    try {
      const response: AxiosResponse<ModuleResponse[]> = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.COURSES}/${courseId}/modules`)
      );
      
      console.log('✅ [moduleService] Modules fetched:', response.data.length, 'modules');
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [moduleService] Error fetching modules:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al obtener módulos');
    }
  }

  /**
   * Obtener estructura completa del curso con módulos y lecciones
   */
  async getCourseStructure(courseId: string): Promise<CourseStructureResponse> {
    console.log('🏗️ [moduleService] Getting course structure for:', courseId);
    
    try {
      const response: AxiosResponse<CourseStructureResponse> = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.COURSES}/${courseId}/structure`)
      );
      
      console.log('✅ [moduleService] Course structure fetched:', {
        modules: response.data.modules?.length || 0,
        total_lessons: response.data.total_lessons || 0
      });
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [moduleService] Error fetching course structure:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al obtener estructura del curso');
    }
  }

  /**
   * Obtener un módulo específico por ID
   */
  async getModule(moduleId: string): Promise<ModuleResponse> {
    console.log('🔍 [moduleService] Getting module:', moduleId);
    
    try {
      const response: AxiosResponse<ModuleResponse> = await axios.get(
        buildApiUrl(`/modules/${moduleId}`)
      );
      
      console.log('✅ [moduleService] Module fetched:', response.data.title);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [moduleService] Error fetching module:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al obtener módulo');
    }
  }

  /**
   * Obtener un módulo con sus lecciones
   */
  async getModuleWithLessons(moduleId: string): Promise<ModuleWithLessons> {
    console.log('📚 [moduleService] Getting module with lessons:', moduleId);
    
    try {
      const response: AxiosResponse<ModuleWithLessons> = await axios.get(
        buildApiUrl(`/modules/${moduleId}/with-lessons`)
      );
      
      console.log('✅ [moduleService] Module with lessons fetched:', {
        title: response.data.title,
        lessons_count: response.data.lessons?.length || 0
      });
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [moduleService] Error fetching module with lessons:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al obtener módulo con lecciones');
    }
  }

  /**
   * Actualizar un módulo
   */
  async updateModule(moduleId: string, moduleData: ModuleUpdate): Promise<ModuleResponse> {
    console.log('✏️ [moduleService] Updating module:', moduleId, moduleData);
    
    try {
      const response: AxiosResponse<ModuleResponse> = await axios.put(
        buildApiUrl(`/modules/${moduleId}`),
        moduleData,
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Module updated:', response.data.title);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [moduleService] Error updating module:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al actualizar módulo');
    }
  }

  /**
   * Eliminar un módulo
   */
  async deleteModule(moduleId: string): Promise<void> {
    console.log('🗑️ [moduleService] Deleting module:', moduleId);
    
    try {
      await axios.delete(
        buildApiUrl(`/modules/${moduleId}`),
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Module deleted successfully');
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [moduleService] Error deleting module:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al eliminar módulo');
    }
  }

  /**
   * Reordenar módulos de un curso
   */
  async reorderModules(courseId: string, moduleOrders: Array<{ id: string; order: number }>): Promise<void> {
    console.log('🔄 [moduleService] Reordering modules for course:', courseId, moduleOrders);
    
    try {
      await axios.put(
        buildApiUrl(`${API_ENDPOINTS.COURSES}/${courseId}/modules/reorder`),
        moduleOrders,
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Modules reordered successfully');
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [moduleService] Error reordering modules:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al reordenar módulos');
    }
  }

  /**
   * Asignar una lección a un módulo
   */
  async assignLessonToModule(moduleId: string, lessonId: string): Promise<void> {
    console.log('🔗 [moduleService] Assigning lesson to module:', { moduleId, lessonId });
    
    try {
      await axios.post(
        buildApiUrl(`/modules/${moduleId}/lessons`),
        { lesson_id: lessonId } as LessonAssignment,
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Lesson assigned to module successfully');
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [moduleService] Error assigning lesson to module:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al asignar lección al módulo');
    }
  }

  /**
   * Remover una lección de un módulo
   */
  async removeLessonFromModule(moduleId: string, lessonId: string): Promise<void> {
    console.log('🔗 [moduleService] Removing lesson from module:', { moduleId, lessonId });
    
    try {
      await axios.delete(
        buildApiUrl(`/modules/${moduleId}/lessons/${lessonId}`),
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Lesson removed from module successfully');
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [moduleService] Error removing lesson from module:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Error al remover lección del módulo');
    }
  }

  // Métodos de utilidad para el frontend

  /**
   * Formatear duración en minutos a formato legible
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  }

  /**
   * Calcular progreso de módulo basado en lecciones completadas
   */
  calculateModuleProgress(module: ModuleWithLessons): number {
    if (module.lessons_count === 0) return 0;
    
    const completedLessons = (Array.isArray(module.lessons) ? module.lessons : []).filter(lesson => lesson.is_completed).length;
    return Math.round((completedLessons / module.lessons_count) * 100);
  }

  /**
   * Verificar si un módulo está bloqueado
   */
  isModuleLocked(module: ModuleWithLessons, previousModules: ModuleWithLessons[]): boolean {
    if (!module.unlock_previous) return false;
    
    const previousModule = previousModules.find(m => m.order === module.order - 1);
    if (!previousModule) return false;
    
    return this.calculateModuleProgress(previousModule) < 100;
  }

  /**
   * Obtener siguiente lección disponible en el curso
   */
  getNextLesson(courseStructure: CourseStructureResponse, currentLessonId?: string): {
    moduleId: string;
    lessonId: string;
    title: string;
  } | null {
    if (!currentLessonId) {
      // Devolver primera lección del primer módulo
      const firstModule = courseStructure.modules.find(m => m.order === 1);
      if (firstModule && firstModule.lessons.length > 0) {
        const firstLesson = firstModule.lessons.find(l => l.order === 1);
        if (firstLesson) {
          return {
            moduleId: firstModule.id,
            lessonId: firstLesson.id,
            title: firstLesson.title
          };
        }
      }
      return null;
    }

    // Encontrar lección actual y devolver la siguiente
    for (const module of courseStructure.modules) {
      const currentLessonIndex = module.lessons.findIndex(l => l.id === currentLessonId);
      
      if (currentLessonIndex !== -1) {
        // Si hay una siguiente lección en el mismo módulo
        if (currentLessonIndex < module.lessons.length - 1) {
          const nextLesson = module.lessons[currentLessonIndex + 1];
          return {
            moduleId: module.id,
            lessonId: nextLesson.id,
            title: nextLesson.title
          };
        }
        
        // Si no, buscar primera lección del siguiente módulo
        const nextModule = courseStructure.modules.find(m => m.order === module.order + 1);
        if (nextModule && nextModule.lessons.length > 0) {
          const firstLesson = nextModule.lessons.find(l => l.order === 1);
          if (firstLesson) {
            return {
              moduleId: nextModule.id,
              lessonId: firstLesson.id,
              title: firstLesson.title
            };
          }
        }
        
        return null; // No hay más lecciones
      }
    }
    
    return null;
  }
}

export default new ModuleService();
