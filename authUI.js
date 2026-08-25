/**
 * AuthUI.js - إدارة واجهة التوثيق لبرنامج Pointage
 * مع دعم الفرنسية كلغة افتراضية، وإضافة Facebook، OTP، واسترجاع كلمة المرور
 */

(function () {
    let isSignUpMode = false;
    let isPhoneMode = false; // للتبديل بين البريد الإلكتروني والهاتف

    // دالة مساعدة للحصول على اللغة الحالية
    function getLanguage() {
        return (window.settings && window.settings.language) || 'fr';
    }

    // نصوص مترجمة (داخلية حتى لا نعتمد على translations.js)
    const strings = {
        fr: {
            signIn: 'Se connecter',
            signUp: 'Créer un compte',
            signInSub: 'Entrez vos identifiants pour accéder à votre compte',
            signUpSub: 'Créez votre compte pour synchroniser vos données',
            email: 'Email',
            password: 'Mot de passe (6 caractères min.)',
            phone: 'Numéro de téléphone',
            otpCode: 'Code de vérification',
            signInBtn: 'Connexion',
            signUpBtn: 'S\'inscrire',
            haveAccount: 'Vous avez déjà un compte ?',
            noAccount: 'Pas de compte ?',
            loginLink: 'Connectez-vous',
            signupLink: 'Créer un compte',
            forgotPassword: 'Mot de passe oublié ?',
            resetPassword: 'Réinitialiser le mot de passe',
            resetInstruction: 'Entrez votre email pour recevoir un lien de réinitialisation',
            sendReset: 'Envoyer',
            facebookLogin: 'Continuer avec Facebook',
            phoneLogin: 'Connexion par téléphone',
            enterPhone: 'Entrez votre numéro de téléphone',
            sendCode: 'Envoyer le code',
            verifyCode: 'Vérifier le code',
            continueAsGuest: 'Continuer en tant qu\'invité',
            close: 'Fermer',
            loading: 'Chargement...',
            errorEmailRequired: 'Veuillez saisir votre email',
            errorPasswordRequired: 'Veuillez saisir votre mot de passe',
            errorPhoneRequired: 'Veuillez saisir votre numéro de téléphone',
            errorOtpRequired: 'Veuillez saisir le code de vérification',
            errorGeneric: 'Une erreur est survenue',
            resetSent: 'Un email de réinitialisation a été envoyé',
        },
        ar: {
            signIn: 'تسجيل الدخول',
            signUp: 'إنشاء حساب جديد',
            signInSub: 'أدخل بياناتك للوصول إلى حسابك',
            signUpSub: 'أنشئ حسابك لمزامنة بياناتك وساعات العمل',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور (6 أحرف على الأقل)',
            phone: 'رقم الهاتف',
            otpCode: 'رمز التحقق',
            signInBtn: 'دخول',
            signUpBtn: 'تسجيل الحساب',
            haveAccount: 'لديك حساب بالفعل؟',
            noAccount: 'ليس لديك حساب؟',
            loginLink: 'تسجيل الدخول',
            signupLink: 'إنشاء حساب جديد',
            forgotPassword: 'نسيت كلمة المرور؟',
            resetPassword: 'استرجاع كلمة المرور',
            resetInstruction: 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين',
            sendReset: 'إرسال',
            facebookLogin: 'المتابعة عبر Facebook',
            phoneLogin: 'الدخول عبر رقم الهاتف',
            enterPhone: 'أدخل رقم هاتفك',
            sendCode: 'إرسال الرمز',
            verifyCode: 'تحقق من الرمز',
            continueAsGuest: 'متابعة كزائر',
            close: 'إلغاء',
            loading: 'جاري المعالجة...',
            errorEmailRequired: 'يرجى كتابة البريد الإلكتروني',
            errorPasswordRequired: 'يرجى كتابة كلمة المرور',
            errorPhoneRequired: 'يرجى إدخال رقم الهاتف',
            errorOtpRequired: 'يرجى إدخال رمز التحقق',
            errorGeneric: 'حدث خطأ',
            resetSent: 'تم إرسال بريد إعادة التعيين',
        }
    };

    function t(key) {
        const lang = getLanguage();
        return strings[lang]?.[key] || strings.fr[key] || key;
    }

    const AuthUI = {
        getModalElement: function () {
            return document.getElementById('authModal') || document.getElementById('auth-modal');
        },

        openModal: function () {
            const modal = this.getModalElement();
            if (modal) {
                modal.style.display = 'flex';
                this.updateUITexts();
                this.clearErrors();
                // إعادة تعيين وضع البريد/الهاتف
                isPhoneMode = false;
                this.updatePhoneModeUI();
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

        // تحديث كل النصوص بناءً على اللغة الحالية
        updateUITexts: function () {
            const title = document.getElementById('authTitle');
            const subtitle = document.getElementById('authSubtitle');
            const btn = document.getElementById('authPrimaryBtn');
            const toggleText = document.getElementById('authToggleText');
            const toggleLink = document.getElementById('authToggleLink');
            const forgotLink = document.getElementById('authForgotLink');
            const emailLabel = document.querySelector('label[for="authEmail"]');
            const passLabel = document.querySelector('label[for="authPassword"]');
            const guestLink = document.getElementById('authGuestLink');

            if (isSignUpMode) {
                if (title) title.innerText = t('signUp');
                if (subtitle) subtitle.innerText = t('signUpSub');
                if (btn) btn.innerText = t('signUpBtn');
                if (toggleText) toggleText.innerText = t('haveAccount');
                if (toggleLink) toggleLink.innerText = t('loginLink');
            } else {
                if (title) title.innerText = t('signIn');
                if (subtitle) subtitle.innerText = t('signInSub');
                if (btn) btn.innerText = t('signInBtn');
                if (toggleText) toggleText.innerText = t('noAccount');
                if (toggleLink) toggleLink.innerText = t('signupLink');
            }
            if (forgotLink) forgotLink.innerText = t('forgotPassword');
            if (emailLabel) emailLabel.innerText = t('email');
            if (passLabel) passLabel.innerText = t('password');
            if (guestLink) guestLink.innerText = t('continueAsGuest');

            // تحديث زر Facebook
            const fbBtn = document.getElementById('authFacebookBtn');
            if (fbBtn) fbBtn.innerText = t('facebookLogin');
            // تحديث زر الهاتف
            const phoneBtn = document.getElementById('authPhoneToggleBtn');
            if (phoneBtn) phoneBtn.innerText = t('phoneLogin');
        },

        // تبديل بين البريد الإلكتروني والهاتف
        togglePhoneMode: function () {
            isPhoneMode = !isPhoneMode;
            this.updatePhoneModeUI();
        },

        updatePhoneModeUI: function () {
            const emailGroup = document.getElementById('authEmailGroup');
            const phoneGroup = document.getElementById('authPhoneGroup');
            const otpGroup = document.getElementById('authOtpGroup');
            const phoneToggleBtn = document.getElementById('authPhoneToggleBtn');

            if (isPhoneMode) {
                if (emailGroup) emailGroup.style.display = 'none';
                if (phoneGroup) phoneGroup.style.display = 'block';
                if (otpGroup) otpGroup.style.display = 'none';
                if (phoneToggleBtn) phoneToggleBtn.innerText = t('email') + ' ?';
            } else {
                if (emailGroup) emailGroup.style.display = 'block';
                if (phoneGroup) phoneGroup.style.display = 'none';
                if (otpGroup) otpGroup.style.display = 'none';
                if (phoneToggleBtn) phoneToggleBtn.innerText = t('phoneLogin');
            }
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
            if (msg.includes('email rate limit exceeded') || msg.includes('429')) {
                friendlyMsg = '⚠️ ' + (getLanguage() === 'ar' ? 'تم تجاوز حد المحاولات' : 'Trop de tentatives, veuillez patienter');
            }
            if (errDiv) {
                errDiv.innerText = friendlyMsg;
                errDiv.style.display = 'block';
            } else {
                alert(friendlyMsg);
            }
        },

        // تبديل وضع تسجيل الدخول / إنشاء حساب
        toggleMode: function () {
            isSignUpMode = !isSignUpMode;
            this.updateUITexts();
            this.clearErrors();
            // إذا كان وضع الهاتف مفعلاً، نعيده إلى البريد
            if (isPhoneMode) {
                isPhoneMode = false;
                this.updatePhoneModeUI();
            }
        },

        // معالج تسجيل الدخول / إنشاء الحساب
        handleSubmit: async function () {
            const emailInput = document.getElementById('authEmail');
            const passInput = document.getElementById('authPassword');
            const phoneInput = document.getElementById('authPhone');
            const otpInput = document.getElementById('authOtp');
            const loading = document.getElementById('authLoading');
            const btn = document.getElementById('authPrimaryBtn');

            this.clearErrors();

            // إذا كان وضع الهاتف
            if (isPhoneMode) {
                const phone = phoneInput ? phoneInput.value.trim() : '';
                if (!phone) {
                    this.showError(t('errorPhoneRequired'));
                    return;
                }
                // إذا كان هناك رمز OTP تم إدخاله، نتحقق منه
                const otp = otpInput ? otpInput.value.trim() : '';
                if (otp) {
                    // تحقق من الرمز
                    if (loading) loading.style.display = 'block';
                    if (btn) btn.disabled = true;
                    try {
                        const result = await window.verifyPhoneOtp(phone, otp);
                        if (result.error) throw result.error;
                        this.closeModal();
                        await this.updateAuthStatusUI();
                    } catch (err) {
                        this.showError(err.message || t('errorGeneric'));
                    } finally {
                        if (loading) loading.style.display = 'none';
                        if (btn) btn.disabled = false;
                    }
                    return;
                } else {
                    // إرسال رمز OTP
                    if (loading) loading.style.display = 'block';
                    if (btn) btn.disabled = true;
                    try {
                        const result = await window.signInWithPhone(phone);
                        if (result.error) throw result.error;
                        // عرض حقل OTP
                        const otpGroup = document.getElementById('authOtpGroup');
                        if (otpGroup) otpGroup.style.display = 'block';
                        const phoneToggleBtn = document.getElementById('authPhoneToggleBtn');
                        if (phoneToggleBtn) phoneToggleBtn.style.display = 'none';
                        // تحديث زر الإجراء ليصبح "تحقق"
                        if (btn) btn.innerText = t('verifyCode');
                        // حفظ رقم الهاتف في متغير
                        window._authPhone = phone;
                        this.showError(''); // مسح الأخطاء
                    } catch (err) {
                        this.showError(err.message || t('errorGeneric'));
                    } finally {
                        if (loading) loading.style.display = 'none';
                        if (btn) btn.disabled = false;
                    }
                    return;
                }
            }

            // وضع البريد الإلكتروني
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
                this.showError(err.message || t('errorGeneric'));
            } finally {
                if (loading) loading.style.display = 'none';
                if (btn) btn.disabled = false;
            }
        },

        // معالج استرجاع كلمة المرور
        handleForgotPassword: function () {
            const email = prompt(t('resetInstruction'));
            if (!email) return;
            // التحقق من صحة البريد
            if (!email.includes('@')) {
                alert(t('errorEmailRequired'));
                return;
            }
            // استدعاء resetPassword
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

        // تسجيل الخروج
        handleSignOut: async function () {
            try {
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

        // تحديث واجهة حالة المستخدم
        updateAuthStatusUI: async function () {
            const statusDiv = document.getElementById('authStatus');
            const loginBtn = document.querySelector('button[onclick="openAuthModal()"]');
            const logoutBtn = document.querySelector('button[onclick="window.signOutUser()"]') ||
                             document.querySelector('button[onclick="signOutUser()"]');
            try {
                const user = window.AuthService ? await window.AuthService.getCurrentUser() : null;
                if (user) {
                    if (statusDiv) {
                        statusDiv.innerHTML = `Connecté en tant que: <strong>${user.email || user.phone || user.id}</strong>`;
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

    // ===== تصدير الدوال إلى النطاق العام =====
    window.openAuthModal = function () { AuthUI.openModal(); };
    window.closeAuthModal = function () { AuthUI.closeModal(); };
    window.toggleAuthMode = function () { AuthUI.toggleMode(); };
    window.handleAuthSubmit = function () { AuthUI.handleSubmit(); };
    window.handleForgotPassword = function () { AuthUI.handleForgotPassword(); };
    window.signOutUser = function () { AuthUI.handleSignOut(); };
    window.togglePhoneMode = function () { AuthUI.togglePhoneMode(); };

    window.AuthUI = AuthUI;

    document.addEventListener('DOMContentLoaded', () => {
        AuthUI.updateAuthStatusUI();
    });
})();
