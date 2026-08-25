// ===================================================================
// app-core.js — Noyau principal de l'application : Initialisation, Navigation, Mode Sombre, Formatage, En-tête et Statut Premium.
// Fait partie de l'application Pointage — Dépend de data.js et supabaseSync.js
// ===================================================================

// ===== نقطة انطلاق التطبيق — Point d'entrée de l'application =====
window.onload = async () => {
    loadData();

    // ===== معالجة العودة من OAuth (Google) =====
    try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
            console.log('🔄 Détection du token OAuth, tentative de connexion...');
            
            // 1. طريقة AuthService
            if (window.AuthService && typeof window.AuthService.setSessionToken === 'function') {
                const user = await window.AuthService.setSessionToken(accessToken);
                if (user) {
                    console.log('✅ Authentification Google réussie pour:', user.email);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    if (typeof showToast === 'function') {
                        showToast('✅ Connexion avec Google réussie', 2000);
                    }
                } else {
                    console.warn('⚠️ Échec via AuthService, tentative fallback...');
                    // Fallback: utilisation directe du client
                    if (window.supabaseInstance) {
                        const { data, error } = await window.supabaseInstance.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || ''
                        });
                        if (!error && data?.user) {
                            console.log('✅ Authentification Google réussie (fallback):', data.user.email);
                            window.history.replaceState({}, document.title, window.location.pathname);
                            if (window.AuthService && typeof window.AuthService.onAuthSuccess === 'function') {
                                await window.AuthService.onAuthSuccess(data.user);
                            }
                            if (typeof showToast === 'function') {
                                showToast('✅ Connexion avec Google réussie', 2000);
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.warn('⚠️ Erreur lors du traitement du callback OAuth:', err);
        if (typeof showToast === 'function') {
            showToast('❌ Erreur lors de la connexion Google', 3000);
        }
    }

    // ===== Vérification de l'utilisateur connecté =====
    try {
        if (window.AuthService && typeof window.AuthService.getCurrentUser === 'function') {
            const user = await window.AuthService.getCurrentUser();
            if (user) {
                console.log('👤 Utilisateur connecté:', user.email || user.phone || user.id);
                if (window.SupabaseSyncEngine && typeof window.SupabaseSyncEngine.pullAll === 'function') {
                    await window.SupabaseSyncEngine.pullAll();
                    loadData();
                }
            } else {
                console.log('👤 Aucun utilisateur connecté, mode local.');
            }
        }
    } catch (err) {
        console.warn('⚠️ Erreur lors de la vérification de l\'utilisateur:', err);
    }

    // Chargement des notes, tâches et rappels
    if (typeof loadNotesData === 'function') loadNotesData();
    if (typeof loadTasksData === 'function') loadTasksData();
    if (typeof loadRemindersData === 'function') loadRemindersData();
    
    initializeApp();
};

function initializeApp() {
    // الفرنسية هي اللغة الافتراضية للمستند والتطبيق
    if (!settings.language) settings.language = 'fr';
    if (!settings.numberFormat) settings.numberFormat = 'western';
    if (!settings.paidBonuses) settings.paidBonuses = {};
    if (!settings.overtimeSettings) {
        settings.overtimeSettings = {
            normalMultiplier: 1.25,
            nightMultiplier: 1.50,
            restDayMultiplier: 1.75,
            holidayMultiplier: 2.00
        };
    }
    if (!settings.workHours) {
        settings.workHours = {
            normalStartHour: 8,
            normalEndHour: 17,
            nightStartHour: 22,
            nightEndHour: 5
        };
    }
    if (!settings.weeklyRestDays || Object.keys(settings.weeklyRestDays).length === 0) {
        settings.weeklyRestDays = {
            0: [0,1,2,3,4,5,6,7,8,9,10,11],
            6: [6,7]
        };
    }

    // === الإعدادات الخاصة بنظام الحصص ===
    if (!settings.numShifts) settings.numShifts = 3;
    if (settings.shiftStartHour === undefined) settings.shiftStartHour = 8;
    if (!settings.shiftBonuses) settings.shiftBonuses = { 2: 75, 3: 100, 4: 125 };

    applySavedTheme();
    if (typeof updateUILanguage === 'function') updateUILanguage();
    updateNumberFormatUI();
    updateHeader();
    if (typeof renderCurrentWeek === 'function') renderCurrentWeek();
    if (typeof initializeCalendar === 'function') initializeCalendar();
    if (typeof initializeReports === 'function') initializeReports();
    if (typeof initializeSettings === 'function') initializeSettings();

    // تحميل بيانات جدول الأعمال والتذكيرات وتشغيل محرك التنبيهات
    if (typeof loadTasksData === 'function') loadTasksData();
    if (typeof loadRemindersData === 'function') loadRemindersData();
    if (typeof initNotifyEngine === 'function') initNotifyEngine();

    // تحقق دوري من حالة الاشتراك المميز (Flouci/Supabase)
    if (typeof initPaymentModule === 'function') initPaymentModule();

    setTimeout(() => {
        if (typeof checkPrivacyConsent !== 'undefined') {
            checkPrivacyConsent();
        }
    }, 1000);

    setTimeout(() => {
        if (typeof checkRatingOnLaunch !== 'undefined') {
            checkRatingOnLaunch();
        }
    }, 3000);

    setTimeout(() => {
        updatePremiumStatus();
    }, 500);

    setTimeout(() => {
        if (typeof checkForContentUpdate !== 'undefined') {
            checkForContentUpdate();
        }
    }, 6000);
}

function updateDeveloperInfo() {
    if (!window.DEVELOPER_INFO) return;

    const isAr = settings.language === 'ar';

    const nameEl = document.getElementById('developerNameDisplay');
    if (nameEl) {
        nameEl.textContent = isAr ? DEVELOPER_INFO.nameAr : DEVELOPER_INFO.nameFr;
    }

    const siteLink = document.getElementById('developerWebsiteLink');
    if (siteLink) {
        siteLink.href = DEVELOPER_INFO.website;
        siteLink.textContent = DEVELOPER_INFO.websiteDisplay || DEVELOPER_INFO.website;
    }

    const addressEl = document.getElementById('developerAddressDisplay');
    if (addressEl) {
        addressEl.textContent = isAr ? DEVELOPER_INFO.addressAr : DEVELOPER_INFO.addressFr;
    }
}

// ===== تحديث الإصدار وقسم "À propos" =====
document.addEventListener('DOMContentLoaded', function() {
    const versionElement = document.getElementById('appVersionDisplay');
    if (versionElement) {
        const otaVersion = localStorage.getItem('otaDisplayVersion');
        versionElement.textContent = otaVersion || window.APP_CONFIG?.versionName || '1.0.0';
    }

    updateDeveloperInfo();
});

// ===== دالة تنسيق الأرقام =====

function formatNumber(number) {
    if (number === undefined || number === null || isNaN(number)) return '0';

    const numStr = number.toString();
    if (settings.numberFormat === 'arabic') {
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return numStr.replace(/\d/g, d => arabicDigits[parseInt(d)]);
    }
    return numStr;
}

function toLocalizedDigits(str) {
    if (str === undefined || str === null) return '';
    const text = String(str);
    if (settings.numberFormat === 'arabic') {
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return text.replace(/[0-9]/g, d => arabicDigits[d]);
    }
    return text;
}

function changeNumberFormat(value) {
    settings.numberFormat = value;
    if (typeof saveData === 'function') saveData();
    updateAllNumbers();
    if (typeof updateUILanguage === 'function') {
        updateUILanguage();
    }
    showToast(settings.language === 'ar' ? 'تم تغيير نوع الأرقام' : 'Format des nombres changé', 1500);
}

function updateNumberFormatUI() {
    const select = document.getElementById('numberFormatSelect');
    if (select) {
        select.value = settings.numberFormat || 'western';
    }
}

function updateAllNumbers() {
    updateHeader();
    if (typeof renderCurrentWeek === 'function') renderCurrentWeek();

    const calSec = document.getElementById('calendar-section');
    if (calSec && calSec.classList.contains('active') && typeof renderCalendar === 'function') {
        renderCalendar();
    }
    const repSec = document.getElementById('reports-section');
    if (repSec && repSec.classList.contains('active') && typeof updateReport === 'function') {
        updateReport();
    }
    const noteSec = document.getElementById('notes-section');
    if (noteSec && noteSec.classList.contains('active') && typeof renderNotes === 'function') {
        renderNotes();
    }
}

// ===== نظام الثيم (Mode Sombre / Clair) =====
const THEME_KEY = 'pointageTheme';

function applySavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        updateThemeUI('dark');
    } else {
        document.body.classList.remove('dark-theme');
        updateThemeUI('light');
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, theme);
    updateThemeUI(theme);
    showToast(settings.language === 'ar' ?
        (isDark ? '🌙 تم تفعيل الوضع الداكن' : '☀️ تم تفعيل الوضع الفاتح') :
        (isDark ? '🌙 Mode sombre activé' : '☀️ Mode clair activé'), 2000);
}

