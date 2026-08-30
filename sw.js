// ===== Service Worker Pointage =====
const CACHE_NAME = 'pointage-v5';
const APP_VERSION = '1.0.0';

// ===== قائمة الملفات الأساسية فقط (الموجودة فعلاً) =====
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
    './manifest.json'
];

// ===== تثبيت الـ Service Worker =====
self.addEventListener('install', event => {
    console.log('📦 Service Worker installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Mise en cache des fichiers...');
                // إضافة كل ملف مع محاولة فردية لتجنب فشل الملف الواحد
                return Promise.allSettled(
                    ASSETS_TO_CACHE.map(url => {
                        return cache.add(url).catch(err => {
                            console.warn('⚠️ Échec de mise en cache:', url, err);
                            // لا نرمي الخطأ، نستمر
                        });
                    })
                );
            })
            .then(() => {
                console.log('✅ Cache terminé (avec succès ou échecs partiels)');
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
            return self.clients.claim();
        })
    );
});

// ===== استراتيجية: Network First with Cache Fallback =====
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // تجاهل طلبات تحليلات و Supabase
    if (url.pathname.includes('/analytics') || 
        url.pathname.includes('/api/') ||
        url.hostname.includes('supabase.co') ||
        url.hostname.includes('firebase')) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then(response => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            try {
                                cache.put(request, responseClone);
                            } catch (e) {
                                // تجاهل أخطاء التخزين
                            }
                        })
                        .catch(() => {});
                }
                return response;
            })
            .catch(() => {
                return caches.match(request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
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

// ===== التحقق من وجود تحديثات =====
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        console.log('🔍 Vérification des mises à jour...');
        self.skipWaiting();
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    version: APP_VERSION
                });
            });
        });
    }
});

console.log('✅ Service Worker Pointage v' + APP_VERSION + ' chargé');
