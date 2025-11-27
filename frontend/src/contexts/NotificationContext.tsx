/**
 * Context para gestión global de notificaciones
 * Integrado con el sistema de notificaciones existente de Stegmaier LMS
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  notificationService, 
  Notification, 
  NotificationListResponse 
} from '../services/notificationService';
import { pushNotificationService } from '../services/pushNotificationService';
import { useAuth } from './AuthContext';

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  courseCompletions: boolean;
  newCourses: boolean;
  progressUpdates: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
}

interface NotificationContextType {
  // Estado de notificaciones
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Paginación
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  
  // Funciones de gestión
  loadNotifications: (page?: number, status?: 'unread' | 'read' | 'archived') => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  
  // Push notifications
  pushPermissionState: { permission: NotificationPermission; supported: boolean; subscribed: boolean };
  requestPushPermission: () => Promise<NotificationPermission>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
  
  // Preferencias
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  
  // Utilidades
  clearError: () => void;
  showLocalNotification: (title: string, message: string, options?: NotificationOptions) => Promise<void>;
}

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: false,
  courseCompletions: true,
  newCourses: true,
  progressUpdates: true,
  systemUpdates: true,
  marketingEmails: false
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Estado principal
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Push notifications
  const [pushPermissionState, setPushPermissionState] = useState({
    permission: 'default' as NotificationPermission,
    supported: false,
    subscribed: false
  });
  
  // Preferencias
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Inicialización
  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
      initializePushNotifications();
      loadPreferences();
    }
  }, [isAuthenticated]);

  // Polling para nuevas notificaciones cada 30 segundos
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const initializeNotifications = async () => {
    try {
      await loadNotifications(1);
      await refreshUnreadCount();
    } catch (err) {
      console.error('Error initializing notifications:', err);
      setError('Error cargando notificaciones');
    }
  };

  const initializePushNotifications = async () => {
    try {
      const initialized = await pushNotificationService.initialize();
      if (initialized) {
        const state = await pushNotificationService.getPermissionState();
        setPushPermissionState(state);
      }
    } catch (err) {
      console.error('Error initializing push notifications:', err);
    }
  };

  const loadNotifications = useCallback(async (
    page: number = 1, 
    status?: 'unread' | 'read' | 'archived'
  ) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const response: NotificationListResponse = await notificationService.getUserNotifications(
        status,
        page,
        20
      );

      // Ensure notifications is always an array
      const notificationsArray = Array.isArray(response?.notifications) ? response.notifications : [];

      if (page === 1) {
        setNotifications(notificationsArray);
      } else {
        setNotifications(prev => [...(Array.isArray(prev) ? prev : []), ...notificationsArray]);
      }

      setCurrentPage(page);
      setTotalPages(Math.ceil((response?.total || 0) / 20));
      setHasMore(page < Math.ceil((response?.total || 0) / 20));
      setUnreadCount(response?.unread_count || 0);

    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Error cargando notificaciones');
      // Set empty array on error to prevent undefined
      if (page === 1) {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'read' as const }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Error marcando notificación como leída');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, status: 'read' as const }))
      );
      
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Error marcando todas las notificaciones como leídas');
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      const wasUnread = notifications.find(n => n.id === notificationId && n.status === 'unread');
      
      setNotifications(prev => (Array.isArray(prev) ? prev : []).filter(n => n.id !== notificationId));
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Error eliminando notificación');
    }
  }, [notifications]);

  const archiveNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.archiveNotification(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'archived' as const }
            : notification
        )
      );
      
      const wasUnread = notifications.find(n => n.id === notificationId && n.status === 'unread');
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      console.error('Error archiving notification:', err);
      setError('Error archivando notificación');
    }
  }, [notifications]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error refreshing unread count:', err);
    }
  }, [isAuthenticated]);

  const requestPushPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const permission = await pushNotificationService.requestPermission();
      const state = await pushNotificationService.getPermissionState();
      setPushPermissionState(state);
      
      // Actualizar preferencias
      if (permission === 'granted') {
        await updatePreferences({ pushNotifications: true });
      }
      
      return permission;
    } catch (err) {
      console.error('Error requesting push permission:', err);
      setError('Error solicitando permisos de notificación');
      return 'denied';
    }
  }, []);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    try {
      const subscription = await pushNotificationService.subscribe();
      const state = await pushNotificationService.getPermissionState();
      setPushPermissionState(state);
      
      return !!subscription;
    } catch (err) {
      console.error('Error subscribing to push:', err);
      setError('Error suscribiéndose a notificaciones push');
      return false;
    }
  }, []);

  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    try {
      const success = await pushNotificationService.unsubscribe();
      const state = await pushNotificationService.getPermissionState();
      setPushPermissionState(state);
      
      if (success) {
        await updatePreferences({ pushNotifications: false });
      }
      
      return success;
    } catch (err) {
      console.error('Error unsubscribing from push:', err);
      setError('Error cancelando suscripción a notificaciones push');
      return false;
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const stored = localStorage.getItem(`notification_preferences_${user?.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  }, [user?.id]);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    try {
      const newPreferences = { ...preferences, ...prefs };
      setPreferences(newPreferences);
      
      // Guardar en localStorage
      localStorage.setItem(
        `notification_preferences_${user?.id}`, 
        JSON.stringify(newPreferences)
      );
      
      // TODO: Enviar al backend cuando esté implementado
      
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Error actualizando preferencias');
    }
  }, [preferences, user?.id]);

  const showLocalNotification = useCallback(async (
    title: string, 
    message: string, 
    options: NotificationOptions = {}
  ) => {
    try {
      await pushNotificationService.showNotification(title, {
        body: message,
        ...options
      });
    } catch (err) {
      console.error('Error showing local notification:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: NotificationContextType = {
    // Estado
    notifications,
    unreadCount,
    loading,
    error,
    
    // Paginación
    currentPage,
    totalPages,
    hasMore,
    
    // Funciones
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    refreshUnreadCount,
    
    // Push notifications
    pushPermissionState,
    requestPushPermission,
    subscribeToPush,
    unsubscribeFromPush,
    
    // Preferencias
    preferences,
    updatePreferences,
    
    // Utilidades
    clearError,
    showLocalNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personalizado
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
