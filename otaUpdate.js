// ===== otaUpdate.js - نظام تحديث محتوى التطبيق (OTA) عبر Supabase =====

const OTA_SKIPPED_VERSION_KEY = 'pointageSkippedContentVersion';
const OTA_LAST_CHECK_KEY = 'pointageLastUpdateCheck';
const OTA_DISPLAY_VERSION_KEY = 'otaDisplayVersion';
const OTA_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 دقائق فقط لتجنب الإزعاج المفرط

async function checkForContentUpdate() {
    if (!window.AndroidApp || typeof AndroidApp.downloadContentUpdate !== 'function') return;
    if (!window.APP_CONFIG || typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured()) return;

    const lastCheck = parseInt(localStorage.getItem(OTA_LAST_CHECK_KEY) || '0', 10);
    if (Date.now() - lastCheck < OTA_CHECK_INTERVAL_MS) return;

    try {
        const manifestUrl = `${APP_CONFIG.supabaseUrl}/storage/v1/object/public/app-updates/${APP_CONFIG.appId}/manifest.json`;
        const res = await fetch(manifestUrl, { cache: 'no-store' });
        localStorage.setItem(OTA_LAST_CHECK_KEY, String(Date.now()));

        if (!res.ok) return;
        const manifest = await res.json();
        if (!manifest || !manifest.contentVersion || !manifest.bundleUrl) return;

        if (manifest.displayVersion) {
            localStorage.setItem(OTA_DISPLAY_VERSION_KEY, manifest.displayVersion);
        }

        const currentVersion = APP_CONFIG.contentVersion || 1;
        const skippedVersion = parseInt(localStorage.getItem(OTA_SKIPPED_VERSION_KEY) || '0', 10);

        if (manifest.contentVersion > currentVersion && manifest.contentVersion !== skippedVersion) {
            showOtaUpdateModal(manifest);
        }
    } catch (e) {
        console.warn('تعذر التحقق من وجود تحديث:', e);
    }
}

function showOtaUpdateModal(manifest) {
    const isAr = settings.language === 'ar';
    const existing = document.getElementById('otaUpdateModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'otaUpdateModal';
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; padding: 26px 22px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">🚀</div>
            <div class="modal-title" style="border-bottom: none;">${isAr ? 'تحديث جديد متاح' : 'Nouvelle mise à jour disponible'}</div>
            <p style="font-size: 14px; color: var(--text-color); line-height: 1.7; margin-bottom: 18px; white-space: pre-line;">
                ${manifest.releaseNotes ? String(manifest.releaseNotes) : (isAr ? 'تحسينات وإصلاحات جديدة.' : 'Nouvelles améliorations et corrections.')}
            </p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="otaDownloadBtn" class="modal-btn" style="margin:0; background: linear-gradient(135deg, #4CAF50, #388E3C);">
                    ${isAr ? '⬇️ تحميل الآن' : '⬇️ Télécharger'}
                </button>
                <button id="otaLaterBtn" class="modal-btn" style="margin:0; background: #9E9E9E;">
                    ${isAr ? 'ذكرني لاحقاً' : 'Plus tard'}
                </button>
                <button id="otaSkipBtn" class="modal-close" style="margin:0;">
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
        // ✅ حذف وقت آخر فحص ليتم التحقق مجدداً في المرة القادمة فوراً
        localStorage.removeItem(OTA_LAST_CHECK_KEY);
    };
    document.getElementById('otaSkipBtn').onclick = () => {
        // ✅ حفظ الإصدار المتجاهل (لن يظهر مرة أخرى حتى مسح التخزين)
        localStorage.setItem(OTA_SKIPPED_VERSION_KEY, String(manifest.contentVersion));
        closeOtaUpdateModal();
    };
}

function closeOtaUpdateModal() {
    const modal = document.getElementById('otaUpdateModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

function startOtaDownload(manifest) {
    const isAr = settings.language === 'ar';
    const btn = document.getElementById('otaDownloadBtn');
    if (btn) {
        btn.textContent = isAr ? '⏳ جاري التحميل...' : '⏳ Téléchargement...';
        btn.disabled = true;
        btn.style.opacity = '0.7';
    }
    window.AndroidApp.downloadContentUpdate(
        manifest.bundleUrl,
        String(manifest.contentVersion),
        manifest.checksum || ''
    );
}

function getDisplayVersion() {
    const otaVersion = localStorage.getItem(OTA_DISPLAY_VERSION_KEY);
    return otaVersion || window.APP_CONFIG?.versionName || '1.0.0';
}

window.onContentUpdateError = function (message) {
    const isAr = settings.language === 'ar';
    closeOtaUpdateModal();
    showToast(
        isAr ? '⚠️ تعذر تنزيل التحديث: ' + message : '⚠️ Échec de la mise à jour: ' + message,
        4000
    );
};

window.checkForContentUpdate = checkForContentUpdate;
window.getDisplayVersion = getDisplayVersion;

console.log('otaUpdate.js loaded successfully');