// ===== supabaseSync.js — Moteur de Synchronisation Cloud Direct =====

let supabaseClient = null;

/**
 * Initialise le client Supabase
 */
function initSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (window.supabase && window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) {
        supabaseClient = window.supabase.createClient(
            window.APP_CONFIG.supabaseUrl,
            window.APP_CONFIG.supabaseAnonKey
        );
        console.log('✅ Client Supabase initialisé avec succès.');
    } else {
        console.warn('⚠️ SDK Supabase ou APP_CONFIG introuvable.');
    }
    return supabaseClient;
}

/**
 * Récupère l'utilisateur actuellement connecté
 */
async function getCurrentUser() {
    const client = initSupabaseClient();
    if (!client) return null;
    const { data: { user } } = await client.auth.getUser();
    return user;
}

/**
 * Envoie les données locales vers le Cloud (Push)
 */
async function pushCloudData(tableName, jsonData) {
    const user = await getCurrentUser();
    if (!user) return;

    try {
        const client = initSupabaseClient();
        const columnMap = {
            'user_work_data': 'work_data',
            'user_settings': 'settings',
            'user_notes': 'notes',
            'user_tasks': 'tasks'
        };

        const payload = {
            user_id: user.id,
            updated_at: new Date().toISOString()
        };
        payload[columnMap[tableName]] = jsonData;

        const { error } = await client
            .from(tableName)
            .upsert(payload, { onConflict: 'user_id' });

        if (error) console.error(`❌ Échec d'envoi vers ${tableName}:`, error.message);
    } catch (e) {
        console.error(`❌ Erreur inattendue lors du push vers ${tableName}:`, e);
    }
}

/**
 * Télécharge toutes les données du Cloud vers le stockage local (Pull)
 */
async function pullAllCloudData() {
    const user = await getCurrentUser();
    if (!user) return false;

    try {
        const client = initSupabaseClient();

        // Récupération parallèle de toutes les tables
        const [workRes, settRes, notesRes, tasksRes] = await Promise.all([
            client.from('user_work_data').select('work_data').eq('user_id', user.id).maybeSingle(),
            client.from('user_settings').select('settings').eq('user_id', user.id).maybeSingle(),
            client.from('user_notes').select('notes').eq('user_id', user.id).maybeSingle(),
            client.from('user_tasks').select('tasks').eq('user_id', user.id).maybeSingle()
        ]);

        if (workRes.data && workRes.data.work_data) {
            window.workData = workRes.data.work_data;
            localStorage.setItem('pointageWorkData', JSON.stringify(window.workData));
        }

        if (settRes.data && settRes.data.settings) {
            // Langue française par défaut si non spécifiée
            window.settings = { language: 'fr', ...settRes.data.settings };
            localStorage.setItem('pointageSettings', JSON.stringify(window.settings));
        }

        if (notesRes.data && notesRes.data.notes) {
            window.notesData = notesRes.data.notes;
            localStorage.setItem('pointageNotesData', JSON.stringify(window.notesData));
        }

        if (tasksRes.data && tasksRes.data.tasks) {
            window.tasksData = tasksRes.data.tasks;
            localStorage.setItem('pointageTasksData', JSON.stringify(window.tasksData));
        }

        console.log('✅ Synchronisation Cloud réussie.');
        return true;
    } catch (e) {
        console.error('❌ Erreur de téléchargement des données Cloud:', e);
        return false;
    }
}

// Exportation globale
window.SupabaseSyncEngine = {
    init: initSupabaseClient,
    getUser: getCurrentUser,
    push: pushCloudData,
    pullAll: pullAllCloudData
};