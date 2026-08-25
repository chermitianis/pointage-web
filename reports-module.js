// ===================================================================
// reports-module.js — منطق تبويب "التقارير" (Rapports): تهيئة وعرض إحصائيات الفترة المختارة.
// جزء من تطبيق Pointage — يعتمد على data.js (يجب تحميله قبل هذا الملف)
// ===================================================================

function initializeReports() {
    const sel = document.getElementById('reportYear');
    const curr = new Date().getFullYear();
    sel.innerHTML = '';

    for (let y = 2020; y <= 2100; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = formatNumber(y);
        if (y === curr) opt.selected = true;
        sel.appendChild(opt);
    }

    const monthSel = document.getElementById('reportMonth');
    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    monthSel.innerHTML = '';
    monthKeys.forEach((key, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = t(key);
        monthSel.appendChild(opt);
    });

    monthSel.value = new Date().getMonth();
    updateReport();
}

function updateReport() {
    const year = parseInt(document.getElementById('reportYear').value);
    const month = parseInt(document.getElementById('reportMonth').value);
    const date = new Date(year, month, 15);
    const period = getMonthPeriod(date);

    document.getElementById('reportPeriod').textContent =
        `${formatNumber(period.startDate.getDate())} ${getMonthName(period.startDate.getMonth())} - ${formatNumber(period.endDate.getDate())} ${getMonthName(period.endDate.getMonth())}`;

    const stats = calculatePeriodStats(period.startDate, period.endDate, false);

    document.getElementById('reportWorkDays').textContent = formatNumber(stats.workDays);
    document.getElementById('reportVacationDays').textContent = formatNumber(stats.vacationDays);
    document.getElementById('reportAbsenceDays').textContent = formatNumber(stats.absenceDays);
    document.getElementById('reportHolidays').textContent = formatNumber(stats.holidayDays);
    document.getElementById('reportOvertimeHours').textContent = formatNumber(stats.overtimeHours.toFixed(1));

    const baseSalary = settings.monthlySalary || 0;
    const workingDaysBase = getExpectedWorkingDaysInPeriod(period.startDate, period.endDate) || 26;
    const dailySalary = baseSalary / workingDaysBase;
    const absenceDeduction = Math.round(stats.absenceDays * dailySalary);
    const finalSalary = baseSalary - absenceDeduction;

    const currency = settings.currency || 'DT';
    document.getElementById('reportBaseSalary').textContent = `${formatNumber(baseSalary)} ${currency}`;
    document.getElementById('reportAbsenceDeduction').textContent = `-${formatNumber(absenceDeduction)} ${currency}`;
    document.getElementById('reportSalary').textContent = `${formatNumber(finalSalary)} ${currency}`;

    // استخدام shiftBonusesTotal الفعلية (تعتمد على عدد الحصص ومكافآت كل حصة المضبوطة في الإعدادات)
    const totalShiftBonus = stats.shiftBonusesTotal || 0;
    document.getElementById('reportBonus').textContent = `${formatNumber(stats.totalBonus)} ${currency}`;
    document.getElementById('reportShiftBonus').textContent = `${formatNumber(totalShiftBonus)} ${currency}`;
    document.getElementById('reportOvertimeBonus').textContent = `${formatNumber(stats.overtimeBonuses.total)} ${currency}`;

    document.getElementById('reportOvertimeNormal').textContent = `${formatNumber(stats.overtimeBonuses.normal)} ${currency}`;
    document.getElementById('reportOvertimeNight').textContent = `${formatNumber(stats.overtimeBonuses.night)} ${currency}`;
    document.getElementById('reportOvertimeRest').textContent = `${formatNumber(stats.overtimeBonuses.restDay)} ${currency}`;
    document.getElementById('reportOvertimeHoliday').textContent = `${formatNumber(stats.overtimeBonuses.holiday)} ${currency}`;

    const nm = settings.overtimeSettings.normalMultiplier;
    const nightM = settings.overtimeSettings.nightMultiplier;
    const rm = settings.overtimeSettings.restDayMultiplier;
    const hm = settings.overtimeSettings.holidayMultiplier;
    const labelNormal  = document.getElementById('labelOvertimeNormal');
    const labelNight   = document.getElementById('labelOvertimeNight');
    const labelRest    = document.getElementById('labelOvertimeRest');
    const labelHoliday = document.getElementById('labelOvertimeHoliday');
    if (labelNormal)  labelNormal.textContent  = settings.language === 'ar' ? `ساعات عادية (×${formatNumber(nm)})` : `Heures normales (×${formatNumber(nm)})`;
    if (labelNight)   labelNight.textContent   = settings.language === 'ar' ? `ساعات ليلية (×${formatNumber(nightM)})` : `Heures nocturnes (×${formatNumber(nightM)})`;
    if (labelRest)    labelRest.textContent    = settings.language === 'ar' ? `يوم راحة (×${formatNumber(rm)})` : `Jour de repos (×${formatNumber(rm)})`;
    if (labelHoliday) labelHoliday.textContent = settings.language === 'ar' ? `أعياد رسمية (×${formatNumber(hm)})` : `Jours fériés (×${formatNumber(hm)})`;

    const yearStats = calculateYearlyStats(year);
    document.getElementById('yearlyYear').textContent = formatNumber(year);
    document.getElementById('yearlyWorkDays').textContent = formatNumber(yearStats.workDays);
    document.getElementById('yearlyVacation').textContent = formatNumber(yearStats.vacationDays);
    document.getElementById('yearlyAbsence').textContent = formatNumber(yearStats.absenceDays);
    document.getElementById('yearlyBonus').textContent = formatNumber(yearStats.totalBonus);
}


console.log('reports-module.js loaded successfully');
