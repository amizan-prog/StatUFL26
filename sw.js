self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Wake up in background when Google/Apple Push Server delivers an Allstat broadcast
self.addEventListener('push', event => {
  let data = {
    title: '📢 STATUFL • Kemas Kini Status',
    body: 'Terdapat kemas kini status inden baharu.',
    tag: 'statufl-allstat',
    url: './index.html'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: data.url }
    })
  );
});

// Open or focus STATUFL when user taps the status-bar notification
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes('StatUFL26') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
