// ===== Service Worker Pointage =====
const CACHE_NAME = 'pointage-v5';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './appConfig.js',
    './authService.js',
    './authUI.js',
    './app-core.js',
    './data.js',
    './translations.js',
    './developerInfo.js',
    './supabaseSync.js',
    './otaUpdate.js',
    './analytics.js',
    './privacy.js',
    './premium.js',
    './feature-gate.js',
    './payment-module.js',
    './pdfExport.js',
    './notify-engine.js',
    './note.js',
    './tasks-module.js',
    './reminders-module.js',
    './notes-hub.js',
    './rating.js',
    './contact.js',
    './stats-engine.js',
    './dashboard.js',
    './calendar-module.js',
    './reports-module.js',
    './settings-module.js',
    './holidays-module.js',
    './api.js',
    './jspdf.umd.min.js',
    './html2canvas.min.js',
    './manifest.json',
    './assets/icon-72.png',
    './assets/icon-96.png',
    './assets/icon-128.png',
    './assets/icon-144.png',
    './assets/icon-152.png',
    './assets/icon-192.png',
    './assets/icon-384.png',
    './assets/icon-512.png',
    './assets/favicon.ico',
    './assets/apple-touch-icon.png'
];

// ===== الإصدار الحالي من التطبيق =====
const APP_VERSION = '1.0.0';

// ===== تثبيت الـ Service Worker =====
self.addEventListener('install', event => {
    console.log('📦 Service Worker installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Mise en cache des fichiers...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // تفعيل الـ Service Worker فوراً دون انتظار
                return self.skipWaiting();
            })
    );
});

// ===== تنشيط الـ Service Worker =====
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activation...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Suppression de l\'ancien cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            // السيطرة على جميع الصفحات المفتوحة فوراً
            return self.clients.claim();
        })
    );
});

// ===== استراتيجية: Network First with Cache Fallback =====
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // تجاهل طلبات تحليلات وغيرها
    if (url.pathname.includes('/analytics') || 
        url.pathname.includes('/api/') ||
        url.pathname.includes('supabase.co')) {
        return;
    }

    // استراتيجية Network First (الإنترنت أولاً)
    event.respondWith(
        fetch(request)
            .then(response => {
                // إذا كان الطلب ناجحاً، قم بتحديث الـ Cache
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, responseClone);
                        })
                        .catch(err => console.warn('Cache update error:', err));
                }
                return response;
            })
            .catch(() => {
                // إذا فشل الطلب (لا يوجد إنترنت)، استخدم الـ Cache
                return caches.match(request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            console.log('📂 Réponse depuis le cache:', request.url);
                            return cachedResponse;
                        }
                        // إذا لم يوجد في Cache، حاول إرجاع index.html
                        if (request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Page non disponible hors ligne', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// ===== التحقق من وجود تحديثات (فحص دوري) =====
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        console.log('🔍 Vérification des mises à jour...');
        // إرسال رسالة إلى جميع العملاء لإعادة التحميل
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    version: APP_VERSION
                });
            });
        });
        // إلغاء تثبيت الـ Service Worker القديم لتحديثه
        self.skipWaiting();
    }
});

console.log('✅ Service Worker Pointage v' + APP_VERSION + ' chargé');
