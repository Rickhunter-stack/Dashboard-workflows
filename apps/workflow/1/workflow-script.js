// ============================================================================
// ÉTAT GLOBAL DE L'APPLICATION
// ============================================================================
let workflows = [];
let currentWorkflow = null;
let currentView = 'summary'; // 'summary', 'diagram', 'cards'
let navigationPath = []; // Chemin pour la navigation dans les sous-processus
let currentCardCount = 12;
let draggedCard = null;
let currentEditingCardId = null;
let diagramOrientation = 'vertical'; // 'vertical' ou 'horizontal'

// ============================================================================
// INITIALISATION
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  loadWorkflows();
  showSummaryView();
});

// ============================================================================
// GESTION DES WORKFLOWS (CHARGEMENT/SAUVEGARDE)
// ============================================================================
function loadWorkflows() {
  const saved = localStorage.getItem("workflows");
  workflows = saved ? JSON.parse(saved) : [];
  
  workflows.forEach(workflow => {
    if (workflow.description === undefined) {
      workflow.description = "";
    }
  });
  
  if (workflows.length > 0) {
    saveWorkflows();
  }
}

function saveWorkflows() {
  localStorage.setItem("workflows", JSON.stringify(workflows));
}

function saveWorkflow() {
  if (!currentWorkflow) return;
  
  const index = workflows.findIndex(w => w.id === currentWorkflow.id);
  if (index !== -1) {
    workflows[index] = currentWorkflow;
    saveWorkflows();
    showNotification("✅ Workflow sauvegardé!");
  }
}

// ============================================================================
// NIVEAU 1 : VUE RÉSUMÉ (PASTILLES HEXAGONALES)
// ============================================================================
function showSummaryView() {
  currentView = 'summary';
  document.getElementById('summary-view').style.display = 'block';
  document.getElementById('diagram-view').style.display = 'none';
  document.getElementById('cards-view').style.display = 'none';
  
  renderWorkflowsHexagons();
}

function renderWorkflowsHexagons() {
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
    .map(workflow => generateHexagonCard(workflow))
    .join("");
}

function generateHexagonCard(workflow) {
  const totalSteps = workflow.cards?.length || 0;
  const subProcessCount = countTotalSubProcesses(workflow.cards || []);
  const colorClass = workflow.color !== "none" ? `hexagon-color-${workflow.color}` : "";
  
  return `
    <div class="hexagon-workflow ${colorClass}" onclick="openDiagramView(${workflow.id})">
      <div class="hexagon-actions">
        <button class="color-badge-mini color-red ${workflow.color === 'red' ? 'active' : ''}" 
                onclick="event.stopPropagation(); setWorkflowColor(${workflow.id}, 'red')" 
                title="Rouge">●</button>
        <button class="color-badge-mini color-orange ${workflow.color === 'orange' ? 'active' : ''}" 
                onclick="event.stopPropagation(); setWorkflowColor(${workflow.id}, 'orange')" 
                title="Orange">●</button>
        <button class="color-badge-mini color-green ${workflow.color === 'green' ? 'active' : ''}" 
                onclick="event.stopPropagation(); setWorkflowColor(${workflow.id}, 'green')" 
                title="Vert">●</button>
        <button class="hexagon-action-btn hexagon-delete-btn" 
                onclick="event.stopPropagation(); deleteWorkflowFromList(${workflow.id})">
          🗑️
        </button>
      </div>
      
      <div class="hexagon-shape">
        <div class="hexagon-title">${escapeHtml(workflow.title)}</div>
        <div class="hexagon-info">
          ${formatDate(workflow.createdAt)}
        </div>
        <div class="hexagon-steps">${totalSteps} étapes</div>
        ${subProcessCount > 0 ? `<div class="hexagon-subprocesses">${subProcessCount} sous-processus</div>` : ''}
      </div>
    </div>
  `;
}

function createNewWorkflow() {
  const newWorkflow = {
    id: Date.now(),
    title: "Nouveau Workflow",
    description: "",
    createdAt: new Date().toISOString(),
    cardCount: 12,
    cards: initializeCards(12),
    titleEdited: false,
    color: "none",
  };

  workflows.push(newWorkflow);
  saveWorkflows();
  openDiagramView(newWorkflow.id);
}

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
      code: "",
      subProcess: null,
    });
  }
  return cards;
}

