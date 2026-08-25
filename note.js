// ===== قسم المذكرات (Notes) — Module de Notes Personnelles =====
// مساحة شخصية للمستخدم لتدوين مذكراته اليومية.
// يدعم عرضاً شهرياً (تقويم) وعرضاً أسبوعياً (قائمة أيام)،
// مع المزامنة التلقائية المباشرة مع سحابة Supabase.

let notesData = {};
let notesViewMode = 'month';       // 'month' | 'week'
let notesCurrentDate = new Date(); // تاريخ مرجعي للتصفح ضمن القسم
let notesSelectedDateStr = null;   // مفتاح اليوم المفتوح حالياً في نافذة التحرير

// ===== تخزين البيانات =====
function loadNotesData() {
    try {
        const raw = localStorage.getItem('pointageNotesData');
        notesData = raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.error('خطأ في تحميل المذكرات:', e);
        notesData = {};
    }

    try {
        const savedView = localStorage.getItem('pointageNotesView');
        if (savedView === 'month' || savedView === 'week') {
            notesViewMode = savedView;
        }
    } catch (e) {
        // القيمة الافتراضية 'month' تبقى سارية
    }
}

function saveNotesData() {
    try {
        localStorage.setItem('pointageNotesData', JSON.stringify(notesData));

        // مزامنة المذكرات سحابياً عبر محرك Supabase Sync Engine
        if (window.SupabaseSyncEngine && typeof window.SupabaseSyncEngine.push === 'function') {
            window.SupabaseSyncEngine.push('user_notes_data', notesData);
        }
    } catch (e) {
        console.error('خطأ في حفظ المذكرات:', e);
    }
}

function hasNoteOn(dateStr) {
    const entry = notesData[dateStr];
    return !!(entry && entry.text && entry.text.trim().length > 0);
}

// ===== تهيئة القسم عند فتحه =====
function initializeNotes() {
    loadNotesData();
    notesCurrentDate = new Date(); // يعرض تلقائياً الشهر/الأسبوع الحالي عند كل دخول للقسم
    updateNotesViewToggleUI();
    renderNotes();
}

function updateNotesViewToggleUI() {
    const monthBtn = document.getElementById('notesViewMonthBtn');
    const weekBtn = document.getElementById('notesViewWeekBtn');
    if (!monthBtn || !weekBtn) return;
    monthBtn.classList.toggle('active', notesViewMode === 'month');
    weekBtn.classList.toggle('active', notesViewMode === 'week');
}

function switchNotesView(mode) {
    if (mode !== 'month' && mode !== 'week') return;
    notesViewMode = mode;
    try { localStorage.setItem('pointageNotesView', mode); } catch (e) {}
    updateNotesViewToggleUI();
    renderNotes();
}

function changeNotesPeriod(delta) {
    if (notesViewMode === 'week') {
        notesCurrentDate.setDate(notesCurrentDate.getDate() + (delta * 7));
    } else {
        notesCurrentDate.setMonth(notesCurrentDate.getMonth() + delta);
    }
    renderNotes();
}

function goToNotesToday() {
    notesCurrentDate = new Date();
    renderNotes();
}

function renderNotes() {
    const monthGrid = document.getElementById('notesMonthGrid');
    const weekList = document.getElementById('notesWeekList');
    if (!monthGrid || !weekList) return;

    if (notesViewMode === 'week') {
        monthGrid.style.display = 'none';
        weekList.style.display = 'flex';
        renderNotesWeek();
    } else {
        weekList.style.display = 'none';
        monthGrid.style.display = 'grid';
        renderNotesMonth();
    }
}

