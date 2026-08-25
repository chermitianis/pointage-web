// ===== البيانات الأساسية — Gestion des données et stockage =====
let workData = {};
let selectedDate = null;
let currentCalendarMonth = new Date();
let editingHolidayIndex = null;

// اللغة الفرنسية هي اللغة الافتراضية (Default: 'fr')
let settings = {
    monthStartDay: 1,
    monthEndDay: 31,
    shift2Bonus: 75,
    shift3Bonus: 100,
    annualVacation: 18,
    language: 'fr',
    numberFormat: 'western', // 'western' أو 'arabic'
    hourlyRate: 5,
    monthlySalary: 800,
    hoursPerDay: 8,
    currency: 'DT', // رمز العملة — قابل للتعديل بالكامل من الإعدادات
    paidBonuses: {},
    apiEnabled: false, // تفعيل/تعطيل واجهة PointageAPI

    overtimeSettings: {
        normalMultiplier: 1.25,
        nightMultiplier: 1.50,
        restDayMultiplier: 1.75,
        holidayMultiplier: 2.00
    },

    workHours: {
        normalStartHour: 8,
        normalEndHour: 17,
        nightStartHour: 22,
        nightEndHour: 5
    },

    weeklyRestDays: {
        0: [0,1,2,3,4,5,6,7,8,9,10,11],
        6: [6,7]
    },

    holidays: [
        { date: '2026-01-01', name_ar: 'رأس السنة الميلادية', name_fr: 'Nouvel An', recurring: true },
        { date: '2025-12-17', name_ar: 'عيد الثورة والشباب', name_fr: 'Révolution et Jeunesse', recurring: true },
        { date: '2026-03-20', name_ar: 'عيد الاستقلال', name_fr: 'Fête de l\'Indépendance', recurring: true },
        { date: '2026-04-09', name_ar: 'يوم الشهداء', name_fr: 'Jour des Martyrs', recurring: true },
        { date: '2026-05-01', name_ar: 'عيد العمال', name_fr: 'Fête du Travail', recurring: true },
        { date: '2026-07-25', name_ar: 'عيد الجمهورية', name_fr: 'Fête de la République', recurring: true },
        { date: '2026-08-13', name_ar: 'عيد المرأة', name_fr: 'Journée de la Femme', recurring: true },
        { date: '2026-03-31', name_ar: 'عيد الفطر (اليوم 1)', name_fr: 'Aïd El Fitr (Jour 1)', recurring: false },
        { date: '2026-04-01', name_ar: 'عيد الفطر (اليوم 2)', name_fr: 'Aïd El Fitr (Jour 2)', recurring: false },
        { date: '2026-06-07', name_ar: 'عيد الأضحى (اليوم 1)', name_fr: 'Aïd El Adha (Jour 1)', recurring: false },
        { date: '2026-06-08', name_ar: 'عيد الأضحى (اليوم 2)', name_fr: 'Aïd El Adha (Jour 2)', recurring: false },
        { date: '2026-06-28', name_ar: 'رأس السنة الهجرية', name_fr: 'Nouvel An Hégirien', recurring: false },
        { date: '2026-09-06', name_ar: 'المولد النبوي الشريف', name_fr: 'Mawlid Ennabaoui', recurring: false }
    ],

    // === الإعدادات الخاصة بنظام الحصص ===
    numShifts: 3,                // عدد الحصص (1, 2, 3, 4)
    shiftStartHour: 8,           // وقت بداية الحصة الأولى (0-23)
    shiftBonuses: {              // مكافآت الحصص (دينار/أسبوع)
        2: 75,
        3: 100,
        4: 125
    }
};

/**
 * حفظ البيانات محلياً مع المزامنة السحابية المباشرة مع Supabase
 */
function saveData() {
    try {
        localStorage.setItem('pointageWorkData', JSON.stringify(workData));
        localStorage.setItem('pointageSettings', JSON.stringify(settings));

        // دفع التغييرات تلقائياً إلى السحابة عبر المحرك المركزي
        if (window.SupabaseSyncEngine) {
            window.SupabaseSyncEngine.push('user_work_data', workData);
            window.SupabaseSyncEngine.push('user_settings', settings);
        }
    } catch (e) {
        console.error('خطأ في الحفظ:', e);
    }
}

