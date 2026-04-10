// ===========================
// ÉTAT GLOBAL
// ===========================
let state = {
  lists: [],
  filter: "",
  archived: [],
  viewMode: "todo", // 'todo' | 'done'
};

// Handlers Escape pour éviter les fuites / doublons lors de la fermeture par bouton
let projectMetaEscapeHandler = null;
let cardModalEscapeHandler = null;
let workflowLinkEscapeHandler = null;

// Initialiser l'état par défaut
function initState() {
  return {
    lists: [
      {
        id: "todo",
        title: "À faire",
        cards: [
          {
            id: generateId(),
            title: "Exemple de carte",
            note:
              "Knowledge Base Architecture\nVous pouvez ajouter des notes ici pour décrire cette tâche plus en détail.",
            priority: "orange",
            startDate: null,
            dueDate: null,
            checklist: [
              { text: "ChromaDB Integration", done: false },
              { text: "API embeddings", done: false },
            ],
            updatedAt: new Date().toISOString(),
            linkedWorkflowId: null,
          },
        ],
      },
      {
        id: "doing",
        title: "En cours",
        cards: [],
      },
      {
        id: "done",
        title: "Fait",
        cards: [],
      },
    ],
    filter: "",
    archived: [],
    viewMode: "todo",
  };
}

// ===========================
// UTILITAIRES
// ===========================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function normalizeChecklistEntry(item) {
  if (item == null) return { text: "", done: false };
  if (typeof item === "string") return { text: item, done: false };
  return {
    text: String(item.text || ""),
    done: !!item.done,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  };
}

function migrateKanbanState(s) {
  if (!s || !Array.isArray(s.lists)) return;
  for (const list of s.lists) {
    if (!Array.isArray(list.cards)) continue;
    for (const card of list.cards) {
      if (!card.checklist) card.checklist = [];
      card.checklist = card.checklist
        .map(normalizeChecklistEntry)
        .filter((e) => e.text.trim().length > 0)
        .map((e) => {
          // Ajoute une date pour pouvoir trier sans casser les anciens boards
          if (!e.createdAt) e.createdAt = card.updatedAt || card.createdAt || new Date().toISOString();
          if (!e.updatedAt) e.updatedAt = e.createdAt;
          return e;
        });
      if (!card.updatedAt) card.updatedAt = new Date().toISOString();
      if (card.linkedWorkflowId != null && card.linkedWorkflowId !== "") {
        card.linkedWorkflowId = String(card.linkedWorkflowId);
      } else {
        card.linkedWorkflowId = null;
      }
    }
  }
}

function sortChecklistForPreview(checklist) {
  const items = (checklist || []).map((item, originalIndex) => ({
    item: normalizeChecklistEntry(item),
    originalIndex,
  }));

  items.sort((a, b) => {
    // 1) Non terminées d'abord
    if (a.item.done !== b.item.done) return a.item.done ? 1 : -1;
    // 2) Plus récent d'abord (updatedAt puis createdAt)
    const at =
      new Date(a.item.updatedAt || a.item.createdAt || 0).getTime() || 0;
    const bt =
      new Date(b.item.updatedAt || b.item.createdAt || 0).getTime() || 0;
    if (at !== bt) return bt - at;
    // 3) Stable
    return a.originalIndex - b.originalIndex;
  });

  return items;
}

function cardSubtitleFromNote(note) {
  const lines = (note || "").split(/\r?\n/);
  const line = lines.map((l) => l.trim()).find((l) => l.length > 0);
  if (!line) return "";
  return line.length > 140 ? `${line.slice(0, 137)}…` : line;
}

function formatRelativeUpdated(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Mis à jour il y a ${m} min`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `Mis à jour il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Mis à jour hier";
  return `Mis à jour il y a ${d}j`;
}

function countPendingCards() {
  const listTodo = state.lists.find((l) => l.id === "todo");
  const listDoing = state.lists.find((l) => l.id === "doing");
  return []
    .concat(listTodo?.cards || [], listDoing?.cards || [])
    .filter(cardMatchesFilter).length;
}

function updatePendingBadge() {
  const el = document.getElementById("dashboard-pending-count");
  if (!el) return;
  const n = countPendingCards();
  el.textContent = `${n} PENDING`;
}

