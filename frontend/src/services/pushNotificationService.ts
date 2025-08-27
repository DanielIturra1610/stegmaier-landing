/**
 * Servicio para Web Push Notifications
 * Integrado con el sistema de notificaciones existente de Stegmaier LMS
 */
import { notificationService } from './notificationService';
import { buildApiUrl } from '../config/api.config';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
  subscribed: boolean;
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey = (import.meta as any)?.env?.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM-8Ll2OkuefZx7c27y6HyP9zt3J4FhJKhUQfqPx5f8BdHxmqZx0q4';

  /**
   * Inicializa el servicio de push notifications
   */
  async initialize(): Promise<boolean> {
    try {
      // Verificar soporte para Service Workers y Notifications
      if (!this.isSupported()) {
        console.warn('Push notifications no soportadas en este navegador');
        return false;
      }

      // Registrar Service Worker
      this.swRegistration = await this.registerServiceWorker();
      
      // Configurar event listeners para mensajes del SW
      this.setupMessageListeners();

      return true;
    } catch (error) {
      console.error('Error inicializando push notifications:', error);
      return false;
    }
  }

  /**
   * Verifica si el navegador soporta push notifications
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  /**
   * Obtiene el estado actual de permisos
   */
  async getPermissionState(): Promise<NotificationPermissionState> {
    const permission = Notification.permission;
    const supported = this.isSupported();
    
    let subscribed = false;
    if (supported && this.swRegistration) {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      subscribed = !!subscription;
    }

    return {
      permission,
      supported,
      subscribed
    };
  }

  /**
   * Solicita permisos para notificaciones
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notificaciones no soportadas');
    }

    const permission = await Notification.requestPermission();
    
    // Si se conceden permisos, intentar suscribirse automáticamente
    if (permission === 'granted') {
      await this.subscribe();
    }

    return permission;
  }

  /**
   * Suscribe al usuario para push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    try {
      if (!this.swRegistration) {
        throw new Error('Service Worker no registrado');
      }

      if (Notification.permission !== 'granted') {
        throw new Error('Permisos no concedidos');
      }

      // Convertir VAPID key a Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      // Crear suscripción
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      });

      // Enviar suscripción al backend
      await this.sendSubscriptionToBackend(subscription);

      return subscription;
    } catch (error) {
      console.error('Error suscribiendo a push notifications:', error);
      return null;
    }
  }

  /**
   * Cancela la suscripción a push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (!subscription) {
        return true;
      }

      // Cancelar suscripción en el navegador
      const success = await subscription.unsubscribe();

      if (success) {
        // Notificar al backend
        await this.removeSubscriptionFromBackend(subscription);
      }

      return success;
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      return false;
    }
  }

  /**
   * Muestra una notificación local
   */
  async showNotification(
    title: string, 
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service Worker no disponible');
    }

    const defaultOptions: NotificationOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        timestamp: Date.now()
      }
    };

    // Crear opciones finales combinando defaults y opciones del usuario
    const finalOptions = { ...defaultOptions, ...options } as any;
    
    // Añadir propiedades no estándar si están soportadas
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      finalOptions.vibrate = [200, 100, 200];
    }
    
    // Añadir acciones para notificaciones interactivas
    if (!finalOptions.actions) {
      finalOptions.actions = [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/icons/close-icon.png'
        }
      ];
    }

    await this.swRegistration.showNotification(title, finalOptions);
  }

  /**
   * Registra el Service Worker
   */
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    const registration = await navigator.serviceWorker.register(
      '/sw.js',
      { scope: '/' }
    );

    // Esperar a que esté activo
    await navigator.serviceWorker.ready;

    return registration;
  }

  /**
   * Configura listeners para mensajes del Service Worker
   */
  private setupMessageListeners(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'NOTIFICATION_CLICKED':
          this.handleNotificationClick(data);
          break;
        case 'NOTIFICATION_CLOSED':
          this.handleNotificationClose(data);
          break;
        default:
          console.log('Mensaje desconocido del SW:', event.data);
      }
    });
  }

  /**
   * Maneja clicks en notificaciones
   */
  private handleNotificationClick(data: any): void {
    console.log('Notificación clickeada:', data);
    
    // Si hay una URL de acción, navegar a ella
    if (data.action_url) {
      window.open(data.action_url, '_blank');
    }
    
    // Marcar como leída si es una notificación del sistema
    if (data.notification_id) {
      notificationService.markAsRead(data.notification_id).catch(console.error);
    }
  }

  /**
   * Maneja cierre de notificaciones
   */
  private handleNotificationClose(data: any): void {
    console.log('Notificación cerrada:', data);
    // Aquí se podrían agregar analytics o tracking
  }

  /**
   * Envía la suscripción al backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Enviar al endpoint del backend
      const response = await fetch(buildApiUrl('push-subscriptions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        throw new Error('Error enviando suscripción al backend');
      }
    } catch (error) {
      console.error('Error enviando suscripción:', error);
      throw error;
    }
  }

  /**
   * Remueve la suscripción del backend
   */
  private async removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch(buildApiUrl('push-subscriptions'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      if (!response.ok) {
        throw new Error('Error removiendo suscripción del backend');
      }
    } catch (error) {
      console.error('Error removiendo suscripción:', error);
    }
  }

  /**
   * Convierte VAPID key de base64 a Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convierte ArrayBuffer a base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const pushNotificationService = new PushNotificationService();
