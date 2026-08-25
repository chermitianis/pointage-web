/**
 * AuthUI.js - إدارة واجهة التوثيق مع دعم Google, Facebook, Téléphone
 * Version avec écran de connexion simplifié et options d'inscription avancées
 * + Formulaire de définition de mot de passe pour les utilisateurs OAuth
 */

(function () {
    // ===== الحالة =====
    let isSignUpMode = false;       // true = عرض خيارات التسجيل، false = عرض نموذج تسجيل الدخول
    let isPhoneSignUp = false;      // true = عرض نموذج الهاتف (OTP)
    let currentPhoneNumber = '';

    // ===== اللغة =====
    function getLanguage() {
        return (window.settings && window.settings.language) || 'fr';
    }

    // ===== النصوص المترجمة =====
    const strings = {
        fr: {
            signInTitle: 'Se connecter',
            signInSub: 'Entrez vos identifiants pour accéder à votre compte',
            emailOrPhone: 'Email ou téléphone',
            password: 'Mot de passe',
            signInBtn: 'Connexion',
            forgotPassword: 'Mot de passe oublié ?',
            noAccount: 'Pas de compte ?',
            createAccount: 'Créer un compte',
            signUpTitle: 'Créer un compte',
            signUpSub: 'Choisissez votre méthode d\'inscription',
            google: 'Continuer avec Google',
            facebook: 'Continuer avec Facebook',
            phone: 'S\'inscrire avec un numéro de téléphone',
            phoneSignUpTitle: 'Inscription par téléphone',
            phonePlaceholder: '+216 99 999 999',
            sendCode: 'Envoyer le code',
            verifyCode: 'Vérifier le code',
            otpPlaceholder: 'Code à 6 chiffres',
            backToLogin: '← Retour à la connexion',
            backToSignUp: '← Retour aux options',
            continueAsGuest: 'Continuer en tant qu\'invité',
            close: 'Fermer',
            loading: 'Chargement...',
            errorEmailRequired: 'Veuillez saisir votre email ou téléphone',
            errorPasswordRequired: 'Veuillez saisir votre mot de passe',
            errorPhoneRequired: 'Veuillez saisir votre numéro de téléphone',
            errorOtpRequired: 'Veuillez saisir le code de vérification',
            errorGeneric: 'Une erreur est survenue',
            resetSent: 'Un email de réinitialisation a été envoyé',
            resetInstruction: 'Entrez votre email pour recevoir un lien de réinitialisation',
            connectedAs: 'Connecté en tant que:',
            notConnected: 'Non connecté (Mode local)',
            finalizeTitle: 'Finaliser la création du compte',
            finalizeSub: 'Choisissez un mot de passe pour votre compte',
            fullName: 'Nom complet',
            email: 'E-mail',
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
            emailOrPhone: 'البريد الإلكتروني أو الهاتف',
            password: 'كلمة المرور',
            signInBtn: 'دخول',
            forgotPassword: 'نسيت كلمة المرور؟',
            noAccount: 'ليس لديك حساب؟',
            createAccount: 'إنشاء حساب',
            signUpTitle: 'إنشاء حساب',
            signUpSub: 'اختر طريقة التسجيل',
            google: 'المتابعة عبر Google',
            facebook: 'المتابعة عبر Facebook',
            phone: 'التسجيل عبر رقم الهاتف',
            phoneSignUpTitle: 'التسجيل عبر الهاتف',
            phonePlaceholder: '+216 99 999 999',
            sendCode: 'إرسال الرمز',
            verifyCode: 'تحقق من الرمز',
            otpPlaceholder: 'رمز مكون من 6 أرقام',
            backToLogin: '← العودة لتسجيل الدخول',
            backToSignUp: '← العودة للخيارات',
            continueAsGuest: 'متابعة كزائر',
            close: 'إلغاء',
            loading: 'جاري المعالجة...',
            errorEmailRequired: 'يرجى كتابة البريد الإلكتروني أو الهاتف',
            errorPasswordRequired: 'يرجى كتابة كلمة المرور',
            errorPhoneRequired: 'يرجى إدخال رقم الهاتف',
            errorOtpRequired: 'يرجى إدخال رمز التحقق',
            errorGeneric: 'حدث خطأ',
            resetSent: 'تم إرسال بريد إعادة التعيين',
            resetInstruction: 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين',
            connectedAs: 'متصل كـ:',
            notConnected: 'غير متصل (وضع محلي)',
            finalizeTitle: 'إكمال إنشاء الحساب',
            finalizeSub: 'اختر كلمة مرور لحسابك',
            fullName: 'الاسم الكامل',
            email: 'البريد الإلكتروني',
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

    // ===== كائن AuthUI =====
    const AuthUI = {
        getModalElement() {
            return document.getElementById('authModal') || document.getElementById('auth-modal');
        },

        openModal() {
            const modal = this.getModalElement();
            if (modal) {
                modal.style.display = 'flex';
                isSignUpMode = false;
                isPhoneSignUp = false;
                this.renderView();
                this.clearErrors();
            } else {
                console.warn('⚠️ #authModal introuvable');
            }
        },

        closeModal() {
            const modal = this.getModalElement();
            if (modal) modal.style.display = 'none';
            this.clearErrors();
        },

        // ===== عرض الواجهة حسب الحالة =====
        renderView() {
            if (isSignUpMode) {
                if (isPhoneSignUp) {
                    this.renderPhoneSignUp();
                } else {
                    this.renderSignUpOptions();
                }
            } else {
                this.renderLoginForm();
            }
        },

        // ===== 1. نموذج تسجيل الدخول =====
        renderLoginForm() {
            const container = document.getElementById('authContent');
            if (!container) return;

            const isAr = getLanguage() === 'ar';
            const dir = isAr ? 'rtl' : 'ltr';

            container.innerHTML = `
                <div style="text-align:center; direction:${dir};">
                    <div style="font-size:48px; margin-bottom:8px;">🔐</div>
                    <h3 id="authTitle" style="margin-bottom:6px; color:var(--text-color, #333); font-size:20px; font-weight:700;">${t('signInTitle')}</h3>
                    <p id="authSubtitle" style="margin-bottom:20px; color:var(--gray, #888); font-size:13px;">${t('signInSub')}</p>

                    <div style="margin-bottom:12px;">
                        <label for="authEmail" style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('emailOrPhone')}</label>
                        <input type="text" id="authEmail" placeholder="exemple@domaine.com"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333); transition:border-color 0.2s;"
                               onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color, #e0e0e0)'">
                    </div>

                    <div style="margin-bottom:12px;">
                        <label for="authPassword" style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('password')}</label>
                        <input type="password" id="authPassword" placeholder="••••••"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333); transition:border-color 0.2s;"
                               onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color, #e0e0e0)'"
                               onkeydown="if(event.key==='Enter') handleAuthSubmit()">
                    </div>

                    <button id="authPrimaryBtn" onclick="handleAuthSubmit()"
                            style="width:100%; padding:12px; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff; border:none; border-radius:10px; font-weight:700; font-size:16px; cursor:pointer; transition:transform 0.15s, box-shadow 0.2s; box-shadow:0 4px 14px rgba(37,99,235,0.35); margin-bottom:8px;">
                        ${t('signInBtn')}
                    </button>

                    <!-- ===== زر Google dans l'écran de connexion ===== -->
                    <button onclick="handleGoogleLogin()" style="width:100%; padding:10px; margin-bottom:10px; background:#fff; color:#333; border:1px solid #ddd; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:background 0.2s, box-shadow 0.2s;"
                            onmouseover="this.style.background='#f1f1f1'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" 
                            onmouseout="this.style.background='#fff'; this.style.boxShadow='none'">
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.86.92 7.48 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        <span>${t('google')}</span>
                    </button>

                    <div style="text-align:right; margin-bottom:12px;">
                        <a href="#" id="authForgotLink" onclick="handleForgotPassword(); return false;" style="color:#2563eb; text-decoration:none; font-size:13px;">${t('forgotPassword')}</a>
                    </div>

                    <div style="margin-top:12px; font-size:14px; color:var(--gray, #666);">
                        <span id="authToggleText">${t('noAccount')}</span>
                        <a href="#" onclick="toggleAuthMode(); return false;" id="authToggleLink" style="color:#2563eb; text-decoration:none; font-weight:600; margin-left:4px;">${t('createAccount')}</a>
                    </div>

                    <div style="margin-top:12px; font-size:13px;">
                        <a href="#" id="authGuestLink" onclick="closeAuthModal(); return false;" style="color:var(--gray, #999); text-decoration:none;">☕ ${t('continueAsGuest')}</a>
                    </div>

                    <div id="authLoading" style="display:none; margin-top:6px; font-size:14px; color:#2563eb;">⏳ ${t('loading')}</div>
                    <div id="authError" style="display:none; margin-top:6px; font-size:13px; color:#dc2626; background:#fee2e2; padding:8px 12px; border-radius:8px;"></div>

                    <button onclick="closeAuthModal()"
                            style="margin-top:14px; background:transparent; border:none; color:var(--gray, #aaa); cursor:pointer; font-size:14px; padding:6px 16px; border-radius:20px; transition:background 0.2s;"
                            onmouseenter="this.style.background='var(--hover-bg, #f0f0f0)'" onmouseleave="this.style.background='transparent'">
                        ✕ ${t('close')}
                    </button>
                </div>
            `;
        },

        // ===== 2. خيارات التسجيل (Google, Facebook, Téléphone) =====
        renderSignUpOptions() {
            const container = document.getElementById('authContent');
            if (!container) return;

            const isAr = getLanguage() === 'ar';
            const dir = isAr ? 'rtl' : 'ltr';

            container.innerHTML = `
                <div style="text-align:center; direction:${dir};">
                    <div style="font-size:48px; margin-bottom:8px;">📝</div>
                    <h3 style="margin-bottom:6px; color:var(--text-color, #333); font-size:20px; font-weight:700;">${t('signUpTitle')}</h3>
                    <p style="margin-bottom:20px; color:var(--gray, #888); font-size:13px;">${t('signUpSub')}</p>

                    <!-- Google -->
                    <button onclick="handleGoogleLogin()" style="width:100%; padding:10px; margin-bottom:10px; background:#fff; color:#333; border:1px solid #ddd; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:background 0.2s, box-shadow 0.2s;"
                            onmouseover="this.style.background='#f1f1f1'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" 
                            onmouseout="this.style.background='#fff'; this.style.boxShadow='none'">
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.86.92 7.48 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        <span>${t('google')}</span>
                    </button>

                    <!-- Facebook -->
                    <button onclick="handleFacebookLogin()" style="width:100%; padding:10px; margin-bottom:10px; background:#1877f2; color:#fff; border:none; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:background 0.2s;"
                            onmouseover="this.style.background='#166fe5'" onmouseout="this.style.background='#1877f2'">
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#fff" d="M24 2.5c-11.9 0-21.5 9.6-21.5 21.5 0 10.7 7.8 19.6 17.9 21.3V30.8h-5.4V24h5.4v-4.7c0-5.3 3.2-8.2 8-8.2 2.3 0 4.7.4 4.7.4v5.1h-2.6c-2.6 0-3.4 1.6-3.4 3.3V24h5.8l-.9 6.8h-4.9V45.3c10.1-1.7 17.9-10.6 17.9-21.3 0-11.9-9.6-21.5-21.5-21.5z"/>
                        </svg>
                        <span>${t('facebook')}</span>
                    </button>

                    <!-- Téléphone -->
                    <button onclick="startPhoneSignUp()" style="width:100%; padding:10px; margin-bottom:10px; background:#34b7f1; color:#fff; border:none; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:background 0.2s;"
                            onmouseover="this.style.background='#2aa3d9'" onmouseout="this.style.background='#34b7f1'">
                        <span style="font-size:18px;">📱</span>
                        <span>${t('phone')}</span>
                    </button>

                    <div style="margin-top:12px; font-size:13px;">
                        <a href="#" onclick="toggleAuthMode(); return false;" style="color:var(--gray, #999); text-decoration:none;">← ${t('backToLogin')}</a>
                    </div>

                    <div id="authError" style="display:none; margin-top:6px; font-size:13px; color:#dc2626; background:#fee2e2; padding:8px 12px; border-radius:8px;"></div>

                    <button onclick="closeAuthModal()"
                            style="margin-top:14px; background:transparent; border:none; color:var(--gray, #aaa); cursor:pointer; font-size:14px; padding:6px 16px; border-radius:20px; transition:background 0.2s;"
                            onmouseenter="this.style.background='var(--hover-bg, #f0f0f0)'" onmouseleave="this.style.background='transparent'">
                        ✕ ${t('close')}
                    </button>
                </div>
            `;
        },

        // ===== 3. نموذج التسجيل عبر الهاتف (OTP) =====
        renderPhoneSignUp() {
            const container = document.getElementById('authContent');
            if (!container) return;

            const isAr = getLanguage() === 'ar';
            const dir = isAr ? 'rtl' : 'ltr';

            container.innerHTML = `
                <div style="text-align:center; direction:${dir};">
                    <div style="font-size:48px; margin-bottom:8px;">📱</div>
                    <h3 style="margin-bottom:6px; color:var(--text-color, #333); font-size:20px; font-weight:700;">${t('phoneSignUpTitle')}</h3>

                    <div style="margin-bottom:12px;">
                        <label for="authPhone" style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('emailOrPhone')}</label>
                        <input type="tel" id="authPhone" placeholder="${t('phonePlaceholder')}"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333);">
                    </div>

                    <div id="authOtpGroup" style="display:none; margin-bottom:12px;">
                        <label for="authOtp" style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('otpPlaceholder')}</label>
                        <input type="text" id="authOtp" placeholder="123456"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333);">
                    </div>

                    <button id="authPhoneBtn" onclick="handlePhoneSignUp()"
                            style="width:100%; padding:12px; background:linear-gradient(135deg, #34b7f1, #1d8fc7); color:#fff; border:none; border-radius:10px; font-weight:700; font-size:16px; cursor:pointer; transition:transform 0.15s; margin-bottom:8px;">
                        ${t('sendCode')}
                    </button>

                    <div id="authPhoneLoading" style="display:none; margin-top:6px; font-size:14px; color:#2563eb;">⏳ ${t('loading')}</div>
                    <div id="authError" style="display:none; margin-top:6px; font-size:13px; color:#dc2626; background:#fee2e2; padding:8px 12px; border-radius:8px;"></div>

                    <div style="margin-top:12px; font-size:13px;">
                        <a href="#" onclick="cancelPhoneSignUp(); return false;" style="color:var(--gray, #999); text-decoration:none;">← ${t('backToSignUp')}</a>
                    </div>

                    <button onclick="closeAuthModal()"
                            style="margin-top:14px; background:transparent; border:none; color:var(--gray, #aaa); cursor:pointer; font-size:14px; padding:6px 16px; border-radius:20px; transition:background 0.2s;"
                            onmouseenter="this.style.background='var(--hover-bg, #f0f0f0)'" onmouseleave="this.style.background='transparent'">
                        ✕ ${t('close')}
                    </button>
                </div>
            `;
        },

        // ===== 4. نموذج تعيين كلمة المرور بعد OAuth =====
        showSetPasswordModal: function (email, fullName) {
            const container = document.getElementById('authContent');
            if (!container) {
                console.warn('⚠️ authContent not found');
                return;
            }

            // Ouvrir le modal s'il n'est pas visible
            const modal = this.getModalElement();
            if (modal) modal.style.display = 'flex';

            const isAr = getLanguage() === 'ar';
            const dir = isAr ? 'rtl' : 'ltr';

            container.innerHTML = `
                <div style="text-align:center; direction:${dir};">
                    <div style="font-size:48px; margin-bottom:8px;">🔐</div>
                    <h3 style="margin-bottom:6px; color:var(--text-color, #333); font-size:20px; font-weight:700;">${t('finalizeTitle')}</h3>
                    <p style="margin-bottom:20px; color:var(--gray, #888); font-size:13px;">${t('finalizeSub')}</p>

                    <div style="margin-bottom:12px;">
                        <label style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('fullName')}</label>
                        <input type="text" id="signupFullName" value="${fullName || ''}" 
                               placeholder="${t('fullName')}"
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333);">
                    </div>

                    <div style="margin-bottom:12px;">
                        <label style="display:block; text-align:left; font-size:13px; color:var(--gray); margin-bottom:4px;">${t('email')}</label>
                        <input type="email" id="signupEmail" value="${email || ''}" readonly
                               style="width:100%; padding:12px 14px; border:2px solid var(--border-color, #e0e0e0); border-radius:10px; box-sizing:border-box; font-size:15px; background:var(--input-bg, #f8f9fa); color:var(--text-color, #333); opacity:0.7; cursor:not-allowed;">
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
                               onkeydown="if(event.key==='Enter') handleFinalizeSignUp()">
                    </div>

                    <button onclick="handleFinalizeSignUp()"
                            style="width:100%; padding:12px; background:linear-gradient(135deg, #4CAF50, #388E3C); color:#fff; border:none; border-radius:10px; font-weight:700; font-size:16px; cursor:pointer; transition:transform 0.15s; margin-bottom:8px;">
                        ${t('createAccountBtn')}
                    </button>

                    <div id="authLoading" style="display:none; margin-top:6px; font-size:14px; color:#2563eb;">⏳ ${t('loading')}</div>
                    <div id="authError" style="display:none; margin-top:6px; font-size:13px; color:#dc2626; background:#fee2e2; padding:8px 12px; border-radius:8px;"></div>

                    <div style="margin-top:12px; font-size:13px;">
                        <a href="#" onclick="closeAuthModal(); return false;" style="color:var(--gray, #999); text-decoration:none;">${t('cancel')}</a>
                    </div>
                </div>
            `;
        },

        // ===== 5. معالج إنهاء التسجيل (تعيين كلمة المرور) =====
        handleFinalizeSignUp: async function () {
            const fullName = document.getElementById('signupFullName')?.value.trim() || '';
            const email = document.getElementById('signupEmail')?.value.trim() || '';
            const password = document.getElementById('signupPassword')?.value || '';
            const confirmPassword = document.getElementById('signupConfirmPassword')?.value || '';
            const loading = document.getElementById('authLoading');

            this.clearErrors();

            if (!password || password.length < 6) {
                this.showError(t('passwordTooShort'));
                return;
            }
            if (password !== confirmPassword) {
                this.showError(t('passwordMismatch'));
                return;
            }
            if (!email) {
                this.showError(t('emailRequired'));
                return;
            }

            if (loading) loading.style.display = 'block';

            try {
                // 1. Définir le mot de passe pour l'utilisateur OAuth
                const result = await window.setPasswordForOAuthUser(password);
                if (result.error) throw result.error;

                // 2. Mettre à jour le nom complet si fourni
                if (fullName && window.AuthService) {
                    const client = window.AuthService.getClient();
                    if (client) {
                        await client.auth.updateUser({ 
                            data: { 
                                full_name: fullName,
                                has_password: true 
                            } 
                        });
                    }
                }

                // 3. Afficher un message de succès
                if (typeof window.showToast === 'function') {
                    window.showToast(t('accountCreated'), 3000);
                }

                // 4. Fermer le modal et recharger
                this.closeModal();
                setTimeout(() => location.reload(), 1500);

            } catch (err) {
                this.showError(err.message || t('errorGeneric'));
            } finally {
                if (loading) loading.style.display = 'none';
            }
        },

        // ===== Actions =====
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

        // ===== تسجيل الدخول بالبريد =====
        handleLogin: async function () {
            const emailInput = document.getElementById('authEmail');
            const passInput = document.getElementById('authPassword');
            const loading = document.getElementById('authLoading');
            const btn = document.getElementById('authPrimaryBtn');

            this.clearErrors();

            const identifier = emailInput ? emailInput.value.trim() : '';
            const password = passInput ? passInput.value : '';

            if (!identifier) {
                this.showError(t('errorEmailRequired'));
                return;
            }
            if (!password) {
                this.showError(t('errorPasswordRequired'));
                return;
            }

            const isEmail = identifier.includes('@');

            if (loading) loading.style.display = 'block';
            if (btn) btn.disabled = true;

            try {
                let result;
                if (isEmail) {
                    result = await window.signInWithEmail(identifier, password);
                } else {
                    this.showError(getLanguage() === 'ar' ? 'استخدم بريدك الإلكتروني لتسجيل الدخول' : 'Utilisez votre email pour vous connecter');
                    if (loading) loading.style.display = 'none';
                    if (btn) btn.disabled = false;
                    return;
                }

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

        // ===== Google =====
        handleGoogleLogin: async function () {
            try {
                const result = await window.signInWithGoogle();
                if (result.error) throw result.error;
                this.showError('⏳ Redirection vers Google...');
            } catch (err) {
                this.showError(err.message || t('errorGeneric'));
            }
        },

        // ===== Facebook =====
        handleFacebookLogin: async function () {
            try {
                const result = await window.signInWithFacebook();
                if (result.error) throw result.error;
                this.showError('⏳ Redirection vers Facebook...');
            } catch (err) {
                this.showError(err.message || t('errorGeneric'));
            }
        },

        // ===== Téléphone (OTP) =====
        startPhoneSignUp: function () {
            isPhoneSignUp = true;
            this.renderView();
        },

        cancelPhoneSignUp: function () {
            isPhoneSignUp = false;
            this.renderView();
        },

        handlePhoneSignUp: async function () {
            const phoneInput = document.getElementById('authPhone');
            const otpInput = document.getElementById('authOtp');
            const btn = document.getElementById('authPhoneBtn');
            const loading = document.getElementById('authPhoneLoading');

            this.clearErrors();

            const phone = phoneInput ? phoneInput.value.trim() : '';
            const otp = otpInput ? otpInput.value.trim() : '';

            if (!phone) {
                this.showError(t('errorPhoneRequired'));
                return;
            }

            if (otp) {
                if (otp.length < 4) {
                    this.showError(t('errorOtpRequired'));
                    return;
                }
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
            }

            if (loading) loading.style.display = 'block';
            if (btn) btn.disabled = true;

            try {
                const result = await window.signInWithPhone(phone);
                if (result.error) throw result.error;

                const otpGroup = document.getElementById('authOtpGroup');
                if (otpGroup) otpGroup.style.display = 'block';
                if (btn) btn.innerText = t('verifyCode');
                currentPhoneNumber = phone;
                this.clearErrors();
            } catch (err) {
                this.showError(err.message || t('errorGeneric'));
            } finally {
                if (loading) loading.style.display = 'none';
                if (btn) btn.disabled = false;
            }
        },

        // ===== استرجاع كلمة المرور =====
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

        // ===== تسجيل الخروج =====
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

        // ===== تحديث حالة المستخدم في الواجهة =====
        updateAuthStatusUI: async function () {
            const statusDiv = document.getElementById('authStatus');
            const loginBtn = document.querySelector('button[onclick="openAuthModal()"]');
            const logoutBtn = document.querySelector('button[onclick="window.signOutUser()"]') ||
                             document.querySelector('button[onclick="signOutUser()"]');

            try {
                const user = window.AuthService ? await window.AuthService.getCurrentUser() : null;
                if (user) {
                    if (statusDiv) {
                        statusDiv.innerHTML = `${t('connectedAs')} <strong>${user.email || user.phone || user.id}</strong>`;
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
        isPhoneSignUp = false;
        AuthUI.renderView();
        AuthUI.clearErrors();
    };
    window.handleAuthSubmit = function () { AuthUI.handleLogin(); };
    window.handleForgotPassword = function () { AuthUI.handleForgotPassword(); };
    window.signOutUser = function () { AuthUI.handleSignOut(); };
    window.handleGoogleLogin = function () { AuthUI.handleGoogleLogin(); };
    window.handleFacebookLogin = function () { AuthUI.handleFacebookLogin(); };
    window.startPhoneSignUp = function () { AuthUI.startPhoneSignUp(); };
    window.cancelPhoneSignUp = function () { AuthUI.cancelPhoneSignUp(); };
    window.handlePhoneSignUp = function () { AuthUI.handlePhoneSignUp(); };
    window.showSetPasswordModal = function(email, fullName) { AuthUI.showSetPasswordModal(email, fullName); };
    window.handleFinalizeSignUp = function() { AuthUI.handleFinalizeSignUp(); };

    window.AuthUI = AuthUI;

    document.addEventListener('DOMContentLoaded', () => {
        AuthUI.updateAuthStatusUI();
    });

    console.log('authUI.js loaded successfully');
})();