// ===========================
// PERSISTANCE
// ===========================
const STORAGE_KEY = "kanbanLiteBoard";
// Evite un nombre de requêtes Supabase excessif (souvent déclenché à chaque frappe).
// Le localStorage reste instantané, seul l'upsert Supabase est débouncé.
let supabaseSaveTimeoutId = null;
const SUPABASE_SAVE_DEBOUNCE_MS = 400;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = JSON.parse(saved);
      if (!state.archived) state.archived = [];
      if (!state.viewMode) state.viewMode = "todo";
      migrateKanbanState(state);
    } else {
      state = initState();
      saveState();
    }
  } catch (error) {
    console.error("Erreur lors du chargement:", error);
    state = initState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (window.supabaseShared) {
      if (supabaseSaveTimeoutId) clearTimeout(supabaseSaveTimeoutId);
      supabaseSaveTimeoutId = setTimeout(() => {
        // Snapshot: on envoie l'état courant au moment du flush.
        window.supabaseShared
          .upsertKanbanBoard(state)
          .catch((error) => {
            console.warn("[Kanban] Supabase upsert failed", error);
          });
      }, SUPABASE_SAVE_DEBOUNCE_MS);
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
  }
}

// Flush final (iframe / navigation / fermeture navigateur)
window.addEventListener("pagehide", () => {
  if (!window.supabaseShared) return;
  if (supabaseSaveTimeoutId) clearTimeout(supabaseSaveTimeoutId);
  supabaseSaveTimeoutId = null;
  window.supabaseShared
    .upsertKanbanBoard(state)
    .catch((error) => console.warn("[Kanban] Supabase final upsert failed", error));
});

window.addEventListener("beforeunload", () => {
  if (!window.supabaseShared) return;
  if (supabaseSaveTimeoutId) clearTimeout(supabaseSaveTimeoutId);
  supabaseSaveTimeoutId = null;
  window.supabaseShared
    .upsertKanbanBoard(state)
    .catch((error) => console.warn("[Kanban] Supabase final upsert failed", error));
});

async function loadBoardState() {
  if (window.supabaseShared) {
    try {
      const board = await window.supabaseShared.fetchKanbanBoard();
      if (board && board.lists && Array.isArray(board.lists)) {
        state = board;
        if (board.filter !== undefined) state.filter = board.filter;
        migrateKanbanState(state);
        return;
      }
    } catch (e) {
      console.warn("[Kanban] Supabase load failed, fallback localStorage", e);
    }
  }
  loadState();
}

// ===========================
// GESTION DES CARTES
// ===========================
function addCard(listId) {
  const list = state.lists.find((l) => l.id === listId);
  if (!list) return;

  const newCard = {
    id: generateId(),
    title: "Nouvelle carte",
    note: "",
    priority: null,
    startDate: null,
    dueDate: null,
    checklist: [],
    updatedAt: new Date().toISOString(),
    linkedWorkflowId: null,
  };

  list.cards.push(newCard);
  saveState();
  render();

  // Focus sur le titre de la nouvelle carte
  setTimeout(() => {
    const cardElement = document.querySelector(`[data-card-id="${newCard.id}"]`);
    if (cardElement) {
      const titleInput = cardElement.querySelector(".board-card-title input");
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }
    }
  }, 100);
}

function updateCardTitle(cardId, newTitle) {
  for (const list of state.lists) {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) {
      card.title = newTitle;
      card.updatedAt = new Date().toISOString();
      saveState();
      return;
    }
  }
}

function updateCardNote(cardId, note) {
  for (const list of state.lists) {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) {
      card.note = note;
      card.updatedAt = new Date().toISOString();
      saveState();
      return;
    }
  }
}

function updateCardPriority(cardId, priority) {
  for (const list of state.lists) {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) {
      card.priority = priority === card.priority ? null : priority;
      card.updatedAt = new Date().toISOString();
      saveState();
      render();
      return;
    }
  }
}

function cycleCardPriority(cardId) {
  const order = [null, "orange", "green", "red"];
  for (const list of state.lists) {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) {
      const cur = card.priority == null ? null : card.priority;
      const i = order.indexOf(cur);
      const idx = i === -1 ? 0 : i;
      const next = order[(idx + 1) % order.length];
      card.priority = next;
      card.updatedAt = new Date().toISOString();
      saveState();
      render();
      return;
    }
  }
}

function deleteCard(cardId) {
  for (const list of state.lists) {
    const index = list.cards.findIndex((c) => c.id === cardId);
    if (index !== -1) {
      const [removed] = list.cards.splice(index, 1);
      if (!state.archived) state.archived = [];
      state.archived.unshift({
        ...removed,
        _fromListId: list.id,
        _archivedAt: new Date().toISOString(),
      });
      saveState();
      render();
      return;
    }
  }
}

