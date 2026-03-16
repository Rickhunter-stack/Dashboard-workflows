// ===========================
// ÉTAT GLOBAL
// ===========================
let state = {
  reminders: [],
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

function formatDateTime(dateTime) {
  if (!dateTime) return null;
  const date = new Date(dateTime);
  const now = new Date();
  
  const options = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('fr-FR', options);
}

function isOverdue(dateTime) {
  if (!dateTime) return false;
  return new Date(dateTime) < new Date();
}

function shouldShowAlert(reminder) {
  if (!reminder.dateTime || !reminder.alertBefore) return false;
  
  const now = new Date();
  const reminderDate = new Date(reminder.dateTime);
  const diffMs = reminderDate - now;
  
  // Convertir l'alerte en millisecondes
  let alertMs = 0;
  switch(reminder.alertBefore) {
    case '1h': alertMs = 60 * 60 * 1000; break;
    case '3h': alertMs = 3 * 60 * 60 * 1000; break;
    case '1d': alertMs = 24 * 60 * 60 * 1000; break;
    case '3d': alertMs = 3 * 24 * 60 * 60 * 1000; break;
    case '1w': alertMs = 7 * 24 * 60 * 60 * 1000; break;
    default: return false;
  }
  
  // Afficher l'alerte si on est dans la période d'alerte et pas encore passé
  return diffMs > 0 && diffMs <= alertMs;
}

// ===========================
// PERSISTANCE
// ===========================
const STORAGE_KEY = "rappelsData";

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.reminders) state.reminders = parsed.reminders;
      if (parsed.filter !== undefined) state.filter = parsed.filter;
    }
  } catch (error) {
    console.error("Erreur lors du chargement:", error);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (window.supabaseShared) {
      state.reminders.forEach((r) => {
        window.supabaseShared.upsertRappel(r);
      });
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
  }
}

async function initState() {
  if (window.supabaseShared) {
    try {
      const rows = await window.supabaseShared.fetchRappels();
      if (rows && Array.isArray(rows) && rows.length > 0) {
        state.reminders = rows.map((row) => row.payload || row);
        render();
        return;
      }
    } catch (e) {
      console.warn("[Rappels] Supabase load failed, fallback localStorage", e);
    }
  }
  loadState();
  render();
}

// ===========================
// GESTION DES RAPPELS
// ===========================
function addReminder() {
  const newReminder = {
    id: generateId(),
    text: "Nouveau rappel",
    dateTime: null,
    alertBefore: null,
    priority: null,
  };

  state.reminders.unshift(newReminder);
  saveState();
  render();

  // Focus sur le texte du nouveau rappel
  setTimeout(() => {
    const reminderElement = document.querySelector(`[data-reminder-id="${newReminder.id}"]`);
    if (reminderElement) {
      const textInput = reminderElement.querySelector(".reminder-text");
      if (textInput) {
        textInput.focus();
        textInput.select();
      }
    }
  }, 100);
}

function updateReminderText(reminderId, newText) {
  const reminder = state.reminders.find((r) => r.id === reminderId);
  if (reminder) {
    reminder.text = newText;
    saveState();
  }
}

function updateReminderPriority(reminderId, priority) {
  const reminder = state.reminders.find((r) => r.id === reminderId);
  if (reminder) {
    reminder.priority = reminder.priority === priority ? null : priority;
    saveState();
    render();
  }
}

function deleteReminder(reminderId) {
  const index = state.reminders.findIndex((r) => r.id === reminderId);
  if (index !== -1) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rappel ?")) {
      state.reminders.splice(index, 1);
      saveState();
      if (window.supabaseShared) {
        window.supabaseShared.deleteRappel(reminderId);
      }
      render();
    }
  }
}

function updateReminderDateTime(reminderId, dateTime, alertBefore) {
  const reminder = state.reminders.find((r) => r.id === reminderId);
  if (reminder) {
    reminder.dateTime = dateTime;
    reminder.alertBefore = alertBefore;
    saveState();
    render();
  }
}

function clearReminderDateTime(reminderId) {
  const reminder = state.reminders.find((r) => r.id === reminderId);
  if (reminder) {
    reminder.dateTime = null;
    reminder.alertBefore = null;
    saveState();
    render();
  }
}

