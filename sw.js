// ===== Service Worker for Pointage PWA =====

const CACHE_NAME = 'pointage-v4';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './styles.css',
    './appConfig.js',
    './data.js',
    './app-core.js',
    './authService.js',
    './authUI.js',
    './assets/icon-72.png',
    './assets/icon-96.png',
    './assets/icon-128.png',
    './assets/icon-144.png',
    './assets/icon-152.png',
    './assets/icon-192.png',
    './assets/icon-384.png',
    './assets/icon-512.png',
    './assets/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Mise en cache...');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Installation réussie');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Erreur de cache:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('🗑️ Suppression:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ===== معالج الطلبات مع تجنب clone المشكلة =====
self.addEventListener('fetch', (event) => {
    // تجاهل طلبات Supabase
    if (event.request.url.includes('supabase.co')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // تجاهل طلبات التحليلات
    if (event.request.url.includes('analytics') || event.request.url.includes('google')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            return fetch(event.request).then((networkResponse) => {
                // تخزين الملفات المحلية فقط (نفس النطاق)
                if (event.request.url.startsWith(self.location.origin)) {
                    try {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    } catch (e) {
                        console.warn('⚠️ Impossible de cloner la réponse:', e);
                    }
                }
                return networkResponse;
            });
        })
    );
});

console.log('📱 Service Worker Pointage v4 chargé');
