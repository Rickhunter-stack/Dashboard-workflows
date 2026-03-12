// État global de l'application
let workflows = [];
let currentWorkflow = null;
let currentCardCount = 12;
let draggedCard = null;
let navigationPath = []; // Chemin de navigation hiérarchique
let currentEditingCardId = null;

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  loadWorkflows();
  renderWorkflowsList();
});

// Gestion de l'info toggle
function toggleInfo() {
  const infoContent = document.getElementById("infoContent");
  const infoToggle = document.querySelector(".info-toggle");

  if (
    infoContent.style.display === "none" ||
    infoContent.style.display === ""
  ) {
    infoContent.style.display = "block";
    infoToggle.textContent = "Informations sur le générateur ▲";
  } else {
    infoContent.style.display = "none";
    infoToggle.textContent = "Informations sur le générateur ▼";
  }
}

// Charger les workflows depuis localStorage
function loadWorkflows() {
  const saved = localStorage.getItem("workflows");
  workflows = saved ? JSON.parse(saved) : [];
}

// Sauvegarder les workflows dans localStorage
function saveWorkflows() {
  localStorage.setItem("workflows", JSON.stringify(workflows));
}

// Créer un nouveau workflow
function createNewWorkflow() {
  const newWorkflow = {
    id: Date.now(),
    title: "Nouveau Workflow",
    createdAt: new Date().toISOString(),
    cardCount: 12,
    cards: initializeCards(12),
    titleEdited: false,
    color: "none",
  };

  workflows.push(newWorkflow);
  saveWorkflows();
  openWorkflowEditor(newWorkflow.id);
}

// Initialiser les cartes d'un workflow
function initializeCards(count) {
  const cards = [];

  for (let i = 0; i < count; i++) {
    const isInput = i === 0;
    const isOutput = i === count - 1;

    cards.push({
      id: Date.now() + i,
      order: i + 1,
      type: isInput ? "input" : isOutput ? "output" : "process",
      title: isInput ? "INPUT" : isOutput ? "OUTPUT" : `Sous-processus ${i}`,
      description: isInput
        ? "Décrivez les données d'entrée..."
        : isOutput
        ? "Décrivez les données de sortie..."
        : "Décrivez ce sous-processus...",
      titleEdited: false,
      descriptionEdited: false,
      color: "none",
      code: "", // Nouveau: code Python associé à la carte
      // Nouveau: chaque carte peut avoir ses propres sous-processus
      subProcess: null, // Contiendra {cardCount: 9, cards: [...]}
    });
  }

  return cards;
}

