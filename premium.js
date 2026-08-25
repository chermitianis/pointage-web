// ===== premium.js - نظام الاشتراك المدفوع =====

const PREMIUM_KEY = 'pointagePremium';
const PREMIUM_EXPIRY_KEY = 'pointagePremiumExpiry';

// ===== التحقق من حالة الاشتراك =====
function checkPremium() {
    const isPremium = localStorage.getItem(PREMIUM_KEY) === 'true';
    if (!isPremium) return false;
    
    const expiry = localStorage.getItem(PREMIUM_EXPIRY_KEY);
    if (expiry) {
        const expiryDate = new Date(expiry);
        if (expiryDate < new Date()) {
            setPremium(false);
            return false;
        }
    }
    
    return true;
}

function setPremium(active, expiryDate = null) {
    localStorage.setItem(PREMIUM_KEY, active ? 'true' : 'false');
    if (active && expiryDate) {
        localStorage.setItem(PREMIUM_EXPIRY_KEY, expiryDate.toISOString());
    } else if (!active) {
        localStorage.removeItem(PREMIUM_EXPIRY_KEY);
    }
}

function getPremiumExpiry() {
    const expiry = localStorage.getItem(PREMIUM_EXPIRY_KEY);
    return expiry ? new Date(expiry) : null;
}

