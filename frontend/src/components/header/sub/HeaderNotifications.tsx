/**
 * Sistema de notificaciones para el header contextual
 * Implementa principios de desarrollo responsivo, mantenible y escalable del EncoderGroup
 * Integrado con NotificationCenter completo
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} no leídas)` : ''}`}
          >
            <Bell className="w-5 h-5" aria-hidden="true" />

            {/* Badge de contador */}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80 max-w-sm" align="end">
          {/* Header del panel */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <ScrollArea className="max-h-96">
            {visibleNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    px-4 py-3 border-b last:border-b-0
                    ${!notification.read ? 'bg-accent/50' : ''}
                    hover:bg-accent cursor-pointer transition-colors relative
                  `}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono de tipo */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="h-6 w-6"
                            aria-label="Eliminar notificación"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>

                      {/* Acción opcional */}
                      {notification.action && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            notification.action!.onClick();
                          }}
                          className="h-auto p-0 text-xs font-medium"
                        >
                          {notification.action.label}
                        </Button>
                      )}

                      {/* Indicador de no leída */}
                      {!notification.read && (
                        <div className="absolute right-2 top-3 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>

          {/* Footer con enlace a ver todas */}
          <DropdownMenuSeparator />
          <div className="px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setNotificationCenterOpen(true);
              }}
              className="w-full justify-center text-sm font-medium"
            >
              Ver todas las notificaciones
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* NotificationCenter completo */}
      <NotificationCenter
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
      />
    </div>
  );
};

export default HeaderNotifications;
