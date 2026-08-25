// ===== Service Worker for Pointage PWA =====

const CACHE_NAME = 'pointage-v2'; // ✅ تم تغيير الإصدار لتحديث الكاش
const urlsToCache = [
    // الصفحات الرئيسية
    './',
    './index.html',
    './manifest.json',
    
    // CSS
    './styles.css',
    
    // الملفات الأساسية
    './appConfig.js',
    './translations.js',
    './data.js',
    './developerInfo.js',
    './app-core.js',
    
    // المصادقة
    './authService.js',
    './authUI.js',
    
    // الوحدات الأساسية
    './dashboard.js',
    './calendar-module.js',
    './reports-module.js',
    './settings-module.js',
    './holidays-module.js',
    
    // الملاحظات والمذكرات
    './note.js',
    './notes-hub.js',
    './tasks-module.js',
    './reminders-module.js',
    './notify-engine.js',
    
    // التقارير والإضافات
    './pdfExport.js',
    './stats-engine.js',
    './feature-gate.js',
    './payment-module.js',
    './premium.js',
    './analytics.js',
    './privacy.js',
    './rating.js',
    './contact.js',
    './otaUpdate.js',
    './supabaseSync.js',
    
    // API
    './api.js',
    
    // المكتبات الخارجية (إن كانت محلية)
    // './jspdf.umd.min.js',
    // './html2canvas.min.js',
    
    // ==========================================
    // ✅ الأيقونات - الأهم لظهور الأيقونة
    // ==========================================
    './assets/icon-72x72.png',
    './assets/icon-96x96.png',
    './assets/icon-128x128.png',
    './assets/icon-144x144.png',
    './assets/icon-152x152.png',
    './assets/icon-192x192.png',
    './assets/icon-384x384.png',
    './assets/icon-512x512.png'
];

// ===== التثبيت =====
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installation en cours...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Mise en cache des ressources...');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation terminée');
                return self.skipWaiting(); // ✅ تفعيل الـ SW فوراً
            })
            .catch((error) => {
                console.error('❌ Service Worker: Échec du cache:', error);
            })
    );
});

// ===== التنشيط =====
self.addEventListener('activate', (event) => {
    console.log('⚡ Service Worker: Activation en cours...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('✅ Service Worker: Activation terminée');
            return self.clients.claim(); // ✅ يتحكم بالصفحات المفتوحة فوراً
        })
    );
});

// ===== التعامل مع الطلبات =====
self.addEventListener('fetch', (event) => {
    // تجاهل طلبات Supabase API (لا نخزنها)
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
        caches.match(event.request)
            .then((response) => {
                // إذا وُجد في الكاش، أعدّه
                if (response) {
                    return response;
                }
                
                // وإلا، حمّل من الشبكة
                return fetch(event.request).then((networkResponse) => {
                    // لا نخزن الملفات الكبيرة أو الخارجية
                    if (event.request.url.startsWith(self.location.origin)) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                });
            })
            .catch(() => {
                // إذا كان الملف غير متاح (غير متصل)، أعد صفحة الخطأ
                console.warn('⚠️ Service Worker: Ressource non disponible hors ligne');
            })
    );
});

console.log('📱 Service Worker Pointage v2 chargé');
