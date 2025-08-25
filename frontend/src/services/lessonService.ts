/**
 * Servicio para operaciones de lecciones
 */

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:8000/api/v1';

// 🔥 FIX: Updated to match backend LessonCreate DTO exactly
interface LessonCreate {
  title: string;
  course_id: string;
  order: number;
  content_type: 'text' | 'video' | 'quiz' | 'assignment';
  content_url?: string;
  content_text?: string;
  duration: number;
  is_free_preview: boolean;
  attachments: string[];
}

interface LessonResponse {
  id: string;
  title: string;
  description: string;
  content_type: 'text' | 'video' | 'quiz' | 'assignment';
  lesson_type?: 'text' | 'video' | 'quiz' | 'assignment';
  content?: string;
  video_url?: string;
  assignment_id?: string;
  duration: number;
  order: number;
  is_free: boolean;
  created_at: string;
}

class LessonService {
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // 🔥 FIX 1: Enhanced with extensive debugging logs
  async getCourseLessons(courseId: string): Promise<LessonResponse[]> {
    console.log('🔍 [LessonService] Getting lessons for course:', courseId);
    console.log('🔍 [LessonService] API URL:', `${API_BASE_URL}/lessons/course/${courseId}`);
    console.log('🔍 [LessonService] Headers:', this.getHeaders());
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/lessons/course/${courseId}`, {
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
        lessons.forEach((lesson: any, index: number) => {
          console.log(`📝 [LessonService] Lesson ${index + 1}:`, {
            id: lesson.id || lesson._id,
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
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching lesson');
    }

    return await response.json();
  }

  async createLesson(courseId: string, lessonData: LessonCreate): Promise<LessonResponse> {
    console.log('🚀 [LessonService] Creating lesson for course:', courseId, lessonData);
    
    const response = await fetch(`${API_BASE_URL}/lessons/course/${courseId}`, {
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
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
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
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error deleting lesson');
    }
  }

  async reorderLessons(courseId: string, lessonOrders: Array<{ id: string; order: number }>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/lessons/course/${courseId}/reorder`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(lessonOrders)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error reordering lessons');
    }
  }
}

export const lessonService = new LessonService();
export default lessonService;
export type { LessonCreate, LessonResponse };
