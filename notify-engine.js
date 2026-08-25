// ===================================================================
// notify-engine.js — Moteur de notifications partagé entre "Agenda" et "Rappels"
//
// Moteur multi-niveaux adapté à l'environnement d'exécution (Mobile/Web) :
//   1) Pont Android Natif (MainActivity.kt / window.AndroidApp) — Le plus fiable.
//   2) Web Notification API (PWA / Navigateur).
//   3) Vibration native ou via navigator.vibrate().
//   4) Synthèse audio via Web Audio API ou fichiers audio personnalisés (URI / Base64).
//   5) Notification Toast interne de l'application.
// ===================================================================

let notifyCheckIntervalId = null;
let notifiedIds = new Set(); // Pour éviter la répétition des notifications dans la même session

function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function initNotifyEngine() {
    requestNotificationPermission();
    if (notifyCheckIntervalId) clearInterval(notifyCheckIntervalId);
    notifyCheckIntervalId = setInterval(checkDueNotifications, 30000); // Vérification toutes les 30 secondes
    checkDueNotifications();
}

function requestNotificationPermission() {
    try {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    } catch (e) { /* Ignorer silencieusement pour les WebViews sans support */ }
}

function computeFireTime(dateStr, timeStr, leadMinutes) {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    let hh = 9, mm = 0;
    if (timeStr) {
        const tp = timeStr.split(':');
        hh = parseInt(tp[0]) || 0;
        mm = parseInt(tp[1]) || 0;
    }
    const dt = new Date(y, m - 1, d, hh, mm, 0);
    dt.setMinutes(dt.getMinutes() - (leadMinutes || 0));
    return dt;
}

function checkDueNotifications() {
    const now = new Date();
    const isAr = window.settings && window.settings.language === 'ar';

    // ===== 1) Vérification des Tâches (tasksData) =====
    if (typeof tasksData === 'object' && tasksData) {
        Object.values(tasksData).forEach(task => {
            if (!task.notify || task.done || !task.date) return;
            const fireTime = computeFireTime(task.date, task.time, task.leadMinutes || 0);
            const key = 'task_' + task.id;
            if (fireTime && fireTime <= now && !notifiedIds.has(key)) {
                notifiedIds.add(key);
                fireNotification({
                    id: key,
                    title: isAr ? '🗓️ تذكير بمهمة' : '🗓️ Rappel de tâche',
                    body: task.text,
                    vibrate: true,
                    soundKey: 'tone1'
                });
            }
        });
    }

    // ===== 2) Vérification des Rappels (remindersData) =====
    if (typeof remindersData === 'object' && remindersData) {
        let changed = false;
        Object.values(remindersData).forEach(rem => {
            if (rem.fired || !rem.date) return;
            const fireTime = computeFireTime(rem.date, rem.time, 0);
            const key = 'rem_' + rem.id;
            if (fireTime && fireTime <= now && !notifiedIds.has(key)) {
                notifiedIds.add(key);

                // Préparation du son — Support URI et Base64
                let soundData = null;
                let soundType = rem.sound || 'tone1';

                if (rem.sound === 'custom') {
                    soundData = rem.customSoundUri || rem.customSoundData || null;
                } else if (rem.sound === 'device') {
                    soundData = rem.deviceRingtoneUri || null;
                }

                fireNotification({
                    id: key,
                    title: isAr ? '⏰ تذكير' : '⏰ Rappel',
                    body: rem.text,
                    vibrate: !!rem.vibrate,
                    soundKey: soundType,
                    soundData: soundData,
                    customSoundData: rem.customSoundData || null
                });
                rem.fired = true;
                changed = true;
            }
        });

        if (changed) {
            if (typeof saveRemindersData === 'function') saveRemindersData();
            if (typeof renderRemindersList === 'function') renderRemindersList();
            if (typeof updateRemindersBadge === 'function') updateRemindersBadge();

            // Synchronisation avec Supabase si disponible
            if (window.SupabaseSyncEngine && typeof window.SupabaseSyncEngine.push === 'function') {
                window.SupabaseSyncEngine.push('user_reminders_data', remindersData);
            }
        }
    }
}

