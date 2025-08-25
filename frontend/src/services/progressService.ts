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
    const token = localStorage.getItem('auth_token');
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
      const [summary, recentVideos] = await Promise.all([
        this.getProgressSummary(),
        this.getProgressSummary().then(s => s.recent_activity)
      ]);

      return {
        summary,
        recentVideos,
        totalBookmarks: 0, // TODO: Implementar conteo real
        totalNotes: 0 // TODO: Implementar conteo real
      };
    } catch (error) {
      console.error('Error fetching detailed progress:', error);
      throw error;
    }
  }

  // === LESSON PROGRESS METHODS ===

  /**
   * Iniciar una lección
   */
  async startLesson(lessonId: string, courseId: string, enrollmentId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/start`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          course_id: courseId,
          enrollment_id: enrollmentId
        })
      });

      if (!response.ok) {
        throw new Error(`Error starting lesson: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error iniciando lección:', error);
      throw error;
    }
  }

  /**
   * Completar una lección
   */
  async completeLesson(lessonId: string, courseId: string, enrollmentId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          course_id: courseId,
          enrollment_id: enrollmentId
        })
      });

      if (!response.ok) {
        throw new Error(`Error completing lesson: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completando lección:', error);
      throw error;
    }
  }

  /**
   * Actualizar progreso de lección
   */
  async updateLessonProgress(
    lessonId: string,
    courseId: string, 
    enrollmentId: string,
    progressData: {
      progress_percentage?: number;
      time_spent_delta: number;
      video_position?: number;
      quiz_score?: number;
    }
  ) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/lessons/${lessonId}/progress?course_id=${courseId}&enrollment_id=${enrollmentId}`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(progressData)
        }
      );

      if (!response.ok) {
        throw new Error(`Error updating lesson progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando progreso de lección:', error);
      throw error;
    }
  }

  /**
   * Obtener progreso de lección
   */
  async getLessonProgress(lessonId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error fetching lesson progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo progreso de lección:', error);
      throw error;
    }
  }

  // === COURSE PROGRESS METHODS ===

  /**
   * Obtener progreso completo de curso
   */
  async getCourseProgress(courseId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error fetching course progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo progreso de curso:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de progreso del usuario
   */
  async getUserProgressSummary() {
    try {
      const response = await fetch(`${API_BASE_URL}/summary`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error fetching user progress summary: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo resumen de progreso:', error);
      throw error;
    }
  }

  // === BATCH SYNC METHODS ===

  /**
   * Sincronizar actualizaciones pendientes (offline sync)
   */
  async syncProgressBatch(updates: Array<{
    lesson_id: string;
    progress_percentage?: number;
    time_spent_delta: number;
    video_position?: number;
    quiz_score?: number;
  }>) {
    try {
      const response = await fetch(`${API_BASE_URL}/sync`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error(`Error syncing progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en sincronización batch:', error);
      throw error;
    }
  }

  /**
   * Guardar progreso localmente para offline sync
   */
  savePendingProgress(lessonId: string, progressData: any) {
    try {
      const existingData = localStorage.getItem('pending_progress');
      const pendingProgress = existingData ? JSON.parse(existingData) : {};
      
      if (!pendingProgress[lessonId]) {
        pendingProgress[lessonId] = [];
      }
      
      pendingProgress[lessonId].push({
        ...progressData,
        timestamp: new Date().toISOString()
      });
      
      localStorage.setItem('pending_progress', JSON.stringify(pendingProgress));
    } catch (error) {
      console.error('Error guardando progreso pendiente:', error);
    }
  }

  /**
   * Obtener y sincronizar progreso pendiente
   */
  async syncPendingProgress() {
    try {
      const pendingData = localStorage.getItem('pending_progress');
      if (!pendingData) return { synced: 0, failed: 0 };
      
      const pendingProgress = JSON.parse(pendingData);
      const allUpdates: Array<{
        lesson_id: string;
        progress_percentage?: number;
        time_spent_delta: number;
        video_position?: number;
        quiz_score?: number;
        timestamp?: string;
      }> = [];
      
      for (const [lessonId, updates] of Object.entries(pendingProgress)) {
        if (Array.isArray(updates)) {
          for (const update of updates) {
            allUpdates.push({
              lesson_id: lessonId,
              progress_percentage: update.progress_percentage,
              time_spent_delta: update.time_spent_delta || 0,
              video_position: update.video_position,
              quiz_score: update.quiz_score,
              timestamp: update.timestamp
            });
          }
        }
      }
      
      if (allUpdates.length > 0) {
        const result = await this.syncProgressBatch(allUpdates);
        
        // Si la sincronización fue exitosa, limpiar storage
        if (result.synced_count > 0) {
          localStorage.removeItem('pending_progress');
        }
        
        return {
          synced: result.synced_count,
          failed: result.failed_count
        };
      }
      
      return { synced: 0, failed: 0 };
    } catch (error) {
      console.error('Error sincronizando progreso pendiente:', error);
      throw error;
    }
  }

  // === ENHANCED UTILITIES ===

  /**
   * Calcular progreso general del curso basado en lecciones
   */
  calculateCourseProgress(lessonsProgress: any[]): number {
    if (!lessonsProgress || lessonsProgress.length === 0) return 0;
    
    const totalProgress = lessonsProgress.reduce((sum, lesson) => {
      return sum + (lesson.progress_percentage || 0);
    }, 0);
    
    return Math.round(totalProgress / lessonsProgress.length);
  }

  /**
   * Formatear tiempo total en formato legible
   */
  formatTotalTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // === ASSIGNMENT PROGRESS METHODS ===

  /**
   * Marcar assignment como iniciado
   */
  async startAssignment(lessonId: string, assignmentId: string, courseId: string, enrollmentId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/start`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          lesson_id: lessonId,
          course_id: courseId,
          enrollment_id: enrollmentId
        })
      });

      if (!response.ok) {
        throw new Error(`Error starting assignment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error iniciando assignment:', error);
      throw error;
    }
  }

  /**
   * Marcar assignment como completado (cuando se envía submission)
   */
  async completeAssignment(lessonId: string, assignmentId: string, courseId: string, enrollmentId: string, submissionId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/complete`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          lesson_id: lessonId,
          course_id: courseId,
          enrollment_id: enrollmentId,
          submission_id: submissionId
        })
      });

      if (!response.ok) {
        throw new Error(`Error completing assignment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completando assignment:', error);
      throw error;
    }
  }

  /**
   * Actualizar progreso de assignment
   */
  async updateAssignmentProgress(
    lessonId: string,
    assignmentId: string,
    courseId: string,
    enrollmentId: string,
    progressData: {
      progress_percentage: number;
      time_spent_delta: number;
      submission_status?: string;
    }
  ) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/assignments/${assignmentId}/progress?lesson_id=${lessonId}&course_id=${courseId}&enrollment_id=${enrollmentId}`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(progressData)
        }
      );

      if (!response.ok) {
        throw new Error(`Error updating assignment progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando progreso de assignment:', error);
      throw error;
    }
  }

  /**
   * Obtener progreso de assignment
   */
  async getAssignmentProgress(lessonId: string, assignmentId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}?lesson_id=${lessonId}`, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 404) {
        return null; // No hay progreso guardado aún
      }

      if (!response.ok) {
        throw new Error(`Error fetching assignment progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo progreso de assignment:', error);
      throw error;
    }
  }

}

// Instancia única del servicio
const progressService = new ProgressService();

export default progressService;