// Afficher la liste des workflows
function renderWorkflowsList() {
  const container = document.getElementById("workflows-list");

  if (workflows.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">Aucun workflow créé</div>
        <div class="empty-state-subtext">Cliquez sur "Nouveau Workflow" pour commencer</div>
      </div>
    `;
    return;
  }

  container.innerHTML = workflows
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(
      (workflow) => `
    <div 
      class="workflow-card ${
        workflow.color !== "none" ? `workflow-card-color-${workflow.color}` : ""
      }" 
      draggable="true"
      data-workflow-id="${workflow.id}"
      ondragstart="handleWorkflowDragStart(event)"
      ondragend="handleWorkflowDragEnd(event)"
      ondragover="handleWorkflowDragOver(event)"
      ondrop="handleWorkflowDrop(event)"
      ondragleave="handleWorkflowDragLeave(event)"
      onclick="openWorkflowEditor(${workflow.id})"
    >
      <div class="workflow-card-header">
        <h3 class="workflow-card-title">${escapeHtml(workflow.title)}</h3>
        <div class="workflow-card-actions">
          <button class="color-badge-mini color-red ${
            workflow.color === "red" ? "active" : ""
          }" onclick="event.stopPropagation(); setWorkflowColor(${
        workflow.id
      }, 'red')" title="Rouge">●</button>
          <button class="color-badge-mini color-orange ${
            workflow.color === "orange" ? "active" : ""
          }" onclick="event.stopPropagation(); setWorkflowColor(${
        workflow.id
      }, 'orange')" title="Orange">●</button>
          <button class="color-badge-mini color-green ${
            workflow.color === "green" ? "active" : ""
          }" onclick="event.stopPropagation(); setWorkflowColor(${
        workflow.id
      }, 'green')" title="Vert">●</button>
          <button class="delete-workflow-btn" onclick="event.stopPropagation(); deleteWorkflowFromList(${
            workflow.id
          })">
            🗑️
          </button>
        </div>
      </div>
      <div class="workflow-card-date">
        Créé le ${formatDate(workflow.createdAt)}
      </div>
      <div class="workflow-card-steps">
        ${workflow.cardCount} étapes
      </div>
    </div>
  `
    )
    .join("");
}

// Ouvrir l'éditeur de workflow
function openWorkflowEditor(workflowId) {
  currentWorkflow = workflows.find((w) => w.id === workflowId);

  if (!currentWorkflow) {
    console.error("Workflow non trouvé");
    return;
  }

  // Réinitialiser le chemin de navigation
  navigationPath = [];

  currentCardCount = currentWorkflow.cardCount;

  document.getElementById("home-view").style.display = "none";
  document.getElementById("workflow-editor").style.display = "block";

  const workflowTitleInput = document.getElementById("workflow-title");
  workflowTitleInput.value = currentWorkflow.title;

  // Ajouter l'événement focus pour effacer le titre par défaut
  workflowTitleInput.onfocus = function () {
    if (!currentWorkflow.titleEdited) {
      this.value = "";
      currentWorkflow.titleEdited = true;
      this.select();
    }
  };

  // Mettre à jour le sélecteur de taille
  updateCardCountButtons();

  renderBreadcrumb();
  renderWorkflowCanvas();
}

// Retour à l'accueil
function backToHome() {
  document.getElementById("home-view").style.display = "block";
  document.getElementById("workflow-editor").style.display = "none";
  currentWorkflow = null;
  navigationPath = [];
  renderWorkflowsList();
}

// Obtenir le contexte actuel (niveau principal ou sous-processus)
function getCurrentContext() {
  let context = currentWorkflow;

  // Naviguer dans l'arborescence selon le chemin
  for (let cardId of navigationPath) {
    const card = context.cards.find((c) => c.id === cardId);
    if (card && card.subProcess) {
      context = card.subProcess;
    }
  }

  return context;
}

// Changer le nombre de cartes
function setCardCount(count) {
  if (!currentWorkflow) return;

  const context = getCurrentContext();
  const oldCardCount = context.cardCount;

  currentCardCount = count;
  context.cardCount = count;

  // Réinitialiser les cartes avec le nouveau nombre
  const oldCards = context.cards;
  context.cards = initializeCards(count);

  // Copier les données des anciennes cartes si elles existent
  oldCards.forEach((oldCard, index) => {
    if (index < count) {
      context.cards[index].title = oldCard.title;
      context.cards[index].description = oldCard.description;
      context.cards[index].titleEdited = oldCard.titleEdited || false;
      context.cards[index].descriptionEdited =
        oldCard.descriptionEdited || false;
      context.cards[index].color = oldCard.color || "none";
      context.cards[index].code = oldCard.code || "";
      context.cards[index].subProcess = oldCard.subProcess;
    }
  });

  updateCardCountButtons();
  saveWorkflows();
  renderWorkflowCanvas();
}

// Mettre à jour les boutons de sélection de taille
function updateCardCountButtons() {
  const context = getCurrentContext();
  document.querySelectorAll(".size-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      parseInt(btn.dataset.size) === context.cardCount
    );
  });
}

// Rendre le fil d'Ariane (breadcrumb)
function renderBreadcrumb() {
  const breadcrumbContainer = document.getElementById("breadcrumb");

  if (navigationPath.length === 0) {
    breadcrumbContainer.innerHTML = `
      <span class="breadcrumb-item active">
        🏠 ${escapeHtml(currentWorkflow.title)}
      </span>
    `;
    return;
  }

  let html = `<a href="#" onclick="navigateToLevel(-1); return false;" class="breadcrumb-item">🏠 ${escapeHtml(
    currentWorkflow.title
  )}</a>`;

  let context = currentWorkflow;
  navigationPath.forEach((cardId, index) => {
    const card = context.cards.find((c) => c.id === cardId);
    if (card) {
      const isLast = index === navigationPath.length - 1;
      if (isLast) {
        html += `<span class="breadcrumb-separator">→</span><span class="breadcrumb-item active">${escapeHtml(
          card.title
        )}</span>`;
      } else {
        html += `<span class="breadcrumb-separator">→</span><a href="#" onclick="navigateToLevel(${index}); return false;" class="breadcrumb-item">${escapeHtml(
          card.title
        )}</a>`;
      }

      if (card.subProcess) {
        context = card.subProcess;
      }
    }
  });

  breadcrumbContainer.innerHTML = html;
}

// Naviguer vers un niveau spécifique
function navigateToLevel(levelIndex) {
  if (levelIndex === -1) {
    // Retour au niveau principal
    navigationPath = [];
  } else {
    // Retour à un niveau intermédiaire
    navigationPath = navigationPath.slice(0, levelIndex + 1);
  }

  const context = getCurrentContext();
  currentCardCount = context.cardCount;

  updateCardCountButtons();
  renderBreadcrumb();
  renderWorkflowCanvas();
}

// Ouvrir le sous-processus d'une carte
function openSubProcess(cardId) {
  const context = getCurrentContext();
  const card = context.cards.find((c) => c.id === cardId);

  if (!card) return;

  // Créer un sous-processus s'il n'existe pas
  if (!card.subProcess) {
    card.subProcess = {
      cardCount: 9,
      cards: initializeCards(9),
    };
    saveWorkflows();
  }

  // Ajouter au chemin de navigation
  navigationPath.push(cardId);
  currentCardCount = card.subProcess.cardCount;

  updateCardCountButtons();
  renderBreadcrumb();
  renderWorkflowCanvas();
}

// Rendre le canvas de workflow
function renderWorkflowCanvas() {
  const canvas = document.getElementById("workflow-canvas");
  const context = getCurrentContext();

  canvas.className = `workflow-canvas grid-${context.cardCount}`;

  canvas.innerHTML = context.cards
    .map(
      (card, index) => `
    <div 
      class="process-card ${card.type === "input" ? "card-input" : ""} ${
        card.type === "output" ? "card-output" : ""
      } ${card.color !== "none" ? `card-color-${card.color}` : ""}"
      draggable="true"
      data-card-id="${card.id}"
      ondragstart="handleDragStart(event)"
      ondragend="handleDragEnd(event)"
      ondragover="handleDragOver(event)"
      ondrop="handleDrop(event)"
      ondragleave="handleDragLeave(event)"
    >
      <div class="card-header">
        <div class="card-number">${card.order}</div>
        <div class="card-color-selector">
          <button class="color-badge-mini color-blue ${
            card.color === "blue" ? "active" : ""
          }" onclick="setCardColor(${
        card.id
      }, 'blue', event)" title="Bleu">●</button>
          <button class="color-badge-mini color-red ${
            card.color === "red" ? "active" : ""
          }" onclick="setCardColor(${
        card.id
      }, 'red', event)" title="Rouge">●</button>
          <button class="color-badge-mini color-orange ${
            card.color === "orange" ? "active" : ""
          }" onclick="setCardColor(${
        card.id
      }, 'orange', event)" title="Orange">●</button>
          <button class="color-badge-mini color-green ${
            card.color === "green" ? "active" : ""
          }" onclick="setCardColor(${
        card.id
      }, 'green', event)" title="Vert">●</button>
        </div>
        <div class="card-type">${
          card.type === "input"
            ? "INPUT"
            : card.type === "output"
            ? "OUTPUT"
            : "STEP"
        }</div>
        <button 
          class="python-btn ${card.code && card.code.trim() ? "has-code" : ""}"
          title="${
            card.code && card.code.trim() ? "Code attaché" : "Ajouter du code"
          }"
          onclick="openCodeModal(${card.id}); event.stopPropagation()"
        >🐍</button>
      </div>
      <input 
        type="text" 
        class="card-title" 
        value="${escapeHtml(card.title)}"
        onfocus="handleTitleFocus(${card.id}, this)"
        onblur="handleInputBlur(this)"
        onchange="updateCardTitle(${card.id}, this.value)"
        onclick="event.stopPropagation()"
      />
      <textarea 
        class="card-description"
        onfocus="handleDescriptionFocus(${card.id}, this)"
        onblur="handleInputBlur(this)"
        onchange="updateCardDescription(${card.id}, this.value)"
        onclick="event.stopPropagation()"
      >${escapeHtml(card.description)}</textarea>
      ${
        card.type !== "input" && card.type == "output"
          ? ""
          : `
        <button class="open-subprocess-btn" onclick="openSubProcess(${
          card.id
        }); event.stopPropagation()">
          ${
            card.subProcess
              ? "🔍 Ouvrir sous-processus"
              : "➕ Créer sous-processus"
          }
        </button>
      `
      }
    </div>
  `
    )
    .join("");

  setTimeout(drawConnectors, 50);
}

// Dessiner les connecteurs entre les cartes
function drawConnectors() {
  const canvas = document.getElementById("workflow-canvas");
  const cards = canvas.querySelectorAll(".process-card");

  document.querySelectorAll(".connector").forEach((c) => c.remove());
  if (cards.length < 2) return;

  const { cardCount } = getCurrentContext();

  // Colonnes par taille : 20→5, 16→4, 4→2, sinon→3 (6, 9, 12)
  const cols =
    cardCount === 20 ? 5 : cardCount === 16 ? 4 : cardCount === 4 ? 2 : 3;

  cards.forEach((card, index) => {
    if (index === cards.length - 1) return; // Pas de connecteur après la dernière carte

    const nextIndex = index + 1;
    const nextCard = cards[nextIndex];

    const cardRect = card.getBoundingClientRect();
    const nextCardRect = nextCard.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Position actuelle dans la grille
    const currentRow = Math.floor(index / cols);
    const currentCol = index % cols;
    const nextRow = Math.floor(nextIndex / cols);
    const nextCol = nextIndex % cols;

    // Si la prochaine carte est sur la même ligne
    if (currentRow === nextRow) {
      const connector = document.createElement("div");
      connector.className = "connector";

      const startX = cardRect.right - canvasRect.left;
      const startY = cardRect.top + cardRect.height / 2 - canvasRect.top;
      const endX = nextCardRect.left - canvasRect.left;

      connector.style.left = startX + "px";
      connector.style.top = startY + "px";
      connector.style.width = endX - startX + "px";

      canvas.appendChild(connector);
    }
    // Si la prochaine carte est sur la ligne suivante
    else if (nextRow === currentRow + 1 && nextCol === 0) {
      // Connecteur vertical descendant
      const connector = document.createElement("div");
      connector.className = "connector";

      const startX = cardRect.left + cardRect.width / 2 - canvasRect.left;
      const startY = cardRect.bottom - canvasRect.top;
      const endY = nextCardRect.top - canvasRect.top;

      connector.style.left = startX + "px";
      connector.style.top = startY + "px";
      connector.style.width = "2px";
      connector.style.height = endY - startY + "px";
      connector.style.transform = "rotate(90deg)";
      connector.style.transformOrigin = "top left";

      canvas.appendChild(connector);
    }
  });
}

// Gestion du drag & drop pour les cartes
function handleDragStart(event) {
  const cardId = parseInt(event.currentTarget.dataset.cardId);
  const context = getCurrentContext();
  draggedCard = context.cards.find((c) => c.id === cardId);
  event.currentTarget.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
  draggedCard = null;
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const target = event.target.closest(".process-card");
  if (target && !target.classList.contains("dragging")) {
    target.classList.add("drag-over");
  }
}

function handleDragLeave(event) {
  const target = event.target.closest(".process-card");
  if (target) {
    target.classList.remove("drag-over");
  }
}

function handleDrop(event) {
  event.preventDefault();
  const target = event.target.closest(".process-card");

  if (!target || !draggedCard) return;

  target.classList.remove("drag-over");

  const context = getCurrentContext();
  const targetCardId = parseInt(target.dataset.cardId);
  const targetCard = context.cards.find((c) => c.id === targetCardId);

  if (draggedCard.id === targetCard.id) return;

  // Ne pas permettre de déplacer INPUT ou OUTPUT
  if (
    draggedCard.type === "input" ||
    draggedCard.type === "output" ||
    targetCard.type === "input" ||
    targetCard.type === "output"
  ) {
    alert("Les cartes INPUT et OUTPUT ne peuvent pas être déplacées.");
    return;
  }

  // Échanger les positions
  const draggedIndex = context.cards.findIndex((c) => c.id === draggedCard.id);
  const targetIndex = context.cards.findIndex((c) => c.id === targetCard.id);

  // Échanger les cartes dans le tableau
  [context.cards[draggedIndex], context.cards[targetIndex]] = [
    context.cards[targetIndex],
    context.cards[draggedIndex],
  ];

  // Mettre à jour les numéros d'ordre
  context.cards.forEach((card, index) => {
    card.order = index + 1;
  });

  saveWorkflows();
  renderWorkflowCanvas();
}

// Gérer le focus sur le titre
function handleTitleFocus(cardId, element) {
  const context = getCurrentContext();
  const card = context.cards.find((c) => c.id === cardId);
  if (card && !card.titleEdited) {
    element.value = "";
    card.titleEdited = true;
    element.select();
  }
}

// Gérer le focus sur la description
function handleDescriptionFocus(cardId, element) {
  const context = getCurrentContext();
  const card = context.cards.find((c) => c.id === cardId);
  if (card && !card.descriptionEdited) {
    element.value = "";
    card.descriptionEdited = true;
    element.select();
  }
  element.closest(".process-card").classList.add("focused");
}

// Gérer le blur des inputs
function handleInputBlur(element) {
  element.closest(".process-card").classList.remove("focused");
}

// Définir la couleur d'une carte
function setCardColor(cardId, color, event) {
  event.stopPropagation();
  const context = getCurrentContext();
  const card = context.cards.find((c) => c.id === cardId);
  if (card) {
    // Si on clique sur la même couleur, on l'enlève
    card.color = card.color === color ? "none" : color;
    saveWorkflows();
    renderWorkflowCanvas();
  }
}

// Mettre à jour le titre d'une carte
function updateCardTitle(cardId, newTitle) {
  const context = getCurrentContext();
  const card = context.cards.find((c) => c.id === cardId);
  if (card) {
    card.title = newTitle;
    saveWorkflows();
    renderBreadcrumb(); // Mettre à jour le breadcrumb si le titre change
  }
}

// Mettre à jour la description d'une carte
function updateCardDescription(cardId, newDescription) {
  const context = getCurrentContext();
  const card = context.cards.find((c) => c.id === cardId);
  if (card) {
    card.description = newDescription;
    saveWorkflows();
  }
}

// Sauvegarder le workflow
function saveWorkflow() {
  if (!currentWorkflow) return;

  const titleInput = document.getElementById("workflow-title");
  currentWorkflow.title = titleInput.value || "Workflow sans titre";

  saveWorkflows();

  // Animation de confirmation
  const saveBtn = document.querySelector(".save-btn");
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "✓ Sauvegardé !";
  saveBtn.style.background =
    "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)";

  setTimeout(() => {
    saveBtn.textContent = originalText;
    saveBtn.style.background = "";
  }, 2000);
}

// Exporter le workflow en JSON
function exportWorkflowJSON() {
  if (!currentWorkflow) return;

  const titleInput = document.getElementById("workflow-title");
  currentWorkflow.title = titleInput.value || "Workflow sans titre";

  // Créer le JSON du workflow actuel
  const jsonData = JSON.stringify(currentWorkflow, null, 2);

  // Créer un blob et un lien de téléchargement
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  // Nettoyer le nom de fichier
  const filename = currentWorkflow.title
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();

  a.href = url;
  a.download = `workflow_${filename}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Animation de confirmation
  const exportBtn = document.querySelector(".export-btn");
  const originalText = exportBtn.textContent;
  exportBtn.textContent = "✓ Exporté !";
  exportBtn.style.background =
    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";

  setTimeout(() => {
    exportBtn.textContent = originalText;
    exportBtn.style.background = "";
  }, 2000);
}

