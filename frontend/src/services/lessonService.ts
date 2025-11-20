/**
 * Servicio para operaciones de lecciones
 */

import { buildApiUrl, getAuthHeaders, API_ENDPOINTS } from '../config/api.config';
import { LessonResponse, LessonCreate, ContentType } from '../types/lesson';

class LessonService {
  private getHeaders() {
    return getAuthHeaders();
  }

  // 🔥 FIX 1: Enhanced with extensive debugging logs
  async getCourseLessons(courseId: string): Promise<LessonResponse[]> {
    console.log('🔍 [LessonService] Getting lessons for course:', courseId);
    console.log('🔍 [LessonService] API URL:', buildApiUrl(`${API_ENDPOINTS.LESSONS}/course/${courseId}`));
    console.log('🔍 [LessonService] Headers:', this.getHeaders());
    
    try {
      const startTime = Date.now();
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.LESSONS}/course/${courseId}`), {
        method: 'GET',
        headers: this.getHeaders()
      });
      const responseTime = Date.now() - startTime;

      console.log('📡 [LessonService] Response status:', response.status);
      console.log('📡 [LessonService] Response ok:', response.ok);
      console.log('📡 [LessonService] Response time:', responseTime + 'ms');
      console.log('📡 [LessonService] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [LessonService] Error response body:', errorText);
        console.error('❌ [LessonService] Error status code:', response.status);
        console.error('❌ [LessonService] Error status text:', response.statusText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }
        throw new Error(errorData.detail || `Error fetching lessons: ${response.status}`);
      }

      const lessons = await response.json();
      console.log('✅ [LessonService] Raw lessons received:', lessons);
      console.log('📊 [LessonService] Total lessons count:', lessons?.length || 0);
      console.log('📋 [LessonService] Lessons data structure:', JSON.stringify(lessons?.[0] || 'No lessons', null, 2));
      
      // Log each lesson for debugging
      if (lessons && lessons.length > 0) {
        lessons.forEach((lesson: LessonResponse, index: number) => {
          console.log(`📝 [LessonService] Lesson ${index + 1}:`, {
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            content_type: lesson.content_type
          });
        });
      }
      
      return lessons || [];
    } catch (error) {
      console.error('💥 [LessonService] Exception getting course lessons:', error);
      console.error('💥 [LessonService] Error stack:', (error as Error).stack);
      throw error;
    }
  }

  async getLessonById(lessonId: string): Promise<LessonResponse> {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.LESSONS}/${lessonId}`), {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching lesson');
    }

    return await response.json();
  }

  async createLesson(courseId: string, lessonData: LessonCreate): Promise<LessonResponse> {
    console.log('🚀 [LessonService] Creating lesson for course:', courseId, lessonData);
    
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.LESSONS}/course/${courseId}`), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(lessonData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [LessonService] Error creating lesson:', errorData);
      throw new Error(errorData.detail || 'Error creating lesson');
    }

    const result = await response.json();
    console.log('✅ [LessonService] Lesson created successfully:', result);
    return result;
  }

  async updateLesson(lessonId: string, lessonData: Partial<LessonCreate>): Promise<LessonResponse> {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.LESSONS}/${lessonId}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(lessonData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error updating lesson');
    }

    return await response.json();
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.LESSONS}/${lessonId}`), {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error deleting lesson');
    }
  }

  async reorderLessons(courseId: string, lessonOrders: Array<{ id: string; order: number }>): Promise<void> {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.LESSONS}/course/${courseId}/reorder`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(lessonOrders)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error reordering lessons');
    }
  }

  /**
   * Marcar una lección como completada
   */
  async markComplete(lessonId: string): Promise<void> {
    console.log('✅ [LessonService] Marking lesson as complete:', lessonId);

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.LESSONS}/${lessonId}/complete`), {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [LessonService] Error marking lesson complete:', errorData);
        throw new Error(errorData.detail || 'Error al marcar lección como completada');
      }

      console.log('✅ [LessonService] Lesson marked as complete successfully');
    } catch (error) {
      console.error('💥 [LessonService] Exception marking lesson complete:', error);
      throw error;
    }
  }
}

export const lessonService = new LessonService();
export default lessonService;
