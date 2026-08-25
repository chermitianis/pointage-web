// ===================================================================
// payment-module.js — تدفق شراء النسخة المميزة عبر Flouci (جهة العميل)
//
// هذا الملف لا يحتوي أي مفتاح سري إطلاقاً — كل التواصل مع Flouci يمر عبر
// Supabase Edge Functions (انظر مجلد supabase-functions/). الجهاز هنا
// فقط: يطلب رابط دفع، يفتحه، ثم يسأل السيرفر دورياً "هل تم التأكيد؟"
// بدل أن يقرر بنفسه أنه أصبح مشتركاً.
//
// 🔧 !! عدّل القيمتين التاليتين بعد نشر Edge Functions ومشروع Supabase !!
// ===================================================================

// TODO: استبدل بعنوان مشروع Supabase الفعلي (Project Settings > API)
const SUPABASE_FUNCTIONS_BASE_URL = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1';
// TODO: استبدل بمفتاح anon العام (آمن للكشف في كود العميل، وليس service_role)
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const PREMIUM_VERIFIED_KEY = 'pointagePremiumVerified';
const PREMIUM_VERIFIED_AT_KEY = 'pointagePremiumVerifiedAt';
const DEVICE_ID_KEY = 'pointageDeviceId';
const PREMIUM_REVALIDATE_INTERVAL_MS = 24 * 60 * 60 * 1000; // إعادة تحقق يومية من السيرفر

let paymentPollIntervalId = null;
let paymentPollAttempts = 0;
const MAX_POLL_ATTEMPTS = 40; // 40 × 3 ثوانٍ ≈ دقيقتان من الانتظار بعد عودة المستخدم من صفحة الدفع

// ===== معرّف جهاز ثابت ومحلي (لا يتطلب حساب مستخدم) =====
// ملاحظة: إن كان لديك نظام مصادقة Supabase Auth حقيقي بالفعل (مستخدمون مسجّلون)،
// يُفضَّل استبدال هذا بمعرّف المستخدم الحقيقي من ذلك النظام لربط الاشتراك بحسابه
// بدل جهازه فقط (حتى يبقى اشتراكه سارياً عند تغيير الهاتف).
function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : ('dev_' + Date.now() + '_' + Math.random().toString(36).slice(2)));
        localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
}

// ===== حالة الاشتراك المميز المخزَّنة محلياً (مؤكَّدة سابقاً من السيرفر) =====
function isPremiumVerifiedLocally() {
    return localStorage.getItem(PREMIUM_VERIFIED_KEY) === 'true';
}

function setPremiumVerifiedLocally(isPremium) {
    localStorage.setItem(PREMIUM_VERIFIED_KEY, isPremium ? 'true' : 'false');
    localStorage.setItem(PREMIUM_VERIFIED_AT_KEY, String(Date.now()));
}

// تُستدعى عند بدء التطبيق: تعيد التحقق من السيرفر دورياً (وليس عند كل فتح فقط)
// حتى لا يبقى المستخدم "مميزاً" محلياً إلى الأبد بعد انتهاء اشتراكه فعلياً من جهتك
async function initPaymentModule() {
    const lastCheck = parseInt(localStorage.getItem(PREMIUM_VERIFIED_AT_KEY) || '0');
    const shouldRevalidate = (Date.now() - lastCheck) > PREMIUM_REVALIDATE_INTERVAL_MS;
    if (shouldRevalidate) {
        await checkPaymentStatusFromServer();
    }
    if (typeof updateFreeUsesIndicator === 'function') updateFreeUsesIndicator();
}

async function checkPaymentStatusFromServer() {
    if (SUPABASE_FUNCTIONS_BASE_URL.includes('YOUR_PROJECT_REF')) {
        // لم يتم إعداد Supabase بعد — لا شيء نفعله (وضع تطوير محلي)
        return isPremiumVerifiedLocally();
    }
    try {
        const response = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/flouci-check-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ deviceId: getDeviceId() })
        });
        const data = await response.json();
        setPremiumVerifiedLocally(!!data.isPremium);
        return !!data.isPremium;
    } catch (e) {
        console.error('payment-module: تعذّر التحقق من حالة الاشتراك', e);
        return isPremiumVerifiedLocally(); // نستخدم آخر حالة معروفة محلياً عند انقطاع الشبكة
    }
}

// ===== واجهة شراء النسخة المميزة =====
function openPremiumPurchaseFlow() {
    const modal = document.getElementById('premiumPurchaseModal');
    if (modal) modal.classList.add('show');
    if (typeof trackFeatureUsed === 'function') trackFeatureUsed('premium_modal_opened', {});
}

