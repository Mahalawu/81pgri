/* ============================================
   SERVICE WORKER — PGRI SINE STORE
   Strategi: Network-First with Cache Fallback
   ============================================ */

const CACHE_NAME = 'Shopping Chart V. 2 PGRI';
const CACHE_VERSION = 'v4';                             // ⬅️ Naikkan angka ini tiap kali update sw.js
const CACHE_FULL_NAME = CACHE_NAME + '-' + CACHE_VERSION;

// OPSI A: File yang wajib di-cache saat install (untuk fallback offline)
const urlsToCache = [
  './',
  './index.html',
  './Panduan.html',
  './manifest.json',
  './80pgri.png',
  './logopgri.png'
];

/* ============================================
   1. INSTALL — Cache file-file utama
   ============================================ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_FULL_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('⚠️ Sebagian file gagal di-cache:', err);
      });
    })
  );
  self.skipWaiting(); // SW baru langsung aktif
});

/* ============================================
   2. ACTIVATE — Hapus cache versi lama
   ============================================ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_NAME) && name !== CACHE_FULL_NAME)
          .map((name) => {
            console.log('🗑️ Menghapus cache lama:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

/* ============================================
   3. FETCH — OPSI B: Network-First untuk HTML
                Cache-First untuk asset
   ============================================ */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ---------- SKIP: Jangan intercept request berikut ----------
  // - Bukan GET
  // - Origin lain (script.google.com, wa.me, cdn, dll)
  if (
    req.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('googleusercontent.com')
  ) {
    return; // Biarkan browser handle langsung
  }

  // ---------- HTML & navigasi → NETWORK-FIRST ----------
  const isHTML =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          // Simpan versi terbaru ke cache (fallback offline)
          const clone = response.clone();
          caches.open(CACHE_FULL_NAME).then((cache) => {
            cache.put(req, clone).catch(() => {});
          });
          return response;
        })
        .catch(() => {
          // Network gagal → ambil dari cache
          return caches.match(req).then((cached) => {
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // ---------- Asset (gambar, CSS, JS, font) → CACHE-FIRST ----------
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_FULL_NAME).then((cache) => {
            cache.put(req, clone).catch(() => {});
          });
          return response;
        })
        .catch(() => {
          return new Response('', { status: 408, statusText: 'Offline' });
        });
    })
  );
});

/* ============================================
   4. MESSAGE — Menerima perintah skip waiting
   ============================================ */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
