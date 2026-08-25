// ===================================================================
// settings-module.js — منطق تبويب "الإعدادات": تهيئة الإعدادات، الحفظ التلقائي، تكوين الحصص، الساعات الإضافية، وأيام الراحة الأسبوعية.
// جزء من تطبيق Pointage — يعتمد على data.js (يجب تحميله قبل هذا الملف)
// ===================================================================

function initializeSettings() {
    document.getElementById('monthStartDay').value = settings.monthStartDay || 1;
    document.getElementById('monthEndDay').value = settings.monthEndDay || 31;
    document.getElementById('annualVacation').value = settings.annualVacation;
    document.getElementById('hourlyRate').value = settings.hourlyRate || 5;
    document.getElementById('monthlySalary').value = settings.monthlySalary || 800;
    document.getElementById('hoursPerDay').value = settings.hoursPerDay || 8;
    document.getElementById('currencyInput').value = settings.currency || 'DT';
    document.getElementById('languageSelect').value = settings.language || 'ar';
    document.getElementById('numberFormatSelect').value = settings.numberFormat || 'western';

    document.getElementById('normalMultiplier').value = settings.overtimeSettings.normalMultiplier;
    document.getElementById('nightMultiplier').value = settings.overtimeSettings.nightMultiplier;
    document.getElementById('restDayMultiplier').value = settings.overtimeSettings.restDayMultiplier;
    document.getElementById('holidayMultiplier').value = settings.overtimeSettings.holidayMultiplier;

    document.getElementById('normalStartHour').value = settings.workHours.normalStartHour;
    document.getElementById('normalEndHour').value = settings.workHours.normalEndHour;
    document.getElementById('nightStartHour').value = settings.workHours.nightStartHour;
    document.getElementById('nightEndHour').value = settings.workHours.nightEndHour;

    // قراءة الإعدادات الجديدة
    document.getElementById('numShiftsSelect').value = settings.numShifts || 3;
    document.getElementById('shiftStartHour').value = settings.shiftStartHour !== undefined ? settings.shiftStartHour : 8;

    // قراءة إعداد API والأتمتة
    const apiToggle = document.getElementById('apiEnabledToggle');
    if (apiToggle) apiToggle.checked = !!settings.apiEnabled;

    renderHolidaysList();
    buildWeeklyRestTable();
    updatePremiumStatus();
    updateShiftBonusesUI();

    const savedTheme = localStorage.getItem(THEME_KEY);
    updateThemeUI(savedTheme === 'dark' ? 'dark' : 'light');

    setupAutoSave();
}

function updateShiftBonusesUI() {
    const container = document.getElementById('shiftBonusesContainer');
    if (!container) return;
    const numShifts = settings.numShifts || 3;
    const isAr = settings.language === 'ar';
    const ranges = getShiftTimeRanges();

    let html = '<div style="margin-top: 10px; font-size: 12px; font-weight: 600; color: var(--gray);">' +
        (isAr ? '⏱️ أوقات الحصص ومكافآتها:' : '⏱️ Horaires et primes des postes:') +
        '</div>';

    for (let i = 1; i <= numShifts; i++) {
        const range = ranges.find(r => r.shift === i);
        const timeLabel = range ? getShiftTimeLabel(i) : '';
        html += `
            <div class="setting-row" style="margin-top: 4px; align-items: center;">
                <div class="setting-label" style="font-size: 12px;">
                    ${isAr ? `حصة ${i}` : `Poste ${i}`}
                    <span class="shift-time-label">${timeLabel}</span>
                </div>
        `;
        if (i === 1) {
            html += `<div style="font-size: 11px; color: var(--gray); font-style: italic;">${isAr ? 'بدون مكافأة' : 'Sans prime'}</div>`;
        } else {
            const val = settings.shiftBonuses && settings.shiftBonuses[i] ? settings.shiftBonuses[i] : 0;
            html += `<input type="number" class="setting-input shift-bonus-input" data-shift="${i}" value="${val}" min="0" step="5" style="padding: 6px 10px; font-size: 13px; width: auto;">`;
        }
        html += `</div>`;
    }

    if (numShifts <= 1) {
        html += `<div style="font-size: 11px; color: var(--gray); margin-top: 6px; font-style: italic;">` +
            (isAr ? '💡 في وضع الحصة الواحدة، يعمل التطبيق بالتوقيت الإداري الاعتيادي المحدد في إعدادات "الساعات الإضافية".' :
                '💡 En mode poste unique, l\'application utilise l\'horaire administratif normal défini dans les paramètres des heures supplémentaires.') +
            `</div>`;
    }

    container.innerHTML = html;

    container.querySelectorAll('.shift-bonus-input').forEach(input => {
        input.addEventListener('change', function() {
            const shift = parseInt(this.dataset.shift);
            const val = parseFloat(this.value) || 0;
            if (!settings.shiftBonuses) settings.shiftBonuses = {};
            settings.shiftBonuses[shift] = val;
            saveData();
            updateHeader();
        });
    });

    // تعطيل حقل "وقت بداية الحصة الأولى" في وضع الحصة الواحدة لأنه غير مستخدم فيه
    const shiftStartInput = document.getElementById('shiftStartHour');
    if (shiftStartInput) {
        shiftStartInput.disabled = (numShifts <= 1);
    }
}