// ===== العرض الشهري =====
function renderNotesMonth() {
    const month = notesCurrentDate.getMonth();
    const year = notesCurrentDate.getFullYear();

    const titleEl = document.getElementById('notesPeriodTitle');
    if (titleEl && typeof getMonthName === 'function') {
        titleEl.textContent = `${getMonthName(month)} ${typeof formatNumber === 'function' ? formatNumber(year) : year}`;
    }

    const grid = document.getElementById('notesMonthGrid');
    grid.innerHTML = '';

    const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // يبدأ الأسبوع بالإثنين
    dayOrder.forEach(i => {
        const h = document.createElement('div');
        h.className = 'calendar-day calendar-header';
        h.textContent = typeof getDayNameShort === 'function' ? getDayNameShort(i) : i;
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

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = typeof formatDate === 'function' ? formatDate(today) : today.toISOString().split('T')[0];

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dateStr = typeof formatDate === 'function' ? formatDate(date) : date.toISOString().split('T')[0];
        const hasNote = hasNoteOn(dateStr);

        const container = document.createElement('div');
        container.className = 'calendar-day-container';

        const cell = document.createElement('div');
        cell.className = 'calendar-day notes-day';
        if (hasNote) cell.classList.add('has-note');
        if (dateStr === todayStr) cell.classList.add('today');
        cell.textContent = typeof formatNumber === 'function' ? formatNumber(d) : d;
        container.appendChild(cell);

        if (hasNote) {
            const dot = document.createElement('div');
            dot.className = 'notes-dot';
            container.appendChild(dot);
        }

        container.onclick = () => openNoteModal(date);
        grid.appendChild(container);
    }
}

// ===== العرض الأسبوعي =====
function renderNotesWeek() {
    if (typeof getWeekStart !== 'function' || typeof getWeekDays !== 'function') return;

    const weekStart = getWeekStart(notesCurrentDate);
    const days = getWeekDays(weekStart);
    const weekEnd = days[6];

    const titleEl = document.getElementById('notesPeriodTitle');
    if (titleEl && typeof getMonthName === 'function') {
        const startLabel = `${typeof formatNumber === 'function' ? formatNumber(weekStart.getDate()) : weekStart.getDate()} ${getMonthName(weekStart.getMonth())}`;
        const endLabel = `${typeof formatNumber === 'function' ? formatNumber(weekEnd.getDate()) : weekEnd.getDate()} ${getMonthName(weekEnd.getMonth())} ${typeof formatNumber === 'function' ? formatNumber(weekEnd.getFullYear()) : weekEnd.getFullYear()}`;
        titleEl.textContent = `${startLabel} - ${endLabel}`;
    }

    const list = document.getElementById('notesWeekList');
    list.innerHTML = '';

    const today = new Date();
    const todayStr = typeof formatDate === 'function' ? formatDate(today) : today.toISOString().split('T')[0];

    days.forEach(date => {
        const dateStr = typeof formatDate === 'function' ? formatDate(date) : date.toISOString().split('T')[0];
        const entry = notesData[dateStr];
        const noteExists = hasNoteOn(dateStr);

        const row = document.createElement('div');
        row.className = 'notes-week-row';
        if (dateStr === todayStr) row.classList.add('today');
        if (noteExists) row.classList.add('has-note');

        const dateBox = document.createElement('div');
        dateBox.className = 'notes-week-date';

        const dayNum = document.createElement('div');
        dayNum.className = 'notes-week-daynum';
        dayNum.textContent = typeof formatNumber === 'function' ? formatNumber(date.getDate()) : date.getDate();

        const dayName = document.createElement('div');
        dayName.className = 'notes-week-dayname';
        dayName.textContent = typeof getDayNameShort === 'function' ? getDayNameShort(date.getDay()) : date.getDay();

        dateBox.appendChild(dayNum);
        dateBox.appendChild(dayName);

        const preview = document.createElement('div');
        preview.className = 'notes-week-preview';
        if (noteExists) {
            preview.textContent = entry.text.length > 90 ? entry.text.slice(0, 90) + '…' : entry.text;
        } else {
            const emptyLabel = document.createElement('span');
            emptyLabel.className = 'notes-empty-label';
            emptyLabel.textContent = typeof t === 'function' ? t('notesEmptyDay') : (window.settings?.language === 'ar' ? 'لا توجد ملاحظات' : 'Aucune note');
            preview.appendChild(emptyLabel);
        }

        const arrow = document.createElement('div');
        arrow.className = 'notes-week-arrow';
        arrow.textContent = window.settings?.language === 'ar' ? '‹' : '›';

        row.appendChild(dateBox);
        row.appendChild(preview);
        row.appendChild(arrow);

        row.onclick = () => openNoteModal(date);
        list.appendChild(row);
    });
}

// ===== نافذة تحرير المذكرة =====
function openNoteModal(date) {
    notesSelectedDateStr = typeof formatDate === 'function' ? formatDate(date) : date.toISOString().split('T')[0];
    const entry = notesData[notesSelectedDateStr];

    const titleEl = document.getElementById('noteModalTitle');
    if (titleEl && typeof getDayName === 'function' && typeof getMonthName === 'function') {
        const dayName = getDayName(date.getDay());
        const monthName = getMonthName(date.getMonth());
        const dayNum = typeof formatNumber === 'function' ? formatNumber(date.getDate()) : date.getDate();
        const yearNum = typeof formatNumber === 'function' ? formatNumber(date.getFullYear()) : date.getFullYear();
        titleEl.textContent = `${dayName} ${dayNum} ${monthName} ${yearNum}`;
    }

    const textarea = document.getElementById('noteTextarea');
    if (textarea) {
        textarea.value = (entry && entry.text) ? entry.text : '';
    }
    updateNoteCharCount();

    const deleteBtn = document.getElementById('noteDeleteBtn');
    if (deleteBtn) deleteBtn.style.display = (entry && entry.text) ? 'block' : 'none';

    const updatedInfo = document.getElementById('noteUpdatedInfo');
    if (updatedInfo) {
        if (entry && entry.updatedAt) {
            const d = new Date(entry.updatedAt);
            const timeStr = typeof formatLocalizedDateTime === 'function' ? formatLocalizedDateTime(d) : d.toLocaleString();
            const labelStr = typeof t === 'function' ? t('notesLastEdited') : (window.settings?.language === 'ar' ? 'آخر تعديل:' : 'Dernière modification :');
            updatedInfo.textContent = `${labelStr} ${timeStr}`;
            updatedInfo.style.display = 'inline';
        } else {
            updatedInfo.style.display = 'none';
        }
    }

    const modal = document.getElementById('noteModal');
    if (modal) {
        modal.classList.add('show');
        if (textarea) setTimeout(() => textarea.focus(), 200);
    }
}

function closeNoteModal() {
    const modal = document.getElementById('noteModal');
    if (modal) modal.classList.remove('show');
    notesSelectedDateStr = null;
}

function updateNoteCharCount() {
    const textarea = document.getElementById('noteTextarea');
    const counter = document.getElementById('noteCharCount');
    if (textarea && counter) {
        counter.textContent = typeof formatNumber === 'function' ? formatNumber(textarea.value.length) : textarea.value.length;
    }
}

function saveNote() {
    if (!notesSelectedDateStr) return;
    const textarea = document.getElementById('noteTextarea');
    if (!textarea) return;

    const text = textarea.value.trim();

    if (text) {
        notesData[notesSelectedDateStr] = {
            text: text,
            updatedAt: new Date().toISOString()
        };

        if (typeof trackFeatureUsed === 'function') {
            trackFeatureUsed('add_note', { date: notesSelectedDateStr });
        }
    } else {
        delete notesData[notesSelectedDateStr];
    }

    saveNotesData();
    closeNoteModal();
    renderNotes();

    if (typeof PointageAPI !== 'undefined' && PointageAPI.isEnabled()) {
        PointageAPI._emit('noteChanged', { date: notesSelectedDateStr, text: text || null });
    }

    const msg = typeof t === 'function' ? t('notesSaved') : (window.settings?.language === 'ar' ? 'تم حفظ الملاحظة' : 'Note enregistrée');
    if (typeof showToast === 'function') showToast(msg, 1500);
}

async function deleteNote() {
    if (!notesSelectedDateStr) return;

    const confirmMsg = typeof t === 'function' ? t('notesDeleteConfirm') : (window.settings?.language === 'ar' ? 'هل أنت تأكد من حذف الملاحظة؟' : 'Voulez-vous supprimer cette note ?');

    let confirmed = false;
    if (typeof showConfirmDialog === 'function') {
        confirmed = await showConfirmDialog(confirmMsg);
    } else {
        confirmed = confirm(confirmMsg);
    }

    if (!confirmed) return;

    delete notesData[notesSelectedDateStr];
    saveNotesData();
    closeNoteModal();
    renderNotes();

    if (typeof PointageAPI !== 'undefined' && PointageAPI.isEnabled()) {
        PointageAPI._emit('noteChanged', { date: notesSelectedDateStr, text: null });
    }

    const msg = typeof t === 'function' ? t('notesDeleted') : (window.settings?.language === 'ar' ? 'تم حذف الملاحظة' : 'Note supprimée');
    if (typeof showToast === 'function') showToast(msg, 1500);
}