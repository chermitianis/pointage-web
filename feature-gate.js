// ===================================================================
// feature-gate.js — نظام "بوابة الميزات" (Feature Gating)
//
// الاستراتيجية: السماح باستخدام ميزات التصدير المتقدمة (PDF) مجاناً عدداً
// محدوداً من المرات (تجربة مجانية ذكية)، ثم عرض شاشة اشتراك أنيقة بعد
// استنفاد المحاولات المجانية. المستخدم المميز (Premium) لا يخضع لأي قيد.
//
// مبدأ الأمان: هذا القيد هو تجربة مستخدم فقط (UX Gate) على جهاز العميل —
// وليس آلية حماية بحد ذاته ضد التلاعب المتقدم (يمكن لمستخدم متمرس مسح
// localStorage لإعادة تعيين العداد). الحماية الحقيقية لأي عملية مدفوعة
// فعلياً تكمن في التحقق من حالة الاشتراك عبر السيرفر (انظر payment-module.js
// ووظيفة verifyPremiumStatus التي تتحقق من Supabase وليس من الجهاز فقط).
//
// يعتمد على: data.js (showToast)، premium.js (checkPremium — إن وُجد)
// ===================================================================

const FREE_EXPORT_LIMIT = 3;
const FEATURE_USAGE_KEY = 'pointageFeatureUsage';

function loadFeatureUsage() {
    try {
        const raw = localStorage.getItem(FEATURE_USAGE_KEY);
        return raw ? JSON.parse(raw) : { exportCount: 0 };
    } catch (e) {
        return { exportCount: 0 };
    }
}

function saveFeatureUsage(usage) {
    try {
        localStorage.setItem(FEATURE_USAGE_KEY, JSON.stringify(usage));
    } catch (e) {
        console.error('feature-gate: تعذّر حفظ عداد الاستخدام', e);
    }
}

function isPremiumUser() {
    // الأولوية للحالة المؤكَّدة من السيرفر عبر Flouci/Supabase (الأكثر موثوقية)
    if (typeof isPremiumVerifiedLocally === 'function' && isPremiumVerifiedLocally()) {
        return true;
    }
    // التوافق مع أي نظام اشتراك سابق موجود في premium.js (مثلاً شراء عبر متجر آخر)
    return typeof checkPremium === 'function' && checkPremium() === true;
}

// عدد المحاولات المجانية المتبقية لميزات التصدير المتقدمة
function getRemainingFreeExports() {
    if (isPremiumUser()) return Infinity;
    const usage = loadFeatureUsage();
    return Math.max(0, FREE_EXPORT_LIMIT - (usage.exportCount || 0));
}

// يُستدعى قبل تنفيذ أي عملية تصدير PDF متقدمة.
// يُرجع true للسماح بالمتابعة، أو false مع عرض شاشة الاشتراك تلقائياً.
function canUseExportFeature(featureLabel) {
    if (isPremiumUser()) return true;

    const remaining = getRemainingFreeExports();
    if (remaining > 0) return true;

    showPaywallModal(featureLabel);
    return false;
}

// يُستدعى فقط بعد نجاح عملية تصدير فعلية لمستخدم غير مميز
function consumeFreeExportUse() {
    if (isPremiumUser()) return;
    const usage = loadFeatureUsage();
    usage.exportCount = (usage.exportCount || 0) + 1;
    saveFeatureUsage(usage);
    updateFreeUsesIndicator();
}

// شارة صغيرة اختيارية تُظهر للمستخدم عدد محاولاته المتبقية (تحفيز غير مزعج)
// تُحدَّث كل عناصر class="free-uses-badge" الموجودة في الصفحة (قد تظهر في أكثر من نافذة تصدير)
function updateFreeUsesIndicator() {
    const elements = document.querySelectorAll('.free-uses-badge');
    if (!elements.length) return;

    const isAr = settings.language === 'ar';
    const premium = isPremiumUser();
    const remaining = getRemainingFreeExports();

    elements.forEach(el => {
        if (premium) {
            el.innerHTML = isAr ? '⭐ عضوية مميزة — تصدير بلا حدود' : '⭐ Membre Premium — exports illimités';
            el.classList.add('free-uses-badge-premium');
            el.style.display = 'inline-flex';
        } else if (remaining > 0) {
            el.classList.remove('free-uses-badge-premium');
            el.innerHTML = isAr ?
                `🎁 ${formatNumber(remaining)} تصدير مجاني متبقٍ` :
                `🎁 ${formatNumber(remaining)} export(s) gratuit(s) restant(s)`;
            el.style.display = 'inline-flex';
        } else {
            el.style.display = 'none';
        }
    });
}

// ===== شاشة الاشتراك (Paywall) =====
function showPaywallModal(featureLabel) {
    const isAr = settings.language === 'ar';
    const titleEl = document.getElementById('paywallTitle');
    const bodyEl = document.getElementById('paywallBody');

    if (titleEl) {
        titleEl.textContent = isAr ? '✨ لقد استخدمت تجربتك المجانية' : '✨ Vous avez utilisé votre essai gratuit';
    }
    if (bodyEl) {
        bodyEl.textContent = isAr ?
            `استخدمت ${formatNumber(FREE_EXPORT_LIMIT)} تصديرات مجانية لميزة "${featureLabel}". اشترك في النسخة المميزة للاستمرار في تصدير تقاريرك بلا حدود، مع كل الميزات المتقدمة.` :
            `Vous avez utilisé ${formatNumber(FREE_EXPORT_LIMIT)} exports gratuits pour "${featureLabel}". Abonnez-vous à la version Premium pour continuer à exporter vos rapports sans limite, avec toutes les fonctionnalités avancées.`;
    }

    const modal = document.getElementById('paywallModal');
    if (modal) modal.classList.add('show');

    if (typeof trackFeatureUsed === 'function') {
        trackFeatureUsed('paywall_shown', { feature: featureLabel });
    }
}

function closePaywallModal() {
    const modal = document.getElementById('paywallModal');
    if (modal) modal.classList.remove('show');
}

function startPremiumPurchaseFromPaywall() {
    closePaywallModal();
    if (typeof openPremiumPurchaseFlow === 'function') {
        openPremiumPurchaseFlow();
    } else if (typeof showPremiumModal === 'function') {
        showPremiumModal();
    }
}

console.log('feature-gate.js loaded successfully');