// Importer un workflow depuis un fichier JSON
function importWorkflowJSON(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const importedWorkflow = JSON.parse(e.target.result);

      if (!importedWorkflow || typeof importedWorkflow !== "object") {
        throw new Error("JSON invalide");
      }

      // Sécurise un id unique + date de création
      importedWorkflow.id = Date.now();
      importedWorkflow.createdAt =
        importedWorkflow.createdAt || new Date().toISOString();

      // Ajoute le workflow importé à la liste
      workflows.push(importedWorkflow);
      saveWorkflows();
      renderWorkflowsList();

      alert("Workflow importé avec succès 🎉");
    } catch (err) {
      console.error("Erreur d'import", err);
      alert("Fichier JSON invalide ou corrompu 😢");
    } finally {
      // Permet de ré-importer le même fichier si besoin
      event.target.value = "";
    }
  };

  reader.readAsText(file);
}

// Supprimer le workflow actuel
function deleteCurrentWorkflow() {
  if (!currentWorkflow) return;

  if (
    confirm(
      `Êtes-vous sûr de vouloir supprimer le workflow "${currentWorkflow.title}" ?`
    )
  ) {
    workflows = workflows.filter((w) => w.id !== currentWorkflow.id);
    saveWorkflows();
    backToHome();
  }
}

