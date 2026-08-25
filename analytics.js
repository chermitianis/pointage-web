// ===== لوحة التحليلات والتتبع المحلي والجسر الناقل =====
const AnalyticsDashboard = {
    modal: null,
    data: null,

    init() {
        this.loadData();
        this.trackAppOpen();
    },

    loadData() {
        try {
            const raw = localStorage.getItem('pointageUserData');
            this.data = raw ? JSON.parse(raw) : {
                openCount: 0,
                featuresUsedCount: 0,
                featureDetails: {}
            };
        } catch (e) {
            console.error('Error loading analytics data:', e);
            this.data = { openCount: 0, featuresUsedCount: 0, featureDetails: {} };
        }
    },

    saveData() {
        try {
            localStorage.setItem('pointageUserData', JSON.stringify(this.data));
        } catch (e) {
            console.error('Error saving analytics data:', e);
        }
    },

    // إرسال البيانات المجمعة للأندرويد ليتولى مزامنتها مع Supabase
    notifyNativeBridge(eventName, payload = {}) {
        if (window.AndroidApp && typeof window.AndroidApp.logAnalytics === 'function') {
            try {
                const fullPayload = {
                    event: eventName,
                    openCount: this.data.openCount,
                    featuresUsedCount: this.data.featuresUsedCount,
                    featureDetails: this.data.featureDetails,
                    details: payload
                };
                window.AndroidApp.logAnalytics(eventName, JSON.stringify(fullPayload));
            } catch (e) {
                console.error('Error sending analytics to Android Bridge:', e);
            }
        }
    },

    trackAppOpen() {
        this.loadData();
        this.data.openCount = (this.data.openCount || 0) + 1;
        this.saveData();

        // إشعار الجسر بفتح التطبيق
        this.notifyNativeBridge('app_open');
    },

    trackFeatureUsed(featureName, details = {}) {
        this.loadData();

        this.data.featuresUsedCount = (this.data.featuresUsedCount || 0) + 1;
        if (!this.data.featureDetails) this.data.featureDetails = {};
        this.data.featureDetails[featureName] = (this.data.featureDetails[featureName] || 0) + 1;

        this.saveData();
        console.log(`📊 Feature tracked: ${featureName}`, details);

        // إشعار الجسر باستخدام الميزة
        this.notifyNativeBridge('feature_used', { featureName, ...details });
    },

    show() {
        this.loadData();
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }

        const isAr = typeof settings !== 'undefined' && settings?.language === 'ar';
        this.modal = document.createElement('div');
        this.modal.id = 'analyticsModal';
        this.modal.className = 'modal show';

        const d = this.data || {};
        const openCount = d.openCount || 0;
        const featuresCount = d.featuresUsedCount || 0;

        const content = `
            <div class="modal-content" style="max-width: 500px; max-height: 85vh; overflow-y: auto; padding: 24px;">
                <div class="modal-title" style="font-size: 20px; color: #7B1FA2; margin-bottom: 16px;">
                    📊 ${isAr ? 'لوحة التحليلات' : 'Tableau de bord analytique'}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700;">${openCount}</div>
                        <div style="font-size: 11px; opacity: 0.8;">${isAr ? 'مرات الفتح' : 'Ouvertures'}</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #4CAF50, #388E3C); color: white; padding: 12px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700;">${featuresCount}</div>
                        <div style="font-size: 11px; opacity: 0.8;">${isAr ? 'ميزات مستخدمة' : 'Fonctionnalités utilisées'}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 8px;">
                    <button class="modal-close" onclick="AnalyticsDashboard.close()" style="flex: 1; margin: 0; padding: 10px;">
                        ${isAr ? 'إغلاق' : 'Fermer'}
                    </button>
                </div>
            </div>
        `;

        this.modal.innerHTML = content;
        document.body.appendChild(this.modal);
        document.body.style.overflow = 'hidden';
    },

    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
        document.body.style.overflow = '';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AnalyticsDashboard.init();
});

window.AnalyticsDashboard = AnalyticsDashboard;

window.trackFeatureUsed = function(featureName, details) {
    AnalyticsDashboard.trackFeatureUsed(featureName, details);
};

console.log('analytics.js loaded successfully with Native Bridge support');