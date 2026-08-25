// ===================================================================
// reminders-module.js — تذكير (Reminders)
// الميزة الثالثة داخل تبويب "المذكرات": تذكيرات لحظية بتاريخ ووقت محددين،
// مع اهتزاز واختيار نغمة (مدمجة، من الهاتف عبر الجسر الأصلي، أو ملف مخصص).
// يعتمد على: data.js، notify-engine.js (generateId/computeFireTime/playReminderSound)
// ===================================================================

let remindersData = {};
let remindersFilter = 'upcoming';
let editingReminderId = null;
let pendingCustomSoundUri = null;      // تخزين URI للملف الصوتي المخصص
let pendingDeviceRingtoneUri = null;   // تخزين URI لنغمة الهاتف

function loadRemindersData() {
    try {
        const raw = localStorage.getItem('pointageRemindersData');
        remindersData = raw ? JSON.parse(raw) : {};

        // تحويل البيانات القديمة (base64) إلى URI إذا كانت موجودة
        Object.keys(remindersData).forEach(key => {
            const r = remindersData[key];
            // إذا كان لدينا customSoundData (base64) وليس customSoundUri
            if (r.customSoundData && !r.customSoundUri) {
                // محاولة تحويل base64 إلى URI (يتم تخزينه مؤقتاً)
                try {
                    // لا يمكن تحويل base64 إلى URI بسهولة، لذا نتركها كما هي
                    // لكن نضيف customSoundUri فارغاً للإشارة إلى أن البيانات قديمة
                    r.customSoundUri = null;
                    r._legacyData = true;
                } catch (e) { console.warn('تحويل البيانات القديمة فشل', e); }
            }
        });
        saveRemindersData();
    } catch (e) {
        console.error('خطأ في تحميل التذكيرات:', e);
        remindersData = {};
    }
}

function saveRemindersData() {
    try {
        // تنظيف البيانات القديمة base64 إذا كانت كبيرة جداً
        let cleaned = false;
        Object.keys(remindersData).forEach(key => {
            const r = remindersData[key];
            // إذا كان لدينا customSoundData (base64) وحجمه كبير > 1MB، نحذفه
            if (r.customSoundData && r.customSoundData.length > 1024 * 1024) {
                delete r.customSoundData;
                r.customSoundUri = null;
                cleaned = true;
            }
        });
        if (cleaned) {
            console.log('تم تنظيف البيانات القديمة كبيرة الحجم');
        }
        localStorage.setItem('pointageRemindersData', JSON.stringify(remindersData));
    } catch (e) {
        console.error('خطأ في حفظ التذكيرات:', e);
        // محاولة حفظ بدون البيانات الكبيرة
        try {
            const cleanData = {};
            Object.keys(remindersData).forEach(key => {
                const r = remindersData[key];
                const clean = { ...r };
                if (clean.customSoundData && clean.customSoundData.length > 500 * 1024) {
                    delete clean.customSoundData;
                }
                cleanData[key] = clean;
            });
            localStorage.setItem('pointageRemindersData', JSON.stringify(cleanData));
        } catch (e2) {
            console.error('فشل حتى بعد التنظيف', e2);
        }
    }
}

function initializeReminders() {
    loadRemindersData();
    renderRemindersList();
    updateRemindersBadge();
}

