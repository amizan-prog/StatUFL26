self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Wake up in background when Google/Apple Push Server delivers a status change or Allstat broadcast
self.addEventListener('push', event => {
  let data = {
    title: '📢 STATUFL • Kemas Kini Status',
    body: 'Terdapat kemas kini status inden baharu.',
    tag: 'statufl-update',
    url: './index.html'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  // 1. Display OS lock-screen / status-bar notification with system chime & vibration
  const showSystemNotification = self.registration.showNotification(data.title, {
    body: data.body,
    tag: data.tag,
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 400],
    data: { url: data.url }
  });

  // 2. Wake any minimized/background STATUFL tabs to trigger in-app chime, toast & data sync
  const notifyOpenTabs = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then(windowClients => {
      windowClients.forEach(client => {
        client.postMessage({
          type: 'STATUFL_PUSH_RECEIVED',
          payload: data
        });
      });
    });

  event.waitUntil(Promise.all([showSystemNotification, notifyOpenTabs]));
});

// Open or focus STATUFL when user taps the lock-screen / status-bar notification
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './index.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if ((client.url.startsWith(self.registration.scope) || client.url.includes('StatUFL')) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Auto-renew push subscription if the browser rotates keys overnight while sleeping
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options || { userVisibleOnly: true })
      .then(newSubscription =>
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
          windowClients.forEach(client => {
            client.postMessage({
              type: 'STATUFL_PUSH_RESUBSCRIBED',
              subscription: newSubscription.toJSON()
            });
          });
        })
      )
      .catch(() => {})
  );
});