/**
 * تحميل البيانات من التخزين المحلي مع ضمان الفرنسية كخيار افتراضي
 */
function loadData() {
    try {
        const data = localStorage.getItem('pointageWorkData');
        const sett = localStorage.getItem('pointageSettings');
        if (data) workData = JSON.parse(data);
        if (sett) {
            const loadedSettings = JSON.parse(sett);
            settings = {
                ...settings,
                ...loadedSettings,
                language: loadedSettings.language || 'fr', // الفرنسية دائماً في حال عدم توفر اللغة
                overtimeSettings: loadedSettings.overtimeSettings || settings.overtimeSettings,
                workHours: loadedSettings.workHours || settings.workHours,
                numberFormat: loadedSettings.numberFormat || 'western',
                numShifts: loadedSettings.numShifts || 3,
                shiftStartHour: loadedSettings.shiftStartHour !== undefined ? loadedSettings.shiftStartHour : 8,
                shiftBonuses: loadedSettings.shiftBonuses || { 2: 75, 3: 100, 4: 125 },
                currency: loadedSettings.currency || 'DT',
                apiEnabled: loadedSettings.apiEnabled === true
            };
        }
    } catch (e) {
        console.error('خطأ في التحميل:', e);
    }
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function parseDate(str) {
    return new Date(str + 'T00:00:00');
}

// ===== تنسيق تاريخ ووقت للعرض مع مراعاة نوع الأرقام المختار =====
function formatLocalizedDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const raw = `${day}/${month}/${year} ${hours}:${minutes}`;
    return (typeof toLocalizedDigits === 'function') ? toLocalizedDigits(raw) : raw;
}

function getMonthPeriod(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const defaultEnd = new Date(year, month + 1, 0).getDate();
    let startDay = settings.monthStartDay || 1;
    let endDay = settings.monthEndDay || defaultEnd;

    if (startDay < 1 || startDay > 31) startDay = 1;
    if (endDay < 1 || endDay > 31) endDay = defaultEnd;

    let startDate, endDate;

    if (date.getDate() < startDay) {
        startDate = new Date(year, month - 1, startDay);
        endDate = new Date(year, month, Math.min(endDay, defaultEnd));
    } else {
        startDate = new Date(year, month, startDay);
        endDate = new Date(year, month + 1, Math.min(endDay, defaultEnd));
    }

    const maxEndDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
    if (endDate.getDate() > maxEndDay) {
        endDate = new Date(endDate.getFullYear(), endDate.getMonth(), maxEndDay);
    }

    return { startDate, endDate };
}

