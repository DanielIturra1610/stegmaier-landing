/**
 * Sistema de notificaciones para el header contextual
 * Implementa principios de desarrollo responsivo, mantenible y escalable del EncoderGroup
 * Integrado con NotificationCenter completo
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { headerAnimations } from '../animations';
import { notificationService } from '../../../services/notificationService';
import { useNotifications } from '../../../contexts/NotificationContext';
import { NotificationCenter } from '../../notifications/NotificationCenter';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface HeaderNotificationsProps {
  className?: string;
  maxVisible?: number;
}

export const HeaderNotifications: React.FC<HeaderNotificationsProps> = ({ 
  className = '',
  maxVisible = 5 
}) => {
  // Usar el contexto de notificaciones para integración completa
  const { unreadCount, refreshUnreadCount } = useNotifications();
  
  // Estados locales para el dropdown básico
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  // Cargar notificaciones básicas para el dropdown
  useEffect(() => {
    loadBasicNotifications();
  }, []);

  const loadBasicNotifications = async () => {
    try {
      const response = await notificationService.getUserNotifications('unread', 1, maxVisible);
      
      // Convertir notificaciones del backend al formato del frontend
      const frontendNotifications: Notification[] = response.notifications.map(backendNotif => ({
        id: backendNotif.id,
        type: notificationService.mapNotificationType(backendNotif.type),
        title: backendNotif.title,
        message: backendNotif.message,
        timestamp: new Date(backendNotif.created_at),
        read: backendNotif.status === 'read',
        action: backendNotif.action_url ? {
          label: backendNotif.action_label || 'Ver más',
          onClick: () => window.location.href = backendNotif.action_url!
        } : undefined
      }));
      
      setNotifications(frontendNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback silencioso - el contexto manejará el estado
      setNotifications([]);
    }
  };

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      );
      // Refrescar el contador desde el contexto
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [refreshUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [refreshUnreadCount]);

  const removeNotification = useCallback(async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => (Array.isArray(prev) ? prev : []).filter(n => n.id !== id));
      // Refrescar el contador desde el contexto
      refreshUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [refreshUnreadCount]);

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'info':
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return notificationService.formatTimestamp(timestamp.toISOString());
  };

  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div className={`relative ${className}`}>
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-lg
          ${headerAnimations.actions.button}
          text-gray-500 dark:text-gray-400
          hover:text-gray-700 dark:hover:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-800
        `}
        aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} no leídas)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className={`
            absolute -top-1 -right-1 
            w-5 h-5 
            bg-red-500 text-white 
            text-xs font-bold 
            rounded-full 
            flex items-center justify-center
            ${headerAnimations.onlineIndicator.online}
          `}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div className={`
            absolute right-0 top-full mt-2 z-20
            ${headerAnimations.actions.dropdown}
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg
            w-80 max-w-sm
          `}>
            {/* Header del panel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={`
                    text-xs text-blue-600 dark:text-blue-400
                    hover:text-blue-700 dark:hover:text-blue-300
                    ${headerAnimations.actions.button}
                  `}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="max-h-96 overflow-y-auto">
              {visibleNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No tienes notificaciones
                  </p>
                </div>
              ) : (
                visibleNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0
                      ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                      ${headerAnimations.actions.button}
                      cursor-pointer
                    `}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icono de tipo */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`
                            text-sm font-medium 
                            ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
                          `}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className={`
                                p-1 rounded
                                text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                                hover:bg-gray-200 dark:hover:bg-gray-600
                                ${headerAnimations.actions.button}
                              `}
                              aria-label="Eliminar notificación"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        
                        {/* Acción opcional */}
                        {notification.action && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.action!.onClick();
                            }}
                            className={`
                              text-xs text-blue-600 dark:text-blue-400
                              hover:text-blue-700 dark:hover:text-blue-300
                              font-medium
                              ${headerAnimations.actions.button}
                            `}
                          >
                            {notification.action.label}
                          </button>
                        )}
                        
                        {/* Indicador de no leída */}
                        {!notification.read && (
                          <div className="absolute right-2 top-3 w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer con enlace a ver todas */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setNotificationCenterOpen(true);
                }}
                className={`
                  text-sm text-blue-600 dark:text-blue-400
                  hover:text-blue-700 dark:hover:text-blue-300
                  font-medium
                  ${headerAnimations.actions.button}
                `}
              >
                Ver todas las notificaciones
              </button>
            </div>
          </div>
        </>
      )}

      {/* NotificationCenter completo */}
      <NotificationCenter
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
      />
    </div>
  );
};

export default HeaderNotifications;