// ===== استجابة فورية لتغيير عدد الحصص / وقت بداية الحصة الأولى =====

function onNumShiftsChange() {
    const select = document.getElementById('numShiftsSelect');
    if (!select) return;
    const val = parseInt(select.value) || 3;
    settings.numShifts = val;
    saveData();
    updateShiftBonusesUI();
    renderCurrentWeek();
    updateHeader();
    if (document.getElementById('reports-section').classList.contains('active')) {
        updateReport();
    }
}

function onShiftStartHourChange() {
    const input = document.getElementById('shiftStartHour');
    if (!input) return;
    const val = parseInt(input.value);
    if (!isNaN(val) && val >= 0 && val <= 23) {
        settings.shiftStartHour = val;
        saveData();
        updateShiftBonusesUI();
        renderCurrentWeek();
    }
}

// ===== الحفظ التلقائي للإعدادات =====

function setupAutoSave() {
    const settingsSection = document.getElementById('settings-section');
    if (!settingsSection) return;

    const inputs = settingsSection.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.closest('#overtimeSettingsModal')) return;
        if (input.closest('#addHolidayModal')) return;
        if (input.closest('#dayModal')) return;

        input.removeEventListener('change', handleAutoSave);
        input.removeEventListener('input', handleAutoSave);

        input.addEventListener('change', handleAutoSave);
        if (input.type === 'text' || input.type === 'number') {
            input.addEventListener('input', handleAutoSave);
        }
    });
}

function handleAutoSave(event) {
    if (event.target.id === 'languageSelect' || event.target.id === 'numberFormatSelect') {
        return;
    }
    saveSettings();
}

function saveSettings() {
    const monthStart = parseInt(document.getElementById('monthStartDay').value);
    const monthEnd = parseInt(document.getElementById('monthEndDay').value);

    if (monthStart < 1 || monthStart > 31 || monthEnd < 1 || monthEnd > 31) {
        return;
    }

    settings.monthStartDay = monthStart;
    settings.monthEndDay = monthEnd;
    settings.annualVacation = parseInt(document.getElementById('annualVacation').value) || 0;
    settings.hourlyRate = parseFloat(document.getElementById('hourlyRate').value) || 0;
    settings.monthlySalary = parseFloat(document.getElementById('monthlySalary').value) || 0;
    settings.hoursPerDay = parseInt(document.getElementById('hoursPerDay').value) || 8;
    settings.currency = document.getElementById('currencyInput').value.trim() || 'DT';

    settings.overtimeSettings.normalMultiplier = parseFloat(document.getElementById('normalMultiplier').value) || 1.25;
    settings.overtimeSettings.nightMultiplier = parseFloat(document.getElementById('nightMultiplier').value) || 1.50;
    settings.overtimeSettings.restDayMultiplier = parseFloat(document.getElementById('restDayMultiplier').value) || 1.75;
    settings.overtimeSettings.holidayMultiplier = parseFloat(document.getElementById('holidayMultiplier').value) || 2.00;

    settings.workHours.normalStartHour = parseInt(document.getElementById('normalStartHour').value) || 8;
    settings.workHours.normalEndHour = parseInt(document.getElementById('normalEndHour').value) || 17;
    settings.workHours.nightStartHour = parseInt(document.getElementById('nightStartHour').value) || 22;
    settings.workHours.nightEndHour = parseInt(document.getElementById('nightEndHour').value) || 5;

    // حفظ الإعدادات الجديدة
    settings.numShifts = parseInt(document.getElementById('numShiftsSelect').value) || 3;
    const shiftStart = parseInt(document.getElementById('shiftStartHour').value);
    if (!isNaN(shiftStart) && shiftStart >= 0 && shiftStart <= 23) {
        settings.shiftStartHour = shiftStart;
    }

    // إعادة توليد أزرار الواجهة الرئيسية وقائمة أوقات/مكافآت الحصص
    renderCurrentWeek();
    updateShiftBonusesUI();

    saveData();
    updateHeader();

    if (document.getElementById('reports-section').classList.contains('active')) {
        updateReport();
    }

    if (typeof PointageAPI !== 'undefined' && PointageAPI.isEnabled()) {
        PointageAPI._emit('settingsChanged', JSON.parse(JSON.stringify(settings)));
    }
}

