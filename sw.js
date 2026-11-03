const CACHE_NAME = 'polarecords-cache-v9';
const urlsToCache = [
    './',
    './index.html',
    './john.html',
    './polaraf.html',
    './media.html',
    './archive.html',
    './style.css',
    './app.js',
    './database.json',
    './site.webmanifest',
    './favicon.ico',
    './assets/hat.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

// Network-first: always serve live content when online (event dates, nav/style
// fixes, etc. must never go stale on a returning visitor's phone). Cache is
// only a fallback for offline use, refreshed opportunistically on each visit.
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return networkResponse;
        }).catch(() =>
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                if (event.request.headers.get('accept')?.includes('text/html')) {
                    return new Response(
                        `<div style="background:#0f0c0a;color:#f1e8da;font-family:sans-serif;padding:20px;">
                            You're offline. Reconnect and refresh to see PolaRecords.
                        </div>`,
                        { headers: { 'Content-Type': 'text/html' } }
                    );
                }
            })
        )
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
        ).then(() => self.clients.claim())
    );
});