// ===========================
// FILTRAGE
// ===========================
function updateFilter(filterText) {
  state.filter = filterText.toLowerCase();
  render();
}

function reminderMatchesFilter(reminder) {
  if (!state.filter) return true;
  const searchText = state.filter;
  return reminder.text.toLowerCase().includes(searchText);
}

// ===========================
// MODAL DATE/HEURE
// ===========================
let currentModalReminderId = null;

function openDateTimeModal(reminderId) {
  currentModalReminderId = reminderId;
  const reminder = state.reminders.find((r) => r.id === reminderId);
  if (!reminder) return;

  // Préparer la date/heure par défaut
  let defaultDateTime = '';
  if (reminder.dateTime) {
    const date = new Date(reminder.dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Créer le modal
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-labelledby="modal-title" aria-modal="true">
      <div class="modal-header">
        <h2 class="modal-title" id="modal-title">📅 Date et heure du rappel</h2>
        <button class="modal-close" aria-label="Fermer" onclick="closeDateTimeModal()">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="modal-field">
          <label class="modal-label" for="datetime-input">Date et heure</label>
          <input
            type="datetime-local"
            id="datetime-input"
            class="modal-input"
            value="${defaultDateTime}"
            aria-label="Date et heure du rappel"
          />
        </div>
        
        <div class="modal-field">
          <label class="modal-label" for="alert-select">M'alerter avant</label>
          <select
            id="alert-select"
            class="modal-select"
            aria-label="Délai d'alerte"
          >
            <option value="">Pas d'alerte</option>
            <option value="1h" ${reminder.alertBefore === '1h' ? 'selected' : ''}>1 heure avant</option>
            <option value="3h" ${reminder.alertBefore === '3h' ? 'selected' : ''}>3 heures avant</option>
            <option value="1d" ${reminder.alertBefore === '1d' ? 'selected' : ''}>1 jour avant</option>
            <option value="3d" ${reminder.alertBefore === '3d' ? 'selected' : ''}>3 jours avant</option>
            <option value="1w" ${reminder.alertBefore === '1w' ? 'selected' : ''}>1 semaine avant</option>
          </select>
        </div>
      </div>
      
      <div class="modal-footer">
        ${reminder.dateTime ? '<button class="modal-btn modal-btn-danger" onclick="clearReminderDateTimeFromModal()">🗑️ Supprimer</button>' : ''}
        <button class="modal-btn modal-btn-secondary" onclick="closeDateTimeModal()">Annuler</button>
        <button class="modal-btn modal-btn-primary" onclick="saveDateTimeFromModal()">Enregistrer</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Fermer avec Escape
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeDateTimeModal();
    }
  };
  modal.addEventListener("keydown", handleEscape);

  // Fermer en cliquant en dehors
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeDateTimeModal();
    }
  });
}

function closeDateTimeModal() {
  const modal = document.querySelector(".modal-overlay");
  if (modal) {
    modal.remove();
  }
  currentModalReminderId = null;
}

function saveDateTimeFromModal() {
  if (!currentModalReminderId) return;

  const dateTimeInput = document.getElementById("datetime-input");
  const alertSelect = document.getElementById("alert-select");

  if (dateTimeInput.value) {
    updateReminderDateTime(
      currentModalReminderId,
      dateTimeInput.value,
      alertSelect.value || null
    );
  }

  closeDateTimeModal();
}

function clearReminderDateTimeFromModal() {
  if (!currentModalReminderId) return;
  clearReminderDateTime(currentModalReminderId);
  closeDateTimeModal();
}

// ===========================
// VÉRIFICATION DES ALERTES
// ===========================
function checkAlerts() {
  const alertReminders = state.reminders.filter(shouldShowAlert);
  
  if (alertReminders.length > 0) {
    const messages = alertReminders.map(r => {
      const timeLeft = new Date(r.dateTime) - new Date();
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const daysLeft = Math.floor(hoursLeft / 24);
      
      let timeMsg = '';
      if (daysLeft > 0) {
        timeMsg = `dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`;
      } else if (hoursLeft > 0) {
        timeMsg = `dans ${hoursLeft} heure${hoursLeft > 1 ? 's' : ''}`;
      } else {
        timeMsg = "bientôt";
      }
      
      return `🔔 "${r.text}" - ${timeMsg}`;
    }).join('\n\n');
    
    alert(`Rappels à venir :\n\n${messages}`);
  }
}