function findCard(cardId) {
  for (const list of state.lists) {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) return { card, list };
  }
  return null;
}

function toggleCardDone(cardId) {
  const found = findCard(cardId);
  if (!found) return;
  const { card, list } = found;
  const confirmed = window.confirm(
    "Marquer cette carte comme terminée ? Elle sera retirée du Kanban mais conservée dans l'historique."
  );
  if (!confirmed) return;

  const index = list.cards.findIndex((c) => c.id === cardId);
  if (index === -1) return;

  const [removed] = list.cards.splice(index, 1);
  if (!state.archived) state.archived = [];
  state.archived.unshift({
    ...removed,
    _fromListId: list.id,
    _archivedAt: new Date().toISOString(),
    _done: true,
  });
  saveState();
  render();
}

function toggleChecklistItem(cardId, index) {
  const found = findCard(cardId);
  if (!found) return;
  const { card } = found;
  if (!card.checklist || !card.checklist[index]) return;
  const entry = normalizeChecklistEntry(card.checklist[index]);
  entry.done = !entry.done;
  entry.updatedAt = new Date().toISOString();
  card.checklist[index] = entry;
  card.updatedAt = new Date().toISOString();
  saveState();
  render();
}

function addChecklistItemValue(cardId, label) {
  const found = findCard(cardId);
  if (!found) return;
  const { card } = found;
  const clean = String(label || "").trim();
  if (!clean) return;
  if (!card.checklist) card.checklist = [];
  const now = new Date().toISOString();
  card.checklist.push({ text: clean, done: false, createdAt: now, updatedAt: now });
  card.updatedAt = new Date().toISOString();
  saveState();
  render();
}

// ===========================
// GESTION DES LISTES
// ===========================
function updateListTitle(listId, newTitle) {
  const list = state.lists.find((l) => l.id === listId);
  if (list) {
    list.title = newTitle;
    saveState();
  }
}

// ===========================
// FILTRAGE
// ===========================
function updateFilter(filterText) {
  state.filter = filterText.toLowerCase();
  render();
}

function cardMatchesFilter(card) {
  if (!state.filter) return true;
  const searchText = state.filter;
  return (
    card.title.toLowerCase().includes(searchText) ||
    (card.note || "").toLowerCase().includes(searchText)
  );
}

function setViewMode(mode) {
  state.viewMode = mode === "done" ? "done" : "todo";
  saveState();
  syncViewToggleUI();
  render();
}

function syncViewToggleUI() {
  const btnTodo = document.getElementById("view-todo");
  const btnDone = document.getElementById("view-done");
  if (!btnTodo || !btnDone) return;

  const isDone = state.viewMode === "done";
  btnTodo.classList.toggle("active", !isDone);
  btnDone.classList.toggle("active", isDone);
  btnTodo.setAttribute("aria-selected", String(!isDone));
  btnDone.setAttribute("aria-selected", String(isDone));
}

// ===========================
// MODAL D'AGRANDISSEMENT
// ===========================
let currentModalCardId = null;

// ===========================
// MODAL "GESTION PROJET"
// (dates + échéance, liée à une carte Kanban)
// ===========================
let currentProjectModalCardId = null;

