// ===== privacy.js - إدارة الخصوصية وجمع البيانات الموحدة =====

const PRIVACY_KEY = 'privacyConsent'; // تم توحيد المفتاح ليتوافق مع باقي الملفات
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

// ===== عرض نافذة الموافقة =====
function showPrivacyModal() {
    const existingModal = document.getElementById('privacyModal');
    if (existingModal) existingModal.remove();

    const isAr = (typeof settings !== 'undefined' && settings?.language === 'ar') || true;

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
                    ${isAr ? 'نحن نقدر خصوصيتك. نود جمع بعض البيانات غير الحساسة لتحسين التطبيق وتجربة المستخدم:' : 'Nous respectons votre vie privée. Nous souhaitons collecter certaines données non sensibles :'}
                </p>
                <ul style="list-style: none; padding: 0; margin: 0 0 16px 0;">
                    <li style="padding: 8px 12px; margin-bottom: 4px; background: #F5F8FA; border-radius: 8px;">📱 ${isAr ? 'نوع الجهاز ونظام التشغيل' : 'Type d\'appareil'}</li>
                    <li style="padding: 8px 12px; margin-bottom: 4px; background: #F5F8FA; border-radius: 8px;">📅 ${isAr ? 'تاريخ التثبيت وعدد مرات الاستخدام' : 'Date d\'installation'}</li>
                    <li style="padding: 8px 12px; margin-bottom: 4px; background: #F5F8FA; border-radius: 8px;">📌 ${isAr ? 'الميزات المستخدمة' : 'Fonctionnalités utilisées'}</li>
                </ul>
            </div>

            <div class="modal-actions" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                <button class="modal-btn privacy-accept" onclick="acceptPrivacy()" style="background: linear-gradient(135deg, #4CAF50, #388E3C); padding: 14px; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    👍 ${isAr ? 'موافق' : 'J\'accepte'}
                </button>
                <button class="modal-btn privacy-decline" onclick="declinePrivacy()" style="background: #9E9E9E; padding: 14px; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
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
    if (userData && typeof syncUserAnalytics === 'function') {
        syncUserAnalytics(userData);
    }

    if (typeof showToast === 'function') {
        showToast(typeof settings !== 'undefined' && settings?.language === 'ar' ? 'شكراً لك! تم تفعيل المزامنة.' : 'Merci! Synchronisation activée.', 3000);
    }
}

// ===== رفض جمع البيانات =====
function declinePrivacy() {
    localStorage.setItem(PRIVACY_KEY, 'false');

    const modal = document.getElementById('privacyModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
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
                    language: navigator.language || 'ar',
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

        if (typeof syncUserAnalytics === 'function') {
            syncUserAnalytics(userData);
        }

        return userData;
    } catch (e) {
        console.error('Error collecting user data:', e);
        return null;
    }
}

function getUserData() {
    try {
        const data = localStorage.getItem(USER_DATA_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

function trackFeature(featureName) {
    const userData = getUserData();
    if (userData) {
        if (!userData.featuresUsed) userData.featuresUsed = [];
        if (!userData.featuresUsed.includes(featureName)) {
            userData.featuresUsed.push(featureName);
            userData.lastUpdate = new Date().toISOString();
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

            if (typeof syncUserAnalytics === 'function') {
                syncUserAnalytics(userData);
            }
        }
    }
}

// ربط الدوال بالكائن العام
window.checkPrivacyConsent = checkPrivacyConsent;
window.showPrivacyModal = showPrivacyModal;
window.acceptPrivacy = acceptPrivacy;
window.declinePrivacy = declinePrivacy;
window.collectUserData = collectUserData;
window.getUserData = getUserData;
window.trackFeature = trackFeature;

console.log('privacy.js loaded successfully');