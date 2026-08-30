/**
 * AuthUI.js - إدارة واجهة التوثيق (Google + Email/Password فقط)
 */

(function () {
    let isSignUpMode = false;

    function getLanguage() {
        return (window.settings && window.settings.language) || 'fr';
    }

    const strings = {
        fr: {
            signInTitle: 'Se connecter',
            signInSub: 'Entrez vos identifiants pour accéder à votre compte',
            email: 'Email',
            password: 'Mot de passe',
            signInBtn: 'Connexion',
            forgotPassword: 'Mot de passe oublié ?',
            noAccount: 'Pas de compte ?',
            createAccount: 'Créer un compte',
            signUpTitle: 'Créer un compte',
            signUpSub: 'Entrez vos informations pour créer un compte',
            google: 'Continuer avec Google',
            backToLogin: '← Retour à la connexion',
            continueAsGuest: 'Continuer en tant qu\'invité',
            close: 'Fermer',
            loading: 'Chargement...',
            errorEmailRequired: 'Veuillez saisir votre email',
            errorPasswordRequired: 'Veuillez saisir votre mot de passe',
            errorGeneric: 'Une erreur est survenue',
            resetSent: 'Un email de réinitialisation a été envoyé',
            resetInstruction: 'Entrez votre email pour recevoir un lien de réinitialisation',
            connectedAs: 'Connecté en tant que:',
            notConnected: 'Non connecté (Mode local)',
            fullName: 'Nom complet',
            choosePassword: 'Choisissez un mot de passe',
            confirmPassword: 'Confirmer le mot de passe',
            createAccountBtn: 'Créer le compte',
            cancel: 'Annuler',
            passwordMismatch: 'Les mots de passe ne correspondent pas',
            passwordTooShort: 'Le mot de passe doit comporter au moins 6 caractères',
            emailRequired: 'L\'email est requis',
            accountCreated: '✅ Compte créé avec succès'
        },
        ar: {
            signInTitle: 'تسجيل الدخول',
            signInSub: 'أدخل بياناتك للوصول إلى حسابك',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            signInBtn: 'دخول',
            forgotPassword: 'نسيت كلمة المرور؟',
            noAccount: 'ليس لديك حساب؟',
            createAccount: 'إنشاء حساب',
            signUpTitle: 'إنشاء حساب',
            signUpSub: 'أدخل معلوماتك لإنشاء حساب',
            google: 'المتابعة عبر Google',
            backToLogin: '← العودة لتسجيل الدخول',
            continueAsGuest: 'متابعة كزائر',
            close: 'إلغاء',
            loading: 'جاري المعالجة...',
            errorEmailRequired: 'يرجى كتابة البريد الإلكتروني',
            errorPasswordRequired: 'يرجى كتابة كلمة المرور',
            errorGeneric: 'حدث خطأ',
            resetSent: 'تم إرسال بريد إعادة التعيين',
            resetInstruction: 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين',
            connectedAs: 'متصل كـ:',
            notConnected: 'غير متصل (وضع محلي)',
            fullName: 'الاسم الكامل',
            choosePassword: 'اختر كلمة مرور',
            confirmPassword: 'تأكيد كلمة المرور',
            createAccountBtn: 'إنشاء الحساب',
            cancel: 'إلغاء',
            passwordMismatch: 'كلمة المرور غير متطابقة',
            passwordTooShort: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            emailRequired: 'البريد الإلكتروني مطلوب',
            accountCreated: '✅ تم إنشاء الحساب بنجاح'
        }
    };

    function t(key) {
        const lang = getLanguage();
        return strings[lang]?.[key] || strings.fr[key] || key;
    }

    const AuthUI = {
        getModalElement() {
            return document.getElementById('authModal') || document.getElementById('auth-modal');
        },

        openModal() {
            const modal = this.getModalElement();
            if (modal) {
                modal.style.display = 'flex';
                isSignUpMode = false;
                this.renderView();
                this.clearErrors();
            }
        },

        closeModal() {
            const modal = this.getModalElement();
            if (modal) modal.style.display = 'none';
            this.clearErrors();
        },

        renderView() {
            if (isSignUpMode) {
                this.renderSignUpForm();
            } else {
                this.renderLoginForm();
            }
        },

        renderLoginForm() {
            const container = document.getElementById('authContent');
            if (!container) return;
            const isAr = getLanguage() === 'ar';
            const dir = isAr ? 'rtl' : 'ltr';

            container.innerHTML = `
                <div style="text-align:center; direction:${dir};">
                    <div style="font-size:48px; margin-bottom:8px;">🔐</div>
                    <h3 style="margin-bottom:6px; color:var(--text-color, #333); font-size:20px; font-weight:700;">${t('signInTitle')}</h3>
                    <p style="margin-bottom:20px; color:var(--gray, #888); font-size:13px;">${t('signInSub')}</p>

                    <div style="margin-bottom:12px;">
                        <label for="authEmail" style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('email')}</label>
                        <input type="email" id="authEmail" placeholder="exemple@domaine.com"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333);">
                    </div>

                    <div style="margin-bottom:12px;">
                        <label for="authPassword" style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('password')}</label>
                        <input type="password" id="authPassword" placeholder="••••••"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333);"
                               onkeydown="if(event.key==='Enter') handleAuthSubmit()">
                    </div>

                    <button id="authPrimaryBtn" onclick="handleAuthSubmit()"
                            style="width:100%; padding:12px; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff; border:none; border-radius:10px; font-weight:700; font-size:16px; cursor:pointer; margin-bottom:8px;">
                        ${t('signInBtn')}
                    </button>

                    <!-- Google Button -->
                    <button onclick="handleGoogleLogin()" style="width:100%; padding:10px; margin-bottom:10px; background:#fff; color:#333; border:1px solid #ddd; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;">
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.86.92 7.48 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        <span>${t('google')}</span>
                    </button>

                    <div style="text-align:right; margin-bottom:12px;">
                        <a href="#" onclick="handleForgotPassword(); return false;" style="color:#2563eb; text-decoration:none; font-size:13px;">${t('forgotPassword')}</a>
                    </div>

                    <div style="margin-top:12px; font-size:14px; color:var(--gray, #666);">
                        <span>${t('noAccount')}</span>
                        <a href="#" onclick="toggleAuthMode(); return false;" style="color:#2563eb; text-decoration:none; font-weight:600;">${t('createAccount')}</a>
                    </div>

                    <div style="margin-top:12px; font-size:13px;">
                        <a href="#" onclick="closeAuthModal(); return false;" style="color:var(--gray, #999); text-decoration:none;">☕ ${t('continueAsGuest')}</a>
                    </div>

                    <div id="authLoading" style="display:none; margin-top:6px; font-size:14px; color:#2563eb;">⏳ ${t('loading')}</div>
                    <div id="authError" style="display:none; margin-top:6px; font-size:13px; color:#dc2626; background:#fee2e2; padding:8px 12px; border-radius:8px;"></div>

                    <button onclick="closeAuthModal()"
                            style="margin-top:14px; background:transparent; border:none; color:var(--gray, #aaa); cursor:pointer; font-size:14px; padding:6px 16px; border-radius:20px;">
                        ✕ ${t('close')}
                    </button>
                </div>
            `;
        },

        renderSignUpForm() {
            const container = document.getElementById('authContent');
            if (!container) return;
            const isAr = getLanguage() === 'ar';
            const dir = isAr ? 'rtl' : 'ltr';

            container.innerHTML = `
                <div style="text-align:center; direction:${dir};">
                    <div style="font-size:48px; margin-bottom:8px;">📝</div>
                    <h3 style="margin-bottom:6px; color:var(--text-color, #333); font-size:20px; font-weight:700;">${t('signUpTitle')}</h3>
                    <p style="margin-bottom:20px; color:var(--gray, #888); font-size:13px;">${t('signUpSub')}</p>

                    <!-- Google Button -->
                    <button onclick="handleGoogleLogin()" style="width:100%; padding:10px; margin-bottom:10px; background:#fff; color:#333; border:1px solid #ddd; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;">
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.86.92 7.48 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        <span>${t('google')}</span>
                    </button>

                    <hr style="margin:16px 0; border:none; border-top:1px solid var(--border-color, #e0e0e0);">

                    <div style="margin-bottom:12px;">
                        <label style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('fullName')}</label>
                        <input type="text" id="signupFullName" placeholder="${t('fullName')}"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333);">
                    </div>

                    <div style="margin-bottom:12px;">
                        <label style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('email')}</label>
                        <input type="email" id="signupEmail" placeholder="exemple@domaine.com"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333);">
                    </div>

                    <div style="margin-bottom:12px;">
                        <label style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('choosePassword')}</label>
                        <input type="password" id="signupPassword" placeholder="${t('choosePassword')}"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333);">
                    </div>

                    <div style="margin-bottom:12px;">
                        <label style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('confirmPassword')}</label>
                        <input type="password" id="signupConfirmPassword" placeholder="${t('confirmPassword')}"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333);"
                               onkeydown="if(event.key==='Enter') handleSignUpSubmit()">
                    </div>

                    <button onclick="handleSignUpSubmit()"
                            style="width:100%; padding:12px; background:linear-gradient(135deg, #4CAF50, #388E3C); color:#fff; border:none; border-radius:10px; font-weight:700; font-size:16px; cursor:pointer; margin-bottom:8px;">
                        ${t('createAccountBtn')}
                    </button>

                    <div style="margin-top:12px; font-size:13px;">
                        <a href="#" onclick="toggleAuthMode(); return false;" style="color:var(--gray, #999); text-decoration:none;">← ${t('backToLogin')}</a>
                    </div>

                    <div id="authLoading" style="display:none; margin-top:6px; font-size:14px; color:#2563eb;">⏳ ${t('loading')}</div>
                    <div id="authError" style="display:none; margin-top:6px; font-size:13px; color:#dc2626; background:#fee2e2; padding:8px 12px; border-radius:8px;"></div>

                    <button onclick="closeAuthModal()"
                            style="margin-top:14px; background:transparent; border:none; color:var(--gray, #aaa); cursor:pointer; font-size:14px; padding:6px 16px; border-radius:20px;">
                        ✕ ${t('close')}
                    </button>
                </div>
            `;
        },

        clearErrors() {
            const errDiv = document.getElementById('authError');
            if (errDiv) {
                errDiv.style.display = 'none';
                errDiv.innerText = '';
            }
        },

        showError(msg) {
            const errDiv = document.getElementById('authError');
            if (errDiv) {
                errDiv.innerText = msg;
                errDiv.style.display = 'block';
            } else {
                alert(msg);
            }
        },

        handleLogin: async function () {
            const emailInput = document.getElementById('authEmail');
            const passInput = document.getElementById('authPassword');
            const loading = document.getElementById('authLoading');
            const btn = document.getElementById('authPrimaryBtn');

            this.clearErrors();

            const email = emailInput ? emailInput.value.trim() : '';
            const password = passInput ? passInput.value : '';

            if (!email) {
                this.showError(t('errorEmailRequired'));
                return;
            }
            if (!password) {
                this.showError(t('errorPasswordRequired'));
                return;
            }

            if (loading) loading.style.display = 'block';
            if (btn) btn.disabled = true;

            try {
                const result = await window.signInWithEmail(email, password);
                if (result.error) throw result.error;

                this.closeModal();
                await this.updateAuthStatusUI();
            } catch (err) {
                this.showError(err.message || t('errorGeneric'));
            } finally {
                if (loading) loading.style.display = 'none';
                if (btn) btn.disabled = false;
            }
        },

        handleSignUpSubmit: async function () {
            const fullName = document.getElementById('signupFullName')?.value.trim() || '';
            const email = document.getElementById('signupEmail')?.value.trim() || '';
            const password = document.getElementById('signupPassword')?.value || '';
            const confirmPassword = document.getElementById('signupConfirmPassword')?.value || '';
            const loading = document.getElementById('authLoading');

            this.clearErrors();

            if (!email) {
                this.showError(t('emailRequired'));
                return;
            }
            if (!password || password.length < 6) {
                this.showError(t('passwordTooShort'));
                return;
            }
            if (password !== confirmPassword) {
                this.showError(t('passwordMismatch'));
                return;
            }

            if (loading) loading.style.display = 'block';

            try {
                const result = await window.signUpWithEmail(email, password, fullName);
                if (result.error) throw result.error;

                if (typeof window.showToast === 'function') {
                    window.showToast(t('accountCreated'), 3000);
                }

                this.closeModal();
                setTimeout(() => location.reload(), 1500);
            } catch (err) {
                this.showError(err.message || t('errorGeneric'));
            } finally {
                if (loading) loading.style.display = 'none';
            }
        },

        handleGoogleLogin: async function () {
            try {
                const result = await window.signInWithGoogle();
                if (result.error) throw result.error;
                this.showError('⏳ Redirection vers Google...');
            } catch (err) {
                this.showError(err.message || t('errorGeneric'));
            }
        },

        handleForgotPassword: function () {
            const email = prompt(t('resetInstruction'));
            if (!email) return;
            if (!email.includes('@')) {
                alert(t('errorEmailRequired'));
                return;
            }
            window.resetUserPassword(email)
                .then(result => {
                    if (result.error) {
                        alert(result.error.message);
                    } else {
                        alert(t('resetSent'));
                    }
                })
                .catch(err => alert(err.message));
        },

        handleSignOut: async function () {
            try {
                if (window.AuthService && typeof window.AuthService.signOut === 'function') {
                    await window.AuthService.signOut();
                }
                await this.updateAuthStatusUI();
            } catch (err) {
                console.error('❌ Error signing out:', err);
            }
        },

        updateAuthStatusUI: async function () {
            const statusDiv = document.getElementById('authStatus');
            const loginBtn = document.querySelector('button[onclick="openAuthModal()"]');
            const logoutBtn = document.querySelector('button[onclick="window.signOutUser()"]');

            try {
                const user = window.AuthService ? await window.AuthService.getCurrentUser() : null;
                if (user) {
                    if (statusDiv) {
                        statusDiv.innerHTML = `${t('connectedAs')} <strong>${user.email || user.id}</strong>`;
                        statusDiv.style.color = '#10b981';
                    }
                    if (loginBtn) loginBtn.style.display = 'none';
                    if (logoutBtn) logoutBtn.style.display = 'block';
                } else {
                    if (statusDiv) {
                        statusDiv.innerHTML = t('notConnected');
                        statusDiv.style.color = 'var(--gray, #6b7280)';
                    }
                    if (loginBtn) loginBtn.style.display = 'block';
                    if (logoutBtn) logoutBtn.style.display = 'none';
                }
            } catch (e) {
                if (statusDiv) statusDiv.innerHTML = t('notConnected');
            }
        }
    };

    // ===== تصدير الدوال العالمية =====
    window.openAuthModal = function () { AuthUI.openModal(); };
    window.closeAuthModal = function () { AuthUI.closeModal(); };
    window.toggleAuthMode = function () {
        isSignUpMode = !isSignUpMode;
        AuthUI.renderView();
        AuthUI.clearErrors();
    };
    window.handleAuthSubmit = function () { AuthUI.handleLogin(); };
    window.handleSignUpSubmit = function () { AuthUI.handleSignUpSubmit(); };
    window.handleForgotPassword = function () { AuthUI.handleForgotPassword(); };
    window.signOutUser = function () { AuthUI.handleSignOut(); };
    window.handleGoogleLogin = function () { AuthUI.handleGoogleLogin(); };

    window.AuthUI = AuthUI;

    document.addEventListener('DOMContentLoaded', function() {
        AuthUI.updateAuthStatusUI();
    });

    console.log('✅ authUI.js loaded successfully (Google + Email/Password)');
})();