function filterWorkflows() {
  const filterInput = document.getElementById("filter-workflows");
  const filterValue = filterInput.value.toLowerCase().trim();
  const hexagons = document.querySelectorAll(".hexagon-workflow");

  hexagons.forEach((hexagon) => {
    const title = hexagon.querySelector(".hexagon-title")?.textContent.toLowerCase() || "";
    if (title.includes(filterValue)) {
      hexagon.style.display = "";
    } else {
      hexagon.style.display = "none";
    }
  });
}

function setWorkflowColor(workflowId, color) {
  const workflow = workflows.find(w => w.id === workflowId);
  if (workflow) {
    workflow.color = workflow.color === color ? "none" : color;
    saveWorkflows();
    renderWorkflowsHexagons();
  }
}

function deleteWorkflowFromList(workflowId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce workflow ?")) {
    workflows = workflows.filter(w => w.id !== workflowId);
    saveWorkflows();
    renderWorkflowsHexagons();
    showNotification("🗑️ Workflow supprimé");
  }
}

// ============================================================================
// NIVEAU 2 : VUE DIAGRAMME
// ============================================================================
function openDiagramView(workflowId) {
  currentWorkflow = workflows.find(w => w.id === workflowId);
  if (!currentWorkflow) {
    console.error("Workflow non trouvé");
    return;
  }

  currentView = 'diagram';
  navigationPath = [];
  
  document.getElementById('summary-view').style.display = 'none';
  document.getElementById('diagram-view').style.display = 'block';
  document.getElementById('cards-view').style.display = 'none';
  
  document.getElementById('workflow-title-diagram').value = currentWorkflow.title;
  
  renderDiagram();
}

function backToSummary() {
  showSummaryView();
}

function toggleDiagramOrientation() {
  diagramOrientation = diagramOrientation === 'vertical' ? 'horizontal' : 'vertical';
  document.getElementById('orientationBtn').textContent = diagramOrientation === 'vertical' ? '↔️ Horizontal' : '⬇️ Vertical';
  renderDiagram();
}

function renderDiagram() {
  const canvas = document.getElementById('diagram-canvas');
  const cards = currentWorkflow.cards || [];
  
  if (diagramOrientation === 'vertical') {
    canvas.innerHTML = generateVerticalDiagram(cards);
  } else {
    canvas.innerHTML = generateHorizontalDiagram(cards);
  }
}

function generateVerticalDiagram(cards) {
  return `
    <div class="diagram-vertical">
      ${cards.map((card, index) => generateDiagramNode(card, index, cards.length)).join('')}
    </div>
  `;
}

function generateHorizontalDiagram(cards) {
  return `
    <div class="diagram-horizontal">
      ${cards.map((card, index) => generateDiagramNode(card, index, cards.length)).join('')}
    </div>
  `;
}

function generateDiagramNode(card, index, total) {
  const isInput = card.type === 'input' || index === 0;
  const isOutput = card.type === 'output' || index === total - 1;
  const hasSubProcess = card.subProcess !== null;
  const subProcessCount = hasSubProcess ? (card.subProcess.cards?.length || 0) : 0;
  
  const nodeClass = isInput ? 'input-node' : isOutput ? 'output-node' : '';
  const icon = getProcessIcon(card, index, total);
  
  const clickAction = hasSubProcess 
    ? `onclick="openCardsView(${card.id})"` 
    : `onclick="createSubProcess(${card.id})"`;
  
  return `
    <div class="diagram-node ${nodeClass}" ${clickAction}>
      <div class="diagram-node-icon">${icon}</div>
      <div class="diagram-node-title">${escapeHtml(card.title)}</div>
      ${hasSubProcess ? `<div class="diagram-subprocess-badge">${subProcessCount} cartes</div>` : ''}
      <div class="diagram-node-subtitle">${hasSubProcess ? 'Cliquez pour voir' : 'Cliquez pour créer'}</div>
    </div>
  `;
}

function getProcessIcon(card, index, total) {
  if (card.type === 'input' || index === 0) return '📥';
  if (card.type === 'output' || index === total - 1) return '📤';
  if (card.subProcess) return '📊';
  return '🔧';
}

function updateWorkflowTitle(newTitle) {
  if (currentWorkflow) {
    currentWorkflow.title = newTitle;
    currentWorkflow.titleEdited = true;
    saveWorkflows();
  }
}

