// ===================================================================
// holidays-module.js — إدارة العطل الرسمية: عرض/إضافة/تعديل/حذف العطل، ومعلومات عن الأعياد الدينية.
// جزء من تطبيق Pointage — يعتمد على data.js (يجب تحميله قبل هذا الملف)
// ===================================================================

function renderHolidaysList() {
    const list = document.getElementById('holidaysList');
    list.innerHTML = '';

    if (settings.holidays.length === 0) {
        list.innerHTML = `<div style="text-align:center;color:#999;padding:15px;font-size:11px;">${t('noHolidays')}</div>`;
        return;
    }

    settings.holidays.forEach((h, i) => {
        const hd = parseDate(h.date);
        const item = document.createElement('div');
        item.className = 'holiday-item';
        const holidayName = settings.language === 'ar' ? (h.name_ar || h.name) : (h.name_fr || h.name);
        const holidayType = h.type === 'religious' ?
            (settings.language === 'ar' ? ' (ديني)' : ' (religieux)') :
            (settings.language === 'ar' ? ' (وطني)' : ' (national)');

        item.innerHTML = `
            <div class="holiday-info">
                <div class="holiday-name">${holidayName}${holidayType}</div>
                <div class="holiday-date">${formatNumber(hd.getDate())} ${getMonthName(hd.getMonth())}${h.recurring ? ` (${settings.language === 'ar' ? 'متكرر' : 'récurrent'})` : ''}</div>
            </div>
            <button class="holiday-edit" onclick="editHoliday(${i})">${t('editHoliday')}</button>
            <button class="holiday-delete" onclick="deleteHoliday(${i})">${t('delete')}</button>
        `;
        list.appendChild(item);
    });
}

function editHoliday(i) {
    editingHolidayIndex = i;
    const h = settings.holidays[i];

    document.getElementById('holidayNameAr').value = h.name_ar || h.name || '';
    document.getElementById('holidayNameFr').value = h.name_fr || '';
    document.getElementById('holidayDate').value = h.date;
    document.getElementById('holidayRecurring').checked = h.recurring || false;

    document.getElementById('addHolidayModal').classList.add('show');
}

function showAddHolidayModal() {
    editingHolidayIndex = null;
    document.getElementById('holidayNameAr').value = '';
    document.getElementById('holidayNameFr').value = '';
    document.getElementById('holidayDate').value = '';
    document.getElementById('holidayRecurring').checked = false;

    document.getElementById('addHolidayModal').classList.add('show');
}

function closeAddHolidayModal() {
    document.getElementById('addHolidayModal').classList.remove('show');
}

function addHoliday() {
    const name_ar = document.getElementById('holidayNameAr').value.trim();
    const name_fr = document.getElementById('holidayNameFr').value.trim();
    const date = document.getElementById('holidayDate').value;
    const recurring = document.getElementById('holidayRecurring').checked;

    if ((!name_ar && !name_fr) || !date) {
        alert(t('fillAllFields'));
        return;
    }

    const holidayData = {
        name_ar: name_ar || name_fr,
        name_fr: name_fr || name_ar,
        date,
        recurring,
        type: 'national'
    };

    if (editingHolidayIndex !== null) {
        settings.holidays[editingHolidayIndex] = holidayData;
        showToast(settings.language === 'ar' ? 'تم تعديل العطلة' : 'Jour férié modifié', 2000);
    } else {
        settings.holidays.push(holidayData);
        showToast(settings.language === 'ar' ? 'تم إضافة العطلة' : 'Jour férié ajouté', 2000);
    }

    saveData();
    renderHolidaysList();
    closeAddHolidayModal();

    if (document.getElementById('dashboard-section').classList.contains('active')) {
        renderCurrentWeek();
    }
    if (document.getElementById('calendar-section').classList.contains('active')) {
        renderCalendar();
    }
}

function deleteHoliday(i) {
    if (confirm(t('confirmDelete'))) {
        settings.holidays.splice(i, 1);
        saveData();
        renderHolidaysList();
        showToast(settings.language === 'ar' ? 'تم حذف العطلة' : 'Jour férié supprimé', 2000);
    }
}

function showReligiousHolidaysInfo() {
    const currentYear = new Date().getFullYear();
    const message = settings.language === 'ar'
        ? `الأعياد الدينية لعام ${formatNumber(currentYear)} تحتاج تحديث يدوي لأنها تعتمد على التقويم الهجري.\n\nيمكنك البحث عن:\n- عيد الفطر\n- عيد الأضحى\n- رأس السنة الهجرية\n- المولد النبوي\n\nثم إضافتها يدوياً من خلال زر "إضافة عطلة".`
        : `Les fêtes religieuses pour ${formatNumber(currentYear)} nécessitent une mise à jour manuelle car elles dépendent du calendrier hégirien.\n\nVous pouvez rechercher:\n- Aïd El Fitr\n- Aïd El Adha\n- Nouvel An Hégirien\n- Mawlid Ennabaoui\n\nPuis les ajouter manuellement via le bouton "Ajouter".`;

    alert(message);
}


console.log('holidays-module.js loaded successfully');
