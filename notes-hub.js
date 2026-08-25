// ===================================================================
// notes-hub.js — Coordonnateur du commutateur des trois fonctionnalités
// du panneau "Notes & Tâches" : Agenda (tasks) / Carnet (notes) / Rappels (reminders)
// Intégré avec le moteur de synchronisation Supabase Engine.
// ===================================================================

let currentNotesHub = 'tasks';

function switchNotesHub(hub) {
    if (!['tasks', 'notes', 'reminders'].includes(hub)) return;

    currentNotesHub = hub;

    // تحديث حالة الأزرار والتبويبات
    document.querySelectorAll('.notes-hub-tab').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('hubTabBtn-' + hub);
    if (activeBtn) activeBtn.classList.add('active');

    // تحديث حالة الألواح والواجهات
    document.querySelectorAll('.notes-hub-panel').forEach(p => p.classList.remove('active'));
    const activePanel = document.getElementById('hubPanel-' + hub);
    if (activePanel) activePanel.classList.add('active');

    // المزامنة التلقائية مع السحابة عند التبديل إن وجد المحرك
    if (window.SupabaseSyncEngine && typeof window.SupabaseSyncEngine.pull === 'function') {
        window.SupabaseSyncEngine.pull().catch(err => {
            console.warn('Erreur lors de la synchronisation Supabase Hub:', err);
        });
    }

    // تهيئة الوظيفة المطلوبة حسب التبويب المحدد
    if (hub === 'tasks' && typeof initializeTasks === 'function') {
        initializeTasks();
    } else if (hub === 'notes' && typeof initializeNotes === 'function') {
        initializeNotes();
    } else if (hub === 'reminders' && typeof initializeReminders === 'function') {
        initializeReminders();
    }
}

// نقطة الدخول عند فتح تبويب "المذكرات" من شريط التنقل السفلي
function initializeNotesHub() {
    switchNotesHub(currentNotesHub || 'tasks');

    // تحديث شارة عدد التذكيرات المستحقة حتى لو كانت اللوحة النشطة غير "تذكير"
    if (typeof updateRemindersBadge === 'function') {
        if (typeof loadRemindersData === 'function' && currentNotesHub !== 'reminders') {
            loadRemindersData();
        }
        updateRemindersBadge();
    }
}

console.log('notes-hub.js loaded successfully with Supabase Sync Integration');