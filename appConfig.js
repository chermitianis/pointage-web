// ===== appConfig.js =====
(function () {
    function initConfig() {
        if (window.APP_CONFIG && window.APP_CONFIG.appId && window.APP_CONFIG.appId !== 'dev') {
            console.log('✅ APP_CONFIG already present from Native:', window.APP_CONFIG.appId);
            try {
                localStorage.setItem('pointageAppConfig', JSON.stringify(window.APP_CONFIG));
            } catch (e) {}
            return true;
        }

        if (window.AndroidApp && typeof window.AndroidApp.getAppConfig === 'function') {
            try {
                const configStr = window.AndroidApp.getAppConfig();
                if (configStr && configStr.length > 0) {
                    window.APP_CONFIG = JSON.parse(configStr);
                    console.log('✅ APP_CONFIG loaded via AndroidApp bridge:', window.APP_CONFIG.appId);
                    try {
                        localStorage.setItem('pointageAppConfig', JSON.stringify(window.APP_CONFIG));
                    } catch (e) {}
                    return true;
                }
            } catch (e) {
                console.error('❌ Error parsing getAppConfig():', e);
            }
        }

        try {
            const saved = localStorage.getItem('pointageAppConfig');
            if (saved) {
                window.APP_CONFIG = JSON.parse(saved);
                console.log('✅ APP_CONFIG loaded from localStorage:', window.APP_CONFIG.appId);
                return true;
            }
        } catch (e) {}

        return false;
    }

    if (!initConfig()) {
        console.warn('⚠️ APP_CONFIG: Using fallback values');
        window.APP_CONFIG = {
            appId: 'pointage',
            packageName: 'com.example.pointage',
            versionName: '1.0.0',
            versionCode: 1,
            language: 'fr',
            supabaseUrl: 'https://qrejsgsjftdbvobxhgnp.supabase.co',
            supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZWpzZ3NqZnRkYnZvYnhoZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNjE2MDQsImV4cCI6MjEwMTkzNzYwNH0.atcqF5iR7B83ePxd51lf68vb0lT-slD6yVzBNc_jrTA',
            resetPasswordUrl: 'https://votre-app.com/reset-password'
        };
        try {
            localStorage.setItem('pointageAppConfig', JSON.stringify(window.APP_CONFIG));
        } catch (e) {}
    }

    if (!window.APP_CONFIG.language) window.APP_CONFIG.language = 'fr';
    if (!window.APP_CONFIG.supabaseUrl) {
        window.APP_CONFIG.supabaseUrl = 'https://qrejsgsjftdbvobxhgnp.supabase.co';
    }
    if (!window.APP_CONFIG.supabaseAnonKey) {
        window.APP_CONFIG.supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZWpzZ3NqZnRkYnZvYnhoZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNjE2MDQsImV4cCI6MjEwMTkzNzYwNH0.atcqF5iR7B83ePxd51lf68vb0lT-slD6yVzBNc_jrTA';
    }

    console.log('📱 APP_CONFIG final:', {
        appId: window.APP_CONFIG.appId,
        version: window.APP_CONFIG.versionName,
        language: window.APP_CONFIG.language,
        supabaseUrl: window.APP_CONFIG.supabaseUrl ? '✅ présent' : '❌ manquant'
    });
})();
