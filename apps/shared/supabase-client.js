// Supabase client partagé pour tout le dashboard
// ⚠️ Remplace SUPABASE_URL et SUPABASE_ANON_KEY par les valeurs de ton projet

const SUPABASE_URL = "https://YOUR-PROJECT-ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

let supabaseClient = null;

async function initSupabase() {
  if (supabaseClient || !window.supabase) return null;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("YOUR-PROJECT-ID")) {
    console.warn("[Supabase] URL / clé non configurées, fallback localStorage.");
    return null;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  return supabaseClient;
}

// Helpers simples pour les workflows (exemple que tu peux dupliquer)
async function fetchWorkflows() {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("workflows")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase] fetchWorkflows error", error);
    return null;
  }
  return data || [];
}

async function upsertWorkflow(workflow) {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client.from("workflows").upsert(workflow).select().single();
  if (error) {
    console.error("[Supabase] upsertWorkflow error", error);
    return null;
  }
  return data;
}

async function deleteWorkflow(id) {
  const client = await initSupabase();
  if (!client) return null;

  const { error } = await client.from("workflows").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] deleteWorkflow error", error);
    return null;
  }
  return true;
}

window.supabaseShared = {
  initSupabase,
  fetchWorkflows,
  upsertWorkflow,
  deleteWorkflow,
};

