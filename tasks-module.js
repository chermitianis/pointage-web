// ===================================================================
// tasks-module.js — جدول أعمالي (Tasks / Agenda)
// أول ميزة من ثلاث داخل تبويب "المذكرات": جدولة المهام اليومية مع إمكانية
// تفعيل تذكير بإشعار قبل الموعد بالمدة التي يحددها المستخدم.
// يعتمد على: data.js (formatDate/parseDate/getMonthName/showToast)،
//            notify-engine.js (generateId/computeFireTime/notifiedIds)
// ===================================================================

let tasksData = {};
let tasksFilter = 'upcoming';
let editingTaskId = null;

function loadTasksData() {
    try {
        const raw = localStorage.getItem('pointageTasksData');
        tasksData = raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.error('خطأ في تحميل جدول الأعمال:', e);
        tasksData = {};
    }
}

function saveTasksData() {
    try {
        localStorage.setItem('pointageTasksData', JSON.stringify(tasksData));
    } catch (e) {
        console.error('خطأ في حفظ جدول الأعمال:', e);
    }
}

function initializeTasks() {
    loadTasksData();
    renderTasksList();
}

function setTasksFilter(filter) {
    tasksFilter = filter;
    document.querySelectorAll('#hubPanel-tasks .filter-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.filter === filter);
    });
    renderTasksList();
}

function getFilteredTasks() {
    const todayStr = formatDate(new Date());
    let list = Object.values(tasksData);

    if (tasksFilter === 'today') {
        list = list.filter(t => t.date === todayStr && !t.done);
    } else if (tasksFilter === 'upcoming') {
        list = list.filter(t => !t.done);
    } else if (tasksFilter === 'done') {
        list = list.filter(t => t.done);
    }
    // 'all' -> بدون تصفية

    list.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    return list;
}

function renderTasksList() {
    const container = document.getElementById('tasksList');
    const empty = document.getElementById('tasksEmptyState');
    if (!container || !empty) return;

    const list = getFilteredTasks();
    if (list.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    const isAr = settings.language === 'ar';
    const todayStr = formatDate(new Date());

    container.innerHTML = list.map(task => {
        const d = parseDate(task.date);
        const isToday = task.date === todayStr;
        const overdue = !task.done && task.date < todayStr;
        const dateLabel = isToday ? (isAr ? 'اليوم' : "Aujourd'hui") : `${formatNumber(d.getDate())} ${getMonthName(d.getMonth())}`;

        return `
        <div class="hub-card ${task.done ? 'hub-card-done' : ''} ${overdue ? 'hub-card-overdue' : ''}" onclick="openTaskModal('${task.id}')">
            <div class="hub-card-check" onclick="event.stopPropagation(); toggleTaskDone('${task.id}')" title="${isAr ? 'إنجاز' : 'Terminer'}">${task.done ? '✅' : '⬜'}</div>
            <div class="hub-card-body">
                <div class="hub-card-text">${escapeHtmlForPdf(task.text)}</div>
                <div class="hub-card-meta">
                    <span class="hub-card-date">📅 ${dateLabel}</span>
                    ${task.time ? `<span class="hub-card-time">🕒 ${task.time}</span>` : ''}
                    ${task.notify ? '<span class="hub-card-badge">🔔</span>' : ''}
                    ${overdue ? `<span class="hub-card-badge hub-card-badge-overdue">${isAr ? 'متأخرة' : 'En retard'}</span>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');
}

function toggleTaskDone(id) {
    if (!tasksData[id]) return;
    tasksData[id].done = !tasksData[id].done;
    saveTasksData();
    renderTasksList();
    if (tasksData[id].done) {
        notifiedIds.add('task_' + id); // تفادي إطلاق إشعار لمهمة أُنجزت للتو
    } else {
        notifiedIds.delete('task_' + id);
    }
}

function openTaskModal(id = null) {
    editingTaskId = id;
    const titleEl = document.getElementById('taskModalTitle');
    const deleteBtn = document.getElementById('taskDeleteBtn');

    if (id && tasksData[id]) {
        const task = tasksData[id];
        titleEl.textContent = settings.language === 'ar' ? 'تعديل المهمة' : 'Modifier la tâche';
        document.getElementById('taskTextarea').value = task.text;
        document.getElementById('taskDateInput').value = task.date;
        document.getElementById('taskTimeInput').value = task.time || '';
        document.getElementById('taskNotifyToggle').checked = !!task.notify;
        document.getElementById('taskNotifyLeadSelect').value = task.leadMinutes !== undefined ? task.leadMinutes : 60;
        deleteBtn.style.display = 'block';
    } else {
        titleEl.textContent = t('taskModalTitle');
        document.getElementById('taskTextarea').value = '';
        document.getElementById('taskDateInput').value = formatDate(new Date());
        document.getElementById('taskTimeInput').value = '09:00';
        document.getElementById('taskNotifyToggle').checked = true;
        document.getElementById('taskNotifyLeadSelect').value = '60';
        deleteBtn.style.display = 'none';
    }

    onTaskNotifyToggleChange();
    document.getElementById('taskModal').classList.add('show');
    setTimeout(() => document.getElementById('taskTextarea').focus(), 200);
}

function onTaskNotifyToggleChange() {
    const enabled = document.getElementById('taskNotifyToggle').checked;
    document.getElementById('taskNotifyLeadRow').style.display = enabled ? 'flex' : 'none';
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('show');
    editingTaskId = null;
}

function saveTask() {
    const text = document.getElementById('taskTextarea').value.trim();
    if (!text) {
        alert(settings.language === 'ar' ? 'الرجاء كتابة نص المهمة' : 'Veuillez saisir le texte de la tâche');
        return;
    }
    const date = document.getElementById('taskDateInput').value;
    if (!date) {
        alert(settings.language === 'ar' ? 'الرجاء تحديد التاريخ' : 'Veuillez choisir une date');
        return;
    }
    const time = document.getElementById('taskTimeInput').value;
    const notify = document.getElementById('taskNotifyToggle').checked;
    const leadMinutes = parseInt(document.getElementById('taskNotifyLeadSelect').value) || 0;

    const id = editingTaskId || generateId();
    const existing = tasksData[id];

    tasksData[id] = {
        id, text, date, time, notify, leadMinutes,
        done: existing ? existing.done : false,
        createdAt: existing ? existing.createdAt : new Date().toISOString()
    };

    notifiedIds.delete('task_' + id); // إعادة تفعيل التنبيه في حال تغيّر الموعد

    saveTasksData();
    closeTaskModal();
    renderTasksList();

    if (typeof PointageAPI !== 'undefined' && PointageAPI.isEnabled()) {
        PointageAPI._emit('taskChanged', JSON.parse(JSON.stringify(tasksData[id])));
    }

    showToast(settings.language === 'ar' ? 'تم حفظ المهمة ✓' : 'Tâche enregistrée ✓', 1800);
}

function deleteTask() {
    if (!editingTaskId) return;
    if (!confirm(settings.language === 'ar' ? 'هل تريد حذف هذه المهمة؟' : 'Voulez-vous supprimer cette tâche ?')) return;

    notifiedIds.delete('task_' + editingTaskId);
    delete tasksData[editingTaskId];
    saveTasksData();
    closeTaskModal();
    renderTasksList();
    showToast(settings.language === 'ar' ? 'تم حذف المهمة' : 'Tâche supprimée', 1500);
}

console.log('tasks-module.js loaded successfully');
