// Supabase client partagé pour tout le dashboard
// ⚠️ Remplace SUPABASE_URL et SUPABASE_ANON_KEY par les valeurs de ton projet

const SUPABASE_URL = "https://lrggcxdzihpwikttgkls.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZ2djeGR6aWhwd2lrdHRna2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjUwNDEsImV4cCI6MjA4ODkwMTA0MX0.OXfBWGvW-wUshdIl_RBuGBpOkAaCam1oBc-i1yq-Rjk";

let supabaseClient = null;
let supabaseLoadPromise = null;

async function initSupabase() {
  if (!window.supabase) {
    if (!supabaseLoadPromise) {
      supabaseLoadPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-supabase-umd="1"]');
        if (existing) {
          existing.addEventListener("load", () => resolve(true), { once: true });
          existing.addEventListener("error", reject, { once: true });
          return;
        }

        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
        s.async = true;
        s.defer = true;
        s.setAttribute("data-supabase-umd", "1");
        s.onload = () => resolve(true);
        s.onerror = reject;
        document.head.appendChild(s);
      }).catch((error) => {
        console.warn("[Supabase] UMD load failed, fallback localStorage.", error);
        return false;
      });
    }

    const ok = await supabaseLoadPromise;
    if (!ok || !window.supabase) return null;
  }

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

// ——— Rappels ———
async function fetchRappels() {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("rappels")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase] fetchRappels error", error);
    return null;
  }
  return data || [];
}

async function upsertRappel(reminder) {
  const client = await initSupabase();
  if (!client) return null;

  const row = {
    id: reminder.id,
    payload: reminder,
  };
  const { data, error } = await client.from("rappels").upsert(row).select().single();
  if (error) {
    console.error("[Supabase] upsertRappel error", error);
    return null;
  }
  return data;
}

async function deleteRappel(id) {
  const client = await initSupabase();
  if (!client) return null;

  const { error } = await client.from("rappels").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] deleteRappel error", error);
    return null;
  }
  return true;
}

// ——— Kanban ———
async function fetchKanbanBoard() {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("kanban_boards")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    console.error("[Supabase] fetchKanbanBoard error", error);
    return null;
  }
  return data ? (data.payload || null) : null;
}

async function upsertKanbanBoard(board) {
  const client = await initSupabase();
  if (!client) return null;

  const row = { id: "default", payload: board };
  const { error } = await client.from("kanban_boards").upsert(row);
  if (error) {
    console.error("[Supabase] upsertKanbanBoard error", error);
    return null;
  }
  return true;
}

// ——— Gestion de projet ———
async function fetchProjectRoadmap() {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("project_roadmap")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    console.error("[Supabase] fetchProjectRoadmap error", error);
    return null;
  }
  return data ? (data.payload || null) : null;
}

async function upsertProjectRoadmap(roadmap) {
  const client = await initSupabase();
  if (!client) return null;

  const row = { id: "default", payload: roadmap };
  const { error } = await client.from("project_roadmap").upsert(row);
  if (error) {
    console.error("[Supabase] upsertProjectRoadmap error", error);
    return null;
  }
  return true;
}

// ——— Notes ———
async function fetchNotes() {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase] fetchNotes error", error);
    return null;
  }
  return data || [];
}

async function upsertNote(note) {
  const client = await initSupabase();
  if (!client) return null;

  const row = { id: note.id, payload: note };
  const { error } = await client.from("notes").upsert(row);
  if (error) {
    console.error("[Supabase] upsertNote error", error);
    return null;
  }
  return true;
}

async function deleteNoteSupabase(id) {
  const client = await initSupabase();
  if (!client) return null;

  const { error } = await client.from("notes").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] deleteNote error", error);
    return null;
  }
  return true;
}

// ——— Templates ———
async function fetchTemplates() {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase] fetchTemplates error", error);
    return null;
  }
  return data || [];
}

async function upsertTemplate(template) {
  const client = await initSupabase();
  if (!client) return null;

  const row = { id: template.id, payload: template };
  const { error } = await client.from("templates").upsert(row);
  if (error) {
    console.error("[Supabase] upsertTemplate error", error);
    return null;
  }
  return true;
}

async function deleteTemplate(id) {
  const client = await initSupabase();
  if (!client) return null;

  const { error } = await client.from("templates").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] deleteTemplate error", error);
    return null;
  }
  return true;
}

window.supabaseShared = {
  initSupabase,
  fetchWorkflows,
  upsertWorkflow,
  deleteWorkflow,
  fetchRappels,
  upsertRappel,
  deleteRappel,
  fetchKanbanBoard,
  upsertKanbanBoard,
  fetchProjectRoadmap,
  upsertProjectRoadmap,
  fetchNotes,
  upsertNote,
  deleteNoteSupabase,
  fetchTemplates,
  upsertTemplate,
  deleteTemplate,
};