function deleteCurrentWorkflow() {
  if (!currentWorkflow) return;
  
  if (confirm("Êtes-vous sûr de vouloir supprimer ce workflow ?")) {
    workflows = workflows.filter(w => w.id !== currentWorkflow.id);
    saveWorkflows();
    currentWorkflow = null;
    showSummaryView();
    showNotification("🗑️ Workflow supprimé");
  }
}

// ============================================================================
// NIVEAU 3 : VUE CARTES
// ============================================================================
function openCardsView(cardId) {
  navigationPath.push(cardId);
  
  currentView = 'cards';
  document.getElementById('summary-view').style.display = 'none';
  document.getElementById('diagram-view').style.display = 'none';
  document.getElementById('cards-view').style.display = 'block';
  
  const context = getCurrentContext();
  const card = findCardInContext(cardId);
  
  if (card) {
    document.getElementById('current-process-title').textContent = card.title;
  }
  
  renderBreadcrumb();
  updateCardCountButtons();
  renderCardsCanvas();
}

function createSubProcess(cardId) {
  const card = findCardById(currentWorkflow.cards, cardId);
  if (!card) return;
  
  if (!card.subProcess) {
    card.subProcess = {
      cardCount: 9,
      cards: initializeCards(9)
    };
    saveWorkflows();
    showNotification("✅ Sous-processus créé!");
  }
  
  openCardsView(cardId);
}

function backToDiagram() {
  navigationPath = [];
  renderDiagram();
  
  currentView = 'diagram';
  document.getElementById('summary-view').style.display = 'none';
  document.getElementById('diagram-view').style.display = 'block';
  document.getElementById('cards-view').style.display = 'none';
}

function getCurrentContext() {
  let context = currentWorkflow;
  
  for (let cardId of navigationPath) {
    const card = context.cards.find(c => c.id === cardId);
    if (card && card.subProcess) {
      context = card.subProcess;
    }
  }
  
  return context;
}

function findCardInContext(cardId) {
  let context = currentWorkflow;
  
  for (let i = 0; i < navigationPath.length - 1; i++) {
    const card = context.cards.find(c => c.id === navigationPath[i]);
    if (card && card.subProcess) {
      context = card.subProcess;
    }
  }
  
  return context.cards.find(c => c.id === cardId);
}

function findCardById(cards, cardId) {
  for (let card of cards) {
    if (card.id === cardId) return card;
    if (card.subProcess && card.subProcess.cards) {
      const found = findCardById(card.subProcess.cards, cardId);
      if (found) return found;
    }
  }
  return null;
}

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

  let html = `<a class="breadcrumb-item" onclick="navigateToLevel(-1)">🏠 ${escapeHtml(currentWorkflow.title)}</a>`;

  let context = currentWorkflow;
  navigationPath.forEach((cardId, index) => {
    const card = context.cards.find(c => c.id === cardId);
    if (card) {
      const isLast = index === navigationPath.length - 1;
      if (isLast) {
        html += `<span class="breadcrumb-separator">→</span><span class="breadcrumb-item active">${escapeHtml(card.title)}</span>`;
      } else {
        html += `<span class="breadcrumb-separator">→</span><a class="breadcrumb-item" onclick="navigateToLevel(${index})">${escapeHtml(card.title)}</a>`;
      }
      if (card.subProcess) {
        context = card.subProcess;
      }
    }
  });

  breadcrumbContainer.innerHTML = html;
}

function navigateToLevel(level) {
  if (level === -1) {
    backToDiagram();
  } else {
    navigationPath = navigationPath.slice(0, level + 1);
    const cardId = navigationPath[level];
    openCardsView(cardId);
  }
}

function setCardCount(count) {
  const context = getCurrentContext();
  const oldCards = context.cards;
  context.cardCount = count;
  context.cards = initializeCards(count);

  oldCards.forEach((oldCard, index) => {
    if (index < count) {
      context.cards[index].title = oldCard.title;
      context.cards[index].description = oldCard.description;
      context.cards[index].titleEdited = oldCard.titleEdited || false;
      context.cards[index].descriptionEdited = oldCard.descriptionEdited || false;
      context.cards[index].color = oldCard.color || "none";
      context.cards[index].code = oldCard.code || "";
      context.cards[index].subProcess = oldCard.subProcess;
    }
  });

  updateCardCountButtons();
  saveWorkflows();
  renderCardsCanvas();
  showNotification(`✅ ${count} cartes configurées`);
}

