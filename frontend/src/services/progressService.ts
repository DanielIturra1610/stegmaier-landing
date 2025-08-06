/**
 * Servicio para gestión de progreso de videos
 */

const API_BASE_URL = '/api/v1/progress';

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
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Actualizar progreso de un video
   */
  async updateVideoProgress(
    lessonId: string, 
    videoId: string, 
    progressData: UpdateProgressRequest
  ): Promise<VideoProgress> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${lessonId}/${videoId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(progressData)
      });

      if (!response.ok) {
        throw new Error(`Error updating progress: ${response.statusText}`);
      }

      const result = await response.json();
      return result.progress;
    } catch (error) {
      console.error('Error updating video progress:', error);
      throw error;
    }
  }

  /**
   * Obtener progreso de un video específico
   */
  async getVideoProgress(lessonId: string, videoId: string): Promise<VideoProgress | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${lessonId}/${videoId}`, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 404) {
        return null; // No hay progreso guardado aún
      }

      if (!response.ok) {
        throw new Error(`Error fetching progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching video progress:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de progreso del usuario
   */
  async getProgressSummary(): Promise<ProgressSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/summary`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error fetching progress summary: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching progress summary:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo marcador
   */
  async createBookmark(
    lessonId: string, 
    videoId: string, 
    bookmarkData: CreateBookmarkRequest
  ): Promise<VideoBookmark> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${lessonId}/${videoId}/bookmarks`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(bookmarkData)
      });

      if (!response.ok) {
        throw new Error(`Error creating bookmark: ${response.statusText}`);
      }

      const result = await response.json();
      return result.bookmark;
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw error;
    }
  }

  /**
   * Obtener marcadores de un video
   */
  async getVideoBookmarks(lessonId: string, videoId: string): Promise<VideoBookmark[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${lessonId}/${videoId}/bookmarks`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error fetching bookmarks: ${response.statusText}`);
      }

      const result = await response.json();
      return result.bookmarks;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw error;
    }
  }

  /**
   * Crear una nueva nota
   */
  async createNote(
    lessonId: string, 
    videoId: string, 
    noteData: CreateNoteRequest
  ): Promise<VideoNote> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${lessonId}/${videoId}/notes`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(noteData)
      });

      if (!response.ok) {
        throw new Error(`Error creating note: ${response.statusText}`);
      }

      const result = await response.json();
      return result.note;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  /**
   * Obtener notas de un video
   */
  async getVideoNotes(lessonId: string, videoId: string): Promise<VideoNote[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${lessonId}/${videoId}/notes`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error fetching notes: ${response.statusText}`);
      }

      const result = await response.json();
      return result.notes;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }

  /**
   * Utilidades para formateo de tiempo
   */
  static formatTime(timeInSeconds: number): string {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Utilidades para cálculo de porcentajes
   */
  static calculateWatchPercentage(currentTime: number, duration: number): number {
    if (duration <= 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }

  /**
   * Verificar si un video está completado
   */
  static isVideoCompleted(currentTime: number, duration: number, threshold = 0.9): boolean {
    if (duration <= 0) return false;
    return (currentTime / duration) >= threshold;
  }

  /**
   * Formatear duración en formato legible
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)} segundos`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.round(seconds / 3600);
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    }
  }

  /**
   * Obtener datos de progreso para dashboard/resúmenes
   */
  async getDetailedProgress(): Promise<{
    summary: ProgressSummary;
    recentVideos: VideoProgress[];
    totalBookmarks: number;
    totalNotes: number;
  }> {
    try {
      const summary = await this.getProgressSummary();
      
      return {
        summary,
        recentVideos: summary.recent_activity || [],
        totalBookmarks: 0, // Se puede calcular desde el resumen
        totalNotes: 0      // Se puede calcular desde el resumen
      };
    } catch (error) {
      console.error('Error fetching detailed progress:', error);
      throw error;
    }
  }
}

// Instancia única del servicio
const progressService = new ProgressService();

export default progressService;