function normalizeDateForInput(dateValue) {
  if (!dateValue) return "";
  if (typeof dateValue !== "string") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function openProjectMetaModal(cardId) {
  currentProjectModalCardId = cardId;
  const found = findCard(cardId);
  if (!found) return;

  const { card } = found;
  const startValue = normalizeDateForInput(card.startDate);
  const dueValue = normalizeDateForInput(card.dueDate);

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="project-meta-title">
      <div class="modal-header">
        <input
          type="text"
          id="project-meta-title"
          class="modal-title-input"
          value="${escapeHtml(card.title)}"
          aria-label="Titre du projet"
          disabled
        />
        <button class="modal-close" aria-label="Fermer" onclick="closeProjectMetaModal()">
          ✕
        </button>
      </div>

      <div class="project-meta-grid">
        <label class="project-meta-field">
          <span class="project-meta-label">Date de démarrage</span>
          <input
            type="date"
            id="project-meta-start"
            class="project-date-input"
            value="${escapeHtml(startValue)}"
          />
        </label>

        <label class="project-meta-field">
          <span class="project-meta-label">Échéance</span>
          <input
            type="date"
            id="project-meta-due"
            class="project-date-input project-date-due"
            value="${escapeHtml(dueValue)}"
          />
        </label>
      </div>

      <div class="modal-footer">
        <button class="modal-btn modal-btn-close" onclick="closeProjectMetaModal()">Fermer</button>
        <button class="modal-btn modal-btn-delete" id="project-meta-save">Enregistrer</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const saveBtn = modal.querySelector("#project-meta-save");
  const startInput = modal.querySelector("#project-meta-start");
  const dueInput = modal.querySelector("#project-meta-due");

  saveBtn?.addEventListener("click", () => {
    const foundNow = findCard(cardId);
    if (!foundNow) return;
    const { card: cardNow } = foundNow;

    const start = startInput?.value ? startInput.value : "";
    const due = dueInput?.value ? dueInput.value : "";

    cardNow.startDate = start || null;
    cardNow.dueDate = due || null;

    saveState();
    closeProjectMetaModal();
  });

  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeProjectMetaModal();
      if (projectMetaEscapeHandler) {
        document.removeEventListener("keydown", projectMetaEscapeHandler);
        projectMetaEscapeHandler = null;
      }
    }
  };
  if (projectMetaEscapeHandler) {
    document.removeEventListener("keydown", projectMetaEscapeHandler);
  }
  projectMetaEscapeHandler = handleEscape;
  document.addEventListener("keydown", projectMetaEscapeHandler);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeProjectMetaModal();
  });

  // Stopper la fermeture si clic dans le contenu
  modal.querySelector(".modal-card")?.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

function closeProjectMetaModal() {
  const overlays = document.querySelectorAll(".modal-overlay");
  overlays.forEach((o) => {
    // On ne peut pas distinguer facilement les overlays, on supprime celui de "gestion projet"
    const title = o.querySelector("#project-meta-title");
    if (title) o.remove();
  });
  currentProjectModalCardId = null;
  if (projectMetaEscapeHandler) {
    document.removeEventListener("keydown", projectMetaEscapeHandler);
    projectMetaEscapeHandler = null;
  }
  render();
}

function closeWorkflowLinkModal() {
  if (workflowLinkEscapeHandler) {
    document.removeEventListener("keydown", workflowLinkEscapeHandler);
    workflowLinkEscapeHandler = null;
  }
  document.querySelectorAll(".workflow-link-overlay").forEach((el) => el.remove());
}

