/**
 * Componente de notificaciones para assignments
 * Maneja alertas sobre due dates, submissions pendientes y calificaciones
 */
import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Assignment, AssignmentSubmission } from '../../types/assignment';
import { assignmentService } from '../../services/assignmentService';

interface AssignmentNotification {
  id: string;
  type: 'due_soon' | 'overdue' | 'submitted' | 'graded' | 'returned';
  title: string;
  message: string;
  assignment: Assignment;
  submission?: AssignmentSubmission;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  is_read: boolean;
}

interface AssignmentNotificationsProps {
  courseId?: string;
  userId?: string;
  onNotificationClick?: (notification: AssignmentNotification) => void;
}

export const AssignmentNotifications: React.FC<AssignmentNotificationsProps> = ({
  courseId,
  userId,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<AssignmentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Configurar polling para actualizaciones periódicas
    const interval = setInterval(loadNotifications, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, [courseId, userId]);

  const loadNotifications = async () => {
    try {
      console.log('🔔 [AssignmentNotifications] Loading notifications...');
      
      // Obtener assignments del curso actual o del usuario
      let assignments: Assignment[] = [];
      if (courseId) {
        assignments = await assignmentService.getCourseAssignments(courseId);
      } else if (userId) {
        assignments = await assignmentService.getUserAssignments();
      }

      const generatedNotifications: AssignmentNotification[] = [];
      const now = new Date();

      for (const assignment of assignments) {
        // Obtener submissions del usuario para este assignment
        let userSubmissions: AssignmentSubmission[] = [];
        try {
          userSubmissions = await assignmentService.getUserSubmissions(assignment.id);
        } catch (error) {
          console.log('No submissions found for assignment:', assignment.id);
        }

        const latestSubmission = userSubmissions.length > 0 
          ? userSubmissions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;

        // Generar notificaciones basadas en estado del assignment
        if (assignment.due_date) {
          const dueDate = new Date(assignment.due_date);
          const timeDiff = dueDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

          // Assignment vencido sin submission
          if (daysDiff < 0 && (!latestSubmission || latestSubmission.status === 'in_progress')) {
            generatedNotifications.push({
              id: `overdue-${assignment.id}`,
              type: 'overdue',
              title: 'Assignment Vencido',
              message: `"${assignment.title}" venció hace ${Math.abs(daysDiff)} días`,
              assignment,
              submission: latestSubmission || undefined,
              priority: 'high',
              created_at: assignment.due_date,
              is_read: false
            });
          }
          
          // Assignment próximo a vencer (1-3 días)
          else if (daysDiff <= 3 && daysDiff > 0 && (!latestSubmission || latestSubmission.status === 'in_progress')) {
            generatedNotifications.push({
              id: `due-soon-${assignment.id}`,
              type: 'due_soon',
              title: 'Assignment Próximo a Vencer',
              message: `"${assignment.title}" vence en ${daysDiff} día${daysDiff > 1 ? 's' : ''}`,
              assignment,
              submission: latestSubmission || undefined,
              priority: daysDiff === 1 ? 'high' : 'medium',
              created_at: new Date().toISOString(),
              is_read: false
            });
          }
        }

        // Notificaciones de submissions
        if (latestSubmission) {
          if (latestSubmission.status === 'submitted' && latestSubmission.grade === null) {
            generatedNotifications.push({
              id: `submitted-${latestSubmission.id}`,
              type: 'submitted',
              title: 'Assignment Enviado',
              message: `Tu submission para "${assignment.title}" está siendo revisada`,
              assignment,
              submission: latestSubmission,
              priority: 'low',
              created_at: latestSubmission.submitted_at || latestSubmission.updated_at,
              is_read: false
            });
          }

          if (latestSubmission.status === 'graded' && latestSubmission.grade !== null) {
            generatedNotifications.push({
              id: `graded-${latestSubmission.id}`,
              type: 'graded',
              title: 'Assignment Calificado',
              message: `Has recibido ${latestSubmission.grade}/${assignment.max_points} puntos en "${assignment.title}"`,
              assignment,
              submission: latestSubmission,
              priority: 'medium',
              created_at: latestSubmission.graded_at || latestSubmission.updated_at,
              is_read: false
            });
          }
        }
      }

      // Ordenar por prioridad y fecha
      const sortedNotifications = generatedNotifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter(n => !n.is_read).length);
      
      console.log('🔔 [AssignmentNotifications] Loaded', sortedNotifications.length, 'notifications');

    } catch (error) {
      console.error('❌ [AssignmentNotifications] Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: AssignmentNotification['type']) => {
    switch (type) {
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'due_soon':
        return <ClockIcon className="h-5 w-5 text-orange-500" />;
      case 'submitted':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'graded':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: AssignmentNotification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-orange-500 bg-orange-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleNotificationClick = (notification: AssignmentNotification) => {
    markAsRead(notification.id);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <BellIcon className="h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Notificaciones de Assignments
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <BellIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No tienes notificaciones de assignments</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-25' : ''
                  } ${getPriorityColor(notification.priority)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-gray-900 ${!notification.is_read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                      className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                  setUnreadCount(0);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Marcar todas como leídas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentNotifications;
