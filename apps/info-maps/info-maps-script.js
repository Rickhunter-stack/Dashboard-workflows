// État global
let currentCreationType = 'mindmap';
let mindmaps = { created: [], imported: [] };
let infographies = { created: [], imported: [] };
let currentLibraryTab = 'infographie-imported';
let currentMindmap = null;
let currentInfographie = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderLibrary();
  updateTabCounts();
});

// Chargement des données
function loadData() {
  const mindmapsData = localStorage.getItem('info-maps-mindmaps');
  const infographiesData = localStorage.getItem('info-maps-infographies');
  
  if (mindmapsData) mindmaps = JSON.parse(mindmapsData);
  if (infographiesData) infographies = JSON.parse(infographiesData);
}

// Sauvegarde des données
function saveData() {
  localStorage.setItem('info-maps-mindmaps', JSON.stringify(mindmaps));
  localStorage.setItem('info-maps-infographies', JSON.stringify(infographies));
}

// Toggle info
function toggleInfo() {
  const infoContent = document.getElementById('infoContent');
  const infoToggle = document.querySelector('.info-toggle');
  
  if (infoContent.style.display === 'none' || infoContent.style.display === '') {
    infoContent.style.display = 'block';
    infoToggle.textContent = 'Informations sur l\'outil ▲';
  } else {
    infoContent.style.display = 'none';
    infoToggle.textContent = 'Informations sur l\'outil ▼';
  }
}

// Changer le type de création
function switchCreationType(type) {
  currentCreationType = type;
  
  // Mettre à jour les boutons
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  
  // Afficher/masquer les actions
  document.getElementById('mindmap-actions').style.display = type === 'mindmap' ? 'flex' : 'none';
  document.getElementById('infographie-actions').style.display = type === 'infographie' ? 'flex' : 'none';
  
  // Activer le bon onglet de bibliothèque
  const defaultTab = type === 'mindmap' ? 'mindmap-imported' : 'infographie-imported';
  switchLibraryTab(defaultTab);
}