function updateCardCountButtons() {
  const context = getCurrentContext();
  document.querySelectorAll(".size-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.size) === context.cardCount);
  });
}

function renderCardsCanvas() {
  const canvas = document.getElementById('cards-canvas');
  const context = getCurrentContext();
  const cards = context.cards || [];
  
  canvas.innerHTML = cards.map(card => generateCardHTML(card)).join('');
  
  // Ajouter les événements drag & drop
  setupDragAndDrop();
}

function generateCardHTML(card) {
  const isInput = card.type === 'input';
  const isOutput = card.type === 'output';
  const cardClass = isInput ? 'input-card' : isOutput ? 'output-card' : '';
  const icon = isInput ? '📥' : isOutput ? '📤' : card.subProcess ? '📊' : '🔧';
  
  return `
    <div class="process-card ${cardClass}" 
         draggable="true" 
         data-card-id="${card.id}"
         ondragstart="handleCardDragStart(event)"
         ondragend="handleCardDragEnd(event)"
         ondragover="handleCardDragOver(event)"
         ondrop="handleCardDrop(event)">
      
      <div class="card-header">
        <div class="card-icon">${icon}</div>
        <div class="card-order">#${card.order}</div>
      </div>
      
      <input type="text" 
             class="card-title-input" 
             value="${escapeHtml(card.title)}"
             onchange="updateCardTitle(${card.id}, this.value)"
             ${isInput || isOutput ? 'readonly' : ''}>
      
      <textarea class="card-description" 
                onchange="updateCardDescription(${card.id}, this.value)"
                placeholder="Description...">${escapeHtml(card.description)}</textarea>
      
      <div class="card-color-badges">
        <div class="color-badge color-none ${card.color === 'none' ? 'active' : ''}" 
             onclick="setCardColor(${card.id}, 'none')"></div>
        <div class="color-badge color-red ${card.color === 'red' ? 'active' : ''}" 
             onclick="setCardColor(${card.id}, 'red')"></div>
        <div class="color-badge color-orange ${card.color === 'orange' ? 'active' : ''}" 
             onclick="setCardColor(${card.id}, 'orange')"></div>
        <div class="color-badge color-green ${card.color === 'green' ? 'active' : ''}" 
             onclick="setCardColor(${card.id}, 'green')"></div>
      </div>
      
      ${!isInput && !isOutput ? `
        <div class="card-actions">
          ${card.subProcess 
            ? `<button class="card-btn btn-subprocess" onclick="openSubProcessLevel(${card.id})">
                📊 Voir sous-processus (${card.subProcess.cards?.length || 0})
              </button>
              <button class="card-btn btn-delete-subprocess" onclick="deleteSubProcess(${card.id})">
                🗑️ Supprimer
              </button>`
            : `<button class="card-btn btn-subprocess" onclick="createSubProcess(${card.id})">
                ➕ Créer sous-processus
              </button>`
          }
          <button class="card-btn btn-code" onclick="openCodeModal(${card.id})">
            💻 Code Python
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function openSubProcessLevel(cardId) {
  openCardsView(cardId);
}

function deleteSubProcess(cardId) {
  if (confirm("Supprimer le sous-processus et toutes ses données ?")) {
    const card = findCardById(currentWorkflow.cards, cardId);
    if (card) {
      card.subProcess = null;
      saveWorkflows();
      renderCardsCanvas();
      showNotification("🗑️ Sous-processus supprimé");
    }
  }
}

function updateCardTitle(cardId, newTitle) {
  const card = findCardById(currentWorkflow.cards, cardId);
  if (card) {
    card.title = newTitle;
    card.titleEdited = true;
    saveWorkflows();
  }
}

function updateCardDescription(cardId, newDescription) {
  const card = findCardById(currentWorkflow.cards, cardId);
  if (card) {
    card.description = newDescription;
    card.descriptionEdited = true;
    saveWorkflows();
  }
}

function setCardColor(cardId, color) {
  const card = findCardById(currentWorkflow.cards, cardId);
  if (card) {
    card.color = color;
    saveWorkflows();
    renderCardsCanvas();
  }
}

// ============================================================================
// DRAG & DROP
// ============================================================================
function setupDragAndDrop() {
  const cards = document.querySelectorAll('.process-card');
  cards.forEach(card => {
    card.addEventListener('dragstart', handleCardDragStart);
    card.addEventListener('dragend', handleCardDragEnd);
    card.addEventListener('dragover', handleCardDragOver);
    card.addEventListener('drop', handleCardDrop);
  });
}

function handleCardDragStart(e) {
  draggedCard = e.target;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function handleCardDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
}

function handleCardDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  
  const target = e.target.closest('.process-card');
  if (target && target !== draggedCard) {
    target.classList.add('drag-over');
  }
  
  return false;
}

function handleCardDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  const target = e.target.closest('.process-card');
  if (draggedCard && target && draggedCard !== target) {
    const draggedId = parseInt(draggedCard.dataset.cardId);
    const targetId = parseInt(target.dataset.cardId);
    
    swapCards(draggedId, targetId);
  }
  
  target?.classList.remove('drag-over');
  return false;
}

function swapCards(cardId1, cardId2) {
  const context = getCurrentContext();
  const card1Index = context.cards.findIndex(c => c.id === cardId1);
  const card2Index = context.cards.findIndex(c => c.id === cardId2);
  
  if (card1Index !== -1 && card2Index !== -1) {
    const tempOrder = context.cards[card1Index].order;
    context.cards[card1Index].order = context.cards[card2Index].order;
    context.cards[card2Index].order = tempOrder;
    
    [context.cards[card1Index], context.cards[card2Index]] = 
    [context.cards[card2Index], context.cards[card1Index]];
    
    saveWorkflows();
    renderCardsCanvas();
    showNotification("🔄 Cartes échangées");
  }
}

// ============================================================================
// MODALES
// ============================================================================
function openCodeModal(cardId) {
  currentEditingCardId = cardId;
  const card = findCardById(currentWorkflow.cards, cardId);
  
  if (card) {
    document.getElementById('code-textarea').value = card.code || '';
    document.getElementById('code-modal').style.display = 'block';
  }
}

function closeCodeModal() {
  document.getElementById('code-modal').style.display = 'none';
  currentEditingCardId = null;
}

function saveCode() {
  if (!currentEditingCardId) return;
  
  const card = findCardById(currentWorkflow.cards, currentEditingCardId);
  if (card) {
    card.code = document.getElementById('code-textarea').value;
    saveWorkflows();
    closeCodeModal();
    showNotification("💾 Code sauvegardé!");
  }
}

// ============================================================================
// IMPORT/EXPORT
// ============================================================================
function exportWorkflowJSON() {
  if (!currentWorkflow) return;
  
  const dataStr = JSON.stringify(currentWorkflow, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `workflow_${currentWorkflow.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showNotification("📥 Workflow exporté!");
}

function importWorkflowJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedWorkflow = JSON.parse(e.target.result);
      importedWorkflow.id = Date.now();
      importedWorkflow.createdAt = new Date().toISOString();
      importedWorkflow.title = importedWorkflow.title + " (Importé)";
      
      workflows.push(importedWorkflow);
      saveWorkflows();
      renderWorkflowsHexagons();
      showNotification("✅ Workflow importé!");
    } catch (error) {
      alert("Erreur lors de l'import du fichier JSON");
      console.error(error);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ============================================================================
// UTILITAIRES
// ============================================================================
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function countTotalSubProcesses(cards) {
  let count = 0;
  cards.forEach(card => {
    if (card.subProcess) {
      count++;
      if (card.subProcess.cards) {
        count += countTotalSubProcesses(card.subProcess.cards);
      }
    }
  });
  return count;
}

function showNotification(message) {
  // Créer une notification simple
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Gestion de l'info toggle
function toggleInfo() {
  const infoContent = document.getElementById("infoContent");
  const infoToggle = document.querySelector(".info-toggle");

  if (infoContent.style.display === "none" || infoContent.style.display === "") {
    infoContent.style.display = "block";
    infoToggle.textContent = "Informations sur le générateur ▲";
  } else {
    infoContent.style.display = "none";
    infoToggle.textContent = "Informations sur le générateur ▼";
  }
}

// Fermer les modales en cliquant en dehors
window.onclick = function(event) {
  const codeModal = document.getElementById('code-modal');
  const treeModal = document.getElementById('tree-modal');
  
  if (event.target === codeModal) {
    closeCodeModal();
  }
  if (event.target === treeModal) {
    closeTreeView();
  }
}

// Fonction placeholder pour closeTreeView
function closeTreeView() {
  document.getElementById('tree-modal').style.display = 'none';
}