function escapeJsString(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function openWorkflowLinkModal(cardId) {
  const found = findCard(cardId);
  if (!found) return;

  let list = [];
  try {
    if (window.supabaseShared && typeof window.supabaseShared.fetchWorkflows === "function") {
      const rows = await window.supabaseShared.fetchWorkflows();
      if (rows && Array.isArray(rows) && rows.length > 0) {
        list = rows
          .map((r) => (r && r.payload ? r.payload : r))
          .filter((w) => w && w.id != null);
      }
    }
  } catch (e) {
    console.warn("[Kanban] fetchWorkflows (sélecteur)", e);
  }
  if (list.length === 0) {
    try {
      const raw = localStorage.getItem("workflows");
      const parsed = raw ? JSON.parse(raw) : [];
      list = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      list = [];
    }
  }

  const rowsHtml =
    list.length === 0
      ? `<p class="workflow-picker-empty">Aucun workflow pour l’instant. Créez-en un dans l’onglet Workflows.</p>`
      : list
          .slice()
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .map((w) => {
            const wid = escapeJsString(String(w.id));
            return `
    <button type="button" class="workflow-picker-row" role="option"
      onclick="setCardLinkedWorkflow('${escapeJsString(cardId)}', '${wid}')">
      <span class="workflow-picker-title">${escapeHtml(w.title || "Sans titre")}</span>
    </button>`;
          })
          .join("");

  const modal = document.createElement("div");
  modal.className = "modal-overlay workflow-link-overlay";
  modal.innerHTML = `
    <div class="modal-card workflow-link-modal" role="dialog" aria-modal="true" aria-labelledby="workflow-link-heading">
      <div class="modal-header">
        <h2 id="workflow-link-heading" class="workflow-link-heading">Connecter un workflow</h2>
        <button type="button" class="modal-close" aria-label="Fermer" onclick="closeWorkflowLinkModal()">✕</button>
      </div>
      <p class="workflow-picker-hint">Choisissez le workflow lié à ce projet. Un raccourci <strong>w</strong> apparaîtra sur la carte.</p>
      <div class="workflow-picker-list" role="listbox">${rowsHtml}</div>
      ${
        found.card.linkedWorkflowId
          ? `<button type="button" class="modal-btn modal-btn-delete workflow-picker-unlink" onclick="setCardLinkedWorkflow('${escapeJsString(cardId)}', null)">Dissocier le workflow</button>`
          : ""
      }
      <div class="modal-footer">
        <button type="button" class="modal-btn modal-btn-close" onclick="closeWorkflowLinkModal()">Fermer</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeWorkflowLinkModal();
      if (workflowLinkEscapeHandler) {
        document.removeEventListener("keydown", workflowLinkEscapeHandler);
        workflowLinkEscapeHandler = null;
      }
    }
  };
  if (workflowLinkEscapeHandler) {
    document.removeEventListener("keydown", workflowLinkEscapeHandler);
  }
  workflowLinkEscapeHandler = handleEscape;
  document.addEventListener("keydown", workflowLinkEscapeHandler);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeWorkflowLinkModal();
  });
  modal.querySelector(".modal-card")?.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

function setCardLinkedWorkflow(cardId, workflowId) {
  const found = findCard(cardId);
  if (!found) return;
  const { card } = found;
  if (workflowId == null || workflowId === "" || workflowId === "null") {
    card.linkedWorkflowId = null;
  } else {
    card.linkedWorkflowId = String(workflowId);
  }
  card.updatedAt = new Date().toISOString();
  saveState();
  closeWorkflowLinkModal();
  render();
}

function openLinkedWorkflowNavigation(workflowId) {
  if (workflowId == null || workflowId === "") return;
  const id = String(workflowId);
  try {
    if (
      window.parent &&
      window.parent !== window &&
      typeof window.parent.dashboardOpenWorkflow === "function"
    ) {
      window.parent.dashboardOpenWorkflow(id);
      return;
    }
  } catch (e) {
    /* origine différente (iframe) */
  }
  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  const qs = new URLSearchParams();
  if (isMobile) qs.set("compact", "1");
  qs.set("open", id);
  window.location.href = "../workflow/workflow-generator.html?" + qs.toString();
}

function openCardModal(cardId) {
  currentModalCardId = cardId;
  const result = findCard(cardId);
  if (!result) return;

  const { card, list } = result;

  // Créer le modal
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-labelledby="modal-title" aria-modal="true">
      <div class="modal-header">
        <input
          type="text"
          id="modal-title"
          class="modal-title-input"
          value="${escapeHtml(card.title)}"
          aria-label="Titre de la carte"
        />
        <button class="modal-close" aria-label="Fermer" onclick="closeCardModal()">
          ✕
        </button>
      </div>
      
      <div class="modal-info">
        Colonne : <strong>${escapeHtml(list.title)}</strong>
      </div>
      
      <div class="priority-selector">
        <span class="priority-label">Priorité :</span>
        <button class="priority-badge priority-red ${card.priority === 'red' ? 'active' : ''}" 
                onclick="updateCardPriority('${cardId}', 'red')" 
                aria-label="Priorité haute">●</button>
        <button class="priority-badge priority-orange ${card.priority === 'orange' ? 'active' : ''}" 
                onclick="updateCardPriority('${cardId}', 'orange')" 
                aria-label="Priorité moyenne">●</button>
        <button class="priority-badge priority-green ${card.priority === 'green' ? 'active' : ''}" 
                onclick="updateCardPriority('${cardId}', 'green')" 
                aria-label="Priorité basse">●</button>
      </div>
      
      <div class="modal-body">
        <label class="modal-label" for="modal-note">Notes détaillées</label>
        <textarea
          id="modal-note"
          class="modal-note"
          placeholder="Ajoutez des notes détaillées ici..."
          aria-label="Notes de la carte"
        >${escapeHtml(card.note)}</textarea>
      </div>
      
      <div class="modal-footer">
        <button class="modal-btn modal-btn-delete" onclick="deleteCardFromModal('${cardId}')">
          🗑️ Supprimer
        </button>
        <button class="modal-btn modal-btn-close" onclick="closeCardModal()">
          Fermer
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Événements
  const titleInput = modal.querySelector("#modal-title");
  const noteTextarea = modal.querySelector("#modal-note");

  titleInput.addEventListener("input", () => {
    updateCardTitle(cardId, titleInput.value);
  });

  noteTextarea.addEventListener("input", () => {
    updateCardNote(cardId, noteTextarea.value);
  });

  // Fermer avec Escape
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeCardModal();
      if (cardModalEscapeHandler) {
        document.removeEventListener("keydown", cardModalEscapeHandler);
        cardModalEscapeHandler = null;
      }
    }
  };
  if (cardModalEscapeHandler) {
    document.removeEventListener("keydown", cardModalEscapeHandler);
  }
  cardModalEscapeHandler = handleEscape;
  document.addEventListener("keydown", cardModalEscapeHandler);

  // Fermer en cliquant sur l'overlay
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeCardModal();
    }
  });

  // Empêcher la propagation des clics sur le contenu du modal
  modal.querySelector(".modal-card").addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Focus sur le titre
  setTimeout(() => titleInput.focus(), 100);
}

function closeCardModal() {
  const modal = document.querySelector(".modal-overlay");
  if (modal) {
    modal.remove();
  }
  currentModalCardId = null;
  if (cardModalEscapeHandler) {
    document.removeEventListener("keydown", cardModalEscapeHandler);
    cardModalEscapeHandler = null;
  }
  render();
}

function deleteCardFromModal(cardId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette carte ?")) {
    deleteCard(cardId);
    closeCardModal();
  }
}

// ===========================
// DRAG & DROP
// ===========================
let draggedCard = null;
let draggedFromList = null;

function handleDragStart(event) {
  const cardElement = event.target.closest(".card");
  if (!cardElement) return;

  const cardId = cardElement.dataset.cardId;
  const result = findCard(cardId);

  if (result) {
    draggedCard = result.card;
    draggedFromList = result.list;
    cardElement.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleDragEnd(event) {
  const cardElement = event.target.closest(".card");
  if (cardElement) {
    cardElement.classList.remove("dragging");
  }
  draggedCard = null;
  draggedFromList = null;
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";

  const columnElement = event.target.closest(".column");
  if (columnElement && !columnElement.classList.contains("dragging")) {
    columnElement.classList.add("drag-over");
  }
}

function handleDragLeave(event) {
  const columnElement = event.target.closest(".column");
  if (columnElement) {
    // Vérifier si on quitte vraiment la colonne (pas juste un enfant)
    const rect = columnElement.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      columnElement.classList.remove("drag-over");
    }
  }
}

function handleDrop(event) {
  event.preventDefault();

  const columnElement = event.target.closest(".column");
  if (!columnElement || !draggedCard || !draggedFromList) return;

  columnElement.classList.remove("drag-over");

  const targetListId = columnElement.dataset.listId;
  const targetList = state.lists.find((l) => l.id === targetListId);

  if (!targetList) return;

  // Si on dépose dans la même liste, ne rien faire
  if (draggedFromList.id === targetList.id) return;

  // Retirer la carte de la liste source
  const sourceIndex = draggedFromList.cards.findIndex((c) => c.id === draggedCard.id);
  if (sourceIndex !== -1) {
    draggedFromList.cards.splice(sourceIndex, 1);
  }

  // Ajouter la carte à la liste cible
  targetList.cards.push(draggedCard);

  saveState();
  render();
}

// ===========================
// RENDU
// ===========================
function render() {
  const board = document.getElementById("board");
  if (!board) return;

  // Nouvelle présentation : grille de "boards/cards" filtrées par vue
  const listTodo = state.lists.find((l) => l.id === "todo");
  const listDoing = state.lists.find((l) => l.id === "doing");
  const listDone = state.lists.find((l) => l.id === "done");

  const cardsTodo = []
    .concat(listTodo?.cards || [], listDoing?.cards || [])
    .filter(cardMatchesFilter);
  const cardsDone = (listDone?.cards || []).filter(cardMatchesFilter);

  const cards = state.viewMode === "done" ? cardsDone : cardsTodo;
  const sortedCards =
    state.viewMode === "done"
      ? cards
      : cards
          .slice()
          .sort((a, b) => {
            const aChecklist = (a.checklist || []).map(normalizeChecklistEntry);
            const bChecklist = (b.checklist || []).map(normalizeChecklistEntry);
            const aPending = aChecklist.filter((t) => !t.done).length;
            const bPending = bChecklist.filter((t) => !t.done).length;
            if (aPending !== bPending) return bPending - aPending;

            const at = new Date(a.updatedAt || 0).getTime() || 0;
            const bt = new Date(b.updatedAt || 0).getTime() || 0;
            if (at !== bt) return bt - at;

            return String(a.id).localeCompare(String(b.id));
          });

  board.classList.add("board-cards");

  if (!cards.length) {
    board.innerHTML = `
      <div class="empty">
        ${state.filter ? "Aucune carte ne correspond au filtre" : "Aucune carte — ajoutez-en une !"}
      </div>
    `;
    updatePendingBadge();
    setupKeyboardHandlers();
    return;
  }

  board.innerHTML = sortedCards
    .map((card, cardIndex) => {
      const subtitle = cardSubtitleFromNote(card.note);
      const sortedChecklist = sortChecklistForPreview(card.checklist || []);
      const pendingItems = sortedChecklist.filter((c) => !c.item.done);
      const doneItems = sortedChecklist.filter((c) => c.item.done);
      const doneCountHidden = doneItems.length;
      const doneCount = sortedChecklist.filter((c) => c.item.done).length;
      const progressPct =
        sortedChecklist.length > 0 ? Math.round((doneCount / sortedChecklist.length) * 100) : 0;
      const statusClass =
        card.priority === "red"
          ? "is-blocked"
          : card.priority === "green"
            ? "is-active"
            : card.priority === "orange"
              ? "is-progress"
              : "is-neutral";
      const updatedLine = formatRelativeUpdated(card.updatedAt);

      return `
        <section
          class="board-card ${card.priority ? "priority-" + card.priority : ""}"
          data-card-id="${card.id}"
          style="--card-stagger: ${cardIndex}"
        >
          <div class="board-card-header">
            <div class="board-card-heading">
              <button
                type="button"
                class="card-status-pill ${statusClass}"
                onclick="event.stopPropagation(); cycleCardPriority('${card.id}')"
                aria-label="Changer le statut du projet (neutre, en cours, actif, bloqué)"
                title="Statut"
              ></button>
              <div class="board-card-title-block">
                <input
                  type="text"
                  class="board-card-title-input"
                  value="${escapeHtml(card.title)}"
                  onchange="updateCardTitle('${card.id}', this.value)"
                  onclick="event.stopPropagation()"
                  aria-label="Titre de la carte"
                />
                ${
                  subtitle
                    ? `<p class="board-card-subtitle">${escapeHtml(subtitle)}</p>`
                    : ""
                }
              </div>
            </div>
            ${
              card.linkedWorkflowId
                ? `<button
                type="button"
                class="board-card-workflow-jump"
                onclick="event.stopPropagation(); openLinkedWorkflowNavigation('${escapeJsString(String(card.linkedWorkflowId))}')"
                aria-label="Ouvrir le workflow lié"
                title="Ouvrir le workflow"
              >w</button>`
                : ""
            }
            <details class="board-card-menu" onclick="event.stopPropagation()">
              <summary class="board-card-menu-trigger" aria-label="Actions du projet">⋯</summary>
              <div class="board-card-menu-panel" role="menu">
                ${
                  state.viewMode === "done"
                    ? ""
                    : `<button type="button" class="board-card-menu-item" role="menuitem"
                        onclick="event.stopPropagation(); toggleCardDone('${card.id}'); this.closest('details').removeAttribute('open')">
                        Marquer terminée
                      </button>`
                }
                <button type="button" class="board-card-menu-item" role="menuitem"
                  onclick="event.stopPropagation(); openProjectMetaModal('${card.id}'); this.closest('details').removeAttribute('open')">
                  Dates &amp; échéance
                </button>
                <button type="button" class="board-card-menu-item" role="menuitem"
                  onclick="event.stopPropagation(); openWorkflowLinkModal('${escapeJsString(card.id)}'); this.closest('details').removeAttribute('open')">
                  Connecter un workflow…
                </button>
                <div class="board-card-menu-divider" role="presentation"></div>
                <button type="button" class="board-card-menu-item" role="menuitem"
                  onclick="event.stopPropagation(); updateCardPriority('${card.id}', 'red'); this.closest('details').removeAttribute('open')">
                  Statut bloqué
                </button>
                <button type="button" class="board-card-menu-item" role="menuitem"
                  onclick="event.stopPropagation(); updateCardPriority('${card.id}', 'orange'); this.closest('details').removeAttribute('open')">
                  En cours
                </button>
                <button type="button" class="board-card-menu-item" role="menuitem"
                  onclick="event.stopPropagation(); updateCardPriority('${card.id}', 'green'); this.closest('details').removeAttribute('open')">
                  Actif
                </button>
              </div>
            </details>
          </div>

          <div class="card-checklist">
            ${pendingItems
              .map(
                ({ item, originalIndex }) => `
              <button
                type="button"
                class="checklist-row ${item.done ? "is-done" : ""}"
                onclick="event.stopPropagation(); toggleChecklistItem('${card.id}', ${originalIndex})"
                aria-label="${item.done ? "Marquer la sous-tâche comme à faire" : "Marquer la sous-tâche comme faite"}"
                title="Cocher / décocher"
              >
                <span class="checklist-box" aria-hidden="true"></span>
                <span class="checklist-text">${escapeHtml(item.text)}</span>
              </button>
            `
              )
              .join("")}
            ${
              doneCountHidden > 0
                ? `<details class="checklist-more-wrap" onclick="event.stopPropagation()">
                    <summary class="checklist-more-summary">Tâches terminées (${doneCountHidden})</summary>
                    ${doneItems
                      .map(({ item, originalIndex }) => {
                        return `
                      <button
                        type="button"
                        class="checklist-row is-done"
                        onclick="event.stopPropagation(); toggleChecklistItem('${card.id}', ${originalIndex})"
                        aria-label="Marquer la sous-tâche comme à faire"
                        title="Décocher"
                      >
                        <span class="checklist-box" aria-hidden="true"></span>
                        <span class="checklist-text">${escapeHtml(item.text)}</span>
                      </button>
                    `;
                      })
                      .join("")}
                  </details>`
                : ""
            }
          </div>

          ${
            sortedChecklist.length > 0
              ? `<div class="board-card-progress" role="presentation" aria-hidden="true">
                  <span class="board-card-progress-bar" style="width:${progressPct}%"></span>
                </div>`
              : ""
          }

          <div class="board-card-meta-footer">
            <div class="board-card-avatars" aria-hidden="true">
              <span class="avatar-chip"></span>
              <span class="avatar-chip"></span>
            </div>
            <time class="board-card-updated" datetime="${escapeHtml(card.updatedAt || "")}">${escapeHtml(updatedLine)}</time>
          </div>

          ${
            state.viewMode === "done"
              ? ""
              : `<div class="board-card-compose">
                  <input
                    type="text"
                    class="board-card-input checklist-input"
                    data-card-id="${card.id}"
                    placeholder="Nouvelle action…"
                    onclick="event.stopPropagation()"
                    aria-label="Ajouter une sous-tâche"
                  />
                  <button
                    type="button"
                    class="board-card-add"
                    onclick="event.stopPropagation(); addChecklistItemValue('${card.id}', this.previousElementSibling.value); this.previousElementSibling.value='';"
                    aria-label="Ajouter"
                    title="Ajouter"
                  >
                    +
                  </button>
                </div>`
          }
        </section>
      `;
    })
    .join("");

  updatePendingBadge();
  setupKeyboardHandlers();
}

// ===========================
// GESTION DU CLAVIER
// ===========================
function setupKeyboardHandlers() {
  // Gestion de Enter et Esc pour les inputs de titre
  document.querySelectorAll(".card-title, .column-title").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        input.blur();
      }
    });
  });

  // Permettre l'activation des cartes avec Enter
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target === card) {
        e.preventDefault();
        const cardId = card.dataset.cardId;
        openCardModal(cardId);
      }
    });
  });

  // Ajout de sous-tâches via input (Entrée)
  document.querySelectorAll(".checklist-input").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const cardId = input.dataset.cardId;
      const value = input.value;
      input.value = "";
      addChecklistItemValue(cardId, value);
    });
  });
}

// ===========================
// INITIALISATION
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("compact") === "1") {
    document.body.classList.add("compact");
  }

  await loadBoardState();
  if (!state.viewMode) state.viewMode = "todo";
  render();
  syncViewToggleUI();

  // Bouton "Nouvelle carte" dans le header
  const btnNewCard = document.getElementById("btn-new-card");
  if (btnNewCard) {
    btnNewCard.addEventListener("click", () => {
      // Ajoute la carte dans la première liste ("À faire")
      if (state.lists.length > 0) {
        addCard(state.lists[0].id);
      }
    });
  }

  // Switch vue
  document.getElementById("view-todo")?.addEventListener("click", () => setViewMode("todo"));
  document.getElementById("view-done")?.addEventListener("click", () => setViewMode("done"));

  // Filtre
  const filterInput = document.getElementById("filter-input");
  if (filterInput) {
    filterInput.addEventListener("input", (e) => {
      updateFilter(e.target.value);
    });

    // Restaurer la valeur du filtre si elle existe
    if (state.filter) {
      filterInput.value = state.filter;
    }
  }

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      document.getElementById("filter-input")?.focus();
    }
  });
});
