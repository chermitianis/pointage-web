// ===== appConfig.js (نسخة الواجهة الأمامية الآمنة) =====
(function () {
    function initConfig() {
        // 1. إذا كانت الإعدادات محقونة مسبقاً من الأندرويد Native
        if (window.APP_CONFIG && window.APP_CONFIG.appId && window.APP_CONFIG.appId !== 'dev') {
            console.log('✅ APP_CONFIG already present from Native:', window.APP_CONFIG.appId);
            return true;
        }

        // 2. محاولة قراءة الإعدادات عبر جسر AndroidApp
        if (window.AndroidApp && typeof window.AndroidApp.getAppConfig === 'function') {
            try {
                window.APP_CONFIG = JSON.parse(window.AndroidApp.getAppConfig());
                console.log('✅ APP_CONFIG loaded via AndroidApp bridge:', window.APP_CONFIG.appId);
                return true;
            } catch (e) {
                console.error('❌ Error parsing getAppConfig():', e);
            }
        }
        return false;
    }

    if (!initConfig()) {
        // 3. بيئة التطوير المحلية فقط (Dev / Browser Testing)
        window.APP_CONFIG = window.APP_CONFIG || {
            appId: 'pointage',
            packageName: 'com.example.pointage',
            versionName: '1.0.0',
            language: 'fr',
            // ===== إعدادات Supabase =====
            // ⚠️ استبدل هذه القيم بقيم مشروعك الحقيقي من https://supabase.com
            supabaseUrl: 'https://qrejsgsjftdbvobxhgnp.supabase.co',
            supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZWpzZ3NqZnRkYnZvYnhoZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNjE2MDQsImV4cCI6MjEwMTkzNzYwNH0.atcqF5iR7B83ePxd51lf68vb0lT-slD6yVzBNc_jrTA',
            resetPasswordUrl: 'https://votre-app.com/reset-password' // اختياري
        };
        console.warn('⚠️ APP_CONFIG: Running in web browser / fallback mode.');
    }
})();