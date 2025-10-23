/**
 * Tipos de notificaciones para el sistema LMS
 * Siguiendo principios del EncoderGroup para tipado consistente
 */

export type NotificationType = 
  | 'COURSE_COMPLETION'
  | 'COURSE_PROGRESS' 
  | 'COURSE_ENROLLMENT'
  | 'QUIZ_COMPLETION'
  | 'NEW_COURSE_ANNOUNCEMENT'
  | 'SYSTEM_UPDATE'
  | 'REMINDER'
  | 'ACHIEVEMENT'
  | 'MESSAGE'
  | 'ALERT';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export type NotificationChannel = 'email' | 'push' | 'in_app';

export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'disabled';

export interface NotificationAction {
  id: string;
  label: string;
  url?: string;
  type?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationMetadata {
  // Snake_case versions (from backend)
  course_id?: string;
  course_name?: string;
  lesson_id?: string;
  lesson_name?: string;
  quiz_id?: string;
  quiz_name?: string;
  certificate_id?: string;
  assignment_id?: string;
  progress_percentage?: number;
  achievement_type?: string;
  // CamelCase versions (transformed by axios)
  courseId?: string;
  courseName?: string;
  lessonId?: string;
  lessonName?: string;
  quizId?: string;
  quizName?: string;
  certificateId?: string;
  assignmentId?: string;
  progressPercentage?: number;
  achievementType?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  is_read: boolean;
  metadata?: NotificationMetadata;
  actions?: NotificationAction[];
  created_at: string;
  updated_at: string;
  read_at?: string;
  archived_at?: string;
}

export interface NotificationPreferenceGroup {
  channels: {
    [key in NotificationChannel]: boolean;
  };
  frequency: NotificationFrequency;
}

export interface NotificationPreferences {
  [key: string]: NotificationPreferenceGroup;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  actions?: Omit<NotificationAction, 'id'>[];
}

export interface CreateNotificationData {
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
  metadata?: NotificationMetadata;
}

// Tipos para componentes UI
export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => Promise<void>;
  onMarkAsUnread?: (id: string) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
}

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  maxHeight?: string;
}
