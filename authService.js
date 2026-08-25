// ===== authService.js =====
(function () {
    let supabaseClient = null;
    let currentUser = null;

    function getClient() {
        if (!supabaseClient && window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) {
            try {
                const { createClient } = window.supabase;
                supabaseClient = createClient(
                    window.APP_CONFIG.supabaseUrl,
                    window.APP_CONFIG.supabaseAnonKey
                );
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
        // ===== دالة ضبط التوكن المضافة للتوافق مع MainActivity و authUI =====
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
                    if (typeof window.updatePremiumStatus === 'function') window.updatePremiumStatus();
                    return currentUser;
                }
            } catch (e) {
                console.warn('⚠️ Failed to restore session from token:', e);
            }
            return null;
        },

        // ===== توافق المسميات مع authUI.js =====
        async login(email, password) {
            const data = await this.signIn(email, password);
            const session = await this.getSession();
            return {
                user: data.user,
                token: session?.access_token || ''
            };
        },

        async logout() {
            await this.signOut();
        },

        async signUp(email, password) {
            const client = getClient();
            if (!client) throw new Error(getMessage('connectionError'));
            const { data, error } = await client.auth.signUp({
                email, password,
                options: {
                    data: {
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

        async signOut() {
            const client = getClient();
            if (client) await client.auth.signOut();
            currentUser = null;
            localStorage.removeItem('supabase_user_session');
            if (typeof window.showToast === 'function') {
                window.showToast(getMessage('signedOut'), 2000);
            }
            if (typeof window.updatePremiumStatus === 'function') window.updatePremiumStatus();
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
            await this.syncLocalDataToCloud(user.id);
            if (typeof window.updatePremiumStatus === 'function') window.updatePremiumStatus();
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
            const user = await this.getCurrentUser();
            if (!user) return false;
            const client = getClient();
            if (!client) return false;
            try {
                const { data, error } = await client
                    .from('app_users')
                    .select('features_used')
                    .eq('user_id', user.id)
                    .eq('app_id', window.APP_CONFIG?.appId || 'pointage')
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();
                if (error || !data || !data.features_used) return false;
                const cloudData = JSON.parse(data.features_used);
                if (cloudData.settings && window.settings) Object.assign(window.settings, cloudData.settings);
                if (cloudData.workData && window.workData) Object.assign(window.workData, cloudData.workData);
                if (typeof window.saveData === 'function') window.saveData();
                console.log('✅ Cloud data imported successfully');
                return true;
            } catch (e) {
                console.error('Failed to import cloud data:', e);
                return false;
            }
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
                redirectTo: window.APP_CONFIG?.resetPasswordUrl || window.location.origin
            });
            if (error) throw error;
            return data;
        }
    };

    // ===== ترجمة وإتاحة الواجهات العامة =====
    function getMessage(key) {
        const isAr = (window.settings?.language === 'ar');
        const messages = {
            'connectionError': isAr ? 'تعذر الاتصال بـ Supabase' : 'Impossible de se connecter à Supabase',
            'signedOut': isAr ? '✅ تم تسجيل الخروج بنجاح' : '✅ Déconnexion réussie'
        };
        return messages[key] || key;
    }

    window.signUpWithEmail = async function(email, password) {
        try { const result = await AuthService.signUp(email, password); return { user: result.user, error: null }; }
        catch (error) { return { user: null, error: error }; }
    };

    window.signInWithEmail = async function(email, password) {
        try { const result = await AuthService.signIn(email, password); return { user: result.user, error: null }; }
        catch (error) { return { user: null, error: error }; }
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

    // ===== استرجاع الجلسة عند تحميل العناصر =====
    document.addEventListener('DOMContentLoaded', async function() {
        try {
            const session = localStorage.getItem('supabase_user_session');
            if (session) {
                const user = await AuthService.getCurrentUser();
                if (user) {
                    console.log('✅ Active user:', user.email);
                    currentUser = user;
                    if (typeof window.updatePremiumStatus === 'function') window.updatePremiumStatus();
                }
            }
        } catch (e) { /* ignore */ }
    });

    console.log('authService.js loaded successfully');
})();