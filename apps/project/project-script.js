// ===========================
// ÉTAT GLOBAL
// ===========================
let state = {
  phases: [],
  phaseNames: {},
  projects: [],
  filter: "",
};

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

// Initialiser l'état par défaut
function initState() {
  return {
    phases: ["planning", "development", "testing", "deployment"],
    phaseNames: {
      planning: "📋 Planification",
      development: "⚙️ Développement",
      testing: "🧪 Test",
      deployment: "🚀 Déploiement",
    },
    projects: [
      {
        id: generateId(),
        name: "Projet Example",
        tasks: {
          planning: {
            id: generateId(),
            title: "Définir les objectifs",
            priority: null,
            startDate: "",
            endDate: "",
          },
          development: null,
          testing: null,
          deployment: null,
        },
      },
    ],
    filter: "",
  };
}

// ===========================
// PERSISTANCE
// ===========================
const STORAGE_KEY = "projectRoadmapData";
const STORAGE_VERSION = "v2"; // Version pour forcer le reset si nécessaire

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Vérifier si la structure est compatible
      if (data.phases && Array.isArray(data.phases) && data.phaseNames && data.projects) {
        state = data;
      } else {
        console.log("Structure incompatible, réinitialisation...");
        state = initState();
        saveState();
      }
    } else {
      state = initState();
      saveState();
    }
  } catch (error) {
    console.error("Erreur lors du chargement:", error);
    state = initState();
    saveState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (window.supabaseShared) {
      window.supabaseShared.upsertProjectRoadmap(state);
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
  }
}

async function loadRoadmapState() {
  if (window.supabaseShared) {
    try {
      const roadmap = await window.supabaseShared.fetchProjectRoadmap();
      if (roadmap && roadmap.phases && Array.isArray(roadmap.phases) && roadmap.projects) {
        state = roadmap;
        return;
      }
    } catch (e) {
      console.warn("[Projet] Supabase load failed, fallback localStorage", e);
    }
  }
  loadState();
}

// ===========================
// GESTION DES PROJETS
// ===========================
function addProject() {
  const newProject = {
    id: generateId(),
    name: "Nouveau Projet",
    tasks: {
      planning: null,
      development: null,
      testing: null,
      deployment: null,
    },
  };
  
  state.projects.push(newProject);
  saveState();
  render();
  
  // Focus sur le nom du projet
  setTimeout(() => {
    const projectElement = document.querySelector(`[data-project-id="${newProject.id}"]`);
    if (projectElement) {
      const nameInput = projectElement.querySelector(".project-name-input");
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }
  }, 100);
}

function updateProjectName(projectId, newName) {
  const project = state.projects.find((p) => p.id === projectId);
  if (project) {
    project.name = newName;
    saveState();
  }
}

function deleteProject(projectId) {
  const index = state.projects.findIndex((p) => p.id === projectId);
  if (index !== -1) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      state.projects.splice(index, 1);
      saveState();
      render();
    }
  }
}

// ===========================
// GESTION DES TÂCHES
// ===========================
function addTask(projectId, phaseId) {
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return;

  const newTask = {
    id: generateId(),
    title: "Nouvelle tâche",
    priority: null,
    startDate: "",
    endDate: "",
  };

  project.tasks[phaseId] = newTask;
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
  for (const project of state.projects) {
    for (const phase of state.phases) {
      const task = project.tasks[phase];
      if (task && task.id === taskId) {
        task.title = newTitle;
        saveState();
        return;
      }
    }
  }
}

function updateTaskPriority(taskId, priority) {
  for (const project of state.projects) {
    for (const phase of state.phases) {
      const task = project.tasks[phase];
      if (task && task.id === taskId) {
        task.priority = task.priority === priority ? null : priority;
        saveState();
        render();
        return;
      }
    }
  }
}

