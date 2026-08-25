// ===================================================================
// dashboard.js — منطق تبويب "الرئيسية" (Accueil): عرض الأسبوع الحالي، تحديد نوع الحصة/اليوم، ونافذة تعديل اليوم.
// جزء من تطبيق Pointage — يعتمد على data.js (يجب تحميله قبل هذا الملف)
// ===================================================================

function renderCurrentWeek() {
    const today = new Date();
    const weekStart = getWeekStart(today);
    const days = getWeekDays(weekStart);
    const grid = document.getElementById('currentWeekGrid');
    grid.innerHTML = '';

    // تحديد عدد الأزرار التي تظهر حسب عدد الحصص
    const numShifts = settings.numShifts || 3;
    const shiftButtonsContainer = document.querySelector('.week-actions');
    if (shiftButtonsContainer) {
        // إخفاء جميع الأزرار أولاً
        shiftButtonsContainer.querySelectorAll('.shift-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        // إظهار الأزرار حسب العدد المحدد، مع عرض وقت كل حصة محسوباً تلقائياً
        for (let i = 1; i <= numShifts; i++) {
            const btn = shiftButtonsContainer.querySelector(`.btn-shift-${i}`);
            if (btn) {
                btn.style.display = 'block';
                const baseLabel = settings.language === 'ar' ? `حصة ${i}` : `Poste ${i}`;
                const timeLabel = getShiftTimeLabel(i);
                btn.innerHTML = timeLabel ?
                    `${baseLabel}<br><span style="font-size:10px; opacity:0.85;">${timeLabel}</span>` :
                    baseLabel;
            }
        }
    }

    days.forEach(day => {
        const data = getDayData(day);
        const cell = document.createElement('div');
        cell.className = 'day-cell';

        if (data.type === 'shift') {
            cell.classList.add(`shift-${data.shift}`);
        } else {
            cell.classList.add(data.type);
        }

        if (formatDate(day) === formatDate(today)) {
            cell.classList.add('today');
        }

        const dayContainer = document.createElement('div');
        dayContainer.className = 'day-container';

        cell.innerHTML = `
            <div class="day-name">${getDayNameShort(day.getDay())}</div>
            <div class="day-number">${formatNumber(day.getDate())}</div>
        `;

        dayContainer.appendChild(cell);

        if (data.overtimeHours && data.overtimeHours > 0) {
            const hoursBadge = document.createElement('div');
            hoursBadge.className = 'overtime-badge';
            hoursBadge.textContent = formatHoursDisplay(data.overtimeHours);
            dayContainer.appendChild(hoursBadge);
        }

        dayContainer.onclick = () => openDayModal(day);
        grid.appendChild(dayContainer);
    });
}

function setWeekShift(shift) {
    const today = new Date();
    const weekStart = getWeekStart(today);
    const days = getWeekDays(weekStart);

    days.forEach(day => {
        const dow = day.getDay();
        const month = day.getMonth();
        const existing = workData[formatDate(day)] || {};
        const overtimeHours = existing.overtimeHours || 0;

        const isWeeklyRest = settings.weeklyRestDays &&
                            settings.weeklyRestDays[dow] &&
                            settings.weeklyRestDays[dow].includes(month);

        if (isWeeklyRest || dow === 0) {
            setDayData(day, { type: 'rest', overtimeHours });
        } else if (dow === 6) {
            setDayData(day, shift === 1 ? { type: 'shift', shift: 1, overtimeHours } : { type: 'rest', overtimeHours });
        } else {
            setDayData(day, { type: 'shift', shift, overtimeHours });
        }
    });

    updateHeader();
    renderCurrentWeek();
    if (document.getElementById('calendar-section').classList.contains('active')) {
        renderCalendar();
    }

    if (typeof trackFeature !== 'undefined') {
        trackFeature('set_week_shift_' + shift);
    }
}

function openDayModal(date) {
    selectedDate = date;
    const dayName = getDayName(date.getDay());
    const monthName = getMonthName(date.getMonth());
    document.getElementById('modalTitle').textContent = `${dayName} ${formatNumber(date.getDate())} ${monthName}`;
    document.getElementById('applyToWeek').checked = false;

    // ===== توليد أزرار الحصص ديناميكياً =====
    const modalButtonsDiv = document.querySelector('.modal-buttons');
    if (modalButtonsDiv) {
        const oldDynamic = modalButtonsDiv.querySelector('.shift-buttons-dynamic');
        if (oldDynamic) oldDynamic.remove();

        const shiftContainer = document.createElement('div');
        shiftContainer.className = 'shift-buttons-dynamic';
        shiftContainer.style.display = 'grid';
        const numShifts = Math.min(settings.numShifts || 3, 4);
        shiftContainer.style.gridTemplateColumns = `repeat(${numShifts}, 1fr)`;
        shiftContainer.style.gap = '8px';
        shiftContainer.style.marginBottom = '10px';

        for (let i = 1; i <= numShifts; i++) {
            const btn = document.createElement('button');
            btn.className = `modal-btn shift-${i}`;
            const baseLabel = settings.language === 'ar' ? `حصة ${i}` : `Poste ${i}`;
            const timeLabel = getShiftTimeLabel(i);
            btn.innerHTML = timeLabel ?
                `${baseLabel}<br><span style="font-size:10px; opacity:0.85;">${timeLabel}</span>` :
                baseLabel;
            btn.onclick = (function(shift) {
                return function() { setDayType('shift', shift); };
            })(i);
            shiftContainer.appendChild(btn);
        }

        modalButtonsDiv.prepend(shiftContainer);
    }

    const data = getDayData(date);
    const overtimeValue = data.overtimeHours || '';
    document.getElementById('overtimeHoursInput').value = overtimeValue;
    document.getElementById('overtimeHoursInput').placeholder = '0';
    document.getElementById('isNightOvertime').checked = !!data.isNight;

    let saveBtn = document.getElementById('saveOvertimeBtn');
    if (!saveBtn) {
        const hoursDiv = document.querySelector('.hours-input');
        saveBtn = document.createElement('button');
        saveBtn.id = 'saveOvertimeBtn';
        saveBtn.className = 'modal-btn';
        saveBtn.style.background = 'linear-gradient(135deg, #9C27B0, #7B1FA2)';
        saveBtn.onclick = saveOvertimeHours;
        saveBtn.style.marginTop = '8px';
        saveBtn.style.width = '100%';
        hoursDiv.appendChild(saveBtn);
    }
    saveBtn.textContent = settings.language === 'ar' ? '💾 حفظ الساعات الإضافية' : '💾 Enregistrer les heures sup';

    document.getElementById('dayModal').classList.add('show');
}

function closeModal() {
    document.getElementById('dayModal').classList.remove('show');
    selectedDate = null;
}

function saveOvertimeHours() {
    if (!selectedDate) return;

    const overtimeHoursInput = document.getElementById('overtimeHoursInput');
    const overtimeValue = overtimeHoursInput.value.trim();
    const overtimeHours = overtimeValue === '' ? 0 : parseFloat(overtimeValue) || 0;
    const apply = document.getElementById('applyToWeek').checked;
    const isNight = document.getElementById('isNightOvertime').checked;

    if (overtimeHours < 0 || overtimeHours > 24) {
        alert(settings.language === 'ar' ? 'الرجاء إدخال عدد ساعات صحيح بين 0 و 24' : 'Veuillez saisir un nombre d\'heures valide entre 0 et 24');
        return;
    }

    if (apply) {
        const weekStart = getWeekStart(selectedDate);
        const days = getWeekDays(weekStart);
        days.forEach(day => {
            const currentData = getDayData(day);
            setDayData(day, { ...currentData, overtimeHours, isNight });
        });
        showToast(settings.language === 'ar' ? 'تم حفظ الساعات الإضافية للأسبوع كامل' : 'Heures supplémentaires enregistrées pour toute la semaine', 2000);
    } else {
        const currentData = getDayData(selectedDate);
        setDayData(selectedDate, { ...currentData, overtimeHours, isNight });
        showToast(settings.language === 'ar' ? 'تم حفظ الساعات الإضافية' : 'Heures supplémentaires enregistrées', 2000);
    }

    overtimeHoursInput.value = '';
    overtimeHoursInput.placeholder = '0';

    updateHeader();
    renderCurrentWeek();
    if (document.getElementById('calendar-section').classList.contains('active')) {
        renderCalendar();
    }

    if (typeof PointageAPI !== 'undefined' && PointageAPI.isEnabled()) {
        PointageAPI._emit('dayChanged', { date: formatDate(selectedDate), data: JSON.parse(JSON.stringify(getDayData(selectedDate))) });
    }

    closeModal();
}

function setDayType(type, shift = null) {
    if (!selectedDate) return;

    const inputVal = document.getElementById('overtimeHoursInput').value.trim();
    const overtimeFromInput = inputVal !== '' ? (parseFloat(inputVal) || 0) : null;
    const apply = document.getElementById('applyToWeek').checked;
    const isNight = document.getElementById('isNightOvertime').checked;

    if (apply) {
        const weekStart = getWeekStart(selectedDate);
        const days = getWeekDays(weekStart);
        days.forEach(day => {
            const dow = day.getDay();
            const existingData = getDayData(day);
            const overtimeHours = overtimeFromInput !== null ? overtimeFromInput : (existingData.overtimeHours || 0);

            if (type === 'shift') {
                if (dow === 0) {
                    setDayData(day, { type: 'rest', overtimeHours, isNight });
                } else if (dow === 6) {
                    setDayData(day, shift === 1 ? { type: 'shift', shift: 1, overtimeHours, isNight } : { type: 'rest', overtimeHours, isNight });
                } else {
                    setDayData(day, { type: 'shift', shift, overtimeHours, isNight });
                }
            } else {
                setDayData(day, { type, overtimeHours, isNight });
            }
        });
        showToast(settings.language === 'ar' ? 'تم تطبيق النوع على الأسبوع كامل' : 'Type appliqué à toute la semaine', 2000);
    } else {
        const existingData = getDayData(selectedDate);
        const overtimeHours = overtimeFromInput !== null ? overtimeFromInput : (existingData.overtimeHours || 0);
        const dayData = type === 'shift' ? { type: 'shift', shift, overtimeHours, isNight } : { type, overtimeHours, isNight };
        setDayData(selectedDate, dayData);
        showToast(settings.language === 'ar' ? 'تم حفظ نوع اليوم' : 'Type de jour enregistré', 2000);
    }

    closeModal();
    updateHeader();
    renderCurrentWeek();
    if (document.getElementById('calendar-section').classList.contains('active')) {
        renderCalendar();
    }

    if (typeof PointageAPI !== 'undefined' && PointageAPI.isEnabled()) {
        PointageAPI._emit('dayChanged', { date: formatDate(selectedDate), data: JSON.parse(JSON.stringify(getDayData(selectedDate))) });
    }
}


console.log('dashboard.js loaded successfully');