// Supprimer un workflow depuis la liste
function deleteWorkflowFromList(workflowId) {
  const workflow = workflows.find((w) => w.id === workflowId);

  if (
    confirm(
      `Êtes-vous sûr de vouloir supprimer le workflow "${workflow.title}" ?`
    )
  ) {
    workflows = workflows.filter((w) => w.id !== workflowId);
    saveWorkflows();
    renderWorkflowsList();
  }
}

// Gestion du drag & drop pour les workflows
let draggedWorkflow = null;

function handleWorkflowDragStart(event) {
  const workflowId = parseInt(event.currentTarget.dataset.workflowId);
  draggedWorkflow = workflows.find((w) => w.id === workflowId);
  event.currentTarget.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
}

function handleWorkflowDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
  draggedWorkflow = null;
}

function handleWorkflowDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = "move";
  const target = event.currentTarget;
  if (target && !target.classList.contains("dragging")) {
    target.classList.add("drag-over");
  }
}

function handleWorkflowDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function handleWorkflowDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const target = event.currentTarget;

  if (!target || !draggedWorkflow) return;

  target.classList.remove("drag-over");

  const targetWorkflowId = parseInt(target.dataset.workflowId);
  const targetWorkflow = workflows.find((w) => w.id === targetWorkflowId);

  if (draggedWorkflow.id === targetWorkflow.id) return;

  // Échanger les positions
  const draggedIndex = workflows.findIndex((w) => w.id === draggedWorkflow.id);
  const targetIndex = workflows.findIndex((w) => w.id === targetWorkflow.id);

  [workflows[draggedIndex], workflows[targetIndex]] = [
    workflows[targetIndex],
    workflows[draggedIndex],
  ];

  saveWorkflows();
  renderWorkflowsList();
}

