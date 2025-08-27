/**
 * Servicio para gestión de notificaciones conectado al backend
 */
import axios from 'axios';
import { buildApiUrl, getAuthHeaders } from '../config/api.config';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  type: string;
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  metadata: Record<string, any>;
  action_url?: string;
  action_label?: string;
  created_at: string;
  read_at?: string;
  archived_at?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  per_page: number;
}

export interface CreateNotificationData {
  recipient_id: string;
  sender_id?: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  action_url?: string;
  action_label?: string;
}

export interface BulkNotificationData {
  recipient_ids: string[];
  sender_id?: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  action_url?: string;
  action_label?: string;
}

class NotificationService {
  private readonly baseUrl = '/notifications';

  /**
   * Obtiene las notificaciones del usuario actual
   */
  async getUserNotifications(
    status?: 'unread' | 'read' | 'archived',
    page: number = 1,
    per_page: number = 20
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString()
    });

    if (status) {
      params.append('status', status);
    }

    const response = await axios.get(buildApiUrl(`${this.baseUrl}?${params}`), { headers: getAuthHeaders() });
    return response.data;
  }

  /**
   * Obtiene el número de notificaciones no leídas
   */
  async getUnreadCount(): Promise<number> {
    const response = await axios.get(buildApiUrl(`${this.baseUrl}/unread-count`), { headers: getAuthHeaders() });
    return response.data.unread_count;
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    await axios.patch(buildApiUrl(`${this.baseUrl}/${notificationId}/read`), {}, { headers: getAuthHeaders() });
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  async markAllAsRead(): Promise<number> {
    const response = await axios.patch(buildApiUrl(`${this.baseUrl}/mark-all-read`), {}, { headers: getAuthHeaders() });
    return response.data.message.match(/\d+/)?.[0] || 0;
  }

  /**
   * Elimina una notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await axios.delete(buildApiUrl(`${this.baseUrl}/${notificationId}`), { headers: getAuthHeaders() });
  }

  /**
   * Archiva una notificación
   */
  async archiveNotification(notificationId: string): Promise<void> {
    await axios.patch(buildApiUrl(`${this.baseUrl}/${notificationId}/archive`), {}, { headers: getAuthHeaders() });
  }

  /**
   * Crea una nueva notificación (solo admins)
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const response = await axios.post(buildApiUrl(this.baseUrl), data, { headers: getAuthHeaders() });
    return response.data;
  }

  /**
   * Crea múltiples notificaciones en lote (solo admins)
   */
  async createBulkNotifications(data: BulkNotificationData): Promise<Notification[]> {
    const response = await axios.post(buildApiUrl(`${this.baseUrl}/bulk`), data, { headers: getAuthHeaders() });
    return response.data;
  }

  /**
   * Notifica completación de curso al instructor
   */
  async notifyCourseCompletion(
    studentId: string,
    courseId: string,
    courseTitle: string,
    instructorId: string
  ): Promise<void> {
    await axios.post(buildApiUrl(`${this.baseUrl}/course-completion`), {
      student_id: studentId,
      course_id: courseId,
      course_title: courseTitle,
    }, { headers: getAuthHeaders() });
  }

  /**
   * Notifica progreso significativo al instructor
   */
  async notifyCourseProgress(
    studentId: string,
    courseId: string,
    courseTitle: string,
    instructorId: string,
    progressPercentage: number
  ): Promise<void> {
    await axios.post(buildApiUrl(`${this.baseUrl}/course-progress`), {
      student_id: studentId,
      course_id: courseId,
      course_title: courseTitle,
      instructor_id: instructorId,
      progress_percentage: progressPercentage
    }, { headers: getAuthHeaders() });
  }

  /**
   * Notifica nueva inscripción al instructor
   */
  async notifyNewEnrollment(
    studentId: string,
    courseId: string,
    courseTitle: string,
    instructorId: string,
    studentName: string
  ): Promise<void> {
    await axios.post(buildApiUrl(`${this.baseUrl}/enrollment`), {
      student_id: studentId,
      course_id: courseId,
      course_title: courseTitle,
      instructor_id: instructorId,
      student_name: studentName
    }, { headers: getAuthHeaders() });
  }

  /**
   * Notifica completación de quiz al instructor
   */
  async notifyQuizCompletion(
    studentId: string,
    quizId: string,
    quizTitle: string,
    courseId: string,
    instructorId: string,
    score: number
  ): Promise<void> {
    await axios.post(buildApiUrl(`${this.baseUrl}/quiz-completion`), {
      student_id: studentId,
      quiz_id: quizId,
      quiz_title: quizTitle,
      course_id: courseId,
      instructor_id: instructorId,
      score: score
    }, { headers: getAuthHeaders() });
  }

  /**
   * Formatea el timestamp de una notificación
   */
  formatTimestamp(timestamp: string): string {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  }

  /**
   * Obtiene el icono según el tipo de notificación
   */
  getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'course_completion': '🎓',
      'course_progress': '📈',
      'new_course': '📚',
      'enrollment': '👥',
      'quiz_completed': '✅',
      'assignment_submitted': '📝',
      'certificate_awarded': '🏆',
      'course_published': '🚀',
      'lesson_completed': '✏️',
      'system_update': '🔔'
    };
    return iconMap[type] || '🔔';
  }

  /**
   * Convierte tipo de backend a tipo de frontend
   */
  mapNotificationType(backendType: string): 'success' | 'warning' | 'error' | 'info' {
    const typeMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      'course_completion': 'success',
      'course_progress': 'info',
      'new_course': 'info',
      'enrollment': 'success',
      'quiz_completed': 'success',
      'assignment_submitted': 'info',
      'certificate_awarded': 'success',
      'course_published': 'info',
      'lesson_completed': 'success',
      'system_update': 'warning'
    };
    return typeMap[backendType] || 'info';
  }
}

export const notificationService = new NotificationService();
