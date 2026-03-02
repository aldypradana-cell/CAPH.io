const CACHE_NAME = 'fintrack-cache-v1';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
    OFFLINE_URL,
    // Kita sengaja tidak melist asset vite di sini karena nama filenya berubah-ubah.
    // Strateginya adalah network-first, lalu fallback ke offline.html
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Memasukkan file statis ke cache');
            return cache.addAll(urlsToCache);
        })
    );
    // paksa SW baru langsung aktif
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    // Hanya tangani GET requests
    if (event.request.method !== 'GET') return;

    // Untuk navigasi HTML (akses halaman web utama)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Jika fetch gagal (karena offline), kembalikan halaman offline
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }

    // Untuk aset lainnya (gambar, css, js) - bisa diabaikan atau di-cache
    // Untuk saat ini biarkan browser menangani secara default, atau cukup return fetch asli
});
