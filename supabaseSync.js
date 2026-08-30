// ===== supabaseSync.js — Moteur de Synchronisation Cloud Direct =====

let supabaseClient = null;

function initSupabaseClient() {
    if (window.supabaseInstance) {
        supabaseClient = window.supabaseInstance;
        return supabaseClient;
    }

    if (window.AuthService && typeof window.AuthService.getClient === 'function') {
        const client = window.AuthService.getClient();
        if (client) {
            supabaseClient = client;
            window.supabaseInstance = client;
            console.log('✅ Client Supabase récupéré depuis AuthService.');
            return supabaseClient;
        }
    }

    if (!supabaseClient && window.supabase && window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) {
        try {
            const { createClient } = window.supabase;
            supabaseClient = createClient(
                window.APP_CONFIG.supabaseUrl,
                window.APP_CONFIG.supabaseAnonKey
            );
            window.supabaseInstance = supabaseClient;
            console.log('✅ Client Supabase initialisé avec succès (fallback).');
        } catch (e) {
            console.error('❌ Échec de l\'initialisation du client Supabase:', e);
        }
    }

    return supabaseClient;
}

async function getCurrentUser() {
    const client = initSupabaseClient();
    if (!client) return null;
    try {
        const { data: { user } } = await client.auth.getUser();
        return user;
    } catch (e) {
        console.warn('⚠️ Impossible de récupérer l\'utilisateur courant:', e);
        return null;
    }
}

async function pushCloudData(tableName, jsonData) {
    const client = initSupabaseClient();
    if (!client) {
        console.warn('⚠️ Client Supabase non disponible, push ignoré.');
        return;
    }

    const user = await getCurrentUser();
    if (!user) {
        console.warn('⚠️ Aucun utilisateur connecté, push ignoré.');
        return;
    }

    try {
        // ===== الجداول المدعومة =====
        const columnMap = {
            'user_work_data': 'work_data',
            'user_settings': 'settings',
            'user_notes': 'notes',
            'user_tasks': 'tasks',
            'user_reminders': 'reminders'
        };

        const dataColumn = columnMap[tableName];
        if (!dataColumn) {
            console.warn(`⚠️ Table '${tableName}' non reconnue.`);
            return;
        }

        const payload = {
            user_id: user.id,
            updated_at: new Date().toISOString()
        };
        payload[dataColumn] = jsonData;

        const { error } = await client
            .from(tableName)
            .upsert(payload, { onConflict: 'user_id' });

        if (error) {
            console.error(`❌ Échec de l'envoi vers ${tableName}:`, error.message);
        } else {
            console.log(`✅ Données envoyées vers ${tableName} pour l'utilisateur ${user.id}.`);
        }
    } catch (e) {
        console.error(`❌ Erreur inattendue lors du push vers ${tableName}:`, e);
    }
}

async function pullAllCloudData() {
    const client = initSupabaseClient();
    if (!client) {
        console.warn('⚠️ Client Supabase non disponible, pull ignoré.');
        return false;
    }

    const user = await getCurrentUser();
    if (!user) {
        console.warn('⚠️ Aucun utilisateur connecté, pull ignoré.');
        return false;
    }

    try {
        const [workRes, settRes, notesRes, tasksRes] = await Promise.all([
            client.from('user_work_data').select('work_data').eq('user_id', user.id).maybeSingle(),
            client.from('user_settings').select('settings').eq('user_id', user.id).maybeSingle(),
            client.from('user_notes').select('notes').eq('user_id', user.id).maybeSingle(),
            client.from('user_tasks').select('tasks').eq('user_id', user.id).maybeSingle()
        ]);

        // --- Mise à jour des données de travail (workData) ---
        if (workRes.data && workRes.data.work_data) {
            window.workData = workRes.data.work_data;
            localStorage.setItem('pointageWorkData', JSON.stringify(window.workData));
            console.log('📥 workData chargé depuis le cloud.');
        } else {
            window.workData = {};
            localStorage.removeItem('pointageWorkData');
        }

        // --- Mise à jour des paramètres (settings) ---
        if (settRes.data && settRes.data.settings) {
            const defaultSettings = {
                language: 'fr',
                numberFormat: 'western',
                monthStartDay: 1,
                monthEndDay: 31,
                shift2Bonus: 75,
                shift3Bonus: 100,
                annualVacation: 18,
                hourlyRate: 5,
                monthlySalary: 800,
                hoursPerDay: 8,
                currency: 'DT',
                paidBonuses: {},
                overtimeSettings: {
                    normalMultiplier: 1.25,
                    nightMultiplier: 1.50,
                    restDayMultiplier: 1.75,
                    holidayMultiplier: 2.00
                },
                workHours: {
                    normalStartHour: 8,
                    normalEndHour: 17,
                    nightStartHour: 22,
                    nightEndHour: 5
                },
                weeklyRestDays: {
                    0: [0,1,2,3,4,5,6,7,8,9,10,11],
                    6: [6,7]
                },
                numShifts: 3,
                shiftStartHour: 8,
                shiftBonuses: { 2: 75, 3: 100, 4: 125 },
                apiEnabled: false
            };

            const cloudSettings = settRes.data.settings;
            window.settings = { ...defaultSettings, ...cloudSettings };
            if (!window.settings.language) {
                window.settings.language = 'fr';
            }
            localStorage.setItem('pointageSettings', JSON.stringify(window.settings));
            console.log('📥 settings chargés depuis le cloud (langue forcée à fr si absente).');
        } else {
            if (!window.settings) {
                window.settings = { language: 'fr' };
            } else if (!window.settings.language) {
                window.settings.language = 'fr';
            }
            localStorage.setItem('pointageSettings', JSON.stringify(window.settings));
        }

        // --- Mise à jour des notes ---
        if (notesRes.data && notesRes.data.notes) {
            window.notesData = notesRes.data.notes;
            localStorage.setItem('pointageNotesData', JSON.stringify(window.notesData));
        } else {
            window.notesData = {};
            localStorage.removeItem('pointageNotesData');
        }

        // --- Mise à jour des tâches ---
        if (tasksRes.data && tasksRes.data.tasks) {
            window.tasksData = tasksRes.data.tasks;
            localStorage.setItem('pointageTasksData', JSON.stringify(window.tasksData));
        } else {
            window.tasksData = {};
            localStorage.removeItem('pointageTasksData');
        }

        console.log(`✅ Synchronisation cloud réussie pour l'utilisateur ${user.id}.`);
        return true;

    } catch (e) {
        console.error('❌ Erreur lors du pull des données cloud :', e);
        return false;
    }
}

// ===== Exportation de l'API publique =====
window.SupabaseSyncEngine = {
    init: initSupabaseClient,
    getUser: getCurrentUser,
    push: pushCloudData,
    pullAll: pullAllCloudData
};

console.log('✅ supabaseSync.js chargé avec succès.');
