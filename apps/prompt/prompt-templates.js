(function () {
  const STORAGE_KEY = "promptAppSavedTemplates";

  function grid() {
    return document.getElementById("prompt-templates-grid");
  }

  function filterInput() {
    return document.getElementById("prompt-templates-filter");
  }

  function modal() {
    return document.getElementById("prompt-template-modal");
  }

  function modalTitle() {
    return document.getElementById("prompt-template-modal-title");
  }

  function modalBody() {
    return document.getElementById("prompt-template-modal-body");
  }

  let editingId = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function previewText(text, max) {
    const t = (text || "").replace(/\s+/g, " ").trim();
    return t.length > max ? t.slice(0, max) + "…" : t;
  }

  function newId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "t_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  function getFiltered() {
    const q = (filterInput()?.value || "").trim().toLowerCase();
    let list = load();
    if (q) {
      list = list.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(q) ||
          (t.body || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return list;
  }

  function openModal() {
    const m = modal();
    if (!m) return;
    m.classList.add("active");
    m.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    const m = modal();
    if (!m) return;
    m.classList.remove("active");
    m.setAttribute("aria-hidden", "true");
    editingId = null;
  }

  function openEdit(id) {
    const t = load().find((x) => x.id === id);
    if (!t) return;
    editingId = id;
    if (modalTitle()) modalTitle().value = t.title || "";
    if (modalBody()) modalBody().value = t.body || "";
    openModal();
  }

  function openNew() {
    editingId = null;
    if (modalTitle()) modalTitle().value = "";
    if (modalBody()) modalBody().value = "";
    openModal();
  }

  function persistFromModal() {
    const title = (modalTitle()?.value || "").trim();
    const body = modalBody()?.value || "";
    if (!title && !body) {
      window.alert("Ajoutez au moins un titre ou le texte du prompt.");
      return;
    }
    let list = load();
    const now = Date.now();
    if (editingId) {
      list = list.map((x) =>
        x.id === editingId
          ? { ...x, title: title || "Sans titre", body, updatedAt: now }
          : x
      );
    } else {
      list.push({
        id: newId(),
        title: title || "Sans titre",
        body,
        updatedAt: now,
      });
    }
    save(list);
    closeModal();
    render();
  }

  function copyModalBody() {
    const text = modalBody()?.value || "";
    if (!text) return;
    const btn = document.getElementById("prompt-template-copy-btn");
    const restore = btn ? btn.textContent : "";
    const done = () => {
      if (btn) {
        btn.textContent = "Copié ✓";
        setTimeout(() => {
          btn.textContent = restore;
        }, 2000);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      console.error(e);
    }
    document.body.removeChild(ta);
  }

  function render() {
    const g = grid();
    if (!g) return;
    const list = getFiltered();
    if (list.length === 0) {
      g.innerHTML =
        '<p class="prompt-templates-empty">Aucun template pour l’instant. Utilisez « Nouveau template » pour en ajouter un.</p>';
      return;
    }
    g.innerHTML = list
      .map((t) => {
        const title = escapeHtml(t.title || "Sans titre");
        const prevRaw = previewText(t.body, 200);
        const prev = prevRaw
          ? escapeHtml(prevRaw)
          : '<span class="prompt-templates-muted">Prompt vide</span>';
        const idAttr = escapeAttr(t.id);
        return (
          '<article class="prompt-template-card" data-id="' +
          idAttr +
          '" role="listitem">' +
          '<div class="prompt-template-card-head">' +
          '<h3 class="prompt-template-card-title">' +
          title +
          "</h3>" +
          '<button type="button" class="prompt-template-delete" data-action="delete" aria-label="Supprimer ce template">✕</button>' +
          "</div>" +
          '<div class="prompt-template-card-preview">' +
          prev +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    g.querySelectorAll(".prompt-template-card").forEach((card) => {
      const id = card.getAttribute("data-id");
      if (!id) return;
      card.addEventListener("click", (e) => {
        if (e.target.closest('[data-action="delete"]')) return;
        openEdit(id);
      });
    });

    g.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = btn.closest(".prompt-template-card");
        const id = card && card.getAttribute("data-id");
        if (!id) return;
        if (!window.confirm("Supprimer ce template ?")) return;
        const next = load().filter((x) => x.id !== id);
        save(next);
        if (editingId === id) closeModal();
        render();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .getElementById("prompt-templates-new")
      ?.addEventListener("click", openNew);
    filterInput()?.addEventListener("input", render);
    document
      .getElementById("prompt-template-modal-save")
      ?.addEventListener("click", persistFromModal);
    document
      .getElementById("prompt-template-modal-close")
      ?.addEventListener("click", closeModal);
    document
      .getElementById("prompt-template-copy-btn")
      ?.addEventListener("click", copyModalBody);

    modal()?.addEventListener("click", (e) => {
      if (e.target === modal()) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        modal() &&
        modal().classList.contains("active")
      ) {
        closeModal();
      }
    });

    render();
  });
})();
