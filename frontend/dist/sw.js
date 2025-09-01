console.log('[SW] Service Worker disabled - bypassing all requests');

// NO interceptar NINGÚN request - dejar que la app funcione normalmente
self.addEventListener('fetch', event => {
  // NO hacer nada - dejar que todos los requests pasen sin interceptar
  return;
});

self.addEventListener('install', event => {
  console.log('[SW] Service Worker installed but inactive');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Service Worker activated but not intercepting');
  event.waitUntil(self.clients.claim());
});

// Eliminar completamente cualquier lógica de caching o intercepting
