// ===== authService.js =====
(function () {
    let supabaseClient = null;
    let currentUser = null;

    // ===== Firebase Configuration =====
    const firebaseConfig = {
        apiKey: "AIzaSyCOT8WjtJ9qEcUWbv_pIgV7RFisrryes6o",
        authDomain: "pointage-454ef.firebaseapp.com",
        projectId: "pointage-454ef",
        storageBucket: "pointage-454ef.firebasestorage.app",
        messagingSenderId: "521883437469",
        appId: "1:521883437469:web:5885b451e7c47c34db8774",
        measurementId: "G-J5HMPC95W8"
    };

    // ===== تهيئة Firebase =====
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        try {
            if (!firebase.apps || firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
                console.log('✅ Firebase initialized successfully');
            } else {
                console.log('✅ Firebase already initialized');
            }
        } catch (e) {
            console.warn('⚠️ Firebase init error:', e);
        }
    } else {
        console.warn('⚠️ Firebase SDK not loaded');
    }

    function getAppUrl() {
        if (window.AndroidApp && typeof window.AndroidApp.getDeviceId === 'function') {
            return 'https://chermitianis.github.io/pointage-web/';
        }
        return window.location.origin + window.location.pathname;
    }

    function getClient() {
        if (window.supabaseInstance) {
            supabaseClient = window.supabaseInstance;
            return supabaseClient;
        }
        if (!supabaseClient && window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) {
            try {
                const { createClient } = window.supabase;
                supabaseClient = createClient(
                    window.APP_CONFIG.supabaseUrl,
                    window.APP_CONFIG.supabaseAnonKey
                );
                window.supabaseInstance = supabaseClient;
                console.log('✅ Supabase client initialized');
            } catch (e) {
                console.error('❌ Failed to initialize Supabase client:', e);
            }
        }
        return supabaseClient;
    }

    function getDeviceId() {
        if (window.AndroidApp && typeof window.AndroidApp.getDeviceId === 'function') {
            try {
                return window.AndroidApp.getDeviceId();
            } catch (e) { /* ignore */ }
        }
        let deviceId = localStorage.getItem('pointage_device_id');
        if (!deviceId) {
            deviceId = 'web_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            localStorage.setItem('pointage_device_id', deviceId);
        }
        return deviceId;
    }

    function getLocalUserData() {
        try {
            return {
                settings: window.settings || {},
                workData: window.workData || {},
                notesData: window.notesData || {},
                tasksData: window.tasksData || {},
                remindersData: window.remindersData || {}
            };
        } catch (e) {
            console.warn('Failed to collect local data:', e);
            return {};
        }
    }

    // ===== Firebase OTP (Phone Authentication) =====
    window.initRecaptcha = function(buttonId = 'send-sms-btn') {
        try {
            if (!window.recaptchaVerifier) {
                if (typeof firebase === 'undefined' || !firebase.auth) {
                    console.error('❌ Firebase Auth not available');
                    return null;
                }
                window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(buttonId, {
                    'size': 'invisible',
                    'callback': function() {
                        console.log('✅ reCAPTCHA resolved');
                    }
                });
                console.log('✅ reCAPTCHA initialized');
            }
            return window.recaptchaVerifier;
        } catch (e) {
            console.error('❌ initRecaptcha error:', e);
            return null;
        }
    };

    // Send OTP SMS via Firebase
    window.sendFirebaseOTP = async function(phoneNumber) {
        try {
            if (!phoneNumber || phoneNumber.length < 8) {
                throw new Error(getMessage('invalidPhone'));
            }
            const appVerifier = window.initRecaptcha('send-sms-btn');
            if (!appVerifier) {
                throw new Error(getMessage('recaptchaError'));
            }
            const confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            return { success: true, message: getMessage('otpSent') };
        } catch (error) {
            console.error('❌ sendFirebaseOTP error:', error);
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.render().then(widgetId => {
                        if (typeof grecaptcha !== 'undefined') {
                            grecaptcha.reset(widgetId);
                        }
                    });
                } catch (e) {}
            }
            throw error;
        }
    };

    // Verify OTP & Sign In to Supabase using Firebase token
    window.verifyOTPAndLogin = async function(otpCode) {
        try {
            if (!otpCode || otpCode.length < 4) {
                throw new Error(getMessage('invalidOtp'));
            }
            if (!window.confirmationResult) {
                throw new Error(getMessage('noConfirmation'));
            }
            const result = await window.confirmationResult.confirm(otpCode);
            const firebaseUser = result.user;
            if (!firebaseUser) {
                throw new Error(getMessage('authFailed'));
            }
            const idToken = await firebaseUser.getIdToken();

            const client = getClient();
            if (!client) {
                throw new Error(getMessage('connectionError'));
            }
            const { data, error } = await client.auth.signInWithIdToken({
                provider: 'firebase',
                token: idToken,
            });

            if (error) throw error;
            if (data?.user) {
                currentUser = data.user;
                await AuthService.onAuthSuccess(data.user);
                return { success: true, user: data.user };
            }
            throw new Error(getMessage('authFailed'));
        } catch (error) {
            console.error('❌ verifyOTPAndLogin error:', error);
            throw error;
        }
    };

    // ===== OAuth Callback Handler =====
    window.handleOAuthCallback = async function(accessToken) {
        console.log('🔄 handleOAuthCallback appelé avec token:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');
        if (!accessToken) return;
        try {
            if (window.AuthService && typeof window.AuthService.setSessionToken === 'function') {
                const user = await window.AuthService.setSessionToken(accessToken);
                if (user) {
                    console.log('✅ Connexion OAuth réussie pour:', user.email);
                    if (typeof showToast === 'function') {
                        showToast('✅ Connexion réussie', 2000);
                    }
                    if (window.AndroidApp && typeof window.AndroidApp.saveUserToken === 'function') {
                        window.AndroidApp.saveUserToken(accessToken);
                    }
                    if (window.SupabaseSyncEngine && typeof window.SupabaseSyncEngine.pullAll === 'function') {
                        await window.SupabaseSyncEngine.pullAll();
                        if (typeof loadData === 'function') loadData();
                    }
                    if (typeof updatePremiumStatus === 'function') updatePremiumStatus();
                    setTimeout(() => location.reload(), 500);
                }
            }
        } catch (e) {
            console.error('❌ Erreur handleOAuthCallback:', e);
            if (typeof showToast === 'function') {
                showToast('❌ Erreur lors de la connexion', 3000);
            }
        }
    };

    const AuthService = {
        getClient() {
            return getClient();
        },

        async setSessionToken(accessToken) {
            const client = getClient();
            if (!client || !accessToken) return null;
            try {
                const { data, error } = await client.auth.setSession({
                    access_token: accessToken,
                    refresh_token: ''
                });
                if (error) throw error;
                if (data?.user) {
                    currentUser = data.user;
                    localStorage.setItem('supabase_user_session', JSON.stringify({
                        id: currentUser.id,
                        email: currentUser.email,
                        lastLogin: new Date().toISOString()
                    }));
                    if (window.AndroidApp && typeof window.AndroidApp.saveUserToken === 'function') {
                        window.AndroidApp.saveUserToken(accessToken);
                    }
                    return currentUser;
                }
            } catch (e) {
                console.warn('⚠️ Failed to restore session from token:', e);
            }
            return null;
        },

        async signIn(email, password) {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data?.user) {
                currentUser = data.user;
                await this.onAuthSuccess(data.user);
            }
            return data;
        },

        async signUp(email, password, fullName) {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        has_password: true,
                        app_id: window.APP_CONFIG?.appId || 'pointage',
                        device_id: getDeviceId()
                    }
                }
            });
            if (error) throw error;
            if (data?.user) {
                currentUser = data.user;
                await this.onAuthSuccess(data.user);
            }
            return data;
        },

        async signInWithGoogle() {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const redirectUrl = getAppUrl();
            console.log('🔄 Google OAuth redirectTo:', redirectUrl);

            const isAndroid = !!(window.AndroidApp && typeof window.AndroidApp.getDeviceId === 'function');
            const finalRedirectUrl = isAndroid ? redirectUrl + '?signup=google' : redirectUrl;

            const { data, error } = await client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: finalRedirectUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });
            if (error) throw error;

            if (data?.url && isAndroid) {
                console.log('🔄 Ouverture de l\'URL OAuth dans WebView');
                window.location.href = data.url;
            }

            return data;
        },

        async signInWithFacebook() {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const redirectUrl = getAppUrl();
            console.log('🔄 Facebook OAuth redirectTo:', redirectUrl);

            const isAndroid = !!(window.AndroidApp && typeof window.AndroidApp.getDeviceId === 'function');
            const finalRedirectUrl = isAndroid ? redirectUrl + '?signup=facebook' : redirectUrl;

            const { data, error } = await client.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: finalRedirectUrl
                }
            });
            if (error) throw error;

            if (data?.url && isAndroid) {
                window.location.href = data.url;
            }

            return data;
        },

        // Phone authentication via Firebase OTP
        async signInWithPhone(phoneNumber) {
            return await window.sendFirebaseOTP(phoneNumber);
        },

        async verifyPhoneOtp(phoneNumber, token) {
            return await window.verifyOTPAndLogin(token);
        },

        async setPasswordForOAuthUser(password) {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.updateUser({
                password: password,
                data: { has_password: true }
            });
            if (error) throw error;
            return data;
        },

        async hasPassword() {
            const user = await this.getCurrentUser();
            if (!user) return false;
            return user.user_metadata?.has_password === true;
        },

        async signOut() {
            const client = getClient();
            if (client) await client.auth.signOut();
            currentUser = null;

            if (window.AndroidApp && typeof window.AndroidApp.clearUserToken === 'function') {
                window.AndroidApp.clearUserToken();
            }

            const keys = [
                'pointageWorkData',
                'pointageSettings',
                'pointageNotesData',
                'pointageTasksData',
                'pointageRemindersData',
                'supabase_user_session',
                'pointage_device_id'
            ];
            keys.forEach(key => localStorage.removeItem(key));

            window.workData = {};
            window.notesData = {};
            window.tasksData = {};
            window.remindersData = {};
            window.settings = { language: 'fr' };

            if (typeof window.showToast === 'function') {
                window.showToast(getMessage('signedOut'), 2000);
            }
            if (typeof window.updatePremiumStatus === 'function') window.updatePremiumStatus();

            setTimeout(() => {
                location.reload();
            }, 500);
        },

        async getCurrentUser() {
            if (currentUser) return currentUser;
            const client = getClient();
            if (!client) return null;
            try {
                const { data: { user } } = await client.auth.getUser();
                currentUser = user;
                return user;
            } catch (e) { return null; }
        },

        async getSession() {
            const client = getClient();
            if (!client) return null;
            const { data: { session } } = await client.auth.getSession();
            return session;
        },

        async isAuthenticated() {
            const user = await this.getCurrentUser();
            return !!user;
        },

        async onAuthSuccess(user) {
            if (!user) return;
            localStorage.setItem('supabase_user_session', JSON.stringify({
                id: user.id,
                email: user.email,
                lastLogin: new Date().toISOString()
            }));
            try {
                const session = await this.getSession();
                if (session && window.AndroidApp && typeof window.AndroidApp.saveUserToken === 'function') {
                    window.AndroidApp.saveUserToken(session.access_token);
                }
            } catch (e) { /* ignore */ }

            if (window.SupabaseSyncEngine && typeof window.SupabaseSyncEngine.pullAll === 'function') {
                await window.SupabaseSyncEngine.pullAll();
            }

            if (typeof window.updatePremiumStatus === 'function') window.updatePremiumStatus();
            location.reload();
        },

        async syncLocalDataToCloud(userId) {
            const client = getClient();
            if (!client || !userId) return false;
            try {
                const localData = getLocalUserData();
                const payload = {
                    user_id: userId,
                    app_id: window.APP_CONFIG?.appId || 'pointage',
                    device_id: getDeviceId(),
                    features_used: JSON.stringify(localData),
                    updated_at: new Date().toISOString(),
                    app_version: window.APP_CONFIG?.versionName || '1.0.0',
                    language: window.settings?.language || 'fr'
                };
                const { error } = await client.from('app_users').upsert(payload, { onConflict: 'user_id, app_id' });
                if (error) {
                    console.error('❌ Cloud sync error:', error.message);
                    return false;
                }
                console.log('✅ Data synced successfully');
                return true;
            } catch (e) {
                console.error('⚠️ Sync failed:', e);
                return false;
            }
        },

        async syncCloudDataToLocal() {
            if (window.SupabaseSyncEngine && typeof window.SupabaseSyncEngine.pullAll === 'function') {
                return await window.SupabaseSyncEngine.pullAll();
            }
            return false;
        },

        async changePassword(newPassword) {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.updateUser({ password: newPassword });
            if (error) throw error;
            return data;
        },

        async resetPassword(email) {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.resetPasswordForEmail(email, {
                redirectTo: getAppUrl()
            });
            if (error) throw error;
            return data;
        }
    };

    function getMessage(key) {
        const isAr = (window.settings?.language === 'ar');
        const messages = {
            'connectionError': isAr ? 'تعذر الاتصال بـ Supabase' : 'Impossible de se connecter à Supabase',
            'signedOut': isAr ? '✅ تم تسجيل الخروج بنجاح' : '✅ Déconnexion réussie',
            'invalidPhone': isAr ? 'رقم هاتف غير صحيح' : 'Numéro de téléphone invalide',
            'recaptchaError': isAr ? 'خطأ في reCAPTCHA' : 'Erreur reCAPTCHA',
            'otpSent': isAr ? 'تم إرسال رمز التحقق' : 'Code de vérification envoyé',
            'invalidOtp': isAr ? 'رمز التحقق غير صحيح' : 'Code de vérification invalide',
            'noConfirmation': isAr ? 'لا توجد جلسة تحقق' : 'Aucune session de vérification',
            'authFailed': isAr ? 'فشل المصادقة' : 'Échec de l\'authentification'
        };
        return messages[key] || key;
    }

    // ===== Exports =====
    window.signUpWithEmail = async function(email, password, fullName) {
        try { const result = await AuthService.signUp(email, password, fullName); return { user: result.user, error: null }; }
        catch (error) { return { user: null, error: error }; }
    };
    window.signInWithEmail = async function(email, password) {
        try { const result = await AuthService.signIn(email, password); return { user: result.user, error: null }; }
        catch (error) { return { user: null, error: error }; }
    };
    window.signInWithGoogle = async function() {
        try { const data = await AuthService.signInWithGoogle(); return { data, error: null }; }
        catch (error) { return { data: null, error: error }; }
    };
    window.signInWithFacebook = async function() {
        try { const data = await AuthService.signInWithFacebook(); return { data, error: null }; }
        catch (error) { return { data: null, error: error }; }
    };
    window.signInWithPhone = async function(phone) {
        try { const data = await AuthService.signInWithPhone(phone); return { data, error: null }; }
        catch (error) { return { data: null, error: error }; }
    };
    window.verifyPhoneOtp = async function(phone, token) {
        try { const data = await AuthService.verifyPhoneOtp(phone, token); return { user: data.user, error: null }; }
        catch (error) { return { user: null, error: error }; }
    };
    window.setPasswordForOAuthUser = async function(password) {
        try { const data = await AuthService.setPasswordForOAuthUser(password); return { data, error: null }; }
        catch (error) { return { data: null, error: error }; }
    };
    window.hasPassword = async function() {
        return await AuthService.hasPassword();
    };
    window.signOutUser = async function() { await AuthService.signOut(); };
    window.getCurrentUser = async function() { return await AuthService.getCurrentUser(); };
    window.isUserAuthenticated = async function() { return await AuthService.isAuthenticated(); };
    window.syncDataWithSupabase = async function() {
        const user = await AuthService.getCurrentUser();
        if (!user) return false;
        return await AuthService.syncLocalDataToCloud(user.id);
    };
    window.syncFromCloud = async function() { return await AuthService.syncCloudDataToLocal(); };
    window.changeUserPassword = async function(newPassword) {
        try { await AuthService.changePassword(newPassword); return { success: true, error: null }; }
        catch (error) { return { success: false, error: error }; }
    };
    window.resetUserPassword = async function(email) {
        try { await AuthService.resetPassword(email); return { success: true, error: null }; }
        catch (error) { return { success: false, error: error }; }
    };

    // Export Firebase OTP functions
    window.sendFirebaseOTP = window.sendFirebaseOTP;
    window.verifyOTPAndLogin = window.verifyOTPAndLogin;
    window.initRecaptcha = window.initRecaptcha;

    window.AuthService = AuthService;

    document.addEventListener('DOMContentLoaded', async function() {
        try {
            const session = localStorage.getItem('supabase_user_session');
            if (session) {
                const user = await AuthService.getCurrentUser();
                if (user) {
                    console.log('✅ Active user:', user.email);
                    currentUser = user;
                    if (typeof window.updatePremiumStatus === 'function') window.updatePremiumStatus();
                    if (window.SupabaseSyncEngine && typeof window.SupabaseSyncEngine.pullAll === 'function') {
                        await window.SupabaseSyncEngine.pullAll();
                    }
                }
            }
        } catch (e) { /* ignore */ }
    });

    console.log('✅ authService.js chargé avec succès (Firebase OTP + Supabase Auth)');
})();
