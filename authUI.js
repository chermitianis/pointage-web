/**
 * AuthUI.js - إدارة واجهة التوثيق لبرنامج Pointage
 */

(function () {
    let isSignUpMode = false;

    const AuthUI = {
        getModalElement: function () {
            return document.getElementById('authModal') || document.getElementById('auth-modal');
        },

        openModal: function () {
            const modal = this.getModalElement();
            if (modal) {
                modal.style.display = 'flex';
            } else {
                console.warn('⚠️ العنصر #authModal غير موجود في الصفحة');
            }
        },

        closeModal: function () {
            const modal = this.getModalElement();
            if (modal) {
                modal.style.display = 'none';
            }
            this.clearErrors();
        },

        toggleMode: function () {
            isSignUpMode = !isSignUpMode;
            const title = document.getElementById('authTitle');
            const subtitle = document.getElementById('authSubtitle');
            const btn = document.getElementById('authPrimaryBtn');
            const toggleText = document.getElementById('authToggleText');
            const toggleLink = document.getElementById('authToggleLink');

            if (isSignUpMode) {
                if (title) title.innerText = 'إنشاء حساب جديد';
                if (subtitle) subtitle.innerText = 'أنشئ حسابك لمزامنة بياناتك وساعات العمل';
                if (btn) btn.innerText = 'تسجيل الحساب';
                if (toggleText) toggleText.innerText = 'لديك حساب بالفعل؟';
                if (toggleLink) toggleLink.innerText = 'تسجيل الدخول';
            } else {
                if (title) title.innerText = 'تسجيل الدخول';
                if (subtitle) subtitle.innerText = 'أدخل بياناتك للوصول إلى حسابك';
                if (btn) btn.innerText = 'دخول';
                if (toggleText) toggleText.innerText = 'ليس لديك حساب؟';
                if (toggleLink) toggleLink.innerText = 'إنشاء حساب جديد';
            }
            this.clearErrors();
        },

        clearErrors: function () {
            const errDiv = document.getElementById('authError');
            if (errDiv) {
                errDiv.style.display = 'none';
                errDiv.innerText = '';
            }
        },

        showError: function (msg) {
            const errDiv = document.getElementById('authError');
            let friendlyMsg = msg;

            if (msg.includes('email rate limit exceeded') || msg.includes('429') || msg.includes('Too Many Requests')) {
                friendlyMsg = '⚠️ تم تجاوز حد محاولات التسجيل المسموح بها. يرجى الانتظار بضع دقائق أو استخدام حسابك الحالي عبر "تسجيل الدخول".';
            }

            if (errDiv) {
                errDiv.innerText = friendlyMsg;
                errDiv.style.display = 'block';
            } else {
                alert(friendlyMsg);
            }
        },

        handleSubmit: async function () {
            const emailInput = document.getElementById('authEmail');
            const passInput = document.getElementById('authPassword');
            const loading = document.getElementById('authLoading');
            const btn = document.getElementById('authPrimaryBtn');

            const email = emailInput ? emailInput.value.trim() : '';
            const password = passInput ? passInput.value : '';

            if (!email || !password) {
                this.showError('يرجى كتابة البريد الإلكتروني وكلمة المرور');
                return;
            }

            this.clearErrors();
            if (loading) loading.style.display = 'block';
            if (btn) btn.disabled = true;

            try {
                if (isSignUpMode) {
                    const { user, error } = await window.signUpWithEmail(email, password);
                    if (error) throw error;
                } else {
                    const { user, error } = await window.signInWithEmail(email, password);
                    if (error) throw error;
                }

                this.closeModal();
                await this.updateAuthStatusUI();
            } catch (err) {
                this.showError(err.message || 'حدث خطأ أثناء العملية');
            } finally {
                if (loading) loading.style.display = 'none';
                if (btn) btn.disabled = false;
            }
        },

        handleSignOut: async function () {
            try {
                // استدعاء المزامنة والتوثيق مباشرة لمنع الـ Recursion
                if (window.AuthService && typeof window.AuthService.signOut === 'function') {
                    await window.AuthService.signOut();
                } else if (window.supabaseClient && window.supabaseClient.auth) {
                    await window.supabaseClient.auth.signOut();
                }

                await this.updateAuthStatusUI();
            } catch (err) {
                console.error('❌ Error signing out:', err);
            }
        },

        updateAuthStatusUI: async function () {
            const statusDiv = document.getElementById('authStatus');
            const loginBtn = document.querySelector('button[onclick="openAuthModal()"]');
            const logoutBtn = document.querySelector('button[onclick="window.signOutUser()"]') ||
                             document.querySelector('button[onclick="signOutUser()"]');

            try {
                const user = window.AuthService ? await window.AuthService.getCurrentUser() : null;

                if (user) {
                    if (statusDiv) {
                        statusDiv.innerHTML = `Connecté en tant que: <strong>${user.email}</strong>`;
                        statusDiv.style.color = '#10b981';
                    }
                    if (loginBtn) loginBtn.style.display = 'none';
                    if (logoutBtn) logoutBtn.style.display = 'block';
                } else {
                    if (statusDiv) {
                        statusDiv.innerHTML = `Non connecté (Mode local)`;
                        statusDiv.style.color = 'var(--gray, #6b7280)';
                    }
                    if (loginBtn) loginBtn.style.display = 'block';
                    if (logoutBtn) logoutBtn.style.display = 'none';
                }
            } catch (e) {
                if (statusDiv) statusDiv.innerHTML = `Non connecté`;
            }
        }
    };

    // ===== تصدير الدوال إلى النطاق العام window =====
    window.openAuthModal = function () { AuthUI.openModal(); };
    window.closeAuthModal = function () { AuthUI.closeModal(); };
    window.toggleAuthMode = function () { AuthUI.toggleMode(); };
    window.handleAuthSubmit = function () { AuthUI.handleSubmit(); };
    window.signOutUser = function () { AuthUI.handleSignOut(); };

    window.AuthUI = AuthUI;

    document.addEventListener('DOMContentLoaded', () => {
        AuthUI.updateAuthStatusUI();
    });
})();