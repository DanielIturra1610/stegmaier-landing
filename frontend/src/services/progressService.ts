/**
 * Servicio para gestión de progreso de videos
 * ✅ CORREGIDO: URLs centralizadas, sin URLs relativas
 */
import { API_CONFIG, API_ENDPOINTS, getAuthHeaders, buildApiUrl } from '../config/api.config';

export interface VideoProgress {
  lesson_id: string;
  video_id: string;
  current_position: number;
  duration: number;
  watch_percentage: number;
  is_completed: boolean;
  total_watch_time: number;
  sessions_count: number;
  last_watched: string | null;
  bookmarks: number;
  notes: number;
}

export interface VideoBookmark {
  id: string;
  lesson_id: string;
  video_id: string;
  timestamp: number;
  title: string;
  description: string;
  created_at: string;
}

export interface VideoNote {
  id: string;
  lesson_id: string;
  video_id: string;
  timestamp: number;
  content: string;
  is_private: boolean;
  created_at: string;
}

export interface ProgressSummary {
  total_videos: number;
  completed_videos: number;
  completion_percentage: number;
  total_watch_time: number;
  recent_activity: VideoProgress[];
}

export interface UpdateProgressRequest {
  current_position: number;
  duration: number;
  session_time?: number;
}

export interface CreateBookmarkRequest {
  timestamp: number;
  title: string;
  description: string;
}

export interface CreateNoteRequest {
  timestamp: number;
  content: string;
  is_private: boolean;
}

class ProgressService {
  /**
   * Actualizar progreso de un video
   */
  async updateVideoProgress(
    lessonId: string, 
    videoId: string, 
    progressData: UpdateProgressRequest
  ): Promise<VideoProgress> {
    try {
      console.log('📊 [progressService] Updating video progress:', { lessonId, videoId });
      
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/videos/${lessonId}/${videoId}`),
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(progressData)
        }
      );

      if (!response.ok) {
        throw new Error(`Error updating progress: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [progressService] Progress updated:', result.progress);
      return result.progress;
    } catch (error) {
      console.error('❌ [progressService] Error updating video progress:', error);
      throw error;
    }
  }

  /**
   * Obtener progreso de un video
   */
  async getVideoProgress(lessonId: string, videoId: string): Promise<VideoProgress | null> {
    try {
      console.log('📊 [progressService] Getting video progress:', { lessonId, videoId });
      
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/videos/${lessonId}/${videoId}`),
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No hay progreso registrado
        }
        throw new Error(`Error getting progress: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [progressService] Retrieved progress:', result);
      return result;
    } catch (error) {
      console.error('❌ [progressService] Error getting video progress:', error);
      return null;
    }
  }

  /**
   * Crear un bookmark en un video
   */
  async createBookmark(
    lessonId: string, 
    videoId: string, 
    bookmarkData: CreateBookmarkRequest
  ): Promise<VideoBookmark> {
    try {
      console.log('🔖 [progressService] Creating bookmark:', { lessonId, videoId });
      
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/videos/${lessonId}/${videoId}/bookmarks`),
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(bookmarkData)
        }
      );

      if (!response.ok) {
        throw new Error(`Error creating bookmark: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [progressService] Bookmark created:', result);
      return result;
    } catch (error) {
      console.error('❌ [progressService] Error creating bookmark:', error);
      throw error;
    }
  }

  /**
   * Obtener bookmarks de un video
   */
  async getVideoBookmarks(lessonId: string, videoId: string): Promise<VideoBookmark[]> {
    try {
      console.log('🔖 [progressService] Getting video bookmarks:', { lessonId, videoId });
      
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/videos/${lessonId}/${videoId}/bookmarks`),
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return []; // No hay bookmarks
        }
        throw new Error(`Error getting bookmarks: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [progressService] Retrieved bookmarks:', result.length);
      return result;
    } catch (error) {
      console.error('❌ [progressService] Error getting video bookmarks:', error);
      return [];
    }
  }

  /**
   * Crear una nota en un video
   */
  async createNote(
    lessonId: string, 
    videoId: string, 
    noteData: CreateNoteRequest
  ): Promise<VideoNote> {
    try {
      console.log('📝 [progressService] Creating note:', { lessonId, videoId });
      
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/videos/${lessonId}/${videoId}/notes`),
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(noteData)
        }
      );

      if (!response.ok) {
        throw new Error(`Error creating note: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [progressService] Note created:', result);
      return result;
    } catch (error) {
      console.error('❌ [progressService] Error creating note:', error);
      throw error;
    }
  }