function closePremiumPurchaseModal() {
    const modal = document.getElementById('premiumPurchaseModal');
    if (modal) modal.classList.remove('show');
    stopPaymentPolling();
}

async function initiateFlouciPayment() {
    const payBtn = document.getElementById('flouciPayBtn');
    const statusEl = document.getElementById('paymentStatusText');
    const isAr = settings.language === 'ar';

    if (SUPABASE_FUNCTIONS_BASE_URL.includes('YOUR_PROJECT_REF') || SUPABASE_ANON_KEY.includes('YOUR_SUPABASE')) {
        alert(isAr ?
            'إعداد الدفع غير مكتمل بعد (يجب ضبط SUPABASE_FUNCTIONS_BASE_URL وSUPABASE_ANON_KEY في payment-module.js).' :
            "La configuration du paiement n'est pas encore terminée (SUPABASE_FUNCTIONS_BASE_URL et SUPABASE_ANON_KEY à définir dans payment-module.js).");
        return;
    }

    if (payBtn) { payBtn.disabled = true; payBtn.textContent = isAr ? '⏳ جارٍ التحضير...' : '⏳ Préparation...'; }

    try {
        const response = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/flouci-create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ deviceId: getDeviceId() })
        });
        const data = await response.json();

        if (!response.ok || !data.paymentUrl) {
            throw new Error(data.error || 'تعذّر إنشاء رابط الدفع');
        }

        // فتح رابط الدفع: عبر الجسر الأصلي (متصفح خارجي، أفضل لأمان صفحة الدفع) إن وُجد، وإلا فتح عادي
        try {
            if (window.AndroidApp && typeof window.AndroidApp.openExternalUrl === 'function') {
                window.AndroidApp.openExternalUrl(data.paymentUrl);
            } else {
                window.open(data.paymentUrl, '_blank');
            }
        } catch (e) {
            window.location.href = data.paymentUrl;
        }

        if (statusEl) {
            statusEl.textContent = isAr ?
                'أكمل الدفع في الصفحة التي فُتحت، ثم عد إلى هنا — سنتحقق تلقائياً.' :
                'Terminez le paiement sur la page ouverte, puis revenez ici — nous vérifierons automatiquement.';
            statusEl.style.display = 'block';
        }

        startPaymentPolling();

    } catch (error) {
        console.error('initiateFlouciPayment error:', error);
        alert(isAr ? 'حدث خطأ أثناء تحضير الدفع: ' + error.message : 'Erreur lors de la préparation du paiement : ' + error.message);
    } finally {
        if (payBtn) { payBtn.disabled = false; payBtn.textContent = isAr ? '💳 الدفع عبر Flouci' : '💳 Payer avec Flouci'; }
    }
}

function startPaymentPolling() {
    stopPaymentPolling();
    paymentPollAttempts = 0;
    paymentPollIntervalId = setInterval(async () => {
        paymentPollAttempts++;
        const isPremium = await checkPaymentStatusFromServer();
        if (isPremium) {
            stopPaymentPolling();
            onPremiumActivated();
        } else if (paymentPollAttempts >= MAX_POLL_ATTEMPTS) {
            stopPaymentPolling();
            const statusEl = document.getElementById('paymentStatusText');
            if (statusEl) {
                statusEl.textContent = settings.language === 'ar' ?
                    'لم نستلم تأكيداً بعد. إن أتممت الدفع، سيُفعَّل اشتراكك تلقائياً خلال دقائق قليلة.' :
                    "Aucune confirmation reçue pour l'instant. Si vous avez payé, votre abonnement sera activé automatiquement sous peu.";
            }
        }
    }, 3000);
}

function stopPaymentPolling() {
    if (paymentPollIntervalId) {
        clearInterval(paymentPollIntervalId);
        paymentPollIntervalId = null;
    }
}

function onPremiumActivated() {
    closePremiumPurchaseModal();
    if (typeof updatePremiumStatus === 'function') updatePremiumStatus();
    if (typeof updateFreeUsesIndicator === 'function') updateFreeUsesIndicator();
    if (typeof showToast === 'function') {
        showToast(settings.language === 'ar' ? '🎉 تم تفعيل النسخة المميزة بنجاح!' : '🎉 Version Premium activée avec succès !', 4000);
    }
    if (typeof trackFeatureUsed === 'function') trackFeatureUsed('premium_activated', {});
}

console.log('payment-module.js loaded successfully');
