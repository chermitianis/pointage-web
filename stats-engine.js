// ===================================================================
// stats-engine.js — محرك حساب الإحصائيات: حساب أيام العمل، الإجازات، الغياب، الساعات الإضافية والمكافآت لأي فترة زمنية.
// جزء من تطبيق Pointage — يعتمد على data.js (يجب تحميله قبل هذا الملف)
// ===================================================================

function calculatePeriodStats(start, end, untilToday = false) {
    let workDays = 0, vacationDays = 0, absenceDays = 0, holidayDays = 0;
    let overtimeHours = 0;
    let shiftBonusesTotal = 0;
    let overtimeBonuses = {
        normal: 0,
        night: 0,
        restDay: 0,
        holiday: 0,
        total: 0
    };
    let overtimeHoursByType = {
        normal: 0,
        night: 0,
        restDay: 0,
        holiday: 0
    };

    const curr = new Date(start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const effectiveEnd = untilToday ? (end < today ? end : today) : end;

    while (curr <= effectiveEnd) {
        const data = getDayData(curr);

        if (data.type === 'shift') {
            workDays++;
            if (data.shift > 1 && settings.shiftBonuses && settings.shiftBonuses[data.shift]) {
                const dailyBonus = settings.shiftBonuses[data.shift] / 5;
                shiftBonusesTotal += dailyBonus;
            }
        } else if (data.type === 'vacation') {
            vacationDays++;
        } else if (data.type === 'absence') {
            absenceDays++;
        } else if (data.type === 'holiday') {
            holidayDays++;
        }

        if (data.overtimeHours && data.overtimeHours > 0) {
            const hours = data.overtimeHours;
            overtimeHours += hours;

            const multiplier = calculateOvertimeMultiplier(curr, data);
            const hourlyBonus = hours * settings.hourlyRate * multiplier;

            if (data.type === 'holiday') {
                overtimeBonuses.holiday += hourlyBonus;
                overtimeHoursByType.holiday += hours;
            } else if (data.type === 'rest') {
                overtimeBonuses.restDay += hourlyBonus;
                overtimeHoursByType.restDay += hours;
            } else if (data.isNight) {
                overtimeBonuses.night += hourlyBonus;
                overtimeHoursByType.night += hours;
            } else {
                overtimeBonuses.normal += hourlyBonus;
                overtimeHoursByType.normal += hours;
            }

            overtimeBonuses.total += hourlyBonus;
        }

        curr.setDate(curr.getDate() + 1);
    }

    shiftBonusesTotal = Math.round(shiftBonusesTotal);
    overtimeBonuses.normal = Math.round(overtimeBonuses.normal);
    overtimeBonuses.night = Math.round(overtimeBonuses.night);
    overtimeBonuses.restDay = Math.round(overtimeBonuses.restDay);
    overtimeBonuses.holiday = Math.round(overtimeBonuses.holiday);
    overtimeBonuses.total = Math.round(overtimeBonuses.total);

    return {
        workDays,
        vacationDays,
        absenceDays,
        holidayDays,
        overtimeHours,
        overtimeHoursByType,
        shiftBonusesTotal: shiftBonusesTotal,
        overtimeBonuses,
        totalBonus: Math.round(shiftBonusesTotal + overtimeBonuses.total)
    };
}

function calculateYearlyStats(year) {
    return calculatePeriodStats(new Date(year, 0, 1), new Date(year, 11, 31), true);
}

function formatHoursDisplay(hours) {
    if (!hours || hours === 0) return '';
    return settings.language === 'ar' ? `${formatNumber(hours)}س` : `${formatNumber(hours)}h`;
}


console.log('stats-engine.js loaded successfully');