// ===========================
// RENDU
// ===========================
function render() {
  const remindersList = document.getElementById("reminders-list");
  if (!remindersList) return;

  // Supprimer visuellement les rappels dépassés
  state.reminders = state.reminders.filter((r) => !isOverdue(r.dateTime));

  const filteredReminders = state.reminders.filter(reminderMatchesFilter);

  if (filteredReminders.length === 0) {
    remindersList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">
          ${state.filter 
            ? "Aucun rappel ne correspond au filtre" 
            : "Aucun rappel pour le moment. Cliquez sur 'Nouveau rappel' pour commencer !"
          }
        </div>
      </div>
    `;
    return;
  }

  remindersList.innerHTML = filteredReminders
    .map((reminder) => {
      const overdue = isOverdue(reminder.dateTime);
      const soon = shouldShowAlert(reminder);
      const priorityClass = reminder.priority ? `priority-${reminder.priority}` : '';
      const overdueClass = overdue ? 'overdue' : '';
      const soonClass = !overdue && soon ? 'soon' : '';

      return `
        <div 
          class="reminder-item ${priorityClass} ${overdueClass} ${soonClass}" 
          data-reminder-id="${reminder.id}"
          role="listitem"
        >
          <div class="priority-buttons">
            <button 
              class="priority-btn priority-red ${reminder.priority === 'red' ? 'active' : ''}" 
              onclick="updateReminderPriority('${reminder.id}', 'red')" 
              aria-label="Priorité haute"
              title="Priorité haute"
            >●</button>
            <button 
              class="priority-btn priority-orange ${reminder.priority === 'orange' ? 'active' : ''}" 
              onclick="updateReminderPriority('${reminder.id}', 'orange')" 
              aria-label="Priorité moyenne"
              title="Priorité moyenne"
            >●</button>
            <button 
              class="priority-btn priority-green ${reminder.priority === 'green' ? 'active' : ''}" 
              onclick="updateReminderPriority('${reminder.id}', 'green')" 
              aria-label="Priorité basse"
              title="Priorité basse"
            >●</button>
          </div>
          
          <div class="reminder-content">
            <input
              type="text"
              class="reminder-text"
              value="${escapeHtml(reminder.text)}"
              onchange="updateReminderText('${reminder.id}', this.value)"
              aria-label="Texte du rappel"
            />
            
            ${reminder.dateTime ? `
              <div class="reminder-datetime">
                <div class="datetime-info">
                  <span class="datetime-label">📅</span>
                  <span>${formatDateTime(reminder.dateTime)}</span>
                  ${overdue ? '<span class="overdue-badge">En retard</span>' : ''}
                </div>
                ${reminder.alertBefore ? `
                  <div class="datetime-info">
                    <span class="datetime-label">🔔</span>
                    <span>Alerte: ${getAlertLabel(reminder.alertBefore)}</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          
          <div class="reminder-actions">
            <button 
              class="btn-datetime ${reminder.dateTime ? 'has-datetime' : ''}" 
              onclick="openDateTimeModal('${reminder.id}')"
              aria-label="Paramétrer date et heure"
              title="Paramétrer date et heure"
            >📅</button>
            <button 
              class="btn-delete" 
              onclick="deleteReminder('${reminder.id}')"
              aria-label="Supprimer le rappel"
              title="Supprimer"
            >🗑️</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function getAlertLabel(alertBefore) {
  const labels = {
    '1h': '1h avant',
    '3h': '3h avant',
    '1d': '1 jour avant',
    '3d': '3 jours avant',
    '1w': '1 semaine avant'
  };
  return labels[alertBefore] || '';
}

// ===========================
// INITIALISATION
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("compact") === "1") {
    document.body.classList.add("compact");
  }

  // Charger l'état (Supabase si configuré, sinon localStorage)
  await initState();

  // Vérifier les alertes au démarrage
  checkAlerts();
  
  // Vérifier les alertes toutes les 5 minutes
  setInterval(checkAlerts, 5 * 60 * 1000);

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

  // Bouton "Nouveau rappel"
  const btnNewReminder = document.getElementById("btn-new-reminder");
  if (btnNewReminder) {
    btnNewReminder.addEventListener("click", addReminder);
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
