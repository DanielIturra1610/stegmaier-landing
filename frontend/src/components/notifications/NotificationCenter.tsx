/**
 * Centro de notificaciones principal
 * Componente completo con filtros, paginación y gestión de estado
 * Siguiendo principios del EncoderGroup para desarrollo responsivo y escalable
 */
import React, { useState, useEffect } from 'react';
import { Bell, Filter, Check, RefreshCw, X, Settings } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationList } from './NotificationList';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

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
      const nextPage = Math.floor((notifications?.length || 0) / 20) + 1;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary" />
              <div>
                <DialogTitle className="text-xl">Centro de Notificaciones</DialogTitle>
                <DialogDescription>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {unreadCount} no leídas
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              title="Actualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        <Tabs defaultValue="notifications" className="flex-1 overflow-hidden" onValueChange={(value) => setActiveTab(value as 'notifications' | 'preferences')}>
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="notifications" className="rounded-none">
              <Bell className="w-4 h-4 mr-2" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-none">
              <Settings className="w-4 h-4 mr-2" />
              Preferencias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-0 flex flex-col h-[calc(85vh-12rem)] overflow-hidden">
            {/* Filtros y controles */}
            <div className="flex items-center justify-between p-4 border-b">
              <Select value={filterStatus} onValueChange={(value) => handleFilterChange(value as FilterStatus)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar notificaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unread">No leídas</SelectItem>
                  <SelectItem value="read">Leídas</SelectItem>
                  <SelectItem value="archived">Archivadas</SelectItem>
                </SelectContent>
              </Select>

              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-primary hover:text-primary/90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="flex-1 overflow-y-auto">
              {error && (
                <Alert variant="destructive" className="m-4">
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button variant="ghost" size="icon" onClick={clearError}>
                      <X className="w-4 h-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <NotificationList
                notifications={notifications}
                loading={loading}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
              />
            </div>

            {/* Footer */}
            <Separator />
            <div className="flex items-center justify-between p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                {notifications?.length || 0} notificaciones mostradas
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="mt-0 p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Configuración de Notificaciones</h3>
                <p className="text-sm text-muted-foreground">
                  Las preferencias de notificación se configurarán próximamente.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationCenter;