// ===== API والأتمتة (WebView / تكامل مع تطبيقات أخرى) =====
function onApiEnabledChange() {
    const checkbox = document.getElementById('apiEnabledToggle');
    if (!checkbox) return;
    settings.apiEnabled = checkbox.checked;
    saveData();
    showToast(settings.language === 'ar' ?
        (settings.apiEnabled ? '✅ تم تفعيل PointageAPI' : '🔒 تم تعطيل PointageAPI') :
        (settings.apiEnabled ? '✅ PointageAPI activée' : '🔒 PointageAPI désactivée'),
        2000);
}

function showApiDocumentation() {
    const isAr = settings.language === 'ar';
    const methods = [
        'getAppInfo()', 'getSettings()',
        'getStats(startDate, endDate)', 'getMonthStats(year, month)', 'getYearStats(year)',
        'getDay(date)', 'getDaysInRange(startDate, endDate)', 'setDay(date, type, shift)', 'deleteDay(date)',
        'getNotes(startDate, endDate)', 'getNote(date)', 'setNote(date, text)',
        'exportReportPDF(startDate, endDate)', 'exportVacationPDF(startDate, endDate)', 'exportNotesPDF(startDate, endDate)',
        'on(eventName, callback)  — dayChanged / noteChanged / settingsChanged'
    ];
    const intro = isAr ?
        'الدوال المتاحة عبر window.PointageAPI (بعد تفعيل الخيار أعلاه):\nصيغة التاريخ: YYYY-MM-DD\n\n' :
        'Méthodes disponibles via window.PointageAPI (après activation ci-dessus) :\nFormat de date : YYYY-MM-DD\n\n';
    alert(intro + methods.join('\n'));
}

function openOvertimeSettings() {
    document.getElementById('overtimeSettingsModal').classList.add('show');
}

function closeOvertimeSettings() {
    document.getElementById('overtimeSettingsModal').classList.remove('show');
}

// ===== أيام الراحة الأسبوعية (جدول شهري) =====

function buildWeeklyRestTable() {
    const container = document.getElementById('weeklyRestTableContainer');
    if (!container) return;

    const days = [0,1,2,3,4,5,6];
    const months = [0,1,2,3,4,5,6,7,8,9,10,11];

    let html = '<table class="weekly-rest-table">';
    html += '<thead><tr><th>' + t('day') + '</th>';
    for (let m of months) {
        html += `<th>${getMonthName(m).substring(0,3)}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let d of days) {
        html += `<tr><td class="day-label">${getDayName(d)}</td>`;
        for (let m of months) {
            const checked = (settings.weeklyRestDays && settings.weeklyRestDays[d] && settings.weeklyRestDays[d].includes(m)) ? 'checked' : '';
            html += `<td><input type="checkbox" class="weekly-rest-check" data-day="${d}" data-month="${m}" ${checked} onchange="saveWeeklyRestSettings()"></td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

function saveWeeklyRestSettings() {
    const checkboxes = document.querySelectorAll('.weekly-rest-check');
    const newRestDays = {};

    checkboxes.forEach(cb => {
        const day = parseInt(cb.dataset.day);
        const month = parseInt(cb.dataset.month);
        if (!newRestDays[day]) newRestDays[day] = [];
        if (cb.checked) {
            newRestDays[day].push(month);
        }
    });

    for (let day in newRestDays) {
        newRestDays[day].sort((a,b) => a - b);
    }

    settings.weeklyRestDays = newRestDays;
    saveData();

    updateHeader();
    renderCurrentWeek();
    renderCalendar();
    if (document.getElementById('reports-section').classList.contains('active')) {
        updateReport();
    }
}

function updateWeeklyRestTable() {
    buildWeeklyRestTable();
}


console.log('settings-module.js loaded successfully');
