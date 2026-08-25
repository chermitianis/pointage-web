// ===================================================================
// calendar-module.js — منطق تبويب "التقويم" (Calendrier): عرض شهري كامل والتنقل بين الأشهر.
// جزء من تطبيق Pointage — يعتمد على data.js (يجب تحميله قبل هذا الملف)
// ===================================================================

function initializeCalendar() {
    currentCalendarMonth = new Date();
    renderCalendar();
}

function renderCalendar() {
    const month = currentCalendarMonth.getMonth();
    const year = currentCalendarMonth.getFullYear();
    document.getElementById('monthTitle').textContent = `${getMonthName(month)} ${formatNumber(year)}`;

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const dayOrder = [1, 2, 3, 4, 5, 6, 0];

    dayOrder.forEach(i => {
        const h = document.createElement('div');
        h.className = 'calendar-day calendar-header';
        h.textContent = getDayNameShort(i);
        grid.appendChild(h);
    });

    const first = new Date(year, month, 1);
    const startDay = first.getDay();

    let emptyDays = startDay - 1;
    if (startDay === 0) emptyDays = 6;

    for (let i = 0; i < emptyDays; i++) {
        const e = document.createElement('div');
        e.className = 'calendar-day';
        grid.appendChild(e);
    }

    const days = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let d = 1; d <= days; d++) {
        const date = new Date(year, month, d);
        const data = getDayData(date);

        const dayContainer = document.createElement('div');
        dayContainer.className = 'calendar-day-container';

        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        if (data.type === 'shift') {
            cell.classList.add(`shift-${data.shift}`);
        } else {
            cell.classList.add(data.type);
        }

        if (formatDate(date) === formatDate(today)) {
            cell.classList.add('today');
        }

        cell.textContent = formatNumber(d);
        dayContainer.appendChild(cell);

        if (data.overtimeHours && data.overtimeHours > 0) {
            const hoursBadge = document.createElement('div');
            hoursBadge.className = 'calendar-overtime-badge';
            hoursBadge.textContent = formatHoursDisplay(data.overtimeHours);
            dayContainer.appendChild(hoursBadge);
        }

        dayContainer.onclick = () => openDayModal(date);
        grid.appendChild(dayContainer);
    }
}

function changeMonth(delta) {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + delta);
    renderCalendar();
}


console.log('calendar-module.js loaded successfully');
