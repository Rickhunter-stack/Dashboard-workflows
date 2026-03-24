let state = {
  templates: [],
  filter: "",
};

const STORAGE_KEY = "promptTemplatesData";
let currentTemplateId = null;
let supabaseTemplatesSaveTimeoutId = null;
const SUPABASE_TEMPLATES_SAVE_DEBOUNCE_MS = 400;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function relativeDate(iso) {
  if (!iso) return "Nouveau";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "Nouveau";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.templates = [
        {
          id: generateId(),
          title: "Prompt dashboard web app",
          prompt:
            "Agis comme un Senior Product Designer + Frontend Engineer. Conçois un dashboard moderne (dark mode), mobile-first, avec navigation claire, KPI cards, actions rapides et cohérence visuelle premium.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          title: "Prompt application SaaS",
          prompt:
            "Crée une structure d'application SaaS orientée conversion: onboarding court, vues principales claires, composants réutilisables, feedback utilisateur et plan de montée en charge.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      saveState();
      return;
    }
    const parsed = JSON.parse(raw);
    state.templates = Array.isArray(parsed.templates) ? parsed.templates : [];
    state.filter = typeof parsed.filter === "string" ? parsed.filter : "";
  } catch (error) {
    console.error("[Templates] loadState failed", error);
    state.templates = [];
    state.filter = "";
  }
}

async function loadTemplatesState() {
  if (window.supabaseShared && typeof window.supabaseShared.fetchTemplates === "function") {
    try {
      const rows = await window.supabaseShared.fetchTemplates();
      if (rows && Array.isArray(rows) && rows.length > 0) {
        state.templates = rows.map((r) => r.payload || r);
        return;
      }
    } catch (error) {
      console.warn("[Templates] Supabase load failed, fallback localStorage", error);
    }
  }
  loadState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (window.supabaseShared && typeof window.supabaseShared.upsertTemplate === "function") {
      if (supabaseTemplatesSaveTimeoutId) clearTimeout(supabaseTemplatesSaveTimeoutId);
      supabaseTemplatesSaveTimeoutId = setTimeout(() => {
        state.templates.forEach((t) => {
          window.supabaseShared
            .upsertTemplate(t)
            .catch((error) => console.warn("[Templates] Supabase upsertTemplate failed", error));
        });
      }, SUPABASE_TEMPLATES_SAVE_DEBOUNCE_MS);
    }
  } catch (error) {
    console.error("[Templates] saveState failed", error);
  }
}

window.addEventListener("pagehide", () => {
  if (!window.supabaseShared || typeof window.supabaseShared.upsertTemplate !== "function") return;
  if (supabaseTemplatesSaveTimeoutId) clearTimeout(supabaseTemplatesSaveTimeoutId);
  supabaseTemplatesSaveTimeoutId = null;
  state.templates.forEach((t) => {
    window.supabaseShared
      .upsertTemplate(t)
      .catch((error) => console.warn("[Templates] Supabase final upsertTemplate failed", error));
  });
});

window.addEventListener("beforeunload", () => {
  if (!window.supabaseShared || typeof window.supabaseShared.upsertTemplate !== "function") return;
  if (supabaseTemplatesSaveTimeoutId) clearTimeout(supabaseTemplatesSaveTimeoutId);
  supabaseTemplatesSaveTimeoutId = null;
  state.templates.forEach((t) => {
    window.supabaseShared
      .upsertTemplate(t)
      .catch((error) => console.warn("[Templates] Supabase final upsertTemplate failed", error));
  });
});

function getFilteredTemplates() {
  const q = state.filter.trim().toLowerCase();
  if (!q) return state.templates;
  return state.templates.filter((t) => {
    const title = (t.title || "").toLowerCase();
    const prompt = (t.prompt || "").toLowerCase();
    return title.includes(q) || prompt.includes(q);
  });
}

