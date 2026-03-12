// ===========================
// ÉTAT GLOBAL
// ===========================
let state = {
  phases: [],
  filter: "",
};

// Initialiser l'état par défaut
function initState() {
  return {
    phases: [
      {
        id: "planning",
        title: "📋 Planification",
        tasks: [
          {
            id: generateId(),
            title: "Définir les objectifs",
            priority: null,
            startDate: "",
            endDate: "",
          },
        ],
      },
      {
        id: "development",
        title: "⚙️ Développement",
        tasks: [],
      },
      {
        id: "testing",
        title: "🧪 Test",
        tasks: [],
      },
      {
        id: "deployment",
        title: "🚀 Déploiement",
        tasks: [],
      },
    ],
    filter: "",
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
const STORAGE_KEY = "projectRoadmapData";

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = JSON.parse(saved);
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
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
  }
}

// ===========================
// GESTION DES TÂCHES
// ===========================
function addTask(phaseId) {
  const phase = state.phases.find((p) => p.id === phaseId);
  if (!phase) return;

  const newTask = {
    id: generateId(),
    title: "Nouvelle tâche",
    priority: null,
    startDate: "",
    endDate: "",
  };

  phase.tasks.push(newTask);
  saveState();
  render();

  // Focus sur le titre de la nouvelle tâche
  setTimeout(() => {
    const taskElement = document.querySelector(`[data-task-id="${newTask.id}"]`);
    if (taskElement) {
      const titleInput = taskElement.querySelector(".task-title");
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }
    }
  }, 100);
}

function updateTaskTitle(taskId, newTitle) {
  for (const phase of state.phases) {
    const task = phase.tasks.find((t) => t.id === taskId);
    if (task) {
      task.title = newTitle;
      saveState();
      return;
    }
  }
}

function updateTaskPriority(taskId, priority) {
  for (const phase of state.phases) {
    const task = phase.tasks.find((t) => t.id === taskId);
    if (task) {
      task.priority = task.priority === priority ? null : priority;
      saveState();
      render();
      return;
    }
  }
}

function updateTaskDate(taskId, dateType, newDate) {
  for (const phase of state.phases) {
    const task = phase.tasks.find((t) => t.id === taskId);
    if (task) {
      if (dateType === "start") {
        task.startDate = newDate;
      } else {
        task.endDate = newDate;
      }
      saveState();
      return;
    }
  }
}

function deleteTask(taskId) {
  for (const phase of state.phases) {
    const index = phase.tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      if (confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
        phase.tasks.splice(index, 1);
        saveState();
        render();
      }
      return;
    }
  }
}

function findTask(taskId) {
  for (const phase of state.phases) {
    const task = phase.tasks.find((t) => t.id === taskId);
    if (task) return { task, phase };
  }
  return null;
}

// ===========================
// FILTRAGE
// ===========================
function updateFilter(filterText) {
  state.filter = filterText.toLowerCase();
  render();
}

function taskMatchesFilter(task) {
  if (!state.filter) return true;
  const searchText = state.filter;
  return task.title.toLowerCase().includes(searchText);
}

// ===========================
// DRAG & DROP
// ===========================
let draggedTask = null;
let draggedFromPhase = null;