// Changer d'onglet bibliothèque
function switchLibraryTab(tab) {
  currentLibraryTab = tab;
  
  // Mettre à jour les boutons
  document.querySelectorAll('.library-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  // Afficher/masquer les contenus
  document.querySelectorAll('.library-content').forEach(content => {
    content.classList.remove('active');
    content.style.display = 'none';
  });
  
  const activeContent = document.getElementById(tab + '-list');
  if (activeContent) {
    activeContent.classList.add('active');
    activeContent.style.display = 'grid';
  }
  
  renderLibrary();
}

// Mettre à jour les compteurs
function updateTabCounts() {
  document.querySelector('[data-tab="mindmap-created"]').textContent = 
    `🧠 Mes Mind Maps (${mindmaps.created.length})`;
  document.querySelector('[data-tab="mindmap-imported"]').textContent = 
    `📚 Mind Maps Importées (${mindmaps.imported.length})`;
  document.querySelector('[data-tab="infographie-created"]').textContent = 
    `📊 Mes Infographies (${infographies.created.length})`;
  document.querySelector('[data-tab="infographie-imported"]').textContent = 
    `📚 Infographies Importées (${infographies.imported.length})`;
}

// Rendre la bibliothèque
function renderLibrary() {
  const lists = {
    'mindmap-created': mindmaps.created,
    'mindmap-imported': mindmaps.imported,
    'infographie-created': infographies.created,
    'infographie-imported': infographies.imported
  };
  
  Object.keys(lists).forEach(key => {
    const container = document.getElementById(key + '-list');
    if (!container) return;
    
    const items = lists[key];
    
    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #b8c5d6;">
          <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📭</div>
          <p>Aucune création pour le moment</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = items.map((item, index) => `
      <div class="content-card" onclick="viewItem('${key.split('-')[0]}', '${key.split('-')[1]}', ${index})">
        <h3>${escapeHtml(item.title || 'Sans titre')}</h3>
        <p style="margin-top: 8px; font-size: 12px; opacity: 0.7;">
          ${item.date ? new Date(item.date).toLocaleDateString('fr-FR') : ''}
        </p>
      </div>
    `).join('');
  });
}

// Créer une mind map
function createMindmap() {
  showSubjectModal('mindmap');
}

// Créer une infographie
function createInfographie() {
  showSubjectModal('infographie');
}

// Afficher le modal de sujet
function showSubjectModal(type) {
  const modal = document.getElementById('subject-modal');
  const title = document.getElementById('modal-title');
  const input = document.getElementById('subject-input');
  
  title.textContent = type === 'mindmap' ? 'Créer une Mind Map' : 'Créer une Infographie';
  input.placeholder = type === 'mindmap' 
    ? 'Ex: Intelligence Artificielle, Marketing...' 
    : 'Ex: Architecture web, Blockchain...';
  input.value = '';
  input.dataset.type = type;
  
  modal.style.display = 'flex';
  input.focus();
}

// Fermer le modal de sujet
function closeSubjectModal() {
  document.getElementById('subject-modal').style.display = 'none';
}

// Générer le contenu
function generateContent() {
  const input = document.getElementById('subject-input');
  const subject = input.value.trim();
  const type = input.dataset.type;
  
  if (!subject) {
    alert('Veuillez entrer un sujet');
    return;
  }
  
  if (type === 'mindmap') {
    currentMindmap = {
      id: Date.now(),
      title: subject,
      date: new Date().toISOString(),
      data: { subject, nodes: [] }
    };
    showMindmapGenerator();
  } else {
    currentInfographie = {
      id: Date.now(),
      title: subject,
      date: new Date().toISOString(),
      data: { subject, steps: [] }
    };
    showInfographieGenerator();
  }
  
  closeSubjectModal();
}

// Afficher le générateur de mind map
function showMindmapGenerator() {
  document.getElementById('home-view').style.display = 'none';
  document.getElementById('mindmap-generator-view').style.display = 'block';
  document.getElementById('infographie-generator-view').style.display = 'none';
  
  if (currentMindmap) {
    document.getElementById('mindmap-title').value = currentMindmap.title || '';
  }
}

// Afficher le générateur d'infographie
function showInfographieGenerator() {
  document.getElementById('home-view').style.display = 'none';
  document.getElementById('mindmap-generator-view').style.display = 'none';
  document.getElementById('infographie-generator-view').style.display = 'block';
  
  if (currentInfographie) {
    document.getElementById('infographie-title').value = currentInfographie.title || '';
  }
}

// Retour à l'accueil
function backToHome() {
  document.getElementById('home-view').style.display = 'block';
  document.getElementById('mindmap-generator-view').style.display = 'none';
  document.getElementById('infographie-generator-view').style.display = 'none';
  
  currentMindmap = null;
  currentInfographie = null;
  
  renderLibrary();
  updateTabCounts();
}

// Sauvegarder une mind map
function saveMindmap() {
  if (!currentMindmap) return;
  
  currentMindmap.title = document.getElementById('mindmap-title').value || 'Sans titre';
  currentMindmap.date = new Date().toISOString();
  
  const existingIndex = mindmaps.created.findIndex(m => m.id === currentMindmap.id);
  if (existingIndex >= 0) {
    mindmaps.created[existingIndex] = currentMindmap;
  } else {
    mindmaps.created.unshift(currentMindmap);
  }
  
  saveData();
  alert('Mind map sauvegardée !');
  updateTabCounts();
}

// Sauvegarder une infographie
function saveInfographie() {
  if (!currentInfographie) return;
  
  currentInfographie.title = document.getElementById('infographie-title').value || 'Sans titre';
  currentInfographie.date = new Date().toISOString();
  
  const existingIndex = infographies.created.findIndex(i => i.id === currentInfographie.id);
  if (existingIndex >= 0) {
    infographies.created[existingIndex] = currentInfographie;
  } else {
    infographies.created.unshift(currentInfographie);
  }
  
  saveData();
  alert('Infographie sauvegardée !');
  updateTabCounts();
}

// Supprimer la mind map actuelle
function deleteCurrentMindmap() {
  if (!currentMindmap) return;
  
  if (confirm('Êtes-vous sûr de vouloir supprimer cette mind map ?')) {
    mindmaps.created = mindmaps.created.filter(m => m.id !== currentMindmap.id);
    saveData();
    backToHome();
  }
}

// Supprimer l'infographie actuelle
function deleteCurrentInfographie() {
  if (!currentInfographie) return;
  
  if (confirm('Êtes-vous sûr de vouloir supprimer cette infographie ?')) {
    infographies.created = infographies.created.filter(i => i.id !== currentInfographie.id);
    saveData();
    backToHome();
  }
}

// Importer un fichier mind map
function importMindmapFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const item = {
      id: Date.now(),
      title: file.name.replace('.html', ''),
      date: new Date().toISOString(),
      htmlContent: e.target.result
    };
    
    mindmaps.imported.unshift(item);
    saveData();
    updateTabCounts();
    renderLibrary();
    switchLibraryTab('mindmap-imported');
  };
  reader.readAsText(file);
  
  event.target.value = '';
}

