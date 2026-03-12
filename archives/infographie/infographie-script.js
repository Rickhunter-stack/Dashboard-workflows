// État global de l'application
let infographies = [];
let importedInfographies = [];
let libraryInfographies = [];
let currentInfographie = null;
let currentLibraryTab = "imported";
let currentPalette = "gradient1";
let currentFont = "Inter";
let currentLayout = "vertical";
let currentTheme = "professional";
let draggedStep = null;
let currentEditingIcon = null;
let currentViewedInfographie = null;
let viewerZoom = 1;

// Palettes de couleurs prédéfinies
const colorPalettes = {
  gradient1: [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ],
  gradient2: [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  ],
  gradient3: [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #08aeea 0%, #2af598 100%)",
    "linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)",
    "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  ],
  vibrant: [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
    "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
    "linear-gradient(135deg, #fa8bff 0%, #2bd2ff 100%)",
    "linear-gradient(135deg, #52fa5a 0%, #4ebbf5 100%)",
  ],
  pastel: [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
    "linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)",
    "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  ],
};

// Emojis disponibles pour les icônes
const availableEmojis = [
  "👤",
  "🖥️",
  "📡",
  "🛡️",
  "👨‍🍳",
  "🗄️",
  "🍽️",
  "🏢",
  "🏭",
  "⚙️",
  "💻",
  "📱",
  "🌐",
  "☁️",
  "🔒",
  "🔑",
  "📊",
  "📈",
  "💡",
  "🎯",
  "🚀",
  "⚡",
  "🔧",
  "🛠️",
  "📦",
  "📮",
  "📬",
  "📭",
  "📤",
  "📥",
  "🎨",
  "🎭",
  "🎪",
  "🎬",
  "📹",
  "📷",
  "🎤",
  "🎧",
  "🎵",
  "🎸",
  "🚗",
  "✈️",
  "🚢",
  "🚆",
  "🚊",
  "🚁",
  "🚲",
  "🏃",
  "🏋️",
  "⚽",
  "🌟",
  "⭐",
  "✨",
  "💫",
  "🌈",
  "🌍",
  "🌎",
  "🌏",
  "🗺️",
  "🧭",
  "📚",
  "📖",
  "📝",
  "✏️",
  "✒️",
  "🖊️",
  "📄",
  "📃",
  "📋",
  "📌",
];

// Templates de génération automatique
const generationTemplates = {
  restaurant: {
    metaphor: "Un restaurant",
    steps: [
      {
        title: "Le Client",
        metaphor: "La personne affamée",
        description: "Envoie une demande au restaurant",
        icon: "👤",
      },
      {
        title: "Le Routeur",
        metaphor: "Le livreur qui trouve l'adresse",
        description: "Achemine la demande au bon endroit",
        icon: "📡",
      },
      {
        title: "Le Serveur",
        metaphor: "Le maître d'hôtel",
        description: "Reçoit la commande et filtre les demandes",
        icon: "🛡️",
      },
      {
        title: "Le Chef",
        metaphor: "Le cuisinier",
        description: "Prépare la réponse demandée",
        icon: "👨‍🍳",
      },
      {
        title: "La Base de données",
        metaphor: "Le garde-manger",
        description: "Stocke tous les ingrédients",
        icon: "🗄️",
      },
    ],
  },
  default: {
    metaphor: "Un processus",
    steps: [
      {
        title: "Étape 1",
        metaphor: "Début",
        description: "Point de départ du processus",
        icon: "🎯",
      },
      {
        title: "Étape 2",
        metaphor: "Traitement",
        description: "Transformation des données",
        icon: "⚙️",
      },
      {
        title: "Étape 3",
        metaphor: "Vérification",
        description: "Contrôle qualité",
        icon: "✅",
      },
      {
        title: "Étape 4",
        metaphor: "Stockage",
        description: "Sauvegarde des résultats",
        icon: "💾",
      },
      {
        title: "Étape 5",
        metaphor: "Livraison",
        description: "Envoi du résultat final",
        icon: "📦",
      },
    ],
  },
};

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  loadInfographies();
  loadLibraryInfographies();
  renderInfographiesList();
  initializePalettes();
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

// Charger les infographies depuis localStorage
function loadInfographies() {
  const saved = localStorage.getItem("infographies");
  infographies = saved ? JSON.parse(saved) : [];
  
  // Ajouter un thumbnail par défaut si manquant
  infographies = infographies.map(inf => ({
    ...inf,
    thumbnail: inf.thumbnail || "🎨"
  }));

  const savedImported = localStorage.getItem("importedInfographies");
  importedInfographies = savedImported ? JSON.parse(savedImported) : [];
  
  // Ajouter un thumbnail par défaut si manquant
  importedInfographies = importedInfographies.map(inf => ({
    ...inf,
    thumbnail: inf.thumbnail || "📊"
  }));
  
  // Sauvegarder les corrections
  if (infographies.length > 0) {
    localStorage.setItem("infographies", JSON.stringify(infographies));
  }
  if (importedInfographies.length > 0) {
    localStorage.setItem("importedInfographies", JSON.stringify(importedInfographies));
  }
}

// Charger la bibliothèque d'infographies pré-installées
async function loadLibraryInfographies() {
  try {
    const response = await fetch("library/infographies/index.json");
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    libraryInfographies = data.infographies || [];

    libraryInfographies.forEach((libInfographie) => {
      const exists = importedInfographies.some(
        (imp) => imp.filename === libInfographie.filename
      );

      if (!exists) {
        loadLibraryHTMLContent(libInfographie);
      }
    });

    renderInfographiesList();
  } catch (error) {
    console.log("Bibliothèque non disponible");
  }
}

// Charger le contenu HTML d'une infographie de bibliothèque
async function loadLibraryHTMLContent(libInfographie) {
  try {
    const response = await fetch(
      `library/infographies/${libInfographie.filename}`
    );
    if (!response.ok) return;

    const htmlContent = await response.text();

    const importedInfographie = {
      id: `lib-${libInfographie.id}`,
      title: libInfographie.title,
      description: libInfographie.description,
      filename: libInfographie.filename,
      thumbnail: libInfographie.thumbnail || "📊",
      category: libInfographie.category || "Général",
      tags: libInfographie.tags || [],
      size: htmlContent.length,
      importedAt: new Date().toISOString(),
      htmlContent: htmlContent,
      isFromLibrary: true,
    };

    importedInfographies.push(importedInfographie);
    saveImportedInfographies();
  } catch (error) {
    console.log(`Erreur: ${libInfographie.filename}`);
  }
}

// Sauvegarder les infographies dans localStorage
function saveInfographies() {
  localStorage.setItem("infographies", JSON.stringify(infographies));
}

// Sauvegarder les infographies importées
function saveImportedInfographies() {
  const toSave = importedInfographies.filter((i) => !i.isFromLibrary);
  localStorage.setItem("importedInfographies", JSON.stringify(toSave));
}

// Obtenir le nombre d'infographies créées
function getCreatedCount() {
  return infographies.length;
}

// Obtenir le nombre d'infographies importées
function getImportedCount() {
  return importedInfographies.length;
}

// Afficher la liste des infographies
function renderInfographiesList() {
  updateLibraryTabCounts();

  // Render created infographies
  const createdContainer = document.getElementById("created-list");
  if (infographies.length === 0) {
    createdContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎨</div>
        <div class="empty-state-text">Aucune infographie créée</div>
        <div class="empty-state-subtext">Cliquez sur "Créer une Infographie" pour commencer</div>
      </div>
    `;
  } else {
    createdContainer.innerHTML = infographies
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(
        (infographie) => `
      <div class="infographie-card" onclick="openInfographieEditor(${
        infographie.id
      })">
        <div class="infographie-card-header">
          <div class="infographie-icon-badge">${infographie.thumbnail || "🎨"}</div>
          <div class="infographie-card-content">
            <div class="infographie-card-title-row">
              <h3 class="infographie-card-title">${escapeHtml(
                infographie.title
              )}</h3>
              <button class="delete-infographie-btn" onclick="event.stopPropagation(); deleteInfographieFromList(${
                infographie.id
              })">
                🗑️
              </button>
            </div>
          </div>
        </div>
        <div class="infographie-card-date">
          Créé le ${formatDate(infographie.createdAt)}
        </div>
        <div class="infographie-card-info">
          ${infographie.steps.length} étapes • Layout: ${infographie.layout}
        </div>
      </div>
    `
      )
      .join("");
  }

  // Render imported infographies
  const importedContainer = document.getElementById("imported-list");
  if (importedInfographies.length === 0) {
    importedContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <div class="empty-state-text">Aucune infographie importée</div>
        <div class="empty-state-subtext">Cliquez sur "Importer une Infographie HTML" pour ajouter des infographies</div>
      </div>
    `;
  } else {
    importedContainer.innerHTML = importedInfographies
      .sort((a, b) => new Date(b.importedAt) - new Date(a.importedAt))
      .map(
        (infographie) => `
      <div class="infographie-card imported" onclick="viewImportedInfographie('${
        infographie.id
      }')">
        <div class="infographie-card-header">
          <div class="infographie-icon-badge">${infographie.thumbnail || "📊"}</div>
          <div class="infographie-card-content">
            <div class="infographie-card-title-row">
              <h3 class="infographie-card-title">${escapeHtml(
                infographie.title
              )}</h3>
              ${
                !infographie.isFromLibrary
                  ? `
                <button class="delete-infographie-btn" onclick="event.stopPropagation(); deleteImportedInfographie('${infographie.id}')">
                  🗑️
                </button>
              `
                  : ""
              }
            </div>
          </div>
        </div>
        ${
          infographie.description
            ? `
          <div class="infographie-card-description">${escapeHtml(
            infographie.description
          )}</div>
        `
            : ""
        }
        <div class="infographie-card-date">
          ${
            infographie.isFromLibrary
              ? "Bibliothèque"
              : "Importé le " + formatDate(infographie.importedAt)
          }
        </div>
        <div class="infographie-card-info">
          ${(infographie.size / 1024).toFixed(1)} KB${
          infographie.category ? " • " + infographie.category : ""
        }
        </div>
        ${
          infographie.tags && infographie.tags.length > 0
            ? `
          <div class="infographie-tags">
            ${infographie.tags
              .map((tag) => `<span class="tag">${tag}</span>`)
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `
      )
      .join("");
  }
}

// Changer d'onglet de bibliothèque
function switchLibraryTab(tab) {
  currentLibraryTab = tab;

  document.querySelectorAll(".library-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  document.querySelectorAll(".library-content").forEach((content) => {
    content.style.display = "none";
    content.classList.remove("active");
  });

  if (tab === "created") {
    const createdList = document.getElementById("created-list");
    createdList.style.display = "grid";
    createdList.classList.add("active");
  } else {
    const importedList = document.getElementById("imported-list");
    importedList.style.display = "grid";
    importedList.classList.add("active");
  }
}

// Mettre à jour les compteurs dans les onglets
function updateLibraryTabCounts() {
  const tabs = document.querySelectorAll(".library-tab");
  tabs.forEach((tab) => {
    const tabType = tab.dataset.tab;
    const count =
      tabType === "created" ? getCreatedCount() : getImportedCount();
    const icon = tabType === "created" ? "🎨" : "📚";
    const label =
      tabType === "created" ? "Mes Créations" : "Bibliothèque Importée";
    tab.innerHTML = `${icon} ${label} (${count})`;
  });
}

// Formater une date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Échapper le HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ====================
// FONCTIONS D'IMPORTATION ET VISUALISATION
// ====================

// Importer un fichier HTML
function importHTMLFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith(".html")) {
    alert("Veuillez sélectionner un fichier HTML");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const htmlContent = e.target.result;

    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch
      ? titleMatch[1].trim()
      : file.name.replace(".html", "");

    const importedInfographie = {
      id: Date.now().toString(),
      title: title,
      filename: file.name,
      size: file.size,
      importedAt: new Date().toISOString(),
      htmlContent: htmlContent,
      thumbnail: "📊",
      isFromLibrary: false,
    };

    importedInfographies.push(importedInfographie);
    saveImportedInfographies();
    renderInfographiesList();
    switchLibraryTab("imported");

    event.target.value = "";
    showNotification(`✓ ${file.name} importé avec succès !`);
  };

  reader.readAsText(file);
}

// Afficher une infographie importée
function viewImportedInfographie(id) {
  const infographie = importedInfographies.find(
    (i) => String(i.id) === String(id)
  );
  if (!infographie) return;

  currentViewedInfographie = infographie;
  viewerZoom = 1;

  const modal = document.getElementById("imported-viewer-modal");
  const iframe = document.getElementById("imported-viewer-frame");

  const blob = new Blob([infographie.htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  iframe.src = url;
  iframe.style.transform = `scale(${viewerZoom})`;
  iframe.style.transformOrigin = "top center";
  modal.style.display = "flex";

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// Fermer le viewer d'infographie importée
function closeImportedViewer() {
  const modal = document.getElementById("imported-viewer-modal");
  const iframe = document.getElementById("imported-viewer-frame");
  modal.style.display = "none";
  iframe.src = "";
  currentViewedInfographie = null;
  viewerZoom = 1;
}

// Zoom avant dans le viewer
function zoomInViewer() {
  viewerZoom = Math.min(viewerZoom + 0.1, 2);
  updateViewerZoom();
}

// Zoom arrière dans le viewer
function zoomOutViewer() {
  viewerZoom = Math.max(viewerZoom - 0.1, 0.5);
  updateViewerZoom();
}

// Réinitialiser le zoom du viewer
function resetZoomViewer() {
  viewerZoom = 1;
  updateViewerZoom();
}

// Mettre à jour le zoom du viewer
function updateViewerZoom() {
  const iframe = document.getElementById("imported-viewer-frame");
  iframe.style.transform = `scale(${viewerZoom})`;
  iframe.style.height = `${100 / viewerZoom}vh`;
}

// Plein écran pour le viewer
function toggleFullscreenViewer() {
  const modal = document.getElementById("imported-viewer-modal");

  if (!document.fullscreenElement) {
    modal.requestFullscreen().catch((err) => {
      console.log(`Erreur: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

// Télécharger l'infographie actuellement visualisée
function downloadCurrentInfographie() {
  if (!currentViewedInfographie) return;

  const blob = new Blob([currentViewedInfographie.htmlContent], {
    type: "text/html",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    currentViewedInfographie.filename ||
    `${currentViewedInfographie.title}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification(`✓ Infographie téléchargée !`);
}

// Supprimer une infographie importée
function deleteImportedInfographie(id) {
  const infographie = importedInfographies.find(
    (i) => String(i.id) === String(id)
  );

  if (confirm(`Êtes-vous sûr de vouloir supprimer "${infographie.title}" ?`)) {
    importedInfographies = importedInfographies.filter(
      (i) => String(i.id) !== String(id)
    );
    saveImportedInfographies();
    renderInfographiesList();
  }
}

// Afficher une notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// ====================
// FONCTIONS DE GÉNÉRATION ET ÉDITION
// ====================

// Afficher le modal de création
function showSubjectModal() {
  document.getElementById("subject-modal").style.display = "flex";
  setTimeout(() => {
    document.getElementById("subject-input").focus();
  }, 100);
}

// Fermer le modal de sujet
function closeSubjectModal() {
  document.getElementById("subject-modal").style.display = "none";
  document.getElementById("subject-input").value = "";
  document.getElementById("metaphor-input").value = "";
  document.getElementById("steps-count").value = "5";
}

// Générer une infographie
function generateInfographie() {
  const subject = document.getElementById("subject-input").value.trim();
  const metaphor = document.getElementById("metaphor-input").value.trim();
  const stepsCount = parseInt(document.getElementById("steps-count").value);

  if (!subject) {
    alert("Veuillez entrer un sujet");
    return;
  }

  // Créer une nouvelle infographie
  const newInfographie = {
    id: Date.now(),
    title: subject,
    subject: subject,
    metaphor: metaphor || "Un processus",
    createdAt: new Date().toISOString(),
    palette: currentPalette,
    font: currentFont,
    layout: currentLayout,
    theme: currentTheme,
    steps: generateSteps(subject, metaphor, stepsCount),
    lexique: [],
    summary: "",
  };

  infographies.push(newInfographie);
  saveInfographies();
  closeSubjectModal();
  openInfographieEditor(newInfographie.id);
}

// Générer des étapes
function generateSteps(subject, metaphor, count) {
  const template = metaphor.toLowerCase().includes("restaurant")
    ? generationTemplates.restaurant
    : generationTemplates.default;

  const steps = [];
  for (let i = 0; i < Math.min(count, template.steps.length); i++) {
    steps.push({
      ...template.steps[i],
      id: i + 1,
    });
  }

  return steps;
}

// Ouvrir l'éditeur d'infographie
function openInfographieEditor(infographieId) {
  currentInfographie = infographies.find((i) => i.id === infographieId);

  if (!currentInfographie) {
    console.error("Infographie non trouvée");
    return;
  }

  // Restaurer les paramètres
  currentPalette = currentInfographie.palette || "gradient1";
  currentFont = currentInfographie.font || "Inter";
  currentLayout = currentInfographie.layout || "vertical";
  currentTheme = currentInfographie.theme || "professional";

  document.getElementById("home-view").style.display = "none";
  document.getElementById("generator-view").style.display = "block";
  document.getElementById("infographie-title").value = currentInfographie.title;

  // Mettre à jour les sélecteurs
  updateActiveButtons();

  // Rendre l'infographie
  renderInfographie();
}

// Mettre à jour les boutons actifs
function updateActiveButtons() {
  // Palette
  document.querySelectorAll(".palette-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.palette === currentPalette);
  });

  // Font
  document.querySelectorAll(".font-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.font === currentFont);
  });

  // Layout
  document.querySelectorAll(".layout-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.layout === currentLayout);
  });

  // Theme
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === currentTheme);
  });
}

// Initialiser les palettes
function initializePalettes() {
  const paletteSelector = document.getElementById("palette-selector");
  if (!paletteSelector) return;

  paletteSelector.innerHTML = Object.keys(colorPalettes)
    .map(
      (paletteKey) => `
    <button class="palette-btn ${
      paletteKey === currentPalette ? "active" : ""
    }" 
            data-palette="${paletteKey}" 
            onclick="setPalette('${paletteKey}')">
      <div class="palette-preview">
        ${colorPalettes[paletteKey]
          .slice(0, 3)
          .map(
            (color) =>
              `<div class="palette-color" style="background: ${color}"></div>`
          )
          .join("")}
      </div>
      <span>${paletteKey}</span>
    </button>
  `
    )
    .join("");
}

// Définir la palette
function setPalette(palette) {
  currentPalette = palette;
  if (currentInfographie) {
    currentInfographie.palette = palette;
    saveInfographies();
    renderInfographie();
  }
  updateActiveButtons();
}

// Définir la font
function setFont(font) {
  currentFont = font;
  if (currentInfographie) {
    currentInfographie.font = font;
    saveInfographies();
    document.getElementById("infographie-canvas").style.fontFamily = font;
  }
  updateActiveButtons();
}

// Définir le layout
function setLayout(layout) {
  currentLayout = layout;
  if (currentInfographie) {
    currentInfographie.layout = layout;
    saveInfographies();
    renderInfographie();
  }
  updateActiveButtons();
}

// Définir le thème
function setTheme(theme) {
  currentTheme = theme;
  if (currentInfographie) {
    currentInfographie.theme = theme;
    saveInfographies();
    renderInfographie();
  }
  updateActiveButtons();
}

// Rendre l'infographie
function renderInfographie() {
  if (!currentInfographie) return;

  const canvas = document.getElementById("infographie-canvas");
  canvas.style.fontFamily = currentFont;

  // Appliquer le thème
  applyTheme(canvas);

  // Rendre les étapes
  const stepsContainer = document.getElementById("steps-container");
  stepsContainer.innerHTML = "";
  stepsContainer.className = `steps-container ${currentLayout}`;

  currentInfographie.steps.forEach((step, index) => {
    const stepElement = createStepElement(step, index);
    stepsContainer.appendChild(stepElement);
  });

  // Rendre le lexique
  renderLexique();

  // Mettre à jour le résumé
  document.getElementById("summary-text").value =
    currentInfographie.summary || "";
}

// Appliquer le thème
function applyTheme(canvas) {
  canvas.className = `infographie-canvas ${currentTheme}`;
}

// Créer un élément étape
function createStepElement(step, index) {
  const stepDiv = document.createElement("div");
  stepDiv.className = "step";
  stepDiv.draggable = true;
  stepDiv.dataset.stepId = step.id;

  const colors = colorPalettes[currentPalette];
  const colorIndex = index % colors.length;

  stepDiv.innerHTML = `
    <div class="step-header" style="background: ${colors[colorIndex]}">
      <button class="step-icon-btn" onclick="openEmojiPicker(${step.id})">${
    step.icon
  }</button>
      <input type="text" class="step-title" value="${escapeHtml(step.title)}" 
             onchange="updateStepTitle(${step.id}, this.value)">
      <button class="step-delete-btn" onclick="deleteStep(${
        step.id
      })">🗑️</button>
    </div>
    <div class="step-content">
      <div class="step-metaphor">
        <strong>💡 Analogie:</strong>
        <input type="text" value="${escapeHtml(step.metaphor)}" 
               onchange="updateStepMetaphor(${step.id}, this.value)">
      </div>
      <div class="step-description">
        <textarea onchange="updateStepDescription(${
          step.id
        }, this.value)">${escapeHtml(step.description)}</textarea>
      </div>
    </div>
  `;

  // Événements drag & drop
  stepDiv.addEventListener("dragstart", handleDragStart);
  stepDiv.addEventListener("dragover", handleDragOver);
  stepDiv.addEventListener("drop", handleDrop);
  stepDiv.addEventListener("dragend", handleDragEnd);

  return stepDiv;
}

// Gestion du drag & drop
function handleDragStart(e) {
  draggedStep = this;
  this.style.opacity = "0.5";
}

function handleDragOver(e) {
  e.preventDefault();
  return false;
}

function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();

  if (draggedStep !== this) {
    const allSteps = [...document.querySelectorAll(".step")];
    const draggedIndex = allSteps.indexOf(draggedStep);
    const targetIndex = allSteps.indexOf(this);

    // Réorganiser dans le tableau
    const draggedStepData = currentInfographie.steps[draggedIndex];
    currentInfographie.steps.splice(draggedIndex, 1);
    currentInfographie.steps.splice(targetIndex, 0, draggedStepData);

    saveInfographies();
    renderInfographie();
  }

  return false;
}

function handleDragEnd() {
  this.style.opacity = "1";
  draggedStep = null;
}

// Mettre à jour le titre d'une étape
function updateStepTitle(stepId, value) {
  const step = currentInfographie.steps.find((s) => s.id === stepId);
  if (step) {
    step.title = value;
    saveInfographies();
  }
}

// Mettre à jour la métaphore d'une étape
function updateStepMetaphor(stepId, value) {
  const step = currentInfographie.steps.find((s) => s.id === stepId);
  if (step) {
    step.metaphor = value;
    saveInfographies();
  }
}

// Mettre à jour la description d'une étape
function updateStepDescription(stepId, value) {
  const step = currentInfographie.steps.find((s) => s.id === stepId);
  if (step) {
    step.description = value;
    saveInfographies();
  }
}

// Ajouter une étape
function addStep() {
  if (!currentInfographie) return;

  const newStep = {
    id: Date.now(),
    title: "Nouvelle étape",
    metaphor: "Description analogique",
    description: "Description technique",
    icon: "⭐",
  };

  currentInfographie.steps.push(newStep);
  saveInfographies();
  renderInfographie();
}

// Supprimer une étape
function deleteStep(stepId) {
  if (!currentInfographie) return;

  if (currentInfographie.steps.length <= 1) {
    alert("Vous devez avoir au moins une étape");
    return;
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer cette étape ?")) {
    currentInfographie.steps = currentInfographie.steps.filter(
      (s) => s.id !== stepId
    );
    saveInfographies();
    renderInfographie();
  }
}

// Ouvrir le sélecteur d'emoji
function openEmojiPicker(stepId) {
  currentEditingIcon = stepId;
  const modal = document.getElementById("emoji-picker-modal");
  const grid = document.getElementById("emoji-grid");

  grid.innerHTML = availableEmojis
    .map(
      (emoji) => `
    <button class="emoji-btn" onclick="selectEmoji('${emoji}')">${emoji}</button>
  `
    )
    .join("");

  modal.style.display = "flex";
}

// Sélectionner un emoji
function selectEmoji(emoji) {
  if (!currentInfographie || currentEditingIcon === null) return;

  const step = currentInfographie.steps.find(
    (s) => s.id === currentEditingIcon
  );
  if (step) {
    step.icon = emoji;
    saveInfographies();
    renderInfographie();
  }

  closeEmojiPicker();
}

// Fermer le sélecteur d'emoji
function closeEmojiPicker() {
  document.getElementById("emoji-picker-modal").style.display = "none";
  currentEditingIcon = null;
}

// Rendre le lexique
function renderLexique() {
  if (!currentInfographie) return;

  const grid = document.getElementById("lexique-grid");
  const lexique = currentInfographie.lexique || [];

  if (lexique.length === 0) {
    grid.innerHTML = `
      <div class="empty-lexique">
        Aucun terme ajouté. Cliquez sur "Ajouter terme" pour commencer.
      </div>
    `;
  } else {
    grid.innerHTML = lexique
      .map(
        (item, index) => `
      <div class="lexique-item">
        <input type="text" class="lexique-term" value="${escapeHtml(
          item.term
        )}" 
               onchange="updateLexiqueTerm(${index}, this.value)">
        <textarea class="lexique-definition" 
                  onchange="updateLexiqueDefinition(${index}, this.value)">${escapeHtml(
          item.definition
        )}</textarea>
        <button class="lexique-delete-btn" onclick="deleteLexiqueItem(${index})">🗑️</button>
      </div>
    `
      )
      .join("");
  }
}

// Ajouter un terme au lexique
function addLexiqueItem() {
  if (!currentInfographie) return;

  if (!currentInfographie.lexique) {
    currentInfographie.lexique = [];
  }

  currentInfographie.lexique.push({
    term: "Nouveau terme",
    definition: "Définition du terme",
  });

  saveInfographies();
  renderLexique();
}

// Mettre à jour un terme du lexique
function updateLexiqueTerm(index, value) {
  if (!currentInfographie) return;

  currentInfographie.lexique[index].term = value;
  saveInfographies();
}

// Mettre à jour une définition du lexique
function updateLexiqueDefinition(index, value) {
  if (!currentInfographie) return;

  currentInfographie.lexique[index].definition = value;
  saveInfographies();
}

// Supprimer un terme du lexique
function deleteLexiqueItem(index) {
  if (!currentInfographie) return;

  if (confirm("Êtes-vous sûr de vouloir supprimer ce terme ?")) {
    currentInfographie.lexique.splice(index, 1);
    saveInfographies();
    renderLexique();
  }
}

// Sauvegarder l'infographie
function saveInfographie() {
  if (!currentInfographie) return;

  const title = document.getElementById("infographie-title").value.trim();
  if (title) {
    currentInfographie.title = title;
  }

  const summary = document.getElementById("summary-text").value;
  currentInfographie.summary = summary;

  saveInfographies();
  showNotification("✓ Infographie sauvegardée !");
}

// Supprimer l'infographie actuelle
function deleteCurrentInfographie() {
  if (!currentInfographie) return;

  if (
    confirm(
      `Êtes-vous sûr de vouloir supprimer "${currentInfographie.title}" ?`
    )
  ) {
    infographies = infographies.filter((i) => i.id !== currentInfographie.id);
    saveInfographies();
    backToHome();
  }
}

// Supprimer une infographie de la liste
function deleteInfographieFromList(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette infographie ?")) {
    infographies = infographies.filter((i) => i.id !== id);
    saveInfographies();
    renderInfographiesList();
  }
}

// Retour à l'accueil
function backToHome() {
  document.getElementById("generator-view").style.display = "none";
  document.getElementById("home-view").style.display = "block";
  currentInfographie = null;
  renderInfographiesList();
}

// ====================
// FONCTIONS D'EXPORT
// ====================

// Afficher le menu d'export
function showExportMenu() {
  document.getElementById("export-modal").style.display = "flex";
}

// Fermer le menu d'export
function closeExportMenu() {
  document.getElementById("export-modal").style.display = "none";
}

// Prévisualiser l'infographie
function previewInfographie() {
  if (!currentInfographie) return;

  const modal = document.getElementById("preview-modal");
  const container = document.getElementById("preview-container");

  container.innerHTML = generatePreviewHTML();
  modal.style.display = "flex";
}

// Fermer la prévisualisation
function closePreview() {
  document.getElementById("preview-modal").style.display = "none";
}

// Générer le HTML de prévisualisation
function generatePreviewHTML() {
  if (!currentInfographie) return "";

  const colors = colorPalettes[currentPalette];

  let html = `
    <div class="preview-infographie ${currentTheme}" style="font-family: ${currentFont}">
      <div class="preview-header">
        <h1>${escapeHtml(currentInfographie.title)}</h1>
        ${
          currentInfographie.metaphor
            ? `<p class="preview-subtitle">${escapeHtml(
                currentInfographie.metaphor
              )}</p>`
            : ""
        }
      </div>

      <div class="preview-steps ${currentLayout}">
  `;

  currentInfographie.steps.forEach((step, index) => {
    const colorIndex = index % colors.length;
    html += `
      <div class="preview-step">
        <div class="preview-step-header" style="background: ${
          colors[colorIndex]
        }">
          <span class="preview-step-icon">${step.icon}</span>
          <h3>${escapeHtml(step.title)}</h3>
        </div>
        <div class="preview-step-content">
          <div class="preview-step-metaphor">
            <strong>💡 ${escapeHtml(step.metaphor)}</strong>
          </div>
          <p>${escapeHtml(step.description)}</p>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  if (currentInfographie.lexique && currentInfographie.lexique.length > 0) {
    html += `
      <div class="preview-lexique">
        <h2>📚 Lexique</h2>
        <div class="preview-lexique-grid">
    `;

    currentInfographie.lexique.forEach((item) => {
      html += `
        <div class="preview-lexique-item">
          <strong>${escapeHtml(item.term)}</strong>
          <p>${escapeHtml(item.definition)}</p>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  if (currentInfographie.summary) {
    html += `
      <div class="preview-summary">
        <h2>🎯 En résumé</h2>
        <p>${escapeHtml(currentInfographie.summary)}</p>
      </div>
    `;
  }

  html += `</div>`;

  return html;
}

// Exporter en PNG
function exportAsPNG() {
  alert("Fonctionnalité à venir : Export PNG");
  closeExportMenu();
}

// Exporter en SVG
function exportAsSVG() {
  alert("Fonctionnalité à venir : Export SVG");
  closeExportMenu();
}

// Exporter en HTML autonome
function exportAsHTML() {
  if (!currentInfographie) return;

  const htmlContent = generateStandaloneHTML();

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentInfographie.title
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  closeExportMenu();
  showNotification(`✓ Infographie exportée en HTML !`);
}

// Générer un HTML autonome
function generateStandaloneHTML() {
  if (!currentInfographie) return "";

  const colors = colorPalettes[currentPalette];

  let stepsHTML = "";
  currentInfographie.steps.forEach((step, index) => {
    const colorIndex = index % colors.length;
    stepsHTML += `
      <div class="step">
        <div class="step-header" style="background: ${colors[colorIndex]}">
          <span class="step-icon">${step.icon}</span>
          <h3>${escapeHtml(step.title)}</h3>
        </div>
        <div class="step-content">
          <div class="step-metaphor">
            <strong>💡 ${escapeHtml(step.metaphor)}</strong>
          </div>
          <p>${escapeHtml(step.description)}</p>
        </div>
      </div>
    `;
  });

  let lexiqueHTML = "";
  if (currentInfographie.lexique && currentInfographie.lexique.length > 0) {
    lexiqueHTML = `
      <div class="lexique-section">
        <h2>📚 Lexique des termes techniques</h2>
        <div class="lexique-grid">
    `;

    currentInfographie.lexique.forEach((item) => {
      lexiqueHTML += `
        <div class="lexique-item">
          <strong>${escapeHtml(item.term)}</strong>
          <p>${escapeHtml(item.definition)}</p>
        </div>
      `;
    });

    lexiqueHTML += `
        </div>
      </div>
    `;
  }

  let summaryHTML = "";
  if (currentInfographie.summary) {
    summaryHTML = `
      <div class="summary-section">
        <h2>🎯 En résumé</h2>
        <p>${escapeHtml(currentInfographie.summary)}</p>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(currentInfographie.title)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: ${currentFont}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #16213e 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            text-align: center;
            color: #1e293b;
            font-size: 2.5em;
            margin-bottom: 15px;
        }
        .subtitle {
            text-align: center;
            color: #64748b;
            font-size: 1.2em;
            margin-bottom: 50px;
        }
        .steps-container {
            display: flex;
            flex-direction: ${
              currentLayout === "horizontal" ? "row" : "column"
            };
            gap: 30px;
            margin-bottom: 50px;
            ${currentLayout === "horizontal" ? "flex-wrap: wrap;" : ""}
        }
        .step {
            ${
              currentLayout === "horizontal"
                ? "flex: 1 1 calc(50% - 15px); min-width: 300px;"
                : ""
            }
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .step-header {
            padding: 25px;
            color: white;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .step-icon {
            font-size: 2.5em;
        }
        .step-header h3 {
            font-size: 1.5em;
            font-weight: 600;
        }
        .step-content {
            padding: 25px;
            background: #f8fafc;
        }
        .step-metaphor {
            background: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
        }
        .step-content p {
            color: #475569;
            line-height: 1.6;
        }
        .lexique-section {
            margin-bottom: 40px;
            padding: 30px;
            background: #f1f5f9;
            border-radius: 15px;
        }
        .lexique-section h2 {
            color: #1e293b;
            margin-bottom: 25px;
            font-size: 1.8em;
        }
        .lexique-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .lexique-item {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .lexique-item strong {
            display: block;
            color: #667eea;
            font-size: 1.1em;
            margin-bottom: 10px;
        }
        .lexique-item p {
            color: #64748b;
            line-height: 1.5;
        }
        .summary-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 15px;
            color: white;
        }
        .summary-section h2 {
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        .summary-section p {
            font-size: 1.1em;
            line-height: 1.8;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${escapeHtml(currentInfographie.title)}</h1>
        ${
          currentInfographie.metaphor
            ? `<p class="subtitle">${escapeHtml(
                currentInfographie.metaphor
              )}</p>`
            : ""
        }
        
        <div class="steps-container">
            ${stepsHTML}
        </div>

        ${lexiqueHTML}
        ${summaryHTML}
    </div>
</body>
</html>`;
}

// Copier le lien de partage
function copyShareLink() {
  alert("Fonctionnalité à venir : Partage en ligne");
  closeExportMenu();
}