function updateTaskDate(taskId, dateType, newDate) {
  for (const project of state.projects) {
    for (const phase of state.phases) {
      const task = project.tasks[phase];
      if (task && task.id === taskId) {
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
}

function deleteTask(projectId, phaseId) {
  const project = state.projects.find((p) => p.id === projectId);
  if (project && project.tasks[phaseId]) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      project.tasks[phaseId] = null;
      saveState();
      render();
    }
  }
}

function findTask(taskId) {
  for (const project of state.projects) {
    for (const phase of state.phases) {
      const task = project.tasks[phase];
      if (task && task.id === taskId) {
        return { task, project, phase };
      }
    }
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

function projectMatchesFilter(project) {
  if (!state.filter) return true;
  const searchText = state.filter;
  
  // Recherche dans le nom du projet
  if (project.name.toLowerCase().includes(searchText)) {
    return true;
  }
  
  // Recherche dans les tâches
  for (const phase of state.phases) {
    const task = project.tasks[phase];
    if (task && task.title.toLowerCase().includes(searchText)) {
      return true;
    }
  }
  
  return false;
}

// ===========================
// DRAG & DROP HORIZONTAL
// ===========================
let draggedTask = null;
let draggedFromProject = null;
let draggedFromPhase = null;

function handleDragStart(event) {
  const taskElement = event.target.closest(".task");
  if (!taskElement) return;

  const taskId = taskElement.dataset.taskId;
  const result = findTask(taskId);

  if (result) {
    draggedTask = result.task;
    draggedFromProject = result.project;
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
  
  // Nettoyer tous les drag-over
  document.querySelectorAll(".task-cell.drag-over").forEach((el) => {
    el.classList.remove("drag-over");
  });
  
  draggedTask = null;
  draggedFromProject = null;
  draggedFromPhase = null;
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";

  const cellElement = event.target.closest(".task-cell");
  if (cellElement && !cellElement.querySelector(".task.dragging")) {
    cellElement.classList.add("drag-over");
  }
}

function handleDragLeave(event) {
  const cellElement = event.target.closest(".task-cell");
  if (cellElement) {
    const rect = cellElement.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      cellElement.classList.remove("drag-over");
    }
  }
}

function handleDrop(event) {
  event.preventDefault();

  const cellElement = event.target.closest(".task-cell");
  if (!cellElement || !draggedTask || !draggedFromProject || !draggedFromPhase) return;

  cellElement.classList.remove("drag-over");

  const targetProjectId = cellElement.dataset.projectId;
  const targetPhase = cellElement.dataset.phase;
  
  // Vérifier que c'est le même projet (mouvement horizontal seulement)
  if (targetProjectId !== draggedFromProject.id) {
    return;
  }
  
  // Si on dépose dans la même cellule, ne rien faire
  if (targetPhase === draggedFromPhase) return;

  // Si la cellule cible contient déjà une tâche, ne rien faire
  if (draggedFromProject.tasks[targetPhase]) {
    return;
  }

  // Déplacer la tâche
  draggedFromProject.tasks[draggedFromPhase] = null;
  draggedFromProject.tasks[targetPhase] = draggedTask;

  saveState();
  render();
}

// ===========================
// RENDU
// ===========================
function render() {
  const board = document.getElementById("roadmap-board");
  if (!board) return;

  const filteredProjects = state.projects.filter(projectMatchesFilter);

  // Générer l'en-tête avec les noms de phases
  const headerHTML = `
    <div class="roadmap-header">
      <div class="project-name-header">Projets</div>
      ${state.phases.map(phaseId => `
        <div class="phase-header-cell">
          ${state.phaseNames[phaseId]}
        </div>
      `).join('')}
      <div class="actions-header"></div>
    </div>
  `;

  // Générer les lignes de projets
  const projectsHTML = filteredProjects.map(project => `
    <div class="project-row" data-project-id="${project.id}">
      <div class="project-name-cell">
        <input
          type="text"
          class="project-name-input"
          value="${escapeHtml(project.name)}"
          onchange="updateProjectName('${project.id}', this.value)"
          onclick="event.stopPropagation()"
        />
      </div>
      
      ${state.phases.map(phaseId => {
        const task = project.tasks[phaseId];
        return `
          <div 
            class="task-cell ${task ? 'has-task' : 'empty-cell'}"
            data-project-id="${project.id}"
            data-phase="${phaseId}"
            ondragover="handleDragOver(event)"
            ondragleave="handleDragLeave(event)"
            ondrop="handleDrop(event)"
          >
            ${task ? `
              <div 
                class="task ${task.priority ? 'priority-' + task.priority : ''}" 
                data-task-id="${task.id}"
                draggable="true"
                ondragstart="handleDragStart(event)"
                ondragend="handleDragEnd(event)"
              >
                <div class="task-header">
                  <input
                    type="text"
                    class="task-title"
                    value="${escapeHtml(task.title)}"
                    onchange="updateTaskTitle('${task.id}', this.value)"
                    onclick="event.stopPropagation()"
                  />
                  <div class="task-actions">
                    <div class="priority-buttons">
                      <button class="priority-btn priority-red ${task.priority === 'red' ? 'active' : ''}" 
                              onclick="event.stopPropagation(); updateTaskPriority('${task.id}', 'red')" 
                              title="Priorité haute">●</button>
                      <button class="priority-btn priority-orange ${task.priority === 'orange' ? 'active' : ''}" 
                              onclick="event.stopPropagation(); updateTaskPriority('${task.id}', 'orange')" 
                              title="Priorité moyenne">●</button>
                      <button class="priority-btn priority-green ${task.priority === 'green' ? 'active' : ''}" 
                              onclick="event.stopPropagation(); updateTaskPriority('${task.id}', 'green')" 
                              title="Priorité basse">●</button>
                    </div>
                    <button 
                      class="btn-delete-task" 
                      onclick="event.stopPropagation(); deleteTask('${project.id}', '${phaseId}')"
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
            ` : `
              <button 
                class="btn-add-task-cell" 
                onclick="addTask('${project.id}', '${phaseId}')"
                title="Ajouter une tâche"
              >
                +
              </button>
            `}
          </div>
        `;
      }).join('')}
      
      <div class="project-actions-cell">
        <button 
          class="btn-delete-project" 
          onclick="deleteProject('${project.id}')"
          title="Supprimer le projet"
        >
          🗑️
        </button>
      </div>
    </div>
  `).join('');

  const emptyState = filteredProjects.length === 0 ? `
    <div class="empty-state">
      ${state.filter 
        ? "Aucun projet ne correspond au filtre" 
        : "Aucun projet — cliquez sur 'Nouveau Projet' pour commencer !"}
    </div>
  ` : '';

  board.innerHTML = headerHTML + projectsHTML + emptyState;
}

// ===========================
// INITIALISATION
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  await loadRoadmapState();
  if (!state.projects || state.projects.length === 0) {
    state = initState();
    saveState();
  }
  render();
  console.log("Rendu initial effectué");

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

  // Bouton "Nouveau Projet"
  const btnNewTask = document.getElementById("btn-new-task");
  if (btnNewTask) {
    btnNewTask.textContent = "➕ Nouveau Projet";
    btnNewTask.addEventListener("click", () => {
      console.log("Ajout d'un nouveau projet");
      addProject();
    });
  }

  // Filtre
  const filterInput = document.getElementById("filter-input");
  if (filterInput) {
    filterInput.placeholder = "🔍 Filtrer les projets...";
    filterInput.addEventListener("input", (e) => {
      updateFilter(e.target.value);
    });

    // Restaurer la valeur du filtre si elle existe
    if (state.filter) {
      filterInput.value = state.filter;
    }
  }
});
