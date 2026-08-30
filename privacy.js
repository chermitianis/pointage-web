// ===== privacy.js - إدارة الخصوصية وجمع البيانات الموحدة مع تكامل Supabase =====

const PRIVACY_KEY = 'privacyConsent';
const USER_DATA_KEY = 'pointageUserData';

// ===== معرف Google Analytics =====
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

// ===== التحقق من الموافقة على جمع البيانات =====
function checkPrivacyConsent() {
    const consent = localStorage.getItem(PRIVACY_KEY);
    if (consent === 'true') {
        collectUserData();
        return true;
    } else if (consent === 'false') {
        return false;
    } else {
        showPrivacyModal();
        return false;
    }
}

// ===== عرض نافذة الموافقة (بالفرنسية افتراضياً) =====
function showPrivacyModal() {
    const existingModal = document.getElementById('privacyModal');
    if (existingModal) existingModal.remove();

    const isAr = (typeof settings !== 'undefined' && settings?.language === 'ar') ? true : false;

    const modal = document.createElement('div');
    modal.id = 'privacyModal';
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content privacy-modal" style="max-width: 460px; padding: 28px 24px;">
            <div class="modal-title" style="font-size: 22px; color: #1976D2; text-align: center; margin-bottom: 16px;">
                🔒 ${isAr ? 'خصوصية البيانات' : 'Confidentialité des données'}
            </div>

            <div class="privacy-text" style="font-size: 14px; line-height: 1.7; color: #424242;">
                <p style="margin-bottom: 12px; font-weight: 500;">
                    ${isAr ? 'نحن نقدر خصوصيتك. نود جمع بعض البيانات غير الحساسة لتحسين التطبيق وتجربة المستخدم:' : 'Nous respectons votre vie privée. Nous souhaitons collecter certaines données non sensibles pour améliorer l\'application :'}
                </p>
                <ul style="list-style: none; padding: 0; margin: 0 0 16px 0;">
                    <li style="padding: 8px 12px; margin-bottom: 4px; background: #F5F8FA; border-radius: 8px;">📱 ${isAr ? 'نوع الجهاز ونظام التشغيل' : 'Type d\'appareil et système d\'exploitation'}</li>
                    <li style="padding: 8px 12px; margin-bottom: 4px; background: #F5F8FA; border-radius: 8px;">📅 ${isAr ? 'تاريخ التثبيت وعدد مرات الاستخدام' : 'Date d\'installation et nombre d\'utilisations'}</li>
                    <li style="padding: 8px 12px; margin-bottom: 4px; background: #F5F8FA; border-radius: 8px;">📌 ${isAr ? 'الميزات المستخدمة' : 'Fonctionnalités utilisées'}</li>
                </ul>
                <p style="font-size: 12px; color: #888; margin-top: 8px;">
                    ${isAr ? 'يمكنك تغيير هذا القرار في أي وقت من خلال إعدادات التطبيق.' : 'Vous pouvez modifier cette décision à tout moment dans les paramètres de l\'application.'}
                </p>
            </div>

            <div class="modal-actions" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                <button class="modal-btn privacy-accept" onclick="acceptPrivacy()" style="background: linear-gradient(135deg, #4CAF50, #388E3C); padding: 14px; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px;">
                    👍 ${isAr ? 'موافق' : 'J\'accepte'}
                </button>
                <button class="modal-btn privacy-decline" onclick="declinePrivacy()" style="background: #9E9E9E; padding: 14px; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px;">
                    ❌ ${isAr ? 'لا أوافق' : 'Je refuse'}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// ===== الموافقة على جمع البيانات =====
function acceptPrivacy() {
    localStorage.setItem(PRIVACY_KEY, 'true');

    const modal = document.getElementById('privacyModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';

    const userData = collectUserData();
    
    syncUserDataToCloud();

    if (typeof showToast === 'function') {
        const isAr = (typeof settings !== 'undefined' && settings?.language === 'ar') ? true : false;
        showToast(isAr ? 'شكراً لك! تم تفعيل المزامنة.' : 'Merci ! Synchronisation activée.', 3000);
    }
}

// ===== رفض جمع البيانات =====
function declinePrivacy() {
    localStorage.setItem(PRIVACY_KEY, 'false');

    const modal = document.getElementById('privacyModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

// ===== مزامنة بيانات المستخدم مع السحابة =====
// ===== مزامنة بيانات المستخدم مع السحابة (باستخدام user_settings) =====
async function syncUserDataToCloud() {
    try {
        const consent = localStorage.getItem(PRIVACY_KEY) === 'true';
        if (!consent) return;

        if (window.AuthService && typeof window.AuthService.getCurrentUser === 'function') {
            const user = await window.AuthService.getCurrentUser();
            if (user) {
                const userData = getUserData();
                if (userData && window.SupabaseSyncEngine && typeof window.SupabaseSyncEngine.push === 'function') {
                    // ===== استخدام user_settings بدلاً من user_privacy_data =====
                    // نضيف privacy_data داخل settings بدلاً من جدول منفصل
                    const currentSettings = window.settings || {};
                    const updatedSettings = {
                        ...currentSettings,
                        privacy_consent: true,
                        privacy_data: {
                            firstInstallDate: userData.firstInstallDate,
                            lastOpenDate: userData.lastOpenDate,
                            openCount: userData.openCount,
                            deviceInfo: userData.deviceInfo,
                            appVersion: userData.appVersion,
                            featuresUsed: userData.featuresUsed || [],
                            consentGiven: true
                        }
                    };
                    
                    await window.SupabaseSyncEngine.push('user_settings', updatedSettings);
                    console.log('✅ Privacy data synced to cloud (via user_settings)');
                    return;
                }
            }
        }
        
        // إذا لم يكن المستخدم مسجلاً، نحفظ البيانات محلياً فقط
        console.log('📁 Privacy data saved locally only (user not logged in)');
        
    } catch (e) {
        console.warn('⚠️ Failed to sync privacy data to cloud:', e);
    }
}

// ===== جمع بيانات المستخدم وإرسالها =====
function collectUserData() {
    try {
        let userData = JSON.parse(localStorage.getItem(USER_DATA_KEY));
        const now = new Date().toISOString();

        if (typeof ensureConfigLoaded === 'function') ensureConfigLoaded();
        const appVersion = window.APP_CONFIG?.versionName || '1.0.0';

        if (!userData) {
            userData = {
                firstInstallDate: now,
                lastOpenDate: now,
                openCount: 1,
                deviceInfo: {
                    platform: navigator.platform || 'android',
                    language: navigator.language || 'fr',
                    userAgent: navigator.userAgent || '',
                    screenWidth: screen.width || 0,
                    screenHeight: screen.height || 0,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
                },
                appVersion: appVersion,
                featuresUsed: [],
                consentGiven: true,
                lastUpdate: now
            };
        } else {
            userData.lastOpenDate = now;
            userData.openCount = (userData.openCount || 0) + 1;
            userData.lastUpdate = now;
            userData.appVersion = appVersion;
            userData.consentGiven = true;
        }

        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

        // مزامنة مع السحابة (فقط إذا كان المستخدم مسجلاً والموافقة موجودة)
        const consent = localStorage.getItem(PRIVACY_KEY) === 'true';
        if (consent) {
            syncUserDataToCloud();
        }

        return userData;
    } catch (e) {
        console.error('Error collecting user data:', e);
        return null;
    }
}

// ===== الحصول على بيانات المستخدم المحلية =====
function getUserData() {
    try {
        const data = localStorage.getItem(USER_DATA_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

// ===== تتبع الميزات المستخدمة =====
function trackFeature(featureName) {
    const userData = getUserData();
    if (userData) {
        if (!userData.featuresUsed) userData.featuresUsed = [];
        if (!userData.featuresUsed.includes(featureName)) {
            userData.featuresUsed.push(featureName);
            userData.lastUpdate = new Date().toISOString();
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

            const consent = localStorage.getItem(PRIVACY_KEY) === 'true';
            if (consent) {
                syncUserDataToCloud();
            }

            if (typeof gtag !== 'undefined') {
                gtag('event', 'feature_used', {
                    'feature_name': featureName,
                    'app_version': window.APP_CONFIG?.versionName || '1.0.0'
                });
            }
        }
    }
}

// ===== تصدير البيانات (للمستخدم) =====
function exportUserData() {
    const data = getUserData();
    if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ===== ربط الدوال بالكائن العام =====
window.checkPrivacyConsent = checkPrivacyConsent;
window.showPrivacyModal = showPrivacyModal;
window.acceptPrivacy = acceptPrivacy;
window.declinePrivacy = declinePrivacy;
window.collectUserData = collectUserData;
window.getUserData = getUserData;
window.trackFeature = trackFeature;
window.exportUserData = exportUserData;
window.syncUserDataToCloud = syncUserDataToCloud;

console.log('privacy.js loaded successfully with cloud sync support (default language: French)');
