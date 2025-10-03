// Service Worker для Sartorial Telemetry PWA
const CACHE_NAME = 'sartorial-telemetry-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Установка Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кэширование файлов');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('[SW] Ошибка кэширования:', err);
      })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Пропускаем API запросы к llm7.io - они должны идти всегда онлайн
  if (url.hostname.includes('llm7.io')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Если есть в кэше - отдаем из кэша
        if (response) {
          console.log('[SW] Из кэша:', event.request.url);
          return response;
        }

        // Иначе делаем сетевой запрос
        console.log('[SW] Из сети:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Не кэшируем некорректные ответы
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Клонируем ответ (можно использовать только один раз)
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((err) => {
            console.log('[SW] Ошибка загрузки:', err);
            // Если офлайн и нет в кэше - можно показать fallback страницу
          });
      })
  );
});

// Push-уведомления (опционально - пока закомментировано)
/*
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%230ea5e9"/%3E%3Ctext x="96" y="135" font-size="120" text-anchor="middle" fill="white"%3E👔%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" fill="%230ea5e9"/%3E%3Ctext x="48" y="68" font-size="60" text-anchor="middle" fill="white"%3E👔%3C/text%3E%3C/svg%3E',
    vibrate: [200, 100, 200],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
*/
