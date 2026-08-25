// ===== authService.js =====
(function () {
    let supabaseClient = null;
    let currentUser = null;

    const APP_URL = 'https://chermitianis.github.io/pointage-web/';

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

    const AuthService = {
        getClient() {
            return getClient();
        },

        // تسجيل الدخول باستخدام Session Token (من OAuth)
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
                    return currentUser;
                }
            } catch (e) {
                console.warn('⚠️ Failed to restore session from token:', e);
            }
            return null;
        },

        // تسجيل الدخول بالبريد وكلمة المرور
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

        // إنشاء حساب جديد بالبريد وكلمة المرور
        async signUp(email, password, fullName) {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        has_password: true, // علامة أن المستخدم لديه كلمة مرور
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

        // تسجيل الدخول عبر Google (للمستخدمين الذين لديهم كلمة مرور أيضاً)
        async signInWithGoogle() {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: APP_URL + '?signup=google' // علامة للتمييز
                }
            });
            if (error) throw error;
            return data;
        },

        // تسجيل الدخول عبر Facebook
        async signInWithFacebook() {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: APP_URL + '?signup=facebook'
                }
            });
            if (error) throw error;
            return data;
        },

        // تسجيل الدخول عبر الهاتف (OTP)
        async signInWithPhone(phoneNumber) {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.signInWithOtp({
                phone: phoneNumber,
            });
            if (error) throw error;
            return data;
        },

        async verifyPhoneOtp(phoneNumber, token) {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.verifyOtp({
                phone: phoneNumber,
                token: token,
                type: 'sms'
            });
            if (error) throw error;
            if (data?.user) {
                currentUser = data.user;
                await this.onAuthSuccess(data.user);
            }
            return data;
        },

        // تعيين كلمة مرور لحساب OAuth (للمستخدمين الذين سجلوا عبر Google/فيسبوك)
        async setPasswordForOAuthUser(password) {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.updateUser({
                password: password,
                data: { has_password: true } // تحديث العلامة
            });
            if (error) throw error;
            return data;
        },

        // التحقق مما إذا كان المستخدم لديه كلمة مرور
        async hasPassword() {
            const user = await this.getCurrentUser();
            if (!user) return false;
            return user.user_metadata?.has_password === true;
        },

        async signOut() {
            const client = getClient();
            if (client) await client.auth.signOut();
            currentUser = null;

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
                redirectTo: APP_URL
            });
            if (error) throw error;
            return data;
        }
    };

    function getMessage(key) {
        const isAr = (window.settings?.language === 'ar');
        const messages = {
            'connectionError': isAr ? 'تعذر الاتصال بـ Supabase' : 'Impossible de se connecter à Supabase',
            'signedOut': isAr ? '✅ تم تسجيل الخروج بنجاح' : '✅ Déconnexion réussie'
        };
        return messages[key] || key;
    }

    // ===== تصدير الدوال العامة =====
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

    console.log('authService.js loaded successfully with APP_URL:', APP_URL);
})();