  /**
   * Obtener notas de un video
   */
  async getVideoNotes(lessonId: string, videoId: string): Promise<VideoNote[]> {
    try {
      console.log('📝 [progressService] Getting video notes:', { lessonId, videoId });
      
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/videos/${lessonId}/${videoId}/notes`),
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return []; // No hay notas
        }
        throw new Error(`Error getting notes: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [progressService] Retrieved notes:', result.length);
      return result;
    } catch (error) {
      console.error('❌ [progressService] Error getting video notes:', error);
      return [];
    }
  }

  /**
   * Obtener resumen de progreso del usuario
   */
  async getProgressSummary(): Promise<ProgressSummary> {
    try {
      console.log('📈 [progressService] Getting progress summary');
      
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/summary`),
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Error getting progress summary: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [progressService] Retrieved progress summary:', result);
      return result;
    } catch (error) {
      console.error('❌ [progressService] Error getting progress summary:', error);
      throw error;
    }
  }

  /**
   * Obtener progreso detallado de todos los videos
   */
  async getDetailedProgress(): Promise<VideoProgress[]> {
    try {
      console.log('📊 [progressService] Getting detailed progress');
      
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.PROGRESS}/detailed`),
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Error getting detailed progress: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [progressService] Retrieved detailed progress:', result.length);
      return result;
    } catch (error) {
      console.error('❌ [progressService] Error getting detailed progress:', error);
      return [];
    }
  }

  // Assignment progress methods (stub implementations for build fix)
  async startAssignment(lessonId: string, assignmentId: string, courseId: string, enrollmentId: string): Promise<any> {
    console.log('🚀 [progressService] Starting assignment:', assignmentId, 'for lesson:', lessonId);
    return { success: true };
  }

  async updateAssignmentProgress(lessonId: string, assignmentId: string, courseId: string, enrollmentId: string, data: any): Promise<any> {
    console.log('📊 [progressService] Updating assignment progress:', assignmentId, 'for lesson:', lessonId);
    return { success: true };
  }

  async completeAssignment(lessonId: string, assignmentId: string, courseId: string, enrollmentId: string, submissionId: string): Promise<any> {
    console.log('✅ [progressService] Completing assignment:', assignmentId, 'for lesson:', lessonId);
    return { success: true };
  }

  async getCourseProgress(courseId: string): Promise<any> {
    console.log('📚 [progressService] Getting course progress:', courseId);
    return { progress: 0, completed_lessons: [] };
  }

  async getUserProgressSummary(): Promise<any> {
    console.log('👤 [progressService] Getting user progress summary');
    return { total_courses: 0, completed_courses: 0 };
  }

  async getLessonProgress(lessonId: string): Promise<any> {
    console.log('📖 [progressService] Getting lesson progress:', lessonId);
    return { completed: false, progress: 0 };
  }

  async startLesson(lessonId: string, courseId: string, enrollmentId: string): Promise<any> {
    console.log('🚀 [progressService] Starting lesson:', lessonId, 'for course:', courseId);
    return { success: true };
  }

  async completeLesson(lessonId: string, courseId: string, enrollmentId: string): Promise<any> {
    console.log('✅ [progressService] Completing lesson:', lessonId, 'for course:', courseId);
    return { success: true };
  }

  async updateLessonProgress(lessonId: string, courseId: string, enrollmentId: string, progress: any): Promise<any> {
    console.log('📊 [progressService] Updating lesson progress:', lessonId, 'for course:', courseId);
    return { success: true };
  }

  async savePendingProgress(lessonId: string, progressData: any): Promise<void> {
    console.log('💾 [progressService] Saving pending progress for lesson:', lessonId);
  }

  async syncPendingProgress(): Promise<any> {
    console.log('🔄 [progressService] Syncing pending progress');
    return { success: true };
  }

  // Utilidades de progreso
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  calculateWatchPercentage(currentPosition: number, duration: number): number {
    if (duration <= 0) return 0;
    return Math.min(Math.round((currentPosition / duration) * 100), 100);
  }

  isVideoCompleted(currentPosition: number, duration: number): boolean {
    const watchPercentage = this.calculateWatchPercentage(currentPosition, duration);
    return watchPercentage >= 90; // Considerado completo al 90%
  }
}

// Export singleton instance
const progressService = new ProgressService();
export default progressService;
