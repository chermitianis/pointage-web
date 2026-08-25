// ===== supabaseSync.js — Moteur de Synchronisation Cloud Direct =====

let supabaseClient = null;

function initSupabaseClient() {
    // 1. التحقق أولاً من الكائن الموحد على مستوى التطبيق (Global Singleton)
    if (window.supabaseInstance) {
        supabaseClient = window.supabaseInstance;
        return supabaseClient;
    }

    // 2. محاولة جلب العميل من AuthService
    if (window.AuthService && typeof window.AuthService.getClient === 'function') {
        const client = window.AuthService.getClient();
        if (client) {
            supabaseClient = client;
            window.supabaseInstance = client; // تعيينه عالمياً للـ Single Instance
            return supabaseClient;
        }
    }

    // 3. كحل أخير (Fallback) في حال لم يتم تهيئة AuthService بعد
    if (!supabaseClient && window.supabase && window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) {
        supabaseClient = window.supabase.createClient(
            window.APP_CONFIG.supabaseUrl,
            window.APP_CONFIG.supabaseAnonKey
        );
        window.supabaseInstance = supabaseClient;
        console.log('✅ Client Supabase initialisé avec succès.');
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
        return null;
    }
}

async function pushCloudData(tableName, jsonData) {
    const client = initSupabaseClient();
    if (!client) return;

    const user = await getCurrentUser();
    if (!user) return;

    try {
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

async function pullAllCloudData() {
    const client = initSupabaseClient();
    if (!client) return false;

    const user = await getCurrentUser();
    if (!user) return false;

    try {
        const [workRes, settRes, notesRes, tasksRes] = await Promise.all([
            client.from('user_work_data').select('work_data').eq('user_id', user.id).maybeSingle(),
            client.from('user_settings').select('settings').eq('user_id', user.id).maybeSingle(),
            client.from('user_notes').select('notes').eq('user_id', user.id).maybeSingle(),
            client.from('user_tasks').select('tasks').eq('user_id', user.id).maybeSingle()
        ]);

        window.workData = (workRes.data && workRes.data.work_data) ? workRes.data.work_data : {};
        localStorage.setItem('pointageWorkData', JSON.stringify(window.workData));

        if (settRes.data && settRes.data.settings) {
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

        console.log('✅ Synchronisation Cloud réussie pour l\'utilisateur:', user.id);
        return true;
    } catch (e) {
        console.error('❌ Erreur de téléchargement des données Cloud:', e);
        return false;
    }
}

window.SupabaseSyncEngine = {
    init: initSupabaseClient,
    getUser: getCurrentUser,
    push: pushCloudData,
    pullAll: pullAllCloudData
};