function getPeriodKey(startDate, endDate) {
    return `${formatDate(startDate)}_${formatDate(endDate)}`;
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

function getWeekDays(start) {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
}

function isHoliday(date) {
    const str = formatDate(date);
    return settings.holidays.some(h => {
        if (h.recurring) {
            const hd = parseDate(h.date);
            return hd.getMonth() === date.getMonth() && hd.getDate() === date.getDate();
        }
        return h.date === str;
    });
}

function getHolidayName(date) {
    const dateStr = formatDate(date);
    const holiday = settings.holidays.find(h => {
        if (h.recurring) {
            const hDate = parseDate(h.date);
            return hDate.getMonth() === date.getMonth() && hDate.getDate() === date.getDate();
        }
        return h.date === dateStr;
    });
    if (!holiday) return '';
    return settings.language === 'ar' ? (holiday.name_ar || holiday.name) : (holiday.name_fr || holiday.name);
}

function getDefaultDayData(date) {
    const day = date.getDay();
    const month = date.getMonth();

    if (settings.weeklyRestDays && settings.weeklyRestDays[day] && settings.weeklyRestDays[day].includes(month)) {
        return { type: 'rest' };
    }
    if (day === 0) return { type: 'rest' };
    if (isHoliday(date)) return { type: 'holiday' };
    return { type: 'shift', shift: 1 };
}

function getExpectedWorkingDaysInPeriod(start, end) {
    let count = 0;
    const curr = new Date(start);
    while (curr <= end) {
        const def = getDefaultDayData(curr);
        if (def.type !== 'rest' && def.type !== 'holiday') count++;
        curr.setDate(curr.getDate() + 1);
    }
    return count;
}

function getDayData(date) {
    const str = formatDate(date);
    const defaultData = getDefaultDayData(date);
    const storedData = workData[str];

    if (!storedData) return defaultData;

    const storedType = storedData.type;
    const defaultType = defaultData.type;
    const storedShift = storedData.shift;
    const defaultShift = defaultData.shift;

    if (storedType !== defaultType) return storedData;
    if (storedType === 'shift' && storedShift !== defaultShift) return storedData;

    if (storedData.overtimeHours && storedData.overtimeHours > 0) {
        return { ...defaultData, overtimeHours: storedData.overtimeHours };
    }
    return defaultData;
}

function setDayData(date, data) {
    workData[formatDate(date)] = data;
    saveData();
}

// ===== حساب أوقات الحصص بناءً على عدد الحصص وبداية الحصة الأولى =====
function getShiftTimeRanges() {
    const numShifts = settings.numShifts || 3;
    const ranges = [];

    if (numShifts <= 1) {
        const start = settings.workHours.normalStartHour;
        const end = settings.workHours.normalEndHour;
        ranges.push({ shift: 1, startHour: start, endHour: end });
        return ranges;
    }

    const shiftLength = 24 / numShifts;
    const baseStart = settings.shiftStartHour !== undefined ? settings.shiftStartHour : 8;

    for (let i = 0; i < numShifts; i++) {
        const start = (baseStart + i * shiftLength) % 24;
        const end = (start + shiftLength) % 24;
        ranges.push({ shift: i + 1, startHour: start, endHour: end });
    }
    return ranges;
}

function formatHourLabel(hour) {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getShiftTimeLabel(shiftNumber) {
    const ranges = getShiftTimeRanges();
    const range = ranges.find(r => r.shift === shiftNumber);
    if (!range) return '';
    const label = `${formatHourLabel(range.startHour)} - ${formatHourLabel(range.endHour)}`;
    return (typeof toLocalizedDigits === 'function') ? toLocalizedDigits(label) : label;
}

function isNightTime(hour) {
    const nightStart = settings.workHours.nightStartHour;
    const nightEnd = settings.workHours.nightEndHour;

    if (nightStart > nightEnd) {
        return hour >= nightStart || hour < nightEnd;
    } else {
        return hour >= nightStart && hour < nightEnd;
    }
}

function calculateOvertimeMultiplier(date, dayData = null) {
    if (dayData) {
        if (dayData.type === 'rest') return settings.overtimeSettings.restDayMultiplier;
        if (dayData.type === 'holiday') return settings.overtimeSettings.holidayMultiplier;
        if (dayData.isNight) return settings.overtimeSettings.nightMultiplier;
        return settings.overtimeSettings.normalMultiplier;
    }

    if (isHoliday(date)) return settings.overtimeSettings.holidayMultiplier;
    const dow = date.getDay();
    if (dow === 0 || dow === 6) return settings.overtimeSettings.restDayMultiplier;
    return settings.overtimeSettings.normalMultiplier;
}

// ===== دالة تنزيل ملف عامة =====
async function downloadFileSmart(blob, fileName) {
    try {
        if (window.AndroidApp && typeof window.AndroidApp.saveAndOpenFile === 'function') {
            const dataUri = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            window.AndroidApp.saveAndOpenFile(dataUri, fileName, blob.type || 'application/octet-stream');
            return true;
        }
    } catch (bridgeError) {
        console.warn('فشل استخدام جسر AndroidApp، سيتم تجربة طريقة أخرى:', bridgeError);
    }

    try {
        if (navigator.share && navigator.canShare) {
            const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: fileName });
                return true;
            }
        }
    } catch (shareError) {
        if (shareError && shareError.name === 'AbortError') {
            return false;
        }
        console.warn('navigator.share غير متاح أو فشل، سيتم تجربة طريقة أخرى:', shareError);
    }

    try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        return true;
    } catch (blobError) {
        console.warn('فشل التنزيل عبر Blob، سيتم تجربة طريقة احتياطية:', blobError);
    }

    try {
        const dataUri = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    } catch (finalError) {
        console.error('فشلت جميع طرق التنزيل:', finalError);
        return false;
    }
}

