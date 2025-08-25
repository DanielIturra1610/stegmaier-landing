/**
 * Servicio especializado para notificaciones de assignments
 * Integra con el NotificationService existente y sistema de emails
 */
import { notificationService, CreateNotificationData, BulkNotificationData } from './notificationService';
import { emailService } from './emailService';
import { Assignment, AssignmentSubmission } from '../types/assignment';
import { assignmentService } from './assignmentService';
import { enrollmentService } from './enrollmentService';

export interface AssignmentNotificationConfig {
  due_date_reminders: boolean;
  submission_confirmations: boolean;
  grading_notifications: boolean;
  revision_requests: boolean;
  email_notifications: boolean;
  browser_notifications: boolean;
}

class AssignmentNotificationService {
  private defaultConfig: AssignmentNotificationConfig = {
    due_date_reminders: true,
    submission_confirmations: true,
    grading_notifications: true,
    revision_requests: true,
    email_notifications: true,
    browser_notifications: true
  };

  /**
   * Programar notificaciones automáticas para un assignment
   */
  async scheduleAssignmentNotifications(assignment: Assignment): Promise<void> {
    try {
      console.log('📅 [AssignmentNotifications] Scheduling notifications for:', assignment.title);

      if (!assignment.due_date) {
        console.log('⚠️ No due date set, skipping notifications');
        return;
      }

      const dueDate = new Date(assignment.due_date);
      const now = new Date();

      // Obtener estudiantes inscritos en el curso
      const enrollments = await enrollmentService.getCourseEnrollments(assignment.course_id);
      const studentIds = enrollments
        .filter(e => e.user_role === 'student' && e.status === 'active')
        .map(e => e.user_id);

      if (studentIds.length === 0) {
        console.log('⚠️ No students enrolled in course');
        return;
      }

      // Programar recordatorios de due date
      await this.scheduleDueDateReminders(assignment, studentIds, dueDate, now);

      console.log('✅ [AssignmentNotifications] Scheduled notifications for', studentIds.length, 'students');

    } catch (error) {
      console.error('❌ [AssignmentNotifications] Error scheduling notifications:', error);
    }
  }

  /**
   * Programar recordatorios de due date
   */
  private async scheduleDueDateReminders(
    assignment: Assignment,
    studentIds: string[],
    dueDate: Date,
    now: Date
  ): Promise<void> {
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Recordatorio 7 días antes
    if (daysDiff <= 7 && daysDiff > 3) {
      await this.sendBulkNotification({
        recipient_ids: studentIds,
        type: 'assignment_due_reminder_week',
        title: 'Assignment próximo a vencer',
        message: `El assignment "${assignment.title}" vence en una semana (${dueDate.toLocaleDateString('es-ES')})`,
        metadata: {
          assignment_id: assignment.id,
          course_id: assignment.course_id,
          due_date: assignment.due_date,
          days_remaining: daysDiff
        },
        action_url: `/platform/courses/${assignment.course_id}`,
        action_label: 'Ver Assignment'
      });
    }

    // Recordatorio 3 días antes
    if (daysDiff <= 3 && daysDiff > 1) {
      await this.sendBulkNotification({
        recipient_ids: studentIds,
        type: 'assignment_due_reminder_3days',
        title: '⚠️ Assignment vence pronto',
        message: `El assignment "${assignment.title}" vence en ${daysDiff} días`,
        metadata: {
          assignment_id: assignment.id,
          course_id: assignment.course_id,
          due_date: assignment.due_date,
          days_remaining: daysDiff
        },
        action_url: `/platform/courses/${assignment.course_id}`,
        action_label: 'Completar Assignment'
      });
    }

    // Recordatorio 1 día antes
    if (daysDiff === 1) {
      await this.sendBulkNotification({
        recipient_ids: studentIds,
        type: 'assignment_due_reminder_1day',
        title: '🚨 Assignment vence mañana',
        message: `¡Último recordatorio! El assignment "${assignment.title}" vence mañana`,
        metadata: {
          assignment_id: assignment.id,
          course_id: assignment.course_id,
          due_date: assignment.due_date,
          days_remaining: 1
        },
        action_url: `/platform/courses/${assignment.course_id}`,
        action_label: 'Completar Ahora'
      });
    }

    // Notificación de vencimiento
    if (daysDiff === 0) {
      await this.sendBulkNotification({
        recipient_ids: studentIds,
        type: 'assignment_due_today',
        title: '⏰ Assignment vence hoy',
        message: `El assignment "${assignment.title}" vence hoy. ¡No olvides enviarlo!`,
        metadata: {
          assignment_id: assignment.id,
          course_id: assignment.course_id,
          due_date: assignment.due_date,
          days_remaining: 0
        },
        action_url: `/platform/courses/${assignment.course_id}`,
        action_label: 'Enviar Assignment'
      });
    }
  }