function handleDragStart(event) {
  const taskElement = event.target.closest(".task");
  if (!taskElement) return;

  const taskId = taskElement.dataset.taskId;
  const result = findTask(taskId);

  if (result) {
    draggedTask = result.task;
    draggedFromPhase = result.phase;
    taskElement.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleDragEnd(event) {
  const taskElement = event.target.closest(".task");
  if (taskElement) {
    taskElement.classList.remove("dragging");
  }
  draggedTask = null;
  draggedFromPhase = null;
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";

  const phaseElement = event.target.closest(".phase");
  if (phaseElement && !phaseElement.classList.contains("dragging")) {
    phaseElement.classList.add("drag-over");
  }
}

function handleDragLeave(event) {
  const phaseElement = event.target.closest(".phase");
  if (phaseElement) {
    const rect = phaseElement.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      phaseElement.classList.remove("drag-over");
    }
  }
}

function handleDrop(event) {
  event.preventDefault();

  const phaseElement = event.target.closest(".phase");
  if (!phaseElement || !draggedTask || !draggedFromPhase) return;

  phaseElement.classList.remove("drag-over");

  const targetPhaseId = phaseElement.dataset.phaseId;
  const targetPhase = state.phases.find((p) => p.id === targetPhaseId);

  if (!targetPhase) return;

  // Si on dépose dans la même phase, ne rien faire
  if (draggedFromPhase.id === targetPhase.id) return;

  // Retirer la tâche de la phase source
  const sourceIndex = draggedFromPhase.tasks.findIndex((t) => t.id === draggedTask.id);
  if (sourceIndex !== -1) {
    draggedFromPhase.tasks.splice(sourceIndex, 1);
  }

  // Ajouter la tâche à la phase cible
  targetPhase.tasks.push(draggedTask);

  saveState();
  render();
}

// ===========================
// RENDU
// ===========================
function render() {
  const board = document.getElementById("roadmap-board");
  if (!board) return;

  board.innerHTML = state.phases
    .map((phase) => {
      const filteredTasks = phase.tasks.filter(taskMatchesFilter);
      const totalCount = phase.tasks.length;

      return `
      <div 
        class="phase" 
        data-phase-id="${phase.id}"
        role="listitem"
        ondragover="handleDragOver(event)"
        ondragleave="handleDragLeave(event)"
        ondrop="handleDrop(event)"
      >
        <div class="phase-header">
          <span class="phase-title">${phase.title}</span>
          <span class="phase-count" aria-label="${totalCount} tâche(s)">${totalCount}</span>
          <button 
            class="btn-add-task" 
            onclick="addTask('${phase.id}')"
            aria-label="Ajouter une tâche à ${escapeHtml(phase.title)}"
          >
            + Ajouter
          </button>
        </div>
        
        <div class="tasks-container" role="list">
          ${
            filteredTasks.length === 0
              ? `<div class="empty">
                  ${
                    state.filter
                      ? "Aucune tâche ne correspond au filtre"
                      : "Aucune tâche — ajoutez-en une !"
                  }
                </div>`
              : filteredTasks
                  .map(
                    (task) => `
              <div 
                class="task ${task.priority ? 'priority-' + task.priority : ''}" 
                data-task-id="${task.id}"
                draggable="true"
                ondragstart="handleDragStart(event)"
                ondragend="handleDragEnd(event)"
                role="listitem"
                tabindex="0"
                aria-label="Tâche: ${escapeHtml(task.title)}"
              >
                <div class="task-header">
                  <input
                    type="text"
                    class="task-title"
                    value="${escapeHtml(task.title)}"
                    onchange="updateTaskTitle('${task.id}', this.value)"
                    onclick="event.stopPropagation()"
                    aria-label="Titre de la tâche"
                  />
                  <div class="task-actions">
                    <div class="priority-buttons">
                      <button class="priority-btn priority-red ${task.priority === 'red' ? 'active' : ''}" 
                              onclick="event.stopPropagation(); updateTaskPriority('${task.id}', 'red')" 
                              aria-label="Priorité haute" title="Priorité haute">●</button>
                      <button class="priority-btn priority-orange ${task.priority === 'orange' ? 'active' : ''}" 
                              onclick="event.stopPropagation(); updateTaskPriority('${task.id}', 'orange')" 
                              aria-label="Priorité moyenne" title="Priorité moyenne">●</button>
                      <button class="priority-btn priority-green ${task.priority === 'green' ? 'active' : ''}" 
                              onclick="event.stopPropagation(); updateTaskPriority('${task.id}', 'green')" 
                              aria-label="Priorité basse" title="Priorité basse">●</button>
                    </div>
                    <button 
                      class="btn-delete-task" 
                      onclick="event.stopPropagation(); deleteTask('${task.id}')"
                      aria-label="Supprimer la tâche"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div class="task-dates">
                  <div class="task-date">
                    <span>📅 Début:</span>
                    <input 
                      type="date" 
                      class="date-input"
                      value="${task.startDate}"
                      onchange="updateTaskDate('${task.id}', 'start', this.value)"
                      onclick="event.stopPropagation()"
                    />
                  </div>
                  <div class="task-date">
                    <span>🏁 Fin:</span>
                    <input 
                      type="date" 
                      class="date-input"
                      value="${task.endDate}"
                      onchange="updateTaskDate('${task.id}', 'end', this.value)"
                      onclick="event.stopPropagation()"
                    />
                  </div>
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
}

// ===========================
// INITIALISATION
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  // Charger l'état
  loadState();
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

  // Bouton "Nouvelle tâche" dans le header
  const btnNewTask = document.getElementById("btn-new-task");
  if (btnNewTask) {
    btnNewTask.addEventListener("click", () => {
      // Ajoute la tâche dans la première phase
      if (state.phases.length > 0) {
        addTask(state.phases[0].id);
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
