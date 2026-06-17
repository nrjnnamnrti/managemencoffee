const CACHE_NAME = 'coffee-shop-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
  // Jangan masukkan icon disini jika tidak selalu ada, agar instalasi SW tidak gagal.
];

// Proses Instalasi Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Strategi Pengambilan Data (Network First, fallback to Cache)
// Menggunakan Network First sangat penting untuk aplikasi berbasis Firebase 
// agar pengguna selalu mendapatkan versi aplikasi (HTML/JS) yang paling baru jika ada update.
self.addEventListener('fetch', (event) => {
  // Hanya proses request GET (Firebase request menggunakan POST/OPTIONS biasanya akan diabaikan oleh cache ini)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Jika jaringan sukses mengambil data, simpan/update ke cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Jika jaringan gagal (offline), ambil dari cache
        return caches.match(event.request);
      })
  );
});

// Pembersihan Cache Lama saat ada update versi (CACHE_NAME berubah)
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
