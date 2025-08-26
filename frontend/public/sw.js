/**
 * Service Worker para Stegmaier LMS
 * Maneja push notifications y cache strategies
 */

const CACHE_NAME = 'stegmaier-lms-v1';
const API_CACHE_NAME = 'stegmaier-api-cache-v1';

// URLs a cachear para funcionamiento offline
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Interceptar requests para estrategias de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // DESHABILITADO: Service Worker NO debe interceptar API calls
  // Causa problemas con POST requests y mixed routing
  if (false && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Solo cachear responses exitosas
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // DESHABILITADO: No retornar fallback para APIs
          return new Response(
            JSON.stringify({ 
              error: 'API Service Worker disabled', 
              cached: false 
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Estrategia para assets estáticos - Cache First
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then(response => {
            // Cachear assets estáticos exitosos
            if (response.ok && 
                (request.destination === 'script' || 
                 request.destination === 'style' || 
                 request.destination === 'image')) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, responseClone));
            }
            return response;
          });
      })
  );
});

// Manejo de Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'Stegmaier LMS',
    body: 'Nueva notificación disponible',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'stegmaier-notification',
    data: {}
  };

  // Parsear datos del push
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Configurar opciones de notificación
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
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
    ]
  };

  // Mostrar notificación
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Cerrar la notificación
  notification.close();

  // Enviar mensaje al cliente principal
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        // Enviar mensaje a todos los clientes
        clients.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: {
              action,
              notification_id: data.notification_id,
              action_url: data.action_url,
              ...data
            }
          });
        });

        // Manejar acciones específicas
        if (action === 'view' || !action) {
          // Acción por defecto o "ver"
          const urlToOpen = data.action_url || '/platform/notifications';
          
          // Buscar una ventana existente para enfocar
          const existingClient = clients.find(client => {
            return client.url.includes(new URL(urlToOpen, self.location.origin).pathname);
          });

          if (existingClient) {
            return existingClient.focus();
          } else {
            // Abrir nueva ventana/tab
            return self.clients.openWindow(urlToOpen);
          }
        } else if (action === 'close') {
          // Solo cerrar (ya se hizo arriba)
          return Promise.resolve();
        }
      })
  );
});

// Manejo de cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  const data = event.notification.data || {};

  // Enviar mensaje al cliente principal
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_CLOSED',
            data: {
              notification_id: data.notification_id,
              ...data
            }
          });
        });
      })
  );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      fetch('/api/v1/notifications/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getStoredAuthToken()}`
        }
      })
      .then(response => {
        console.log('[SW] Background sync completed');
        return response;
      })
      .catch(error => {
        console.error('[SW] Background sync failed:', error);
        throw error;
      })
    );
  }
});

// Función auxiliar para obtener token de auth del IndexedDB/localStorage
function getStoredAuthToken() {
  // Esta función necesitaría implementarse para acceder al token
  // desde el Service Worker context
  return null;
}

// Manejo de mensajes desde el cliente principal
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'SET_AUTH_TOKEN':
      // Almacenar token para uso en background sync
      // Implementar storage en IndexedDB si es necesario
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

console.log('[SW] Service Worker script loaded');
