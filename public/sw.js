self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 最小限のフェッチリスナー（PWA認識のため）
  event.respondWith(fetch(event.request));
});
