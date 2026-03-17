// ===========================
// ÉTAT GLOBAL
// ===========================
let state = {
  notes: [],
  filter: "",
};

const STORAGE_KEY = "notesData";
const COLORS = [
  { id: "yellow", hex: "#fbbf24" },
  { id: "green", hex: "#34d399" },
  { id: "blue", hex: "#60a5fa" },
  { id: "pink", hex: "#f472b6" },
  { id: "purple", hex: "#a78bfa" },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===========================
// PERSISTANCE
// ===========================
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      state.notes = data.notes || [];
      state.filter = data.filter || "";
    }
  } catch (e) {
    console.error("Erreur chargement notes:", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      notes: state.notes,
      filter: state.filter,
    }));
    if (window.supabaseShared) {
      state.notes.forEach((n) => window.supabaseShared.upsertNote(n));
    }
  } catch (e) {
    console.error("Erreur sauvegarde notes:", e);
  }
}

async function loadNotesState() {
  if (window.supabaseShared) {
    try {
      const rows = await window.supabaseShared.fetchNotes();
      if (rows && Array.isArray(rows) && rows.length > 0) {
        state.notes = rows.map((r) => r.payload || r);
        render();
        return;
      }
    } catch (e) {
      console.warn("[Notes] Supabase load failed, fallback localStorage", e);
    }
  }
  loadState();
  render();
}

// ===========================
// RENDU
// ===========================
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderColorPicker(selectedColorId) {
  const container = document.getElementById("color-picker");
  if (!container) return;
  container.innerHTML = COLORS.map(c => `
    <button
      type="button"
      class="color-btn ${selectedColorId === c.id ? "active" : ""}"
      data-color="${c.id || ""}"
      style="background: ${c.hex}"
      title="${c.id}"
      aria-label="Couleur ${c.id}"
    ></button>
  `).join("");
  container.querySelectorAll(".color-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function render() {
  const grid = document.getElementById("notes-grid");
  if (!grid) return;

  const filterLower = state.filter.toLowerCase().trim();
  const filtered = state.notes.filter(n => {
    if (!filterLower) return true;
    const search = filterLower;
    return (n.title || "").toLowerCase().includes(search) ||
           (n.content || "").toLowerCase().includes(search) ||
           (n.code || "").toLowerCase().includes(search);
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="notes-empty">
        <p>${state.filter ? "Aucune note ne correspond au filtre." : "Aucune note. Cliquez sur « Nouvelle note » pour commencer."}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(note => {
    const colorClass = note.color ? `note-color-${note.color}` : "";
    const title = escapeHtml(note.title || "Sans titre");
    const content = escapeHtml((note.content || "").slice(0, 200));
    const codePreview = escapeHtml((note.code || "").trim().split("\n")[0] || "").slice(0, 60);
    return `
      <article class="note-card ${colorClass}" data-note-id="${note.id}" role="listitem">
        <div class="note-card-title">${title || "Sans titre"}</div>
        ${content ? `<div class="note-card-content">${content}</div>` : ""}
        ${note.code ? `<div class="note-card-code">${codePreview}</div>` : ""}
      </article>
    `;
  }).join("");

  grid.querySelectorAll(".note-card").forEach(card => {
    card.addEventListener("click", () => openModal(card.dataset.noteId));
  });
}

// ===========================
// MODAL
// ===========================
let currentNoteId = null;

function openModal(noteId = null) {
  currentNoteId = noteId;
  const modal = document.getElementById("note-modal");
  const titleInput = document.getElementById("modal-title");
  const contentInput = document.getElementById("modal-content");
  const codeInput = document.getElementById("modal-code");
  const deleteBtn = document.getElementById("modal-delete");

  modal.classList.add("active");

  if (noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (note) {
      titleInput.value = note.title || "";
      contentInput.value = note.content || "";
      codeInput.value = note.code || "";
      renderColorPicker(note.color);
      deleteBtn.style.display = "block";
    }
  } else {
    titleInput.value = "";
    contentInput.value = "";
    codeInput.value = "";
    renderColorPicker(null);
    deleteBtn.style.display = "none";
  }

  titleInput.focus();
}

function closeModal() {
  document.getElementById("note-modal").classList.remove("active");
  currentNoteId = null;
}

function getSelectedColor() {
  const active = document.querySelector(".color-picker .color-btn.active");
  return active ? active.dataset.color || null : null;
}

function saveNote() {
  const title = document.getElementById("modal-title").value.trim();
  const content = document.getElementById("modal-content").value;
  const code = document.getElementById("modal-code").value.trim();
  const color = getSelectedColor();

  if (currentNoteId) {
    const note = state.notes.find(n => n.id === currentNoteId);
    if (note) {
      note.title = title || "Sans titre";
      note.content = content;
      note.code = code || null;
      note.color = color || null;
    }
  } else {
    state.notes.unshift({
      id: generateId(),
      title: title || "Sans titre",
      content,
      code: code || null,
      color: color || null,
    });
  }

  saveState();
  render();
  closeModal();
}

function deleteNote() {
  if (!currentNoteId || !confirm("Supprimer cette note ?")) return;
  const id = currentNoteId;
  state.notes = state.notes.filter(n => n.id !== id);
  saveState();
  if (window.supabaseShared) {
    window.supabaseShared.deleteNoteSupabase(id);
  }
  render();
  closeModal();
}

// Copier le code
document.getElementById("btn-copy-code")?.addEventListener("click", () => {
  const code = document.getElementById("modal-code").value;
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById("btn-copy-code");
    const orig = btn.textContent;
    btn.textContent = "Copié !";
    setTimeout(() => { btn.textContent = orig; }, 1500);
  });
});

// ===========================
// INIT
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("compact") === "1") {
    document.body.classList.add("compact");
  }

  await loadNotesState();

  document.getElementById("btn-new-note")?.addEventListener("click", () => openModal());
  document.getElementById("modal-close")?.addEventListener("click", closeModal);
  document.getElementById("modal-save")?.addEventListener("click", saveNote);
  document.getElementById("modal-delete")?.addEventListener("click", deleteNote);

  const filterInput = document.getElementById("filter-input");
  if (filterInput) {
    filterInput.value = state.filter;
    filterInput.addEventListener("input", e => {
      state.filter = e.target.value;
      saveState();
      render();
    });
  }

  document.getElementById("note-modal")?.addEventListener("click", e => {
    if (e.target.id === "note-modal") closeModal();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
});
