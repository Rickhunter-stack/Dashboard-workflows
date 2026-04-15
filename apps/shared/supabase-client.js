// Supabase client partagé pour tout le dashboard

const SUPABASE_URL = "https://lrggcxdzihpwikttgkls.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImxyZ2djeGR6aWhwd2lrdHRna2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjUwNDEsImV4cCI6MjA4ODkwMTA0MX0.OXfBWGvW-wUshdIl_RBuGBpOkAaCam1oBc-i1yq-Rjk";

let supabaseClient = null;
let supabaseLoadPromise = null;

function logSupabaseError(scope, error) {
  console.error(`[Supabase] ${scope} error`, {
    message: error?.message ?? null,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    code: error?.code ?? null,
    raw: error ?? null,
  });
}

function nowIso() {
  return new Date().toISOString();
}

async function initSupabase() {
  if (!window.supabase) {
    if (!supabaseLoadPromise) {
      supabaseLoadPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-supabase-umd="1"]');

        if (existing) {
          if (window.supabase) {
            resolve(true);
            return;
          }
          existing.addEventListener("load", () => resolve(true), { once: true });
          existing.addEventListener("error", reject, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
        script.async = true;
        script.defer = true;
        script.setAttribute("data-supabase-umd", "1");
        script.onload = () => resolve(true);
        script.onerror = reject;
        document.head.appendChild(script);
      }).catch((error) => {
        console.warn("[Supabase] UMD load failed, fallback localStorage.", error);
        return false;
      });
    }

    const ok = await supabaseLoadPromise;
    if (!ok || !window.supabase) return null;
  }

  if (supabaseClient) return supabaseClient;

  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes("YOUR-PROJECT-ID")
  ) {
    console.warn("[Supabase] URL / clé non configurées, fallback localStorage.");
    return null;
  }

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false },
    }
  );

  return supabaseClient;
}

// ===========================
// HELPERS GÉNÉRIQUES
// ===========================

async function fetchAllOrdered(tableName) {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from(tableName)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError(`fetchAllOrdered:${tableName}`, error);
    return null;
  }

  return data || [];
}

async function fetchSinglePayloadById(tableName, id = "default") {
  const client = await initSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from(tableName)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logSupabaseError(`fetchSinglePayloadById:${tableName}`, error);
    return null;
  }

  return data ? data.payload || null : null;
}

async function upsertPayloadRow(tableName, id, payload, createdAt = null) {
  const client = await initSupabase();
  if (!client) return null;

  const row = {
    id,
    payload,
    created_at: createdAt || nowIso(),
  };

  const { error } = await client.from(tableName).upsert(row);

  if (error) {
    logSupabaseError(`upsertPayloadRow:${tableName}`, error);
    return null;
  }

  return true;
}

async function deleteById(tableName, id) {
  const client = await initSupabase();
  if (!client) return null;

  const { error } = await client.from(tableName).delete().eq("id", id);

  if (error) {
    logSupabaseError(`deleteById:${tableName}`, error);
    return null;
  }

  return true;
}

// ===========================
// WORKFLOWS
// ===========================

async function fetchWorkflows() {
  return fetchAllOrdered("workflows");
}

async function upsertWorkflow(workflow) {
  const client = await initSupabase();
  if (!client) return null;

  const row = {
    ...workflow,
    created_at: workflow?.created_at || nowIso(),
  };

  const { data, error } = await client
    .from("workflows")
    .upsert(row)
    .select()
    .single();

  if (error) {
    logSupabaseError("upsertWorkflow", error);
    return null;
  }

  return data;
}

async function deleteWorkflow(id) {
  return deleteById("workflows", id);
}

// ===========================
// RAPPELS
// ===========================

async function fetchRappels() {
  return fetchAllOrdered("rappels");
}

async function upsertRappel(reminder) {
  return upsertPayloadRow(
    "rappels",
    reminder.id,
    reminder,
    reminder?.created_at || reminder?.createdAt || null
  );
}

async function deleteRappel(id) {
  return deleteById("rappels", id);
}

// ===========================
// KANBAN
// ===========================

async function fetchKanbanBoard() {
  return fetchSinglePayloadById("kanban_boards", "default");
}

async function upsertKanbanBoard(board) {
  // Protection anti-effacement côté shared aussi (défense en profondeur).
  // Refuse d'écrire un payload vide par erreur.
  const hasCards =
    !!board &&
    Array.isArray(board.lists) &&
    (board.lists.some((l) => Array.isArray(l.cards) && l.cards.length > 0) ||
      (Array.isArray(board.archived) && board.archived.length > 0));
  if (!hasCards) {
    console.warn("[Supabase] upsertKanbanBoard refused: empty board payload.");
    return null;
  }

  return upsertPayloadRow(
    "kanban_boards",
    "default",
    board,
    board?.created_at || board?.createdAt || null
  );
}

// ===========================
// PROJECT ROADMAP
// ===========================

async function fetchProjectRoadmap() {
  return fetchSinglePayloadById("project_roadmap", "default");
}

async function upsertProjectRoadmap(roadmap) {
  return upsertPayloadRow(
    "project_roadmap",
    "default",
    roadmap,
    roadmap?.created_at || roadmap?.createdAt || null
  );
}

// ===========================
// NOTES
// ===========================

async function fetchNotes() {
  return fetchAllOrdered("notes");
}

async function upsertNote(note) {
  return upsertPayloadRow(
    "notes",
    note.id,
    note,
    note?.created_at || note?.createdAt || null
  );
}

async function deleteNoteSupabase(id) {
  return deleteById("notes", id);
}

// ===========================
// TEMPLATES
// ===========================

async function fetchTemplates() {
  return fetchAllOrdered("templates");
}

async function upsertTemplate(template) {
  return upsertPayloadRow(
    "templates",
    template.id,
    template,
    template?.created_at || template?.createdAt || null
  );
}

async function deleteTemplate(id) {
  return deleteById("templates", id);
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
