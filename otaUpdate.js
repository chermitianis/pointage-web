// ===== otaUpdate.js - نظام تحديث التطبيق الكامل (APK + PWA) =====

const OTA_SKIPPED_VERSION_KEY = 'pointageSkippedContentVersion';
const OTA_LAST_CHECK_KEY = 'pointageLastUpdateCheck';
const OTA_DISPLAY_VERSION_KEY = 'otaDisplayVersion';
const OTA_APK_SKIPPED_KEY = 'pointageSkippedApkVersion';
const OTA_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 دقائق بين الفحوصات

// ===== التحقق من وجود تحديث جديد =====
async function checkForContentUpdate() {
    try {
        // 1. التحقق عبر Supabase Storage (لـ APK)
        if (window.APP_CONFIG && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
            await checkSupabaseUpdate();
        }

        // 2. التحقق عبر version.txt (لـ PWA والمتصفح)
        await checkVersionFileUpdate();

        // 3. التحقق عبر Service Worker (لـ PWA)
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                const updated = await registration.update();
                if (updated) {
                    console.log('🔄 Service Worker mis à jour');
                }
            }
        }

        // 4. التحقق من تحديث APK (عبر AndroidApp Bridge)
        if (window.AndroidApp && typeof window.AndroidApp.checkForApkUpdate === 'function') {
            try {
                console.log('📱 Vérification APK depuis otaUpdate...');
                window.AndroidApp.checkForApkUpdate();
            } catch (e) {
                console.warn('⚠️ Erreur checkForApkUpdate:', e);
            }
        }

        // 5. تحديث الـ Cache إذا كان هناك ملفات جديدة
        await refreshCacheIfNeeded();

    } catch (error) {
        console.warn('⚠️ Erreur lors de la vérification OTA:', error);
    }
}

// ===== التحقق من Supabase Storage =====
async function checkSupabaseUpdate() {
    const lastCheck = parseInt(localStorage.getItem(OTA_LAST_CHECK_KEY) || '0', 10);
    if (Date.now() - lastCheck < OTA_CHECK_INTERVAL_MS) return;

    try {
        const manifestUrl = `${window.APP_CONFIG.supabaseUrl}/storage/v1/object/public/app-updates/${window.APP_CONFIG.appId}/manifest.json`;
        const res = await fetch(manifestUrl, { cache: 'no-store' });
        localStorage.setItem(OTA_LAST_CHECK_KEY, String(Date.now()));

        if (!res.ok) return;
        const manifest = await res.json();
        if (!manifest || !manifest.contentVersion || !manifest.bundleUrl) return;

        if (manifest.displayVersion) {
            localStorage.setItem(OTA_DISPLAY_VERSION_KEY, manifest.displayVersion);
        }

        const currentVersion = window.APP_CONFIG.contentVersion || 1;
        const skippedVersion = parseInt(localStorage.getItem(OTA_SKIPPED_VERSION_KEY) || '0', 10);

        if (manifest.contentVersion > currentVersion && manifest.contentVersion !== skippedVersion) {
            // تحديث APK (لـ Android)
            if (window.AndroidApp && typeof window.AndroidApp.downloadAndInstallApk === 'function') {
                showOtaUpdateModal(manifest);
            } else {
                // تحميل مباشر للمتصفح
                showOtaUpdateModal(manifest);
            }
        }
    } catch (e) {
        console.warn('⚠️ Erreur Supabase OTA:', e);
    }
}

// ===== التحقق من version.txt =====
async function checkVersionFileUpdate() {
    try {
        const response = await fetch('./version.txt?t=' + Date.now(), {
            cache: 'no-store'
        });
        if (!response.ok) return;

        const newVersion = (await response.text()).trim();
        const currentVersion = localStorage.getItem('pointageAppVersion');

        if (currentVersion && currentVersion !== newVersion) {
            console.log('🆕 Nouvelle version détectée:', newVersion);
            localStorage.setItem('pointageAppVersion', newVersion);
            
            // تحديث الصفحة تلقائياً
            if (typeof showToast === 'function') {
                showToast('🔄 Mise à jour disponible. Rafraîchissement...', 2000);
            }
            setTimeout(() => {
                window.location.reload(true);
            }, 2500);
        } else if (!currentVersion) {
            localStorage.setItem('pointageAppVersion', newVersion);
        }
    } catch (e) {
        // Silencieux: fichier version.txt peut ne pas exister
    }
}

