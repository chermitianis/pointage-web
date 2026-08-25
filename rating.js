// ===== نظام تقييم التطبيق =====
const RATING_KEY = 'pointageRating';
const APP_LAUNCH_COUNT_KEY = 'pointageLaunchCount';
const RATING_SHOWN_KEY = 'pointageRatingShown';

// ===== التحقق من حالة التقييم وعرض النافذة =====
function checkAndShowRating() {
    if (typeof checkPremium !== 'undefined' && checkPremium()) {
        return;
    }
    
    const privacyConsent = localStorage.getItem('pointagePrivacyConsent');
    if (privacyConsent !== 'true') {
        return;
    }
    
    let launchCount = parseInt(localStorage.getItem(APP_LAUNCH_COUNT_KEY) || '0');
    launchCount++;
    localStorage.setItem(APP_LAUNCH_COUNT_KEY, launchCount.toString());
    
    const ratingStatus = localStorage.getItem(RATING_KEY);
    if (ratingStatus === 'rated' || ratingStatus === 'never') {
        return;
    }
    
    const shownThisSession = sessionStorage.getItem(RATING_SHOWN_KEY);
    if (shownThisSession === 'true') {
        return;
    }
    
    const lastShown = localStorage.getItem('pointageRatingLastShown');
    if (lastShown) {
        const daysSinceLastShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastShown < 30 && launchCount % 5 !== 0) {
            return;
        }
    } else if (launchCount < 5) {
        return;
    }
    
    showRatingModal();
    sessionStorage.setItem(RATING_SHOWN_KEY, 'true');
    localStorage.setItem('pointageRatingLastShown', Date.now().toString());
}

// ===== عرض نافذة تقييم التطبيق =====
function showRatingModal() {
    const existingModal = document.getElementById('ratingModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'ratingModal';
    modal.className = 'modal show';
    // تم إزالة الأيقونات ⭐ و ⏰ من النافذة
    modal.innerHTML = `
        <div class="modal-content rating-modal" style="max-width: 420px; padding: 28px 24px;">
            <div class="modal-title" style="font-size: 22px; margin-bottom: 12px;">${t('ratingTitle') || 'هل أعجبك التطبيق؟'}</div>
            <div class="rating-text" style="text-align: center; padding: 8px 0 16px;">
                <p style="font-size: 15px; line-height: 1.6; color: #424242; margin-bottom: 12px;">
                    ${t('ratingText') || 'نحن نعمل باستمرار على تحسين التطبيق. إذا أعجبك، ساعدنا بتقييمه في المتجر.'}
                </p>
                <div style="background: linear-gradient(135deg, #FFF8E1, #FFECB3); padding: 14px; border-radius: 12px; margin: 8px 0;">
                    <span style="font-size: 16px; font-weight: 600; color: #F57F17;">🌟 ${t('ratingReward') || 'مكافأة: بعد التقييم، سنقوم بإزالة الإعلانات نهائياً!'}</span>
                </div>
                <div style="display: flex; justify-content: center; gap: 6px; margin-top: 12px; font-size: 36px;">
                    <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
                </div>
            </div>
            <div class="modal-actions" style="flex-direction: column; gap: 10px; margin-top: 4px;">
                <button class="modal-btn rating-yes" onclick="rateApp()" style="background: linear-gradient(135deg, #4CAF50, #388E3C); padding: 14px; font-size: 16px; width: 100%;">
                    ${t('rateNow') || 'تقييم التطبيق'}
                </button>
                <button class="modal-btn rating-later" onclick="closeRatingModal()" style="background: #9E9E9E; padding: 12px; font-size: 14px; width: 100%;">
                    ${t('rateLater') || 'تذكير لاحقاً'}
                </button>
                <button class="modal-btn rating-never" onclick="neverShowRating()" style="background: transparent; color: #999; border: 1px solid #ddd; padding: 10px; font-size: 13px; width: 100%;">
                    ${t('rateNever') || 'لا، شكراً'}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ===== إغلاق نافذة التقييم =====
function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) modal.remove();
    const nextReminder = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('pointageRatingReminder', nextReminder.toString());
}

// ===== تقييم التطبيق =====
function rateApp() {
    const packageName = 'com.example.pointage';
    const storeUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
    
    try {
        window.open(storeUrl, '_blank');
    } catch (e) {
        window.location.href = storeUrl;
    }
    
    localStorage.setItem(RATING_KEY, 'rated');
    
    if (typeof hideAds !== 'undefined') {
        hideAds();
    } else if (typeof checkPremium !== 'undefined' && !checkPremium()) {
        document.body.classList.add('no-ads');
    }
    
    closeRatingModal();
    showToast(t('ratingThanks') || 'شكراً لك! تم إزالة الإعلانات.', 3000);
}

// ===== رفض عرض التقييم نهائياً =====
function neverShowRating() {
    localStorage.setItem(RATING_KEY, 'never');
    closeRatingModal();
    showToast(t('ratingDeclined') || 'تم إلغاء طلب التقييم.', 2000);
}

// ===== دالة لتحديث حالة التقييم من الإعدادات =====
function getRatingStatus() {
    return localStorage.getItem(RATING_KEY) || 'not_shown';
}

// ===== دالة لإعادة تعيين حالة التقييم (للمطورين) =====
function resetRatingStatus() {
    localStorage.removeItem(RATING_KEY);
    localStorage.removeItem(APP_LAUNCH_COUNT_KEY);
    localStorage.removeItem(RATING_SHOWN_KEY);
    localStorage.removeItem('pointageRatingLastShown');
    localStorage.removeItem('pointageRatingReminder');
    showToast('تم إعادة تعيين حالة التقييم', 2000);
}

// ===== دالة للتحقق من وجود تذكير معلق =====
function checkRatingReminder() {
    const reminder = localStorage.getItem('pointageRatingReminder');
    if (reminder) {
        const reminderTime = parseInt(reminder);
        if (Date.now() > reminderTime) {
            const shownThisSession = sessionStorage.getItem(RATING_SHOWN_KEY);
            if (!shownThisSession) {
                const ratingStatus = localStorage.getItem(RATING_KEY);
                if (ratingStatus !== 'rated' && ratingStatus !== 'never') {
                    showRatingModal();
                    sessionStorage.setItem(RATING_SHOWN_KEY, 'true');
                    localStorage.removeItem('pointageRatingReminder');
                }
            }
        }
    }
}

// ===== دالة للتحقق من عدد مرات فتح التطبيق وعرض التقييم =====
function checkRatingOnLaunch() {
    setTimeout(() => {
        checkAndShowRating();
    }, 2000);
    
    setTimeout(() => {
        checkRatingReminder();
    }, 4000);
}

// ===== ربط الدوال بالكائن العام =====
window.checkAndShowRating = checkAndShowRating;
window.showRatingModal = showRatingModal;
window.closeRatingModal = closeRatingModal;
window.rateApp = rateApp;
window.neverShowRating = neverShowRating;
window.getRatingStatus = getRatingStatus;
window.resetRatingStatus = resetRatingStatus;
window.checkRatingReminder = checkRatingReminder;
window.checkRatingOnLaunch = checkRatingOnLaunch;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkRatingOnLaunch, 3000);
});

console.log('rating.js loaded successfully');