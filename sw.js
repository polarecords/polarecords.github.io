const CACHE_NAME = 'polarecords-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './terminal.css',
    './app.js',
    './database.json',
    './site.webmanifest',
    './favicon.ico',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request).catch(() => {
                    // Provide a custom offline fallback if it's an HTML page
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return new Response(
                            `<div style="background:#031A16; color:#81B5AC; font-family:monospace; padding:20px;">
                                [ OFFLINE MODE: CACHED SIGNALS ONLY ]<br><br>
                                Signal lost. Reconnect to uplink.
                            </div>`,
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    }
                });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
