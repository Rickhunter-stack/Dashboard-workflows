// ===========================
// ÉTAT GLOBAL
// ===========================
let state = {
  lists: [],
  filter: "",
  archived: [],
};

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
            note: "Vous pouvez ajouter des notes ici pour décrire cette tâche plus en détail.",
            priority: null,
            checklist: [],
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

// ===========================
// PERSISTANCE
// ===========================
const STORAGE_KEY = "kanbanLiteBoard";

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = JSON.parse(saved);
      if (!state.archived) state.archived = [];
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
      window.supabaseShared.upsertKanbanBoard(state);
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
  }
}

async function loadBoardState() {
  if (window.supabaseShared) {
    try {
      const board = await window.supabaseShared.fetchKanbanBoard();
      if (board && board.lists && Array.isArray(board.lists)) {
        state = board;
        if (board.filter !== undefined) state.filter = board.filter;
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
    priority: null,
    checklist: [],
  };

  list.cards.push(newCard);
  saveState();
  render();

  // Focus sur le titre de la nouvelle carte
  setTimeout(() => {
    const cardElement = document.querySelector(`[data-card-id="${newCard.id}"]`);
    if (cardElement) {
      const titleInput = cardElement.querySelector(".card-title");
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
  const removed = card.checklist[index];
  card.checklist.splice(index, 1);
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
  card.checklist.push(clean);
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
    card.note.toLowerCase().includes(searchText)
  );
}

// ===========================
// MODAL D'AGRANDISSEMENT
// ===========================
let currentModalCardId = null;

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
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);

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

  board.innerHTML = state.lists
    .map((list) => {
      const filteredCards = list.cards.filter(cardMatchesFilter);
      const visibleCount = filteredCards.length;
      const totalCount = list.cards.length;

      return `
      <div 
        class="column" 
        data-list-id="${list.id}"
        role="listitem"
        ondragover="handleDragOver(event)"
        ondragleave="handleDragLeave(event)"
        ondrop="handleDrop(event)"
      >
        <div class="column-header">
          <input
            type="text"
            class="column-title"
            value="${escapeHtml(list.title)}"
            onchange="updateListTitle('${list.id}', this.value)"
            aria-label="Titre de la colonne"
          />
          <span class="column-count" aria-label="${totalCount} carte(s)">${totalCount}</span>
          <button 
            class="btn-add-card" 
            onclick="addCard('${list.id}')"
            aria-label="Ajouter une carte à ${escapeHtml(list.title)}"
          >
            + Ajouter
          </button>
        </div>
        
        <div class="cards-container" role="list">
          ${
            filteredCards.length === 0
              ? `<div class="empty">
                  ${
                    state.filter
                      ? "Aucune carte ne correspond au filtre"
                      : "Aucune carte — ajoutez-en une !"
                  }
                </div>`
              : filteredCards
                  .map(
                    (card) => `
              <div 
                class="card ${card.priority ? 'priority-' + card.priority : ''}" 
                data-card-id="${card.id}"
                draggable="true"
                ondragstart="handleDragStart(event)"
                ondragend="handleDragEnd(event)"
                onclick="openCardModal('${card.id}')"
                role="listitem"
                tabindex="0"
                aria-label="Carte: ${escapeHtml(card.title)}"
              >
                <div class="card-header">
                  <div class="card-header-main">
                    <button
                      class="card-done-toggle"
                      onclick="event.stopPropagation(); toggleCardDone('${card.id}')"
                      aria-label="Marquer la carte comme terminée"
                    >
                      ✓
                    </button>
                    <input
                      type="text"
                      class="card-title"
                      value="${escapeHtml(card.title)}"
                      onchange="updateCardTitle('${card.id}', this.value)"
                      onclick="event.stopPropagation()"
                      aria-label="Titre de la carte"
                    />
                  </div>
                  <div class="card-actions">
                    <div class="priority-badges">
                      <button class="priority-badge-mini priority-red ${card.priority === 'red' ? 'active' : ''}" 
                              onclick="event.stopPropagation(); updateCardPriority('${card.id}', 'red')" 
                              aria-label="Priorité haute" title="Priorité haute">●</button>
                      <button class="priority-badge-mini priority-orange ${card.priority === 'orange' ? 'active' : ''}" 
                              onclick="event.stopPropagation(); updateCardPriority('${card.id}', 'orange')" 
                              aria-label="Priorité moyenne" title="Priorité moyenne">●</button>
                      <button class="priority-badge-mini priority-green ${card.priority === 'green' ? 'active' : ''}" 
                              onclick="event.stopPropagation(); updateCardPriority('${card.id}', 'green')" 
                              aria-label="Priorité basse" title="Priorité basse">●</button>
                    </div>
                  </div>
                </div>
                <div class="card-checklist">
                  ${
                    card.checklist && card.checklist.length
                      ? card.checklist
                          .map(
                            (item, idx) => `
                    <button
                      type="button"
                      class="checklist-row"
                      onclick="event.stopPropagation(); toggleChecklistItem('${card.id}', ${idx})"
                      aria-label="Terminer la sous-tâche"
                      title="Terminer"
                    >
                      <span class="checklist-box" aria-hidden="true"></span>
                      <span class="checklist-text">${escapeHtml(item)}</span>
                    </button>
                  `
                          )
                          .join("")
                      : ""
                  }
                  <input
                    type="text"
                    class="checklist-input"
                    data-card-id="${card.id}"
                    placeholder="+ Sous-tâche (Entrée)"
                    onclick="event.stopPropagation()"
                    aria-label="Ajouter une sous-tâche"
                  />
                </div>
              </div>
            `
                  )
                  .join("")
          }
        </div>
      </div>
    `;
    })
    .join("");

  // Ajouter les gestionnaires d'événements pour le clavier
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
  render();

  // Toggle info section
  const infoToggle = document.getElementById("info-toggle");
  const infoContent = document.getElementById("info-content");

  if (infoToggle && infoContent) {
    infoToggle.addEventListener("click", () => {
      const isExpanded = infoContent.style.display === "block";

      if (isExpanded) {
        infoContent.style.display = "none";
        infoToggle.textContent = "Comment utiliser ▼";
        infoToggle.setAttribute("aria-expanded", "false");
      } else {
        infoContent.style.display = "block";
        infoToggle.textContent = "Comment utiliser ▲";
        infoToggle.setAttribute("aria-expanded", "true");
      }
    });
  }

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
});