// Définir la couleur d'un workflow
function setWorkflowColor(workflowId, color) {
  const workflow = workflows.find((w) => w.id === workflowId);
  if (workflow) {
    // Si on clique sur la même couleur, on l'enlève
    workflow.color = workflow.color === color ? "none" : color;
    saveWorkflows();
    renderWorkflowsList();
  }
}

// Ouvrir la modale de code
function openCodeModal(cardId) {
  currentEditingCardId = cardId;
  const context = getCurrentContext();
  const card = context.cards.find((c) => c.id === cardId);
  if (card) {
    document.getElementById("code-textarea").value = card.code;
  }
  document.getElementById("code-modal").style.display = "flex";
}

// Fermer la modale de code
function closeCodeModal() {
  document.getElementById("code-modal").style.display = "none";
}

function saveCode() {
  if (currentEditingCardId === null) return;
  const context = getCurrentContext();
  const card = context.cards.find((c) => c.id === currentEditingCardId);
  if (card) {
    card.code = document.getElementById("code-textarea").value;
    saveWorkflows();
  }
  closeCodeModal();
  renderWorkflowCanvas(); // met à jour la couleur du 🐍
}

// Utilitaires
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Redessiner les connecteurs lors du redimensionnement de la fenêtre
window.addEventListener("resize", () => {
  if (currentWorkflow) {
    setTimeout(drawConnectors, 100);
  }
});