function updateRemindersBadge() {
    const badge = document.getElementById('remindersDueBadge');
    if (!badge) return;
    const now = new Date();
    const dueCount = Object.values(remindersData).filter(r => !r.fired && computeFireTime(r.date, r.time, 0) && computeFireTime(r.date, r.time, 0) <= now).length;
    if (dueCount > 0) {
        badge.textContent = formatNumber(dueCount);
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

function setRemindersFilter(filter) {
    remindersFilter = filter;
    document.querySelectorAll('#hubPanel-reminders .filter-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.filter === filter);
    });
    renderRemindersList();
}

function getFilteredReminders() {
    let list = Object.values(remindersData);
    if (remindersFilter === 'upcoming') list = list.filter(r => !r.fired);
    else if (remindersFilter === 'past') list = list.filter(r => r.fired);
    // 'all' -> بدون تصفية
    list.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    return list;
}

function renderRemindersList() {
    const container = document.getElementById('remindersList');
    const empty = document.getElementById('remindersEmptyState');
    if (!container || !empty) return;

    const list = getFilteredReminders();
    if (list.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    container.innerHTML = list.map(r => {
        const d = parseDate(r.date);
        const dateLabel = `${formatNumber(d.getDate())} ${getMonthName(d.getMonth())}`;
        // عرض أيقونة النغمة المستخدمة
        let soundIcon = '🔔';
        if (r.sound === 'device') soundIcon = '📱';
        else if (r.sound === 'custom') soundIcon = '🎵';

        return `
        <div class="hub-card ${r.fired ? 'hub-card-done' : ''}" onclick="openReminderModal('${r.id}')">
            <div class="hub-card-check">${r.fired ? '🔕' : soundIcon}</div>
            <div class="hub-card-body">
                <div class="hub-card-text">${escapeHtmlForPdf(r.text)}</div>
                <div class="hub-card-meta">
                    <span class="hub-card-date">📅 ${dateLabel}</span>
                    ${r.time ? `<span class="hub-card-time">🕒 ${r.time}</span>` : ''}
                    ${r.fired ? '<span class="hub-card-badge hub-card-badge-done">✓</span>' : ''}
                </div>
            </div>
        </div>`;
    }).join('');
}

function openReminderModal(id = null) {
    editingReminderId = id;
    pendingCustomSoundUri = null;
    pendingDeviceRingtoneUri = null;

    const titleEl = document.getElementById('reminderModalTitle');
    const deleteBtn = document.getElementById('reminderDeleteBtn');
    document.getElementById('reminderCustomFileRow').style.display = 'none';

    if (id && remindersData[id]) {
        const r = remindersData[id];
        titleEl.textContent = settings.language === 'ar' ? 'تعديل التذكير' : 'Modifier le rappel';
        document.getElementById('reminderTextarea').value = r.text;
        document.getElementById('reminderDateInput').value = r.date;
        document.getElementById('reminderTimeInput').value = r.time || '';
        document.getElementById('reminderVibrateToggle').checked = !!r.vibrate;
        document.getElementById('reminderSoundSelect').value = r.sound || 'tone1';
        pendingCustomSoundUri = r.customSoundUri || null;
        pendingDeviceRingtoneUri = r.deviceRingtoneUri || null;
        deleteBtn.style.display = 'block';

        // عرض اسم الملف أو النغمة المختارة إذا كانت موجودة
        if (r.sound === 'custom' && r.customSoundUri) {
            const fileName = r.customSoundUri.split('/').pop() || 'Fichier audio';
            showToast((settings.language === 'ar' ? '🎵 ملف مخصص: ' : '🎵 Fichier : ') + fileName, 2000);
        } else if (r.sound === 'device' && r.deviceRingtoneUri) {
            const name = r.deviceRingtoneUri.split('/').pop() || 'Sonnerie';
            showToast((settings.language === 'ar' ? '📱 نغمة: ' : '📱 Sonnerie : ') + name, 2000);
        }
    } else {
        titleEl.textContent = t('reminderModalTitle');
        document.getElementById('reminderTextarea').value = '';
        document.getElementById('reminderDateInput').value = formatDate(new Date());
        document.getElementById('reminderTimeInput').value = '09:00';
        document.getElementById('reminderVibrateToggle').checked = true;
        document.getElementById('reminderSoundSelect').value = 'tone1';
        deleteBtn.style.display = 'none';
    }

    onReminderSoundSelectChange();
    document.getElementById('reminderModal').classList.add('show');
    setTimeout(() => document.getElementById('reminderTextarea').focus(), 200);
}

function onReminderSoundSelectChange() {
    const val = document.getElementById('reminderSoundSelect').value;
    document.getElementById('reminderCustomFileRow').style.display = (val === 'custom') ? 'flex' : 'none';

    if (val === 'device') {
        try {
            if (window.AndroidApp && typeof window.AndroidApp.pickRingtone === 'function') {
                window.AndroidApp.pickRingtone();
            } else {
                showToast(settings.language === 'ar' ?
                    'اختيار نغمات الهاتف متاح فقط داخل تطبيق الأندرويد' :
                    "La sélection des sonneries du téléphone n'est disponible que dans l'application Android", 3000);
            }
        } catch (e) { console.error(e); }
    } else if (val === 'custom') {
        // محاولة استخدام الجسر الأصلي أولاً
        try {
            if (window.AndroidApp && typeof window.AndroidApp.pickAudioFile === 'function') {
                window.AndroidApp.pickAudioFile();
            } else {
                // احتياطي: فتح منتقي الملفات عبر input type="file"
                const fileInput = document.getElementById('reminderCustomFileInput');
                if (fileInput) {
                    fileInput.click();
                }
            }
        } catch (e) { console.error(e); }
    }
}

// ===== دوال استقبال النتائج من الجسر الأصلي =====

// تُستدعى من الجانب الأصلي (Android) بعد اختيار المستخدم لنغمة من هاتفه
// يتم تمرير URI كامل وليس اسم فقط
function onDeviceRingtoneSelected(ringtoneUri) {
    pendingDeviceRingtoneUri = ringtoneUri;
    // استخراج اسم النغمة من URI لعرضه للمستخدم
    let name = ringtoneUri;
    try {
        const uri = new URL(ringtoneUri);
        name = uri.pathname.split('/').pop() || 'Sonnerie';
    } catch (e) {
        name = ringtoneUri.split('/').pop() || 'Sonnerie';
    }
    showToast((settings.language === 'ar' ? '✅ تم اختيار نغمة: ' : '✅ Sonnerie sélectionnée : ') + name, 2500);
}

// تُستدعى من الجانب الأصلي (Android) بعد اختيار ملف صوتي
function onAudioFileSelected(audioUri) {
    pendingCustomSoundUri = audioUri;
    const name = audioUri.split('/').pop() || 'Fichier audio';
    showToast((settings.language === 'ar' ? '✅ تم اختيار ملف صوتي: ' : '✅ Fichier audio sélectionné : ') + name, 2500);
}

// تُستدعى عند تغيير الملف عبر input type="file" (احتياطي)
function onReminderCustomFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // زيادة الحد الأقصى إلى 5MB لتشغيل الملفات بشكل أفضل
    if (file.size > 5 * 1024 * 1024) {
        alert(settings.language === 'ar' ? 'الملف كبير جداً (الحد الأقصى 5 ميغابايت)' : 'Fichier trop volumineux (max 5 Mo)');
        event.target.value = '';
        return;
    }

    // محاولة استخدام الجسر الأصلي لتشغيل الملف بدلاً من تخزينه
    const reader = new FileReader();
    reader.onload = function() {
        // تخزين البيانات كـ Data URL (احتياطي)
        pendingCustomSoundUri = reader.result;
        showToast((settings.language === 'ar' ? '✅ تم تحميل الملف: ' : '✅ Fichier chargé : ') + file.name, 2000);
    };
    reader.onerror = function() {
        alert(settings.language === 'ar' ? 'تعذّرت قراءة الملف' : 'Impossible de lire le fichier');
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

function testReminderSound() {
    const soundKey = document.getElementById('reminderSoundSelect').value;
    // استخدام URI المخزن بدلاً من البيانات المشفرة
    let soundData = null;
    if (soundKey === 'custom' && pendingCustomSoundUri) {
        soundData = pendingCustomSoundUri;
    } else if (soundKey === 'device' && pendingDeviceRingtoneUri) {
        soundData = pendingDeviceRingtoneUri;
    }
    playReminderSound(soundKey, soundData);
}

function closeReminderModal() {
    document.getElementById('reminderModal').classList.remove('show');
    editingReminderId = null;
    pendingCustomSoundUri = null;
    pendingDeviceRingtoneUri = null;
}

function saveReminder() {
    const text = document.getElementById('reminderTextarea').value.trim();
    if (!text) {
        alert(settings.language === 'ar' ? 'الرجاء كتابة نص التذكير' : 'Veuillez saisir le texte du rappel');
        return;
    }
    const date = document.getElementById('reminderDateInput').value;
    if (!date) {
        alert(settings.language === 'ar' ? 'الرجاء تحديد التاريخ' : 'Veuillez choisir une date');
        return;
    }
    const time = document.getElementById('reminderTimeInput').value;
    const vibrate = document.getElementById('reminderVibrateToggle').checked;
    const sound = document.getElementById('reminderSoundSelect').value;

    const id = editingReminderId || generateId();
    const existing = remindersData[id];

    // إن أعاد المستخدم ضبط موعد تذكير سبق إطلاقه إلى المستقبل، يُعاد تفعيله تلقائياً
    const newFireTime = computeFireTime(date, time, 0);
    const stillFired = existing && existing.fired && newFireTime && newFireTime <= new Date();

    // بناء كائن التذكير
    const reminder = {
        id, text, date, time, vibrate, sound,
        fired: !!stillFired,
        createdAt: existing ? existing.createdAt : new Date().toISOString()
    };

    // تخزين URI بدلاً من البيانات المشفرة
    if (sound === 'custom') {
        reminder.customSoundUri = pendingCustomSoundUri || (existing ? existing.customSoundUri : null);
        // حذف البيانات القديمة إذا كانت موجودة
        delete reminder.customSoundData;
    } else if (sound === 'device') {
        reminder.deviceRingtoneUri = pendingDeviceRingtoneUri || (existing ? existing.deviceRingtoneUri : null);
        // حذف الاسم القديم
        delete reminder.deviceRingtoneName;
    } else {
        // للنغمات المدمجة، نمسح أي بيانات سابقة
        delete reminder.customSoundUri;
        delete reminder.deviceRingtoneUri;
        delete reminder.customSoundData;
        delete reminder.deviceRingtoneName;
    }

    // إذا كان لدينا بيانات قديمة (base64) ولم يتم اختيار custom، نحذفها
    if (sound !== 'custom' && existing && existing.customSoundData) {
        delete existing.customSoundData;
    }

    remindersData[id] = reminder;

    if (!stillFired) notifiedIds.delete('rem_' + id);

    saveRemindersData();
    closeReminderModal();
    renderRemindersList();
    updateRemindersBadge();

    if (typeof PointageAPI !== 'undefined' && PointageAPI.isEnabled()) {
        PointageAPI._emit('reminderChanged', JSON.parse(JSON.stringify(remindersData[id])));
    }

    showToast(settings.language === 'ar' ? 'تم حفظ التذكير ✓' : 'Rappel enregistré ✓', 1800);
}

function deleteReminder() {
    if (!editingReminderId) return;
    if (!confirm(settings.language === 'ar' ? 'هل تريد حذف هذا التذكير؟' : 'Voulez-vous supprimer ce rappel ?')) return;

    notifiedIds.delete('rem_' + editingReminderId);
    delete remindersData[editingReminderId];
    saveRemindersData();
    closeReminderModal();
    renderRemindersList();
    updateRemindersBadge();
    showToast(settings.language === 'ar' ? 'تم حذف التذكير' : 'Rappel supprimé', 1500);
}

console.log('reminders-module.js loaded successfully');