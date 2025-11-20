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

  /**
   * Upload video for a lesson
   */
  async uploadLessonVideo(
    lessonId: string,
    videoFile: File,
    onProgress?: (progress: number) => void
  ): Promise<{ lesson: LessonResponse; media: any }> {
    console.log('📤 [LessonService] Uploading video for lesson:', lessonId);
    console.log('📤 [LessonService] Video file:', {
      name: videoFile.name,
      size: videoFile.size,
      type: videoFile.type
    });

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('video', videoFile);

      console.log('📤 [LessonService] FormData created, sending request...');

      // Upload with progress tracking
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            console.log(`📊 [LessonService] Upload progress: ${percentComplete.toFixed(2)}%`);
            onProgress?.(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Create a Response-like object
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers({
                'Content-Type': xhr.getResponseHeader('Content-Type') || 'application/json'
              })
            }));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', buildApiUrl(`${API_ENDPOINTS.LESSONS}/${lessonId}/video`));

        // Set auth headers
        const headers = this.getHeaders();
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.send(formData);
      });

      console.log('📡 [LessonService] Response received, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [LessonService] Upload error:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }
        throw new Error(errorData.detail || 'Error uploading video');
      }

      const result = await response.json();
      console.log('✅ [LessonService] Video uploaded successfully:', result);

      return result;
    } catch (error) {
      console.error('💥 [LessonService] Exception uploading video:', error);
      throw error;
    }
  }
}

export const lessonService = new LessonService();
export default lessonService;