  /**
   * Enviar notificación de submission recibida
   */
  async notifySubmissionReceived(submission: AssignmentSubmission, assignment: Assignment): Promise<void> {
    try {
      console.log('📨 [AssignmentNotifications] Notifying submission received:', submission.id);

      // Notificación al estudiante
      await notificationService.createNotification({
        recipient_id: submission.student_id,
        type: 'assignment_submission_received',
        title: 'Assignment enviado exitosamente',
        message: `Tu submission para "${assignment.title}" ha sido recibida y está siendo revisada`,
        metadata: {
          assignment_id: assignment.id,
          submission_id: submission.id,
          course_id: assignment.course_id,
          submitted_at: submission.submitted_at
        },
        action_url: `/platform/courses/${assignment.course_id}`,
        action_label: 'Ver Submission'
      });

      // Obtener instructores del curso
      const courseEnrollments = await enrollmentService.getCourseEnrollments(assignment.course_id);
      const instructorIds = courseEnrollments
        .filter(e => ['instructor', 'admin'].includes(e.user_role))
        .map(e => e.user_id);

      if (instructorIds.length > 0) {
        // Notificación a instructores
        await this.sendBulkNotification({
          recipient_ids: instructorIds,
          type: 'assignment_submission_for_grading',
          title: 'Nueva submission para calificar',
          message: `${submission.student_name || 'Un estudiante'} ha enviado una submission para "${assignment.title}"`,
          metadata: {
            assignment_id: assignment.id,
            submission_id: submission.id,
            course_id: assignment.course_id,
            student_id: submission.student_id,
            submitted_at: submission.submitted_at
          },
          action_url: `/platform/admin/assignments/${assignment.id}/grading`,
          action_label: 'Revisar Submission'
        });
      }

      console.log('✅ [AssignmentNotifications] Submission notifications sent');

    } catch (error) {
      console.error('❌ [AssignmentNotifications] Error sending submission notifications:', error);
    }
  }

  /**
   * Enviar notificación de calificación disponible
   */
  async notifyGradeAvailable(submission: AssignmentSubmission, assignment: Assignment): Promise<void> {
    try {
      console.log('🎯 [AssignmentNotifications] Notifying grade available:', submission.id);

      await notificationService.createNotification({
        recipient_id: submission.student_id,
        type: 'assignment_graded',
        title: 'Assignment calificado',
        message: `Tu submission para "${assignment.title}" ha sido calificada. Puntuación: ${submission.grade}/${assignment.max_points}`,
        metadata: {
          assignment_id: assignment.id,
          submission_id: submission.id,
          course_id: assignment.course_id,
          grade: submission.grade,
          max_points: assignment.max_points,
          graded_at: submission.graded_at
        },
        action_url: `/platform/courses/${assignment.course_id}`,
        action_label: 'Ver Calificación'
      });

      // Enviar email si está habilitado
      if (this.defaultConfig.email_notifications) {
        await this.sendGradeEmail(submission, assignment);
      }

      console.log('✅ [AssignmentNotifications] Grade notification sent');

    } catch (error) {
      console.error('❌ [AssignmentNotifications] Error sending grade notification:', error);
    }
  }

