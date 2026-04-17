// Service Worker para MisAutónomos
const CACHE_NAME = 'misautonomos-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Recibir push notification
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: '/logo-192.png',
      badge: '/logo-192.png',
      tag: data.tag || 'default',
      data: {
        url: data.url || '/',
        messageId: data.messageId
      },
      vibrate: [200, 100, 200],
      requireInteraction: false
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'MisAutónomos', options)
    );
  } catch (err) {
    console.error('Error procesando push:', err);
  }
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
