/**
 * Componente individual de notificación
 * Maneja interacciones, acciones y formato visual
 * Siguiendo principios del EncoderGroup para componentes reutilizables
 */
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CheckCircle2, 
  Archive, 
  Trash2, 
  ExternalLink, 
  MoreVertical,
  BookOpen,
  Award,
  Bell,
  AlertCircle,
  Info,
  Gift,
  Users,
  MessageSquare
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Notification, NotificationType } from '../../types/notification';
import { useNotifications } from '../../contexts/NotificationContext';

interface NotificationItemProps {
  notification: Notification;
  isLast?: boolean;
}

// Mapeo de tipos a iconos y estilos
const typeConfig: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  COURSE_COMPLETION: {
    icon: Award,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  COURSE_PROGRESS: {
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  COURSE_ENROLLMENT: {
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  QUIZ_COMPLETION: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  NEW_COURSE_ANNOUNCEMENT: {
    icon: Gift,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  SYSTEM_UPDATE: {
    icon: Info,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800'
  },
  REMINDER: {
    icon: Bell,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  ACHIEVEMENT: {
    icon: Award,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800'
  },
  MESSAGE: {
    icon: MessageSquare,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800'
  },
  ALERT: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  isLast = false 
}) => {
  const { markAsRead, markAsUnread, archiveNotification, deleteNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const config = typeConfig[notification.type] || typeConfig.SYSTEM_UPDATE;
  const IconComponent = config.icon;

  const handleMarkAsRead = async () => {
    if (notification.is_read) return;
    
    setIsLoading(true);
    try {
      await markAsRead(notification.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsUnread = async () => {
    if (!notification.is_read) return;
    
    setIsLoading(true);
    try {
      await markAsUnread(notification.id);
    } catch (error) {
      console.error('Error marking as unread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      await archiveNotification(notification.id);
    } catch (error) {
      console.error('Error archiving notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteNotification(notification.id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (actionUrl?: string) => {
    if (actionUrl) {
      window.location.href = actionUrl;
    }
    handleMarkAsRead();
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: es
      });
    } catch {
      return 'Hace un momento';
    }
  };

  return (
    <div
      className={`
        group relative p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer
        ${!notification.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
        ${isLoading ? 'opacity-60 pointer-events-none' : ''}
      `}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start space-x-3">
        {/* Icono de tipo */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} ${config.borderColor} border flex items-center justify-center`}>
          <IconComponent className={`w-5 h-5 ${config.color}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium text-gray-900 dark:text-white ${!notification.is_read ? 'font-semibold' : ''}`}>
                {notification.title}
              </h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {notification.message}
              </p>
              
              {/* Metadata */}
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatTimestamp(notification.created_at)}</span>
                {notification.metadata?.course_name && (
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{notification.metadata.course_name}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Indicador no leído */}
            {!notification.is_read && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full ml-2 mt-1" />
            )}
          </div>

          {/* Acciones de la notificación */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex items-center space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(action.url);
                  }}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  {action.label}
                  {action.url && <ExternalLink className="w-3 h-3 ml-1" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menú de opciones */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[200px] bg-white dark:bg-gray-800 rounded-md p-1 shadow-lg border border-gray-200 dark:border-gray-700 z-50"
              sideOffset={5}
            >
              {notification.is_read ? (
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  onClick={handleMarkAsUnread}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Marcar como no leída
                </DropdownMenu.Item>
              ) : (
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  onClick={handleMarkAsRead}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Marcar como leída
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Item
                className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                onClick={handleArchive}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archivar
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-600 my-1" />

              <DropdownMenu.Item
                className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
};

export default NotificationItem;
