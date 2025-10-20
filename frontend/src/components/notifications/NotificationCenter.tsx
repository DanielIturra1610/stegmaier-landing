/**
 * Centro de notificaciones principal
 * Componente completo con filtros, paginación y gestión de estado
 * Siguiendo principios del EncoderGroup para desarrollo responsivo y escalable
 */
import React, { useState, useEffect } from 'react';
import { Bell, Filter, Check, RefreshCw, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationList } from './NotificationList';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterStatus = 'all' | 'unread' | 'read' | 'archived';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadNotifications,
    markAllAsRead,
    refreshUnreadCount,
    clearError
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Cargar notificaciones al abrir
  useEffect(() => {
    if (isOpen) {
      loadNotifications(1, filterStatus === 'all' ? undefined : filterStatus);
    }
  }, [isOpen, filterStatus]);

  // Refrescar count cuando se abre
  useEffect(() => {
    if (isOpen) {
      refreshUnreadCount();
    }
  }, [isOpen]);

  const handleFilterChange = (newFilter: FilterStatus) => {
    setFilterStatus(newFilter);
    loadNotifications(1, newFilter === 'all' ? undefined : newFilter);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = Math.floor(notifications.length / 20) + 1;
      loadNotifications(nextPage, filterStatus === 'all' ? undefined : filterStatus);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      // Refrescar la lista si estamos en filtro 'unread'
      if (filterStatus === 'unread') {
        loadNotifications(1, 'unread');
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleRefresh = () => {
    loadNotifications(1, filterStatus === 'all' ? undefined : filterStatus);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl max-h-[85vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
          
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Centro de Notificaciones
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount > 0 && `${unreadCount} notificaciones no leídas`}
              </p>
            </div>
          </div>
            
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

          {/* Tabs */}
      <div className="flex bg-gray-50 dark:bg-gray-900 p-1">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
            activeTab === 'notifications'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Notificaciones
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
            activeTab === 'preferences'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Preferencias
        </button>
      </div>

          {activeTab === 'notifications' && (
        <div>
          {/* Filtros y controles */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value as FilterStatus)}
                className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              >
                <option value="all">Todas</option>
                <option value="unread">No leídas</option>
                <option value="read">Leídas</option>
                <option value="archived">Archivadas</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
            </div>

                {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Marcar todas como leídas</span>
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="flex-1 overflow-hidden">
            {error && (
              <div className="p-4 m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <NotificationList
              notifications={notifications}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Configuración de Notificaciones
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Las preferencias de notificación se configurarán próximamente.
          </p>
        </div>
      )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {notifications.length} notificaciones mostradas
          </p>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;
