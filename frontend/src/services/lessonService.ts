/**
 * Servicio para operaciones de lecciones
 */

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:8000/api/v1';

interface LessonCreate {
  title: string;
  description: string;
  content_type: 'text' | 'video';
  is_free: boolean;
  content?: string;
  video_url?: string;
}

interface LessonResponse {
  id: string;
  title: string;
  description: string;
  content_type: 'text' | 'video';
  content?: string;
  video_url?: string;
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

  async getCourseLessons(courseId: string): Promise<LessonResponse[]> {
    const response = await fetch(`${API_BASE_URL}/lessons/course/${courseId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching lessons');
    }

    return await response.json();
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