// Importer un fichier infographie
function importInfographieFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const item = {
      id: Date.now(),
      title: file.name.replace('.html', ''),
      date: new Date().toISOString(),
      htmlContent: e.target.result
    };
    
    infographies.imported.unshift(item);
    saveData();
    updateTabCounts();
    renderLibrary();
    switchLibraryTab('infographie-imported');
  };
  reader.readAsText(file);
  
  event.target.value = '';
}

// Voir un élément
function viewItem(type, category, index) {
  const item = type === 'mindmap' 
    ? mindmaps[category][index] 
    : infographies[category][index];
  
  if (!item) return;
  
  if (category === 'imported' && item.htmlContent) {
    // Afficher dans un iframe
    const modal = document.getElementById('preview-modal');
    const frame = document.getElementById('preview-frame');
    frame.srcdoc = item.htmlContent;
    modal.style.display = 'flex';
  } else {
    // Éditer
    if (type === 'mindmap') {
      currentMindmap = item;
      showMindmapGenerator();
    } else {
      currentInfographie = item;
      showInfographieGenerator();
    }
  }
}

// Fermer la prévisualisation
function closePreview() {
  document.getElementById('preview-modal').style.display = 'none';
}

// Afficher le menu d'export
function showExportMenu(type) {
  document.getElementById('export-modal').style.display = 'flex';
}

// Fermer le menu d'export
function closeExportMenu() {
  document.getElementById('export-modal').style.display = 'none';
}

// Exporter en PNG
function exportAsPNG() {
  alert('Export PNG en cours de développement');
  closeExportMenu();
}

// Exporter en SVG
function exportAsSVG() {
  alert('Export SVG en cours de développement');
  closeExportMenu();
}

// Exporter en HTML
function exportAsHTML() {
  alert('Export HTML en cours de développement');
  closeExportMenu();
}

// Fonctions de contrôle pour Mind Map
function setConnectionStyle(style) {
  document.querySelectorAll('.connection-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

function zoomIn() {
  const zoomLevel = document.getElementById('zoom-level');
  let current = parseInt(zoomLevel.textContent);
  current = Math.min(200, current + 10);
  zoomLevel.textContent = current + '%';
}

function zoomOut() {
  const zoomLevel = document.getElementById('zoom-level');
  let current = parseInt(zoomLevel.textContent);
  current = Math.max(50, current - 10);
  zoomLevel.textContent = current + '%';
}

function addBranch() {
  alert('Ajout de branche en cours de développement');
}

function centerView() {
  alert('Centrage de la vue en cours de développement');
}

// Fonctions de contrôle pour Infographie
function setFont(font) {
  document.querySelectorAll('.font-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

function setLayout(layout) {
  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

function addStep() {
  alert('Ajout d\'étape en cours de développement');
}

function previewInfographie() {
  alert('Prévisualisation en cours de développement');
}

// Utilitaire
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