// ===== نافذة تأكيد مخصصة =====
function showConfirmDialog(message, options = {}) {
    return new Promise((resolve) => {
        const isAr = settings.language === 'ar';
        const existing = document.getElementById('customConfirmModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'customConfirmModal';
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 380px; text-align: center; padding: 26px 22px;">
                <div class="modal-title" style="border-bottom: none; margin-bottom: 10px;">${options.title || (isAr ? 'تأكيد' : 'Confirmation')}</div>
                <p style="font-size: 14px; color: var(--text-color); line-height: 1.7; margin-bottom: 22px; white-space: pre-line;">${message}</p>
                <div style="display: flex; gap: 10px;">
                    <button id="customConfirmYesBtn" class="modal-btn" style="flex: 1; margin: 0; background: linear-gradient(135deg, #F44336, #D32F2F);">${options.confirmText || (isAr ? 'تأكيد' : 'Confirmer')}</button>
                    <button id="customConfirmNoBtn" class="modal-close" style="flex: 1; margin: 0;">${options.cancelText || (isAr ? 'إلغاء' : 'Annuler')}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const cleanup = (result) => {
            modal.remove();
            document.body.style.overflow = '';
            resolve(result);
        };

        document.getElementById('customConfirmYesBtn').onclick = () => cleanup(true);
        document.getElementById('customConfirmNoBtn').onclick = () => cleanup(false);
    });
}

async function exportData() {
    const data = {
        workData: workData,
        settings: settings,
        exportDate: new Date().toISOString(),
        version: '3.0'
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const exportFileDefaultName = `pointage-backup-${formatDate(new Date())}.json`;

    const success = await downloadFileSmart(blob, exportFileDefaultName);
    if (success) {
        showToast(typeof t === 'function' ? t('dataExported') : 'Données exportées', 2000);
    } else {
        showToast(settings.language === 'ar' ? 'تعذر تصدير البيانات' : 'Échec de l\'exportation des données', 2500);
    }
}

function importData() {
    document.getElementById('fileInput').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            const confirmMsg = typeof t === 'function' ? t('confirmRestore') : (settings.language === 'ar' ? 'هل أنت تأكد من استعادة البيانات؟' : 'Voulez-vous restaurer les données ?');

            const confirmed = await showConfirmDialog(confirmMsg);
            if (confirmed) {
                if (importedData.workData) {
                    workData = importedData.workData;
                }
                if (importedData.settings) {
                    settings = { ...settings, ...importedData.settings };
                }

                saveData();
                location.reload();
            }
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            showToast(typeof t === 'function' ? t('invalidFile') : 'Fichier invalide', 3000);
        }
    };
    reader.readAsText(file);

    event.target.value = '';
}

async function clearData() {
    const confirmMsg = typeof t === 'function' ? t('confirmClear') : (settings.language === 'ar' ? 'هل أنت تأكد من مسح جميع البيانات؟' : 'Voulez-vous réinitialiser toutes les données ?');
    const confirmed = await showConfirmDialog(confirmMsg);

    if (confirmed) {
        workData = {};
        localStorage.removeItem('pointageWorkData');
        localStorage.removeItem('pointageSettings');

        settings = {
            monthStartDay: 1,
            monthEndDay: 31,
            shift2Bonus: 75,
            shift3Bonus: 100,
            annualVacation: 18,
            language: 'fr', // الفرنسية افتراضياً
            numberFormat: 'western',
            hourlyRate: 5,
            monthlySalary: 800,
            hoursPerDay: 8,
            currency: 'DT',
            paidBonuses: {},
            overtimeSettings: {
                normalMultiplier: 1.25,
                nightMultiplier: 1.50,
                restDayMultiplier: 1.75,
                holidayMultiplier: 2.00
            },
            workHours: {
                normalStartHour: 8,
                normalEndHour: 17,
                nightStartHour: 22,
                nightEndHour: 5
            },
            weeklyRestDays: {
                0: [0,1,2,3,4,5,6,7,8,9,10,11],
                6: [6,7]
            },
            holidays: [...settings.holidays],
            numShifts: settings.numShifts || 3,
            shiftStartHour: settings.shiftStartHour !== undefined ? settings.shiftStartHour : 8,
            shiftBonuses: settings.shiftBonuses || { 2: 75, 3: 100, 4: 125 }
        };
        
        saveData();
        location.reload();
    }
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('Toast element not found');
        return;
    }
    toast.textContent = message;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}