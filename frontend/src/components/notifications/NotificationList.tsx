/**
 * Lista de notificaciones con scroll virtual y carga infinita
 * Componente optimizado para grandes volúmenes de notificaciones
 * Siguiendo principios del EncoderGroup para performance y UX
 */
import React, { useRef, useEffect } from 'react';
import { Loader2, RefreshCw, Bell } from 'lucide-react';
import { Notification } from '../../services/notificationService';
import { NotificationItem } from './NotificationItem';

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading,
  hasMore,
  onLoadMore
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);

  // Intersection Observer para carga automática
  useEffect(() => {
    const loadMoreButton = loadMoreButtonRef.current;
    if (!loadMoreButton || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreButton);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, onLoadMore]);

  // Estado vacío
  if (!loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay notificaciones
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Cuando tengas nuevas notificaciones sobre tus cursos y progreso, aparecerán aquí.
        </p>
      </div>
    );
  }

  // Estado de carga inicial
  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando notificaciones...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto max-h-[50vh]"
      style={{ scrollbarWidth: 'thin' }}
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {notifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            isLast={index === notifications.length - 1}
          />
        ))}
      </div>

      {/* Botón de cargar más / Loading estado */}
      {hasMore && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            ref={loadMoreButtonRef}
            onClick={onLoadMore}
            disabled={loading}
            className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cargando más...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Cargar más notificaciones</span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Indicador de final */}
      {!hasMore && notifications.length > 0 && (
        <div className="py-4 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            No hay más notificaciones
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