function updateThemeUI(theme) {
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    if (icon && label) {
        if (theme === 'dark') {
            icon.textContent = '🌙';
            label.textContent = settings.language === 'ar' ? 'الوضع الداكن' : 'Mode sombre';
        } else {
            icon.textContent = '☀️';
            label.textContent = settings.language === 'ar' ? 'الوضع الفاتح' : 'Mode clair';
        }
    }
}

function resetTheme() {
    localStorage.removeItem(THEME_KEY);
    document.body.classList.remove('dark-theme');
    updateThemeUI('light');
    showToast(settings.language === 'ar' ? 'تم إعادة تعيين الثيم' : 'Thème réinitialisé', 2000);
}

// ===== تحديث رأس الصفحة — Mise à jour de l'en-tête =====

function updateHeader() {
    const now = new Date();
    if (typeof getMonthPeriod !== 'function') return;

    const period = getMonthPeriod(now);
    const periodEl = document.getElementById('currentPeriod');

    if (periodEl && typeof getMonthName === 'function') {
        periodEl.textContent =
            `${formatNumber(period.startDate.getDate())} ${getMonthName(period.startDate.getMonth())} - ${formatNumber(period.endDate.getDate())} ${getMonthName(period.endDate.getMonth())} ${formatNumber(period.endDate.getFullYear())}`;
    }

    if (typeof calculatePeriodStats === 'function') {
        const stats = calculatePeriodStats(period.startDate, period.endDate, true);
        const bonusEl = document.getElementById('currentBonusAmount');
        const daysEl = document.getElementById('workDaysMonth');
        const overtimeEl = document.getElementById('overtimeHours');

        if (bonusEl) bonusEl.textContent = formatNumber(Math.round(stats.totalBonus));
        if (daysEl) daysEl.textContent = formatNumber(stats.workDays);
        if (overtimeEl) overtimeEl.textContent = formatNumber(stats.overtimeHours.toFixed(1));
    }

    updateVacationBalanceDisplay(now);
    checkPreviousBonuses();
    if (typeof updateUILanguage === 'function') updateUILanguage();
    updatePremiumStatus();
}