function render() {
  const grid = document.getElementById("templates-grid");
  if (!grid) return;

  const list = getFilteredTemplates();
  if (!list.length) {
    grid.innerHTML = `<div class="templates-empty">${
      state.filter
        ? "Aucun template ne correspond au filtre."
        : "Aucun template pour le moment. Clique sur « Nouveau template »."
    }</div>`;
    return;
  }

  grid.innerHTML = list
    .slice()
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .map((item) => {
      return `
        <article class="template-card" data-template-id="${escapeHtml(item.id)}" role="listitem">
          <div class="template-card-header">
            <h3 class="template-title">${escapeHtml(item.title || "Sans titre")}</h3>
            <button type="button" class="template-delete-btn" data-delete-id="${escapeHtml(item.id)}" aria-label="Supprimer ce template">🗑</button>
          </div>
          <div class="template-content">${escapeHtml(item.prompt || "")}</div>
          <div class="template-meta">Mis à jour ${escapeHtml(relativeDate(item.updatedAt))}</div>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll(".template-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.templateId));
  });

  grid.querySelectorAll(".template-delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.deleteId;
      removeTemplate(id);
    });
  });
}

function openModal(templateId = null) {
  currentTemplateId = templateId;
  const modal = document.getElementById("template-modal");
  const titleInput = document.getElementById("template-modal-title");
  const promptInput = document.getElementById("template-modal-prompt");
  const deleteBtn = document.getElementById("template-modal-delete");
  if (!modal || !titleInput || !promptInput || !deleteBtn) return;

  if (templateId) {
    const t = state.templates.find((x) => x.id === templateId);
    titleInput.value = t?.title || "";
    promptInput.value = t?.prompt || "";
    deleteBtn.style.display = "inline-flex";
  } else {
    titleInput.value = "";
    promptInput.value = "";
    deleteBtn.style.display = "none";
  }

  modal.classList.add("active");
  titleInput.focus();
}

function closeModal() {
  const modal = document.getElementById("template-modal");
  if (!modal) return;
  modal.classList.remove("active");
  currentTemplateId = null;
}

function saveTemplate() {
  const titleInput = document.getElementById("template-modal-title");
  const promptInput = document.getElementById("template-modal-prompt");
  const title = (titleInput?.value || "").trim();
  const prompt = (promptInput?.value || "").trim();
  if (!title && !prompt) {
    closeModal();
    return;
  }

  if (currentTemplateId) {
    const t = state.templates.find((x) => x.id === currentTemplateId);
    if (t) {
      t.title = title || "Sans titre";
      t.prompt = prompt;
      t.updatedAt = new Date().toISOString();
    }
  } else {
    state.templates.unshift({
      id: generateId(),
      title: title || "Sans titre",
      prompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveState();
  render();
  closeModal();
}

function removeTemplate(id) {
  if (!id) return;
  if (!confirm("Supprimer ce template ?")) return;
  state.templates = state.templates.filter((t) => t.id !== id);
  saveState();
  if (window.supabaseShared && typeof window.supabaseShared.deleteTemplate === "function") {
    window.supabaseShared
      .deleteTemplate(id)
      .catch((error) => console.warn("[Templates] Supabase deleteTemplate failed", error));
  }
  render();
  if (currentTemplateId === id) closeModal();
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("compact") === "1") {
    document.body.classList.add("compact");
  }

  await loadTemplatesState();
  render();

  const filterInput = document.getElementById("filter-input");
  const btnNew = document.getElementById("btn-new-template");
  const btnSave = document.getElementById("template-modal-save");
  const btnDelete = document.getElementById("template-modal-delete");
  const btnClose = document.getElementById("template-modal-close");
  const modal = document.getElementById("template-modal");

  if (filterInput) {
    filterInput.value = state.filter;
    filterInput.addEventListener("input", (e) => {
      state.filter = e.target.value || "";
      saveState();
      render();
    });
  }

  btnNew?.addEventListener("click", () => openModal());
  btnSave?.addEventListener("click", saveTemplate);
  btnDelete?.addEventListener("click", () => removeTemplate(currentTemplateId));
  btnClose?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (modal?.classList.contains("active")) closeModal();
  });
});
