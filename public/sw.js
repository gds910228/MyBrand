// MisoTech Service Worker - Web Push（角度2）
// 版本控制：改 SW 后递增 CACHE_VERSION，配合 skipWaiting + clients.claim 让开发期/线上即时更新。
const CACHE_VERSION = 'misotech-sw-v1';
const CACHE_NAME = `${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  // 新 SW 立即激活，不等旧 SW 释放
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 清理旧版本缓存
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      // 立即控制所有客户端
      await self.clients.claim();
    })(),
  );
});

// 接收推送 -> 显示通知
self.addEventListener('push', (event) => {
  let data = { title: 'MisoTech', body: '', url: '/' };
  try {
    if (event.data) data = event.data.json();
  } catch {
    data = { title: 'MisoTech', body: event.data ? event.data.text() : '', url: '/' };
  }

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 点击通知 -> 打开文章页
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // 若已有打开的标签，聚焦并导航
      for (const client of allClients) {
        if ('focus' in client) {
          client.navigate?.(targetUrl);
          return client.focus();
        }
      }
      // 否则新开
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