// ===== عرض نافذة النسخة الممتازة =====
function showPremiumModal() {
    if (checkPremium()) {
        showToast(settings.language === 'ar' ? 'أنت مشترك بالفعل في النسخة الممتازة!' : 'Vous êtes déjà abonné à la version premium!', 2000);
        return;
    }
    
    const existingModal = document.getElementById('premiumModal');
    if (existingModal) existingModal.remove();
    
    const isAr = settings.language === 'ar';
    // ===== دعم الوضع الليلي: الألوان الثابتة (inline) كانت تُكسر في الوضع الليلي =====
    // لأن خلفية النافذة تتحول للون داكن بينما كانت عناصر القائمة تحتفظ بخلفية
    // ونص فاتحَين ثابتين، ما يجعل النص غير مقروء. نحدد الألوان هنا حسب الوضع الحالي.
    const isDark = document.body.classList.contains('dark-theme');
    const featureTitleColor = isDark ? '#e8eaf0' : '#424242';
    const featureItemBg = isDark ? '#22314f' : '#F5F5F5';
    const featureItemColor = isDark ? '#e8eaf0' : '#333333';
    
    const modal = document.createElement('div');
    modal.id = 'premiumModal';
    modal.className = 'modal show';
    // تم إزالة الأيقونات ⭐ و 💰 من النافذة
    modal.innerHTML = `
        <div class="modal-content premium-modal" style="max-width: 460px; padding: 28px 24px;">
            <div class="modal-title" style="font-size: 24px; color: #FFD700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${isAr ? 'النسخة الممتازة' : 'Version Premium'}
            </div>
            
            <div class="premium-features" style="padding: 8px 0 16px;">
                <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: ${featureTitleColor}; text-align: center;">
                    ${isAr ? '🚀 مزايا الاشتراك مدى الحياة:' : ' Avantages de l\'abonnement à vie:'}
                </h4>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="padding: 10px 14px; margin-bottom: 6px; background: ${featureItemBg}; color: ${featureItemColor}; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14px;">
                        <span style="font-size: 20px;">🚫</span>
                        <span>${isAr ? 'إزالة الإعلانات نهائياً' : 'Suppression des publicités définitivement'}</span>
                    </li>
                    <li style="padding: 10px 14px; margin-bottom: 6px; background: ${featureItemBg}; color: ${featureItemColor}; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14px;">
                        <span style="font-size: 20px;">📊</span>
                        <span>${isAr ? 'تقارير متقدمة مع رسوم بيانية' : 'Rapports avancés avec graphiques'}</span>
                    </li>
                    <li style="padding: 10px 14px; margin-bottom: 6px; background: ${featureItemBg}; color: ${featureItemColor}; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14px;">
                        <span style="font-size: 20px;">📁</span>
                        <span>${isAr ? 'تصدير البيانات بصيغ متعددة (Excel, CSV)' : 'Exportation des données en plusieurs formats (Excel, CSV)'}</span>
                    </li>
                    <li style="padding: 10px 14px; margin-bottom: 6px; background: ${featureItemBg}; color: ${featureItemColor}; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14px;">
                        <span style="font-size: 20px;">☁️</span>
                        <span>${isAr ? 'مزامنة سحابية بين الأجهزة' : 'Synchronisation cloud entre appareils'}</span>
                    </li>
                    <li style="padding: 10px 14px; margin-bottom: 6px; background: ${featureItemBg}; color: ${featureItemColor}; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14px;">
                        <span style="font-size: 20px;">🔒</span>
                        <span>${isAr ? 'دعم فني أولوية' : 'Support technique prioritaire'}</span>
                    </li>
                    <li style="padding: 10px 14px; margin-bottom: 6px; background: ${featureItemBg}; color: ${featureItemColor}; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14px;">
                        <span style="font-size: 20px;">🎁</span>
                        <span>${isAr ? 'تحديثات مجانية مستقبلية' : 'Mises à jour gratuites futures'}</span>
                    </li>
                </ul>
                
                <div class="premium-price" style="text-align: center; margin: 20px 0 8px; padding: 16px; background: linear-gradient(135deg, #FFF8E1, #FFECB3); border-radius: 14px;">
                    <span class="price" style="font-size: 32px; font-weight: 800; color: #E65100;">${(typeof formatNumber === 'function') ? formatNumber(99) : 99} ${isAr ? 'د' : 'DT'}</span>
                    <span class="price-note" style="display: block; font-size: 13px; color: #795548; margin-top: 4px;">
                        ${isAr ? 'دفعة واحدة مدى الحياة' : 'Paiement unique à vie'}
                    </span>
                </div>
            </div>
            
            <div class="modal-actions" style="flex-direction: column; gap: 10px; margin-top: 4px;">
                <button class="modal-btn premium-btn" onclick="purchasePremium()" style="background: linear-gradient(135deg, #FFD700, #FFA000); color: #333; padding: 16px; font-size: 18px; font-weight: 700; width: 100%; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);">
                    ${isAr ? 'اشتر الآن' : 'Acheter maintenant'}
                </button>
                <button class="modal-close" onclick="closePremiumModal()" style="padding: 12px; font-size: 14px; width: 100%;">
                    ${isAr ? 'إلغاء' : 'Annuler'}
                </button>
            </div>
            
            <div style="text-align: center; margin-top: 12px; font-size: 11px; color: #999;">
                ${isAr ? '🔒 دفع آمن عبر Google Play' : '🔒 Paiement sécurisé via Google Play'}
                &nbsp;·&nbsp;
                <a href="#" onclick="restorePremiumPurchases(); return false;" style="color: #1976D2; text-decoration: underline;">
                    ${isAr ? 'استعادة المشتريات' : 'Restaurer les achats'}
                </a>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

// ===== عملية الشراء (حقيقية عبر Google Play Billing) =====
// الخطوات: 1) الطلب من الكود الأصلي (Kotlin) بدء تدفق الشراء عبر Google Play
//          2) عند نجاح الشراء، ينادي الكود الأصلي window.onNativePurchaseUpdate(...)
//          3) نتحقق من صحة عملية الشراء عبر Cloud Function (يمنع أي تلاعب محلي)
//          4) لا يُفعَّل الاشتراك فعلياً إلا بعد تأكيد الخادم
function purchasePremium() {
    const isAr = settings.language === 'ar';
    
    if (checkPremium()) {
        showToast(isAr ? 'أنت مشترك بالفعل!' : 'Vous êtes déjà abonné!', 2000);
        closePremiumModal();
        return;
    }
    
    // الشراء الحقيقي متاح فقط داخل التطبيق المثبَّت من متجر Google Play
    // (الجسر AndroidApp موفَّر من MainActivity.kt عبر BillingManager)
    if (window.AndroidApp && typeof window.AndroidApp.launchPurchase === 'function') {
        window.AndroidApp.launchPurchase();
        showToast(isAr ? '⏳ جاري فتح نافذة الدفع من Google Play...' : '⏳ Ouverture du paiement Google Play...', 3000);
        return;
    }
    
    // تشغيل الموقع خارج التطبيق المثبَّت (متصفح عادي) - لا توجد آلية دفع هنا
    showToast(isAr ? 
        'الشراء متاح فقط داخل التطبيق المثبَّت من متجر Google Play' : 
        'L\'achat est disponible uniquement dans l\'application installée depuis Google Play', 
    3500);
}

// ===== استعادة المشتريات (مطلوبة من سياسات Google Play) =====
// مفيدة عند إعادة تثبيت التطبيق أو تغيير الجهاز مع بقاء نفس حساب Google
function restorePremiumPurchases() {
    const isAr = settings.language === 'ar';
    if (window.AndroidApp && typeof window.AndroidApp.restorePurchases === 'function') {
        window.AndroidApp.restorePurchases();
        showToast(isAr ? '⏳ جاري التحقق من مشترياتك السابقة...' : '⏳ Vérification de vos achats précédents...', 3000);
    } else {
        showToast(isAr ? 
            'هذه الميزة متاحة فقط داخل التطبيق المثبَّت' : 
            'Cette fonctionnalité est disponible uniquement dans l\'application installée', 
        3000);
    }
}

// ===== يُستدعى من الكود الأصلي (Kotlin) عند نجاح عملية شراء (جديدة أو مستعادة) =====
window.onNativePurchaseUpdate = async function(jsonStr) {
    const isAr = settings.language === 'ar';
    try {
        const data = JSON.parse(jsonStr);
        if (!data || !data.productId || !data.purchaseToken) {
            console.warn('onNativePurchaseUpdate: بيانات شراء غير صالحة', data);
            return;
        }

        showToast(isAr ? '⏳ جاري التحقق من عملية الشراء...' : '⏳ Vérification de l\'achat...', 4000);

        const verified = (typeof verifyPurchaseWithServer === 'function')
            ? await verifyPurchaseWithServer(data.productId, data.purchaseToken)
            : false;

        if (verified) {
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 100);
            setPremium(true, expiryDate);

            closePremiumModal();
            updatePremiumStatus();
            hideAds();

            showToast(isAr ? '🎉 تهانينا! تم تفعيل النسخة الممتازة.' : '🎉 Félicitations! Version premium activée.', 3000);

            if (typeof trackFeature !== 'undefined') trackFeature('premium_purchased');
        } else {
            showToast(isAr ? 
                'تعذر التحقق من عملية الشراء. إن استمرت المشكلة تواصل مع الدعم.' : 
                'Échec de la vérification de l\'achat. Contactez le support si le problème persiste.', 
            4500);
        }
    } catch (e) {
        console.error('onNativePurchaseUpdate error:', e);
    }
};

// ===== يُستدعى من الكود الأصلي عند فشل أو إلغاء عملية الشراء =====
window.onNativePurchaseError = function(message) {
    showToast(message || (settings.language === 'ar' ? 'فشلت عملية الشراء' : 'Échec de l\'achat'), 3000);
};

// ===== مطابقة حالة الاشتراك المحلية مع الحالة الحقيقية المسجّلة على الخادم =====
// يُستدعى عند بدء التطبيق لضمان أن الحالة المحلية تعكس الشراء الفعلي المُتحقَّق منه
async function reconcilePremiumWithServer() {
    if (typeof checkServerPremiumStatus !== 'function') return;
    try {
        const serverStatus = await checkServerPremiumStatus();
        if (serverStatus === true && !checkPremium()) {
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 100);
            setPremium(true, expiryDate);
            hideAds();
            updatePremiumStatus();
        }
    } catch (e) {
        console.warn('تعذرت مطابقة حالة الاشتراك مع الخادم:', e);
    }
}
window.restorePremiumPurchases = restorePremiumPurchases;
window.reconcilePremiumWithServer = reconcilePremiumWithServer;

// ===== إخفاء الإعلانات =====
function hideAds() {
    const adSelectors = [
        '.ad-banner',
        '.ad-container',
        '.ad-unit',
        '[class*="ad-"]',
        '[id*="ad-"]'
    ];
    
    adSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
        });
    });
    
    document.body.classList.add('premium-active');
}

// ===== تحديث حالة الاشتراك في الواجهة =====
function updatePremiumStatus() {
    const statusEl = document.getElementById('premiumStatus');
    if (!statusEl) return;
    
    const isAr = settings.language === 'ar';
    const isPremium = checkPremium();
    
    if (isPremium) {
        const expiry = getPremiumExpiry();
        let expiryText = '';
        if (expiry) {
            // تنسيق يدوي يراعي نوع الأرقام المختار بدلاً من الاعتماد على locale المتصفح
            const day = String(expiry.getDate()).padStart(2, '0');
            const month = String(expiry.getMonth() + 1).padStart(2, '0');
            const year = expiry.getFullYear();
            const rawDateStr = `${day}/${month}/${year}`;
            const dateStr = (typeof toLocalizedDigits === 'function') ? toLocalizedDigits(rawDateStr) : rawDateStr;
            expiryText = isAr ? ` (صالحة حتى ${dateStr})` : ` (valable jusqu'au ${dateStr})`;
        }
        
        statusEl.innerHTML = `✅ <strong style="color: #4CAF50;">${isAr ? 'أنت مشترك في النسخة الممتازة' : 'Vous êtes abonné à la version premium'}${expiryText}</strong>`;
        hideAds();
    } else {
        statusEl.innerHTML = `🔓 <span style="color: #999;">${isAr ? 'غير مشترك. قم بالترقية للاستمتاع بالمزايا.' : 'Non abonné. Mettez à niveau pour profiter des avantages.'}</span>`;
    }
}

// ===== التحقق من حالة الاشتراك عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', () => {
    if (checkPremium()) {
        hideAds();
    }
    setTimeout(updatePremiumStatus, 500);
    // مطابقة الحالة المحلية مع السجل الحقيقي على الخادم (يلتقط أي اشتراك تم
    // التحقق منه فعلياً ولم يُسجَّل بعد محلياً، ولا يُبطل الحالة المحلية تلقائياً)
    setTimeout(() => {
        if (typeof reconcilePremiumWithServer === 'function') reconcilePremiumWithServer();
    }, 1500);
});

// ===== ربط الدوال بالكائن العام =====
window.checkPremium = checkPremium;
window.setPremium = setPremium;
window.getPremiumExpiry = getPremiumExpiry;
window.showPremiumModal = showPremiumModal;
window.closePremiumModal = closePremiumModal;
window.purchasePremium = purchasePremium;
window.hideAds = hideAds;
window.updatePremiumStatus = updatePremiumStatus;

console.log('premium.js loaded successfully');