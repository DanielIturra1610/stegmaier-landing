/**
 * Servicio para gestión de módulos
 * Comunicación con API backend para operaciones CRUD de módulos
 */
import axios, { AxiosResponse } from 'axios';
import {
  ModuleResponse,
  ModuleWithLessons,
  CourseStructureResponse,
  ModuleCreate,
  ModuleUpdate,
  ModuleOrderUpdate,
  LessonAssignment,
  CourseModulesResponse
} from '../types/module';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';

class ModuleService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  /**
   * Crear nuevo módulo en un curso
   */
  async createModule(courseId: string, moduleData: ModuleCreate): Promise<ModuleResponse> {
    console.log('🔍 [moduleService] Creating module for course:', courseId, moduleData);
    
    try {
      const response: AxiosResponse<ModuleResponse> = await axios.post(
        `${API_BASE_URL}/courses/${courseId}/modules`,
        moduleData,
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Module created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [moduleService] Error creating module:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los módulos de un curso
   */
  async getCourseModules(courseId: string): Promise<ModuleResponse[]> {
    console.log('🔍 [moduleService] Fetching modules for course:', courseId);
    
    try {
      const response: AxiosResponse<ModuleResponse[]> = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/modules`
      );
      
      console.log('✅ [moduleService] Modules fetched:', response.data.length, 'modules');
      return response.data;
    } catch (error) {
      console.error('❌ [moduleService] Error fetching course modules:', error);
      throw error;
    }
  }

  /**
   * Obtener estructura completa del curso con módulos y lecciones
   */
  async getCourseStructure(courseId: string): Promise<CourseStructureResponse> {
    console.log('🔍 [moduleService] Fetching course structure for:', courseId);
    
    try {
      const response: AxiosResponse<CourseStructureResponse> = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/structure`
      );
      
      console.log('✅ [moduleService] Course structure fetched:', {
        modules: response.data.total_modules,
        lessons: response.data.total_lessons,
        duration: response.data.total_duration
      });
      return response.data;
    } catch (error) {
      console.error('❌ [moduleService] Error fetching course structure:', error);
      throw error;
    }
  }

  /**
   * Obtener módulo específico
   */
  async getModule(moduleId: string): Promise<ModuleResponse> {
    console.log('🔍 [moduleService] Fetching module:', moduleId);
    
    try {
      const response: AxiosResponse<ModuleResponse> = await axios.get(
        `${API_BASE_URL}/modules/${moduleId}`
      );
      
      console.log('✅ [moduleService] Module fetched:', response.data.title);
      return response.data;
    } catch (error) {
      console.error('❌ [moduleService] Error fetching module:', error);
      throw error;
    }
  }

  /**
   * Obtener módulo con sus lecciones completas
   */
  async getModuleWithLessons(moduleId: string): Promise<ModuleWithLessons> {
    console.log('🔍 [moduleService] Fetching module with lessons:', moduleId);
    
    try {
      const response: AxiosResponse<ModuleWithLessons> = await axios.get(
        `${API_BASE_URL}/modules/${moduleId}/with-lessons`
      );
      
      console.log('✅ [moduleService] Module with lessons fetched:', {
        title: response.data.title,
        lessons: response.data.lessons_count,
        duration: response.data.total_duration
      });
      return response.data;
    } catch (error) {
      console.error('❌ [moduleService] Error fetching module with lessons:', error);
      throw error;
    }
  }

  /**
   * Actualizar módulo
   */
  async updateModule(moduleId: string, moduleData: ModuleUpdate): Promise<ModuleResponse> {
    console.log('🔍 [moduleService] Updating module:', moduleId, moduleData);
    
    try {
      const response: AxiosResponse<ModuleResponse> = await axios.put(
        `${API_BASE_URL}/modules/${moduleId}`,
        moduleData,
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Module updated successfully:', response.data.title);
      return response.data;
    } catch (error) {
      console.error('❌ [moduleService] Error updating module:', error);
      throw error;
    }
  }

  /**
   * Eliminar módulo
   */
  async deleteModule(moduleId: string): Promise<void> {
    console.log('🔍 [moduleService] Deleting module:', moduleId);
    
    try {
      await axios.delete(
        `${API_BASE_URL}/modules/${moduleId}`,
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Module deleted successfully');
    } catch (error) {
      console.error('❌ [moduleService] Error deleting module:', error);
      throw error;
    }
  }

  /**
   * Reordenar módulos de un curso
   */
  async reorderModules(courseId: string, moduleOrders: ModuleOrderUpdate[]): Promise<void> {
    console.log('🔍 [moduleService] Reordering modules for course:', courseId, moduleOrders);
    
    try {
      await axios.put(
        `${API_BASE_URL}/courses/${courseId}/modules/reorder`,
        moduleOrders,
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Modules reordered successfully');
    } catch (error) {
      console.error('❌ [moduleService] Error reordering modules:', error);
      throw error;
    }
  }

  /**
   * Agregar lección a un módulo
   */
  async addLessonToModule(moduleId: string, lessonId: string): Promise<void> {
    console.log('🔍 [moduleService] Adding lesson to module:', { moduleId, lessonId });
    
    try {
      await axios.post(
        `${API_BASE_URL}/modules/${moduleId}/lessons`,
        { lesson_id: lessonId } as LessonAssignment,
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Lesson added to module successfully');
    } catch (error) {
      console.error('❌ [moduleService] Error adding lesson to module:', error);
      throw error;
    }
  }

  /**
   * Remover lección de un módulo
   */
  async removeLessonFromModule(moduleId: string, lessonId: string): Promise<void> {
    console.log('🔍 [moduleService] Removing lesson from module:', { moduleId, lessonId });
    
    try {
      await axios.delete(
        `${API_BASE_URL}/modules/${moduleId}/lessons/${lessonId}`,
        this.getAuthHeaders()
      );
      
      console.log('✅ [moduleService] Lesson removed from module successfully');
    } catch (error) {
      console.error('❌ [moduleService] Error removing lesson from module:', error);
      throw error;
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
    
    const completedLessons = module.lessons.filter(lesson => lesson.is_completed).length;
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

// Exportar instancia singleton
export const moduleService = new ModuleService();
export default moduleService;
