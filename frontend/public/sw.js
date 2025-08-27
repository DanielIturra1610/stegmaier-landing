/**
 * Service Worker para Stegmaier LMS
 * Maneja push notifications y cache strategies
 * ✅ CORREGIDO: URLs HTTPS y configuración centralizada
 */

const CACHE_NAME = 'stegmaier-lms-v1';
const API_CACHE_NAME = 'stegmaier-api-cache-v1';

// ✅ Configuración centralizada de API para Service Worker
const getApiBaseUrl = () => {
  // FORZAR HTTPS en todos los casos de producción
  if (self.location.hostname.includes('railway.app') || 
      self.location.hostname.includes('vercel.app') ||
      self.location.hostname.includes('netlify.app') ||
      self.location.hostname.includes('github.io') ||
      self.location.protocol === 'https:') {
    return 'https://stegmaier-backend-production.up.railway.app/api/v1';
  }
  // Solo en desarrollo local explícito usar HTTP
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api/v1';
  }
  // FALLBACK SEGURO: Siempre HTTPS por defecto
  return 'https://stegmaier-backend-production.up.railway.app/api/v1';
};

const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${getApiBaseUrl()}/${cleanEndpoint}`;
};

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

  // 🚨 CRÍTICO: NO INTERCEPTAR API CALLS - CAUSA PANTALLAS BLANCAS
  // Saltamos COMPLETAMENTE cualquier request a backend APIs
  if (url.hostname.includes('stegmaier-backend') || 
      url.pathname.startsWith('/api/') ||
      url.pathname.includes('/api/') ||
      url.href.includes('/api/')) {
    // NO hacer nada, dejar que el browser maneje directamente
    console.log('[SW] Skipping API request:', url.href);
    return;
  }

  // Solo manejar assets estáticos (JS, CSS, imágenes)
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'document') {
    
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then(response => {
              // Cachear assets estáticos exitosos
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, responseClone))
                  .catch(err => console.error('[SW] Cache error:', err));
              }
              return response;
            })
            .catch(err => {
              console.error('[SW] Fetch error for static asset:', err);
              return new Response('Network Error', { status: 503 });
            });
        })
    );
  }
  // Para todo lo demás, no interceptar
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
      fetch(buildApiUrl('notifications/sync'), {
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
  // En Service Worker context, usar postMessage para solicitar token al cliente
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