  /**
   * Enviar notificación de solicitud de revisión
   */
  async notifyRevisionRequested(submission: AssignmentSubmission, assignment: Assignment, message: string): Promise<void> {
    try {
      console.log('🔄 [AssignmentNotifications] Notifying revision requested:', submission.id);

      await notificationService.createNotification({
        recipient_id: submission.student_id,
        type: 'assignment_revision_requested',
        title: 'Revisión solicitada en assignment',
        message: `Se ha solicitado una revisión en tu submission para "${assignment.title}": ${message.substring(0, 100)}...`,
        metadata: {
          assignment_id: assignment.id,
          submission_id: submission.id,
          course_id: assignment.course_id,
          revision_message: message
        },
        action_url: `/platform/courses/${assignment.course_id}`,
        action_label: 'Ver Comentarios'
      });

      console.log('✅ [AssignmentNotifications] Revision request notification sent');

    } catch (error) {
      console.error('❌ [AssignmentNotifications] Error sending revision notification:', error);
    }
  }

  /**
   * Enviar notificaciones de assignments vencidos sin enviar
   */
  async notifyOverdueAssignments(): Promise<void> {
    try {
      console.log('⏰ [AssignmentNotifications] Checking for overdue assignments...');

      const now = new Date();
      
      // Obtener todos los assignments activos con due date pasado
      // const overdueAssignments = await assignmentService.getOverdueAssignments();

      // Por ahora simulamos la lógica
      // En implementación real, esto sería un cron job en el backend

      console.log('✅ [AssignmentNotifications] Overdue check completed');

    } catch (error) {
      console.error('❌ [AssignmentNotifications] Error checking overdue assignments:', error);
    }
  }

  /**
   * Enviar notificación masiva
   */
  private async sendBulkNotification(data: BulkNotificationData): Promise<void> {
    try {
      await notificationService.createBulkNotification(data);
      
      // Enviar emails si está habilitado
      if (this.defaultConfig.email_notifications) {
        await this.sendBulkEmail(data);
      }

      // Enviar notificaciones del navegador si está habilitado
      if (this.defaultConfig.browser_notifications) {
        await this.sendBrowserNotifications(data);
      }

    } catch (error) {
      console.error('❌ [AssignmentNotifications] Error sending bulk notification:', error);
    }
  }

  /**
   * Enviar email de calificación
   */
  private async sendGradeEmail(submission: AssignmentSubmission, assignment: Assignment): Promise<void> {
    try {
      const emailData = {
        to: [submission.student_email || ''],
        subject: `Calificación disponible: ${assignment.title}`,
        template: 'assignment_graded',
        context: {
          student_name: submission.student_name,
          assignment_title: assignment.title,
          grade: submission.grade,
          max_points: assignment.max_points,
          feedback: submission.feedback,
          course_url: `${window.location.origin}/platform/courses/${assignment.course_id}`
        }
      };

      await emailService.sendEmail(emailData);
      console.log('📧 [AssignmentNotifications] Grade email sent');

    } catch (error) {
      console.error('❌ [AssignmentNotifications] Error sending grade email:', error);
    }
  }

  /**
   * Enviar emails masivos
   */
  private async sendBulkEmail(data: BulkNotificationData): Promise<void> {
    try {
      const emailData = {
        to: data.recipient_ids.map(id => `user-${id}@example.com`), // En real, obtener emails reales
        subject: data.title,
        template: 'assignment_reminder',
        context: {
          title: data.title,
          message: data.message,
          action_url: data.action_url,
          action_label: data.action_label
        }
      };

      await emailService.sendBulkEmail(emailData);
      console.log('📧 [AssignmentNotifications] Bulk email sent to', data.recipient_ids.length, 'recipients');

    } catch (error) {
      console.error('❌ [AssignmentNotifications] Error sending bulk email:', error);
    }
  }

  /**
   * Enviar notificaciones del navegador
   */
  private async sendBrowserNotifications(data: BulkNotificationData): Promise<void> {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        data.recipient_ids.forEach(() => {
          new Notification(data.title, {
            body: data.message,
            icon: '/favicon.ico',
            tag: `assignment-${data.metadata?.assignment_id}`
          });
        });
      }
    } catch (error) {
      console.error('❌ [AssignmentNotifications] Error sending browser notifications:', error);
    }
  }

  /**
   * Solicitar permisos de notificación del navegador
   */
  async requestBrowserNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('⚠️ Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

export const assignmentNotificationService = new AssignmentNotificationService();
export default assignmentNotificationService;