function fireNotification({ id, title, body, vibrate, soundKey, soundData, customSoundData }) {
    // 1) Pont Android Natif
    try {
        if (window.AndroidApp && typeof window.AndroidApp.showNativeNotification === 'function') {
            window.AndroidApp.showNativeNotification(title, body, id);
        }
    } catch (e) { console.error('notify-engine: Erreur du pont natif notification', e); }

    // 2) Web Notification API
    try {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: body, tag: id });
        }
    } catch (e) { console.error('notify-engine: Erreur Web Notification', e); }

    // 3) Vibration
    if (vibrate) {
        vibrateDevice(400);
    }

    // 4) Lecture du Son
    playReminderSound(soundKey, soundData || customSoundData);

    // 5) Fallback Toast UI
    if (typeof showToast === 'function') {
        showToast(`${title}: ${body}`, 5000);
    }
}

// ===== Fonction de Vibration =====
function vibrateDevice(duration = 400) {
    try {
        if (window.AndroidApp && typeof window.AndroidApp.vibrate === 'function') {
            window.AndroidApp.vibrate(duration);
            return;
        }
        if (navigator.vibrate) {
            navigator.vibrate([duration * 0.7, 100, duration * 0.7]);
            return;
        }
    } catch (e) {
        console.warn('notify-engine: Échec de la vibration', e);
    }
}

// ===== Lecture des Sons =====
function playReminderSound(soundKey, soundData) {
    try {
        // 1) Pont Android Natif
        if (window.AndroidApp) {
            if (soundKey === 'device' && soundData && typeof window.AndroidApp.playRingtone === 'function') {
                window.AndroidApp.playRingtone(soundData);
                return;
            }
            if (soundKey === 'custom' && soundData && typeof window.AndroidApp.playAudioFile === 'function') {
                window.AndroidApp.playAudioFile(soundData);
                return;
            }
            if (typeof window.AndroidApp.playDeviceRingtone === 'function') {
                window.AndroidApp.playDeviceRingtone();
                return;
            }
        }

        // 2) Lecture Web
        if (soundKey === 'custom' && soundData) {
            playCustomSound(soundData);
            return;
        }

        if (soundKey === 'device' && soundData) {
            try {
                const audio = new Audio(soundData);
                audio.play().catch(() => playBuiltInTone('tone1'));
                return;
            } catch (e) {
                playBuiltInTone('tone1');
                return;
            }
        }

        // 3) Tonalités Intégrées (Web Audio API)
        playBuiltInTone(soundKey || 'tone1');

    } catch (e) {
        console.error('notify-engine: Erreur lors de la lecture audio', e);
        try { playBuiltInTone('tone1'); } catch (e2) {}
    }
}

// ===== Lecture Son Personnalisé (Web) =====
function playCustomSound(soundData) {
    if (!soundData) return;

    try {
        const audio = new Audio(soundData);
        audio.play().catch(() => playCustomSoundViaAudioContext(soundData));
    } catch (e) {
        playCustomSoundViaAudioContext(soundData);
    }
}

// ===== Lecture via AudioContext =====
function playCustomSoundViaAudioContext(soundData) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    if (soundData.startsWith('data:audio/')) {
        fetch(soundData)
            .then(res => res.arrayBuffer())
            .then(buffer => ctx.decodeAudioData(buffer))
            .then(decoded => {
                const source = ctx.createBufferSource();
                source.buffer = decoded;
                source.connect(ctx.destination);
                source.start();
            })
            .catch(e => console.warn('Échec décodage audio', e));
    } else if (soundData.startsWith('http') || soundData.startsWith('content://') || soundData.startsWith('file://')) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', soundData, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
            if (xhr.status === 200) {
                ctx.decodeAudioData(xhr.response, function(decoded) {
                    const source = ctx.createBufferSource();
                    source.buffer = decoded;
                    source.connect(ctx.destination);
                    source.start();
                });
            }
        };
        xhr.send();
    }
}

// ===== Tonalités Intégrées Synthétisées =====
function playBuiltInTone(toneKey) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
        const ctx = new AudioCtx();
        const patterns = {
            tone1: [[880, 0.15], [0, 0.05], [880, 0.15]],
            tone2: [[1046, 0.12], [1318, 0.12], [1568, 0.22]],
            tone3: [[440, 0.09], [0, 0.06], [440, 0.09], [0, 0.06], [440, 0.16]]
        };
        const seq = patterns[toneKey] || patterns.tone1;
        let t = ctx.currentTime;
        seq.forEach(([freq, dur]) => {
            if (freq > 0) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.28, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
                osc.connect(gain).connect(ctx.destination);
                osc.start(t);
                osc.stop(t + dur);
            }
            t += dur;
        });
    } catch (e) {
        console.warn('Échec de la tonalité synthétisée', e);
    }
}

console.log('notify-engine.js loaded successfully with Supabase & Native bridge support');