function updateVacationBalanceDisplay(now) {
    if (typeof calculateYearlyStats !== 'function') return;

    const year = now.getFullYear();
    const yearStats = calculateYearlyStats(year);
    const usedVacation = yearStats.vacationDays;

    const monthsElapsed = now.getMonth();
    const monthlyAccrualRate = (settings.annualVacation || 18) / 12;
    const accruedToDate = monthsElapsed * monthlyAccrualRate;
    const currentBalance = accruedToDate - usedVacation;
    const balanceRounded = Math.round(currentBalance * 10) / 10;

    const vacBalEl = document.getElementById('vacationBalance');
    if (vacBalEl) vacBalEl.textContent = formatNumber(usedVacation);

    const soldeEl = document.getElementById('vacationSolde');
    if (soldeEl) {
        const sign = balanceRounded > 0 ? '+' : '';
        soldeEl.textContent = `${sign}${formatNumber(balanceRounded)}`;
        soldeEl.classList.toggle('positive', balanceRounded >= 0);
        soldeEl.classList.toggle('negative', balanceRounded < 0);
    }
}

function checkPreviousBonuses() {
    if (typeof getMonthPeriod !== 'function' || typeof calculatePeriodStats !== 'function') return;

    const now = new Date();
    const currentPeriod = getMonthPeriod(now);

    const lastMonthDate = new Date(currentPeriod.startDate);
    lastMonthDate.setDate(lastMonthDate.getDate() - 1);
    const lastPeriod = getMonthPeriod(lastMonthDate);
    const lastKey = getPeriodKey(lastPeriod.startDate, lastPeriod.endDate);

    const alertEl = document.getElementById('bonusAlert');
    if (!alertEl) return;

    if (!settings.paidBonuses[lastKey]) {
        const lastStats = calculatePeriodStats(lastPeriod.startDate, lastPeriod.endDate, false);
        if (lastStats.totalBonus > 0) {
            alertEl.classList.add('show');
            const prevBonusEl = document.getElementById('previousBonusAmount');
            if (prevBonusEl) {
                prevBonusEl.textContent = `${formatNumber(Math.round(lastStats.totalBonus))} ${settings.currency || 'DT'}`;
            }
            return;
        }
    }

    alertEl.classList.remove('show');
}

function clearPreviousBonus() {
    if (typeof getMonthPeriod !== 'function') return;

    const now = new Date();
    const currentPeriod = getMonthPeriod(now);

    const lastMonthDate = new Date(currentPeriod.startDate);
    lastMonthDate.setDate(lastMonthDate.getDate() - 1);
    const lastPeriod = getMonthPeriod(lastMonthDate);
    const lastKey = getPeriodKey(lastPeriod.startDate, lastPeriod.endDate);

    if (!settings.paidBonuses) settings.paidBonuses = {};
    settings.paidBonuses[lastKey] = true;

    if (typeof saveData === 'function') saveData();
    checkPreviousBonuses();
    showToast(settings.language === 'ar' ? 'تم تصفير المكافآت' : 'Primes effacées', 2000);
}

