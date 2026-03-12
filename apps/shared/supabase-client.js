// Supabase client partagé pour tout le dashboard
// ⚠️ Remplace SUPABASE_URL et SUPABASE_ANON_KEY par les valeurs de ton projet

const SUPABASE_URL = "https://lrggcxdzihpwikttgkls.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZ2djeGR6aWhwd2lrdHRna2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjUwNDEsImV4cCI6MjA4ODkwMTA0MX0.OXfBWGvW-wUshdIl_RBuGBpOkAaCam1oBc-i1yq-Rjk";

let supabaseClient = null;

async function initSupabase() {
  if (!window.supabase) return null;

  if (supabaseClient) {
    return supabaseClient;
  }

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