// fenêtre TREE
function openTreeView() {
  // crée la modale si absente (sécurité)
  if (!document.getElementById("tree-modal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div id="tree-modal" class="modal">
        <div class="modal-content tree-modal-content">
          <span class="close-modal" onclick="closeTreeView()">&times;</span>
          <h2>Arborescence du Workflow</h2>
          <div id="tree-container" class="tree-container"></div>
        </div>
      </div>
      `
    );
  }

  const container = document.getElementById("tree-container");
  const treeHtml = generateTreeHTML(currentWorkflow, [], navigationPath);
  container.innerHTML = treeHtml;

  document.getElementById("tree-modal").style.display = "flex";
}

function closeTreeView() {
  document.getElementById("tree-modal").style.display = "none";
}

function generateTreeHTML(context, path = [], currentPath = []) {
  // utilitaires locaux
  const keyOf = (p) => JSON.stringify(p);
  const isSamePath = (a, b) => keyOf(a) === keyOf(b);
  const safe = (v) => (v == null ? "" : String(v));

  // bloc racine (titre du niveau courant)
  const isCurrent = isSamePath(path, currentPath);
  const lastId = path[path.length - 1];

  // titre du niveau : workflow (racine) ou titre de la carte menant à ce niveau
  const title =
    path.length === 0
      ? safe(currentWorkflow?.title || "Workflow")
      : safe(
          (context?.cards || []).find((c) => c.id === lastId)?.title || "Niveau"
        );

  let html = `<div class="tree-node">
    <div 
      class="tree-node-title ${isCurrent ? "tree-current" : ""}" 
      onclick="navigateFromTree('${keyOf(path)}')"
    >
      ${escapeHtml(title)}
    </div>
  `;

  // afficher toutes les cartes du niveau courant
  const cards = Array.isArray(context?.cards) ? context.cards : [];
  for (const card of cards) {
    const childPath = [...path, card.id];
    const childIsCurrent = isSamePath(childPath, currentPath);

    // nœud de carte
    html += `
      <div class="tree-node">
        <div 
          class="tree-node-title ${childIsCurrent ? "tree-current" : ""}"
          onclick="navigateFromTree('${keyOf(childPath)}')"
        >
          ${escapeHtml(safe(card.title))}
        </div>
      </div>
    `;

    // descente récursive si sous-processus
    if (card.subProcess && Array.isArray(card.subProcess.cards)) {
      html += generateTreeHTML(card.subProcess, childPath, currentPath);
    }
  }

  html += `</div>`;
  return html;
}

function navigateFromTree(pathString) {
  const path = JSON.parse(pathString);
  navigationPath = path;
  closeTreeView();
  renderBreadcrumb();
  renderWorkflowCanvas();
}