// ===== التنقل بين أقسام التطبيق =====

function showSection(section, event = null) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const secEl = document.getElementById(`${section}-section`);
    if (secEl) secEl.classList.add('active');

    const header = document.querySelector('.app-header');
    if (header) {
        header.classList.toggle('header-hidden', section !== 'dashboard');
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        const navBtns = document.querySelectorAll('.nav-btn');
        const sectionMap = {
            'dashboard': 0,
            'calendar': 1,
            'reports': 2,
            'notes': 3,
            'settings': 4
        };
        if (sectionMap[section] !== undefined && navBtns[sectionMap[section]]) {
            navBtns[sectionMap[section]].classList.add('active');
        }
    }

    switch (section) {
        case 'dashboard':
            if (typeof renderCurrentWeek === 'function') renderCurrentWeek();
            break;
        case 'calendar':
            currentCalendarMonth = new Date();
            if (typeof renderCalendar === 'function') renderCalendar();
            break;
        case 'reports':
            if (typeof initializeReports === 'function') initializeReports();
            break;
        case 'notes':
            if (typeof initializeNotesHub === 'function') initializeNotesHub();
            break;
        case 'settings':
            if (typeof initializeSettings === 'function') initializeSettings();
            break;
    }
}

// ===== حالة النسخة المميزة (Premium) وتزامن Supabase =====

function updatePremiumStatus() {
    const statusEl = document.getElementById('premiumStatus');
    if (!statusEl) return;

    if (typeof checkPremium !== 'undefined' && checkPremium()) {
        statusEl.innerHTML = '✅ <strong style="color: #4CAF50;">' +
            (settings.language === 'ar' ? 'أنت مشترك في النسخة الممتازة' : 'Vous êtes abonné à la version premium') +
            '</strong>';
        if (typeof hideAds !== 'undefined') {
            hideAds();
        }
    } else {
        statusEl.innerHTML = '🔓 <span data-i18n="premiumNotSubscribed">' +
            (settings.language === 'ar' ? 'غير مشترك. قم بالترقية للاستمتاع بالمزايا.' : 'Non abonné. Mettez à niveau pour profiter des avantages.') +
            '</span>';
    }
}

function openAnalyticsDashboard() {
    if (typeof AnalyticsDashboard !== 'undefined') {
        AnalyticsDashboard.show();
    } else {
        showToast(settings.language === 'ar' ? 'جاري تحميل لوحة التحليلات...' : 'Chargement du tableau de bord...', 2000);
        const script = document.createElement('script');
        script.src = 'analytics.js';
        script.onload = function() {
            if (typeof AnalyticsDashboard !== 'undefined') {
                AnalyticsDashboard.show();
            } else {
                showToast(settings.language === 'ar' ? 'حدث خطأ في تحميل التحليلات' : 'Erreur de chargement des analyses', 2000);
            }
        };
        document.head.appendChild(script);
    }
}

function openRatingManually() {
    if (typeof showRatingModal !== 'undefined') {
        showRatingModal();
    } else {
        showToast(settings.language === 'ar' ? 'ميزة التقييم غير متوفرة حالياً' : 'Fonction de notation non disponible', 2000);
    }
}

function exportUserData() {
    if (typeof getUserData !== 'undefined') {
        const userData = getUserData();
        if (userData) {
            const dataStr = JSON.stringify(userData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });

            if (typeof downloadFileSmart === 'function') {
                downloadFileSmart(blob, `user_data_${new Date().toISOString().split('T')[0]}.json`);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `user_data_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
            showToast(settings.language === 'ar' ? 'تم تصدير بيانات المستخدم' : 'Données utilisateur exportées', 2000);
        } else {
            showToast(settings.language === 'ar' ? 'لا توجد بيانات مستخدم' : 'Aucune donnée utilisateur', 2000);
        }
    } else {
        showToast(settings.language === 'ar' ? 'ميزة تصدير البيانات غير متوفرة' : 'Fonction d\'export non disponible', 2000);
    }
}

function resetRatingForTesting() {
    if (typeof resetRatingStatus !== 'undefined') {
        resetRatingStatus();
    } else {
        showToast(settings.language === 'ar' ? 'ميزة إعادة تعيين التقييم غير متوفرة' : 'Fonction de réinitialisation non disponible', 2000);
    }
}

console.log('app-core.js loaded successfully with Supabase sync support');