// ===== تحديث الـ Cache إذا كانت هناك ملفات جديدة =====
async function refreshCacheIfNeeded() {
    if (!('caches' in window)) return;

    try {
        const cacheNames = await caches.keys();
        const pointageCaches = cacheNames.filter(name => name.startsWith('pointage-'));

        for (const cacheName of pointageCaches) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            // إعادة تحميل الملفات الأساسية من الشبكة
            const filesToRefresh = [
                './index.html',
                './app-core.js',
                './authService.js',
                './authUI.js',
                './data.js',
                './styles.css'
            ];

            for (const request of requests) {
                const url = new URL(request.url);
                const pathname = url.pathname;
                
                if (filesToRefresh.some(file => pathname.endsWith(file))) {
                    try {
                        const freshResponse = await fetch(request.url, { cache: 'no-store' });
                        if (freshResponse && freshResponse.status === 200) {
                            await cache.put(request, freshResponse);
                            console.log('🔄 Cache mis à jour:', pathname);
                        }
                    } catch (e) {
                        // Ignorer les erreurs
                    }
                }
            }
        }
    } catch (e) {
        console.warn('⚠️ Erreur refresh cache:', e);
    }
}

// ===== عرض نافذة التحديث =====
function showOtaUpdateModal(manifest) {
    const isAr = typeof settings !== 'undefined' && settings.language === 'ar';
    const existing = document.getElementById('otaUpdateModal');
    if (existing) existing.remove();

    const version = manifest.displayVersion || manifest.version || '1.0.0';
    const releaseNotes = manifest.releaseNotes || (isAr ? 'تحسينات وإصلاحات جديدة.' : 'Nouvelles améliorations et corrections.');

    const modal = document.createElement('div');
    modal.id = 'otaUpdateModal';
    modal.className = 'modal show';
    modal.style.cssText = 'display:flex; align-items:center; justify-content:center; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; backdrop-filter:blur(4px);';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 420px; padding: 28px 24px; text-align: center; background:var(--card-bg, #fff); border-radius:16px; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
            <div style="font-size: 48px; margin-bottom: 12px;">🚀</div>
            <div class="modal-title" style="border-bottom: none; font-size:20px; font-weight:700; margin-bottom:6px; color:var(--text-color, #333);">
                ${isAr ? 'تحديث جديد متاح' : 'Nouvelle mise à jour disponible'}
            </div>
            <div style="font-size:14px; color:#1976D2; font-weight:600; margin-bottom:12px;">
                ${isAr ? `الإصدار ${version}` : `Version ${version}`}
            </div>
            <p style="font-size:13px; color:var(--gray, #666); line-height:1.7; margin-bottom:20px; white-space:pre-line; padding:0 8px;">
                ${releaseNotes}
            </p>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <button id="otaDownloadBtn" class="modal-btn" style="margin:0; background:linear-gradient(135deg, #4CAF50, #388E3C); color:#fff; border:none; border-radius:10px; padding:12px; font-weight:700; font-size:16px; cursor:pointer;">
                    ${isAr ? '⬇️ تحميل وتثبيت' : '⬇️ Télécharger & Installer'}
                </button>
                <button id="otaLaterBtn" class="modal-btn" style="margin:0; background:#9E9E9E; color:#fff; border:none; border-radius:10px; padding:10px; font-weight:600; font-size:14px; cursor:pointer;">
                    ${isAr ? 'ذكرني لاحقاً' : 'Plus tard'}
                </button>
                <button id="otaSkipBtn" class="modal-close" style="margin:0; background:transparent; border:none; color:var(--gray, #999); padding:8px; font-size:13px; cursor:pointer;">
                    ${isAr ? 'تجاهل هذا الإصدار' : 'Ignorer cette version'}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    document.getElementById('otaDownloadBtn').onclick = () => startOtaDownload(manifest);
    document.getElementById('otaLaterBtn').onclick = () => {
        closeOtaUpdateModal();
        localStorage.removeItem(OTA_LAST_CHECK_KEY);
    };
    document.getElementById('otaSkipBtn').onclick = () => {
        localStorage.setItem(OTA_SKIPPED_VERSION_KEY, String(manifest.contentVersion || manifest.version));
        closeOtaUpdateModal();
    };
}

// ===== إغلاق نافذة التحديث =====
function closeOtaUpdateModal() {
    const modal = document.getElementById('otaUpdateModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

// ===== بدء التحميل =====
function startOtaDownload(manifest) {
    const isAr = typeof settings !== 'undefined' && settings.language === 'ar';
    const btn = document.getElementById('otaDownloadBtn');
    if (btn) {
        btn.textContent = isAr ? '⏳ جاري التحميل...' : '⏳ Téléchargement...';
        btn.disabled = true;
        btn.style.opacity = '0.7';
    }

    // 1. إذا كان APK يستخدم AndroidApp Bridge
    if (window.AndroidApp && typeof window.AndroidApp.downloadAndInstallApk === 'function') {
        const url = manifest.apkUrl || manifest.bundleUrl;
        if (url) {
            window.AndroidApp.downloadAndInstallApk(url);
            setTimeout(closeOtaUpdateModal, 1000);
            return;
        }
    }

    // 2. إذا كان Capacitor (Ionic/Cordova)
    if (window.Capacitor?.isNativePlatform()) {
        window.open(manifest.bundleUrl, '_system');
        setTimeout(closeOtaUpdateModal, 1000);
        return;
    }

    // 3. Fallback: فتح في نافذة جديدة
    const url = manifest.apkUrl || manifest.bundleUrl;
    if (url) {
        window.open(url, '_blank');
        setTimeout(closeOtaUpdateModal, 1000);
        return;
    }

    // 4. إذا كان تحديث محتوى فقط (PWA) - إعادة تحميل الصفحة
    if (manifest.contentVersion) {
        localStorage.setItem('pointageAppVersion', String(manifest.contentVersion));
        if (typeof showToast === 'function') {
            showToast('🔄 Mise à jour du contenu...', 2000);
        }
        setTimeout(() => {
            window.location.reload(true);
        }, 1500);
        setTimeout(closeOtaUpdateModal, 500);
    }
}

// ===== الحصول على الإصدار المعروض =====
function getDisplayVersion() {
    const otaVersion = localStorage.getItem(OTA_DISPLAY_VERSION_KEY);
    if (otaVersion) return otaVersion;
    
    if (window.APP_CONFIG?.versionName) {
        return window.APP_CONFIG.versionName;
    }
    
    if (window.AndroidApp && typeof window.AndroidApp.getAppVersion === 'function') {
        try {
            return window.AndroidApp.getAppVersion();
        } catch(e) {}
    }
    
    return '1.0.0';
}

// ===== تهيئة نظام OTA =====
function initOtaCheck() {
    console.log('🔍 Initialisation OTA...');
    
    // فحص فوري بعد 3 ثوان
    setTimeout(() => {
        checkForContentUpdate();
    }, 3000);

    // فحص دوري كل 5 دقائق
    setInterval(() => {
        checkForContentUpdate();
    }, OTA_CHECK_INTERVAL_MS);

    // فحص عند عودة التطبيق إلى الواجهة (visibility change)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('👁️ Application revenue au premier plan - vérification OTA');
            checkForContentUpdate();
        }
    });
}

// ===== Exports =====
window.checkForContentUpdate = checkForContentUpdate;
window.showOtaUpdateModal = showOtaUpdateModal;
window.closeOtaUpdateModal = closeOtaUpdateModal;
window.startOtaDownload = startOtaDownload;
window.getDisplayVersion = getDisplayVersion;
window.initOtaCheck = initOtaCheck;

console.log('✅ otaUpdate.js chargé avec succès (APK + PWA)');
