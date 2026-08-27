const CACHE_NAME = 'Shopping Chart V. 2 PGRI';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './80pgri.png',
  './logopgri.png'
];

// 1. Fase Install (Hanya satu fungsi, menggunakan variabel urlsToCache yang benar)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pastikan semua file di dalam array urlsToCache benar-benar ada di folder Anda
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Memaksa SW baru langsung aktif tanpa menunggu tab ditutup
});

// 2. Fase Activate (Penting untuk memperbarui cache jika ada perubahan versi)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Langsung mengontrol halaman web tanpa perlu reload pertama kali
});

// 3. Fase Fetch (Sesuai dengan logika pengecualian Google Script Anda)
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET' && !event.request.url.includes('script.google.com')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
