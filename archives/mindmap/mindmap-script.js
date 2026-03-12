// État global de l'application
let mindmaps = [];
let importedMindmaps = [];
let libraryMindmaps = [];
let currentMindmap = null;
let currentLibraryTab = "imported";
let currentTheme = "purple";
let currentConnectionStyle = "curved";
let currentLayout = "radial";
let currentZoom = 1;
let svgPanZoom = { x: 0, y: 0 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let selectedNode = null;
let editingNode = null;
let currentViewedMindmap = null;
let viewerZoom = 1;

// Thèmes de couleurs
const themes = {
  purple: {
    primary: "#667eea",
    secondary: "#764ba2",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  blue: {
    primary: "#3b82f6",
    secondary: "#1e40af",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
  },
  green: {
    primary: "#10b981",
    secondary: "#059669",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  orange: {
    primary: "#f59e0b",
    secondary: "#d97706",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  },
  red: {
    primary: "#ef4444",
    secondary: "#dc2626",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  },
};

// Données de suggestion pour générer des mind maps
const mindmapTemplates = {
  default: {
    branches: [
      {
        title: "Concept Principal",
        children: ["Aspect 1", "Aspect 2", "Aspect 3"],
      },
      {
        title: "Applications",
        children: ["Pratique", "Théorique", "Expérimental"],
      },
      {
        title: "Avantages",
        children: ["Efficacité", "Innovation", "Croissance"],
      },
      {
        title: "Défis",
        children: ["Obstacles", "Risques", "Limitations"],
      },
    ],
  },
};

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  loadMindmaps();
  loadLibraryMindmaps();
  renderMindmapsList();
  setupCanvasInteractions();
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

// Charger les mindmaps depuis localStorage
function loadMindmaps() {
  const saved = localStorage.getItem("mindmaps");
  mindmaps = saved ? JSON.parse(saved) : [];

  const savedImported = localStorage.getItem("importedMindmaps");
  importedMindmaps = savedImported ? JSON.parse(savedImported) : [];
}

// Charger la bibliothèque de mind maps pré-installées
async function loadLibraryMindmaps() {
  try {
    const response = await fetch("library/mindmaps/index.json");
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    libraryMindmaps = data.mindmaps || [];

    libraryMindmaps.forEach((libMindmap) => {
      const exists = importedMindmaps.some(
        (imp) => imp.filename === libMindmap.filename
      );

      if (!exists) {
        loadLibraryHTMLContent(libMindmap);
      }
    });

    renderMindmapsList();
  } catch (error) {
    console.log("Bibliothèque non disponible");
  }
}

// Charger le contenu HTML d'une mind map de bibliothèque
async function loadLibraryHTMLContent(libMindmap) {
  try {
    const response = await fetch(`library/mindmaps/${libMindmap.filename}`);
    if (!response.ok) return;

    const htmlContent = await response.text();

    const importedMindmap = {
      id: `lib-${libMindmap.id}`,
      title: libMindmap.title,
      description: libMindmap.description,
      filename: libMindmap.filename,
      thumbnail: libMindmap.thumbnail || "🧠",
      category: libMindmap.category || "Général",
      tags: libMindmap.tags || [],
      size: htmlContent.length,
      importedAt: new Date().toISOString(),
      htmlContent: htmlContent,
      isFromLibrary: true,
    };

    importedMindmaps.push(importedMindmap);
    saveImportedMindmaps();
  } catch (error) {
    console.log(`Erreur: ${libMindmap.filename}`);
  }
}

// Sauvegarder les mindmaps dans localStorage
function saveMindmaps() {
  localStorage.setItem("mindmaps", JSON.stringify(mindmaps));
}

// Sauvegarder les mindmaps importées
function saveImportedMindmaps() {
  const toSave = importedMindmaps.filter((m) => !m.isFromLibrary);
  localStorage.setItem("importedMindmaps", JSON.stringify(toSave));
}

// Obtenir le nombre de mindmaps créées
function getCreatedCount() {
  return mindmaps.length;
}

// Obtenir le nombre de mindmaps importées
function getImportedCount() {
  return importedMindmaps.length;
}

// Afficher le modal de saisie du sujet
function showGenerator() {
  document.getElementById("subject-modal").style.display = "flex";
  setTimeout(() => {
    document.getElementById("subject-input").focus();
  }, 100);
}

// Fermer le modal de sujet
function closeSubjectModal() {
  document.getElementById("subject-modal").style.display = "none";
  document.getElementById("subject-input").value = "";
}

// Générer une mind map à partir d'un sujet
function generateMindmap() {
  const subjectInput = document.getElementById("subject-input");
  const subject = subjectInput.value.trim();

  if (!subject) {
    alert("Veuillez entrer un sujet");
    return;
  }

  // Créer une nouvelle mind map
  const newMindmap = {
    id: Date.now(),
    title: subject,
    subject: subject,
    createdAt: new Date().toISOString(),
    theme: currentTheme,
    connectionStyle: currentConnectionStyle,
    layout: currentLayout,
    nodes: generateNodes(subject),
  };

  mindmaps.push(newMindmap);
  saveMindmaps();
  closeSubjectModal();
  openMindmapEditor(newMindmap.id);
}

// Générer des nœuds basés sur le sujet
function generateNodes(subject) {
  const template = mindmapTemplates.default;
  const nodes = [];

  // Nœud central
  nodes.push({
    id: 0,
    text: subject,
    level: 0,
    parentId: null,
    x: 400,
    y: 300,
    collapsed: false,
    children: [],
  });

  // Branches principales
  template.branches.forEach((branch, branchIndex) => {
    const branchId = branchIndex + 1;
    nodes.push({
      id: branchId,
      text: branch.title,
      level: 1,
      parentId: 0,
      x: 0,
      y: 0,
      collapsed: false,
      children: [],
    });

    nodes[0].children.push(branchId);

    // Sous-branches
    branch.children.forEach((child, childIndex) => {
      const childId = nodes.length;
      nodes.push({
        id: childId,
        text: child,
        level: 2,
        parentId: branchId,
        x: 0,
        y: 0,
        collapsed: false,
        children: [],
      });

      nodes[branchId].children.push(childId);
    });
  });

  return nodes;
}

// Afficher la liste des mindmaps
function renderMindmapsList() {
  updateLibraryTabCounts();

  // Render created mindmaps
  const createdContainer = document.getElementById("created-list");
  if (mindmaps.length === 0) {
    createdContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🧠</div>
        <div class="empty-state-text">Aucune mind map créée</div>
        <div class="empty-state-subtext">Cliquez sur "Créer une Mind Map" pour commencer</div>
      </div>
    `;
  } else {
    createdContainer.innerHTML = mindmaps
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(
        (mindmap) => `
      <div class="mindmap-card" onclick="openMindmapEditor(${mindmap.id})">
        <div class="mindmap-card-header">
          <h3 class="mindmap-card-title">${escapeHtml(mindmap.title)}</h3>
          <button class="delete-mindmap-btn" onclick="event.stopPropagation(); deleteMindmapFromList(${
            mindmap.id
          })">
            🗑️
          </button>
        </div>
        <div class="mindmap-card-date">
          Créé le ${formatDate(mindmap.createdAt)}
        </div>
        <div class="mindmap-card-info">
          ${mindmap.nodes.length} nœuds • Layout: ${mindmap.layout}
        </div>
      </div>
    `
      )
      .join("");
  }

  // Render imported mindmaps
  const importedContainer = document.getElementById("imported-list");
  if (importedMindmaps.length === 0) {
    importedContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <div class="empty-state-text">Aucune mind map importée</div>
        <div class="empty-state-subtext">Cliquez sur "Importer une Mind Map HTML" pour ajouter des mind maps</div>
      </div>
    `;
  } else {
    importedContainer.innerHTML = importedMindmaps
      .sort((a, b) => new Date(b.importedAt) - new Date(a.importedAt))
      .map(
        (mindmap) => `
      <div class="mindmap-card imported" onclick="viewImportedMindmap('${
        mindmap.id
      }')">
        <div class="mindmap-card-header">
          <span class="mindmap-thumbnail">${mindmap.thumbnail}</span>
          <h3 class="mindmap-card-title">${escapeHtml(mindmap.title)}</h3>
          ${
            !mindmap.isFromLibrary
              ? `
            <button class="delete-mindmap-btn" onclick="event.stopPropagation(); deleteImportedMindmap('${mindmap.id}')">
              🗑️
            </button>
          `
              : ""
          }
        </div>
        ${
          mindmap.description
            ? `
          <div class="mindmap-card-description">${escapeHtml(
            mindmap.description
          )}</div>
        `
            : ""
        }
        <div class="mindmap-card-date">
          ${
            mindmap.isFromLibrary
              ? "Bibliothèque"
              : "Importé le " + formatDate(mindmap.importedAt)
          }
        </div>
        <div class="mindmap-card-info">
          ${(mindmap.size / 1024).toFixed(1)} KB${
          mindmap.category ? " • " + mindmap.category : ""
        }
        </div>
        ${
          mindmap.tags && mindmap.tags.length > 0
            ? `
          <div class="mindmap-tags">
            ${mindmap.tags
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

// Ouvrir l'éditeur de mindmap
function openMindmapEditor(mindmapId) {
  currentMindmap = mindmaps.find((m) => m.id === mindmapId);

  if (!currentMindmap) {
    console.error("Mind map non trouvée");
    return;
  }

  // Restaurer les paramètres
  currentTheme = currentMindmap.theme || "purple";
  currentConnectionStyle = currentMindmap.connectionStyle || "curved";
  currentLayout = currentMindmap.layout || "radial";
  currentZoom = 1;
  svgPanZoom = { x: 0, y: 0 };

  document.getElementById("home-view").style.display = "none";
  document.getElementById("generator-view").style.display = "block";
  document.getElementById("mindmap-title").value = currentMindmap.title;

  // Mettre à jour les sélecteurs
  updateActiveButtons();

  // Calculer les positions et rendre
  calculateNodePositions();
  renderMindmap();
}

// Mettre à jour les boutons actifs
function updateActiveButtons() {
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === currentTheme);
  });

  document.querySelectorAll(".connection-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.dataset.style === currentConnectionStyle
    );
  });

  document.querySelectorAll(".layout-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.layout === currentLayout);
  });
}

// Retour à l'accueil
function backToHome() {
  document.getElementById("home-view").style.display = "block";
  document.getElementById("generator-view").style.display = "none";
  currentMindmap = null;
  selectedNode = null;
  editingNode = null;
  renderMindmapsList();
}

// Changer le thème
function setTheme(theme) {
  currentTheme = theme;
  if (currentMindmap) {
    currentMindmap.theme = theme;
    saveMindmaps();
  }
  updateActiveButtons();
  renderMindmap();
}

// Changer le style de connexion
function setConnectionStyle(style) {
  currentConnectionStyle = style;
  if (currentMindmap) {
    currentMindmap.connectionStyle = style;
    saveMindmaps();
  }
  updateActiveButtons();
  renderMindmap();
}

// Changer le layout
function setLayout(layout) {
  currentLayout = layout;
  if (currentMindmap) {
    currentMindmap.layout = layout;
    saveMindmaps();
  }
  updateActiveButtons();
  calculateNodePositions();
  renderMindmap();
}

// Calculer les positions des nœuds selon le layout
function calculateNodePositions() {
  if (!currentMindmap || !currentMindmap.nodes) return;

  const nodes = currentMindmap.nodes;
  const centerX = 400;
  const centerY = 300;

  if (currentLayout === "radial") {
    calculateRadialLayout(nodes, centerX, centerY);
  } else if (currentLayout === "hierarchical") {
    calculateHierarchicalLayout(nodes, centerX, centerY);
  } else if (currentLayout === "organic") {
    calculateOrganicLayout(nodes, centerX, centerY);
  }
}

// Layout radial
function calculateRadialLayout(nodes, centerX, centerY) {
  const rootNode = nodes[0];
  rootNode.x = centerX;
  rootNode.y = centerY;

  const level1Nodes = nodes.filter((n) => n.level === 1);
  const angleStep = (Math.PI * 2) / level1Nodes.length;

  level1Nodes.forEach((node, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const distance = 200;
    node.x = centerX + Math.cos(angle) * distance;
    node.y = centerY + Math.sin(angle) * distance;

    // Positionner les enfants
    const children = nodes.filter((n) => n.parentId === node.id);
    if (children.length > 0) {
      const childAngleStep = Math.PI / 3 / children.length;
      const startAngle = angle - Math.PI / 6;

      children.forEach((child, childIndex) => {
        const childAngle = startAngle + childIndex * childAngleStep;
        const childDistance = 150;
        child.x = node.x + Math.cos(childAngle) * childDistance;
        child.y = node.y + Math.sin(childAngle) * childDistance;
      });
    }
  });
}

// Layout hiérarchique
function calculateHierarchicalLayout(nodes, centerX, centerY) {
  const rootNode = nodes[0];
  rootNode.x = centerX;
  rootNode.y = 100;

  const level1Nodes = nodes.filter((n) => n.level === 1);
  const horizontalSpacing = 200;
  const verticalSpacing = 150;

  level1Nodes.forEach((node, index) => {
    const totalWidth = (level1Nodes.length - 1) * horizontalSpacing;
    node.x = centerX - totalWidth / 2 + index * horizontalSpacing;
    node.y = 100 + verticalSpacing;

    // Positionner les enfants
    const children = nodes.filter((n) => n.parentId === node.id);
    if (children.length > 0) {
      const childSpacing = 120;
      const childTotalWidth = (children.length - 1) * childSpacing;

      children.forEach((child, childIndex) => {
        child.x = node.x - childTotalWidth / 2 + childIndex * childSpacing;
        child.y = node.y + verticalSpacing;
      });
    }
  });
}

// Layout organique
function calculateOrganicLayout(nodes, centerX, centerY) {
  const rootNode = nodes[0];
  rootNode.x = centerX;
  rootNode.y = centerY;

  const level1Nodes = nodes.filter((n) => n.level === 1);
  const angleStep = (Math.PI * 2) / level1Nodes.length;

  level1Nodes.forEach((node, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const distance = 180 + Math.random() * 40;
    const angleVariation = (Math.random() - 0.5) * 0.3;
    node.x = centerX + Math.cos(angle + angleVariation) * distance;
    node.y = centerY + Math.sin(angle + angleVariation) * distance;

    // Positionner les enfants de manière organique
    const children = nodes.filter((n) => n.parentId === node.id);
    if (children.length > 0) {
      children.forEach((child, childIndex) => {
        const childAngle = angle + ((Math.random() - 0.5) * Math.PI) / 2;
        const childDistance = 120 + Math.random() * 30;
        child.x = node.x + Math.cos(childAngle) * childDistance;
        child.y = node.y + Math.sin(childAngle) * childDistance;
      });
    }
  });
}

// Rendre la mind map sur le canvas SVG
function renderMindmap() {
  if (!currentMindmap) return;

  const svg = document.getElementById("mindmap-canvas");
  svg.innerHTML = "";

  const theme = themes[currentTheme];
  const nodes = currentMindmap.nodes;

  // Créer un groupe pour le contenu (pour le pan/zoom)
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute(
    "transform",
    `translate(${svgPanZoom.x}, ${svgPanZoom.y}) scale(${currentZoom})`
  );
  svg.appendChild(g);

  // Dessiner d'abord les connexions
  nodes.forEach((node) => {
    if (node.parentId !== null && !node.collapsed) {
      const parent = nodes.find((n) => n.id === node.parentId);
      if (parent && !parent.collapsed) {
        drawConnection(g, parent, node, theme);
      }
    }
  });

  // Dessiner les nœuds
  nodes.forEach((node) => {
    if (node.parentId === null || !isParentCollapsed(node, nodes)) {
      drawNode(g, node, theme);
    }
  });
}

// Vérifier si un parent est collapsed
function isParentCollapsed(node, nodes) {
  let current = node;
  while (current.parentId !== null) {
    const parent = nodes.find((n) => n.id === current.parentId);
    if (parent.collapsed) return true;
    current = parent;
  }
  return false;
}

// Dessiner une connexion
function drawConnection(parent, fromNode, toNode, theme) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  let d;
  if (currentConnectionStyle === "straight") {
    d = `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;
  } else if (currentConnectionStyle === "curved") {
    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;
    const controlX = midX;
    const controlY = fromNode.y;
    d = `M ${fromNode.x} ${fromNode.y} Q ${controlX} ${controlY}, ${toNode.x} ${toNode.y}`;
  } else {
    // organic
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const controlX1 = fromNode.x + dx * 0.3;
    const controlY1 = fromNode.y + dy * 0.1;
    const controlX2 = fromNode.x + dx * 0.7;
    const controlY2 = fromNode.y + dy * 0.9;
    d = `M ${fromNode.x} ${fromNode.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toNode.x} ${toNode.y}`;
  }

  path.setAttribute("d", d);
  path.setAttribute("class", "connection-line");
  path.setAttribute("stroke", theme.primary);
  path.setAttribute("opacity", "0.4");

  parent.appendChild(path);
}

// Dessiner un nœud
function drawNode(parent, node, theme) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "node-group");
  group.setAttribute("data-node-id", node.id);

  if (node.collapsed) {
    group.classList.add("node-collapsed");
  }

  // Calculer la taille du nœud selon le niveau
  let radius;
  let fontSize;
  if (node.level === 0) {
    radius = 60;
    fontSize = 16;
  } else if (node.level === 1) {
    radius = 45;
    fontSize = 14;
  } else {
    radius = 35;
    fontSize = 12;
  }

  // Cercle
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", node.x);
  circle.setAttribute("cy", node.y);
  circle.setAttribute("r", radius);
  circle.setAttribute("class", "node-circle");

  if (node.level === 0) {
    circle.setAttribute("fill", `url(#gradient-${currentTheme})`);
  } else {
    circle.setAttribute("fill", theme.primary);
    circle.setAttribute("opacity", node.level === 1 ? "0.8" : "0.6");
  }

  circle.setAttribute("stroke", theme.secondary);
  circle.setAttribute("stroke-width", "2");

  // Créer le gradient pour le nœud central
  if (
    node.level === 0 &&
    !document.getElementById(`gradient-${currentTheme}`)
  ) {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const gradient = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "linearGradient"
    );
    gradient.setAttribute("id", `gradient-${currentTheme}`);
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "100%");

    const stop1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "stop"
    );
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", theme.primary);

    const stop2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "stop"
    );
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", theme.secondary);

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    parent.appendChild(defs);
  }

  // Texte
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", node.x);
  text.setAttribute("y", node.y);
  text.setAttribute("class", "node-text");
  text.setAttribute("font-size", fontSize);

  // Gérer le texte long
  const words = node.text.split(" ");
  if (words.length > 2 && node.level > 0) {
    const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(" ");
    const secondLine = words.slice(Math.ceil(words.length / 2)).join(" ");

    const tspan1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan"
    );
    tspan1.setAttribute("x", node.x);
    tspan1.setAttribute("dy", "-0.3em");
    tspan1.textContent = firstLine;

    const tspan2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan"
    );
    tspan2.setAttribute("x", node.x);
    tspan2.setAttribute("dy", "1.2em");
    tspan2.textContent = secondLine;

    text.appendChild(tspan1);
    text.appendChild(tspan2);
  } else {
    text.textContent = node.text;
  }

  group.appendChild(circle);
  group.appendChild(text);

  // Indicateur de nœuds enfants collapsed
  if (node.children && node.children.length > 0 && node.collapsed) {
    const indicator = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    indicator.setAttribute("x", node.x);
    indicator.setAttribute("y", node.y + radius + 15);
    indicator.setAttribute("class", "node-text");
    indicator.setAttribute("font-size", "14");
    indicator.textContent = `+${node.children.length}`;
    group.appendChild(indicator);
  }

  // Événements
  group.addEventListener("click", (e) => handleNodeClick(e, node));
  group.addEventListener("dblclick", (e) => handleNodeDoubleClick(e, node));

  parent.appendChild(group);
}

// Gérer le clic sur un nœud
function handleNodeClick(e, node) {
  e.stopPropagation();

  if (node.children && node.children.length > 0) {
    node.collapsed = !node.collapsed;
    saveMindmaps();
    renderMindmap();
  }

  selectedNode = node;
}

// Gérer le double-clic sur un nœud
function handleNodeDoubleClick(e, node) {
  e.stopPropagation();
  startEditingNode(node);
}

// Commencer l'édition d'un nœud
function startEditingNode(node) {
  const newText = prompt("Modifier le texte du nœud:", node.text);
  if (newText !== null && newText.trim() !== "") {
    node.text = newText.trim();
    saveMindmaps();
    renderMindmap();
  }
}

// Ajouter une branche
function addBranch() {
  if (!currentMindmap || !selectedNode) {
    alert("Veuillez sélectionner un nœud d'abord");
    return;
  }

  const newText = prompt("Texte de la nouvelle branche:");
  if (!newText || newText.trim() === "") return;

  const newNode = {
    id: currentMindmap.nodes.length,
    text: newText.trim(),
    level: selectedNode.level + 1,
    parentId: selectedNode.id,
    x: 0,
    y: 0,
    collapsed: false,
    children: [],
  };

  currentMindmap.nodes.push(newNode);
  selectedNode.children.push(newNode.id);

  saveMindmaps();
  calculateNodePositions();
  renderMindmap();
}

// Développer tous les nœuds
function expandAll() {
  if (!currentMindmap) return;

  currentMindmap.nodes.forEach((node) => {
    node.collapsed = false;
  });

  saveMindmaps();
  renderMindmap();
}

// Réduire tous les nœuds de niveau 1 et plus
function collapseAll() {
  if (!currentMindmap) return;

  currentMindmap.nodes.forEach((node) => {
    if (node.level === 1) {
      node.collapsed = true;
    }
  });

  saveMindmaps();
  renderMindmap();
}

// Centrer la vue
function centerView() {
  svgPanZoom = { x: 0, y: 0 };
  currentZoom = 1;
  updateZoomDisplay();
  renderMindmap();
}

// Zoom avant
function zoomIn() {
  currentZoom = Math.min(currentZoom + 0.1, 2);
  updateZoomDisplay();
  renderMindmap();
}

// Zoom arrière
function zoomOut() {
  currentZoom = Math.max(currentZoom - 0.1, 0.5);
  updateZoomDisplay();
  renderMindmap();
}

// Réinitialiser le zoom
function resetZoom() {
  currentZoom = 1;
  updateZoomDisplay();
  renderMindmap();
}

// Mettre à jour l'affichage du zoom
function updateZoomDisplay() {
  document.getElementById("zoom-level").textContent = `${Math.round(
    currentZoom * 100
  )}%`;
}

// Configuration des interactions canvas
function setupCanvasInteractions() {
  const svg = document.getElementById("mindmap-canvas");

  svg.addEventListener("mousedown", (e) => {
    if (e.target === svg || e.target.tagName === "g") {
      isDragging = true;
      dragStart = { x: e.clientX - svgPanZoom.x, y: e.clientY - svgPanZoom.y };
      svg.style.cursor = "grabbing";
    }
  });

  svg.addEventListener("mousemove", (e) => {
    if (isDragging) {
      svgPanZoom.x = e.clientX - dragStart.x;
      svgPanZoom.y = e.clientY - dragStart.y;
      renderMindmap();
    }
  });

  svg.addEventListener("mouseup", () => {
    isDragging = false;
    svg.style.cursor = "grab";
  });

  svg.addEventListener("mouseleave", () => {
    isDragging = false;
    svg.style.cursor = "grab";
  });

  // Zoom avec la molette
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  });
}

// Sauvegarder la mindmap
function saveMindmap() {
  if (!currentMindmap) return;

  const titleInput = document.getElementById("mindmap-title");
  currentMindmap.title = titleInput.value || "Mind Map sans titre";

  saveMindmaps();

  // Animation de confirmation
  const saveBtn = document.querySelector(".save-btn");
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "✓ Sauvegardé !";

  setTimeout(() => {
    saveBtn.textContent = originalText;
  }, 2000);
}

// Supprimer la mindmap actuelle
function deleteCurrentMindmap() {
  if (!currentMindmap) return;

  if (
    confirm(
      `Êtes-vous sûr de vouloir supprimer la mind map "${currentMindmap.title}" ?`
    )
  ) {
    mindmaps = mindmaps.filter((m) => m.id !== currentMindmap.id);
    saveMindmaps();
    backToHome();
  }
}

// Supprimer une mindmap depuis la liste
function deleteMindmapFromList(mindmapId) {
  const mindmap = mindmaps.find((m) => m.id === mindmapId);

  if (
    confirm(
      `Êtes-vous sûr de vouloir supprimer la mind map "${mindmap.title}" ?`
    )
  ) {
    mindmaps = mindmaps.filter((m) => m.id !== mindmapId);
    saveMindmaps();
    renderMindmapsList();
  }
}

// Afficher le menu d'export
function showExportMenu() {
  document.getElementById("export-modal").style.display = "flex";
}

// Fermer le menu d'export
function closeExportMenu() {
  document.getElementById("export-modal").style.display = "none";
}

// Exporter en PNG
function exportAsPNG() {
  const svg = document.getElementById("mindmap-canvas");
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  canvas.width = 1600;
  canvas.height = 1200;

  img.onload = function () {
    ctx.fillStyle = "#0a0e27";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentMindmap.title || "mindmap"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  img.src =
    "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  closeExportMenu();
}

// Exporter en SVG
function exportAsSVG() {
  const svg = document.getElementById("mindmap-canvas");
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentMindmap.title || "mindmap"}.svg`;
  a.click();
  URL.revokeObjectURL(url);
  closeExportMenu();
}

// Exporter en JSON
function exportAsJSON() {
  const data = JSON.stringify(currentMindmap, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentMindmap.title || "mindmap"}.json`;
  a.click();
  URL.revokeObjectURL(url);
  closeExportMenu();
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
      ? titleMatch[1].replace("Mind Map - ", "").trim()
      : file.name.replace(".html", "");

    const importedMindmap = {
      id: Date.now().toString(),
      title: title,
      filename: file.name,
      size: file.size,
      importedAt: new Date().toISOString(),
      htmlContent: htmlContent,
      thumbnail: "🧠",
      isFromLibrary: false,
    };

    importedMindmaps.push(importedMindmap);
    saveImportedMindmaps();
    renderMindmapsList();
    switchLibraryTab("imported");

    event.target.value = "";
    showNotification(`✓ ${file.name} importé avec succès !`);
  };

  reader.readAsText(file);
}

// Afficher une mindmap importée
function viewImportedMindmap(id) {
  const mindmap = importedMindmaps.find((m) => String(m.id) === String(id));
  if (!mindmap) return;

  currentViewedMindmap = mindmap;
  viewerZoom = 1;

  const modal = document.getElementById("imported-viewer-modal");
  const iframe = document.getElementById("imported-viewer-frame");

  const blob = new Blob([mindmap.htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  iframe.src = url;
  iframe.style.transform = `scale(${viewerZoom})`;
  iframe.style.transformOrigin = "top center";
  modal.style.display = "flex";

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// Fermer le viewer de mindmap importée
function closeImportedViewer() {
  const modal = document.getElementById("imported-viewer-modal");
  const iframe = document.getElementById("imported-viewer-frame");
  modal.style.display = "none";
  iframe.src = "";
  currentViewedMindmap = null;
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

// Télécharger la mindmap actuellement visualisée
function downloadCurrentMindmap() {
  if (!currentViewedMindmap) return;

  const blob = new Blob([currentViewedMindmap.htmlContent], {
    type: "text/html",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    currentViewedMindmap.filename || `${currentViewedMindmap.title}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification(`✓ Mind map téléchargée !`);
}

// Supprimer une mindmap importée
function deleteImportedMindmap(id) {
  const mindmap = importedMindmaps.find((m) => String(m.id) === String(id));

  if (confirm(`Êtes-vous sûr de vouloir supprimer "${mindmap.title}" ?`)) {
    importedMindmaps = importedMindmaps.filter(
      (m) => String(m.id) !== String(id)
    );
    saveImportedMindmaps();
    renderMindmapsList();
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

// Export HTML autonome
function exportAsHTML() {
  if (!currentMindmap) return;

  const htmlContent = generateStandaloneMindmapHTML();

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentMindmap.title
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  closeExportMenu();
  showNotification(`✓ Mind map exportée en HTML !`);
}

// Générer un HTML autonome de la mindmap
function generateStandaloneMindmapHTML() {
  if (!currentMindmap) return "";

  const nodes = currentMindmap.nodes;
  const theme = themes[currentTheme];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mind Map - ${escapeHtml(currentMindmap.title)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #16213e 100%);
            overflow: hidden;
            width: 100vw;
            height: 100vh;
        }
        .container { width: 100%; height: 100%; display: flex; flex-direction: column; padding: 20px; }
        .header { text-align: center; margin-bottom: 15px; color: white; }
        .header h1 { font-size: 2.2em; font-weight: 700; margin-bottom: 5px; }
        .canvas-wrapper { flex: 1; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); position: relative; overflow: hidden; }
        svg { width: 100%; height: 100%; cursor: grab; }
        svg:active { cursor: grabbing; }
        .node { cursor: pointer; transition: all 0.3s; }
        .node:hover { transform: scale(1.05); }
        .node-circle { stroke-width: 2; stroke: white; }
        .node-text { font-family: "Inter", sans-serif; font-weight: 600; fill: white; text-anchor: middle; dominant-baseline: middle; pointer-events: none; }
        .connection-line { stroke: #cbd5e1; stroke-width: 2; fill: none; opacity: 0.6; }
        .controls { position: absolute; bottom: 20px; right: 20px; z-index: 10; display: flex; gap: 8px; }
        .control-btn { width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; color: white; font-size: 1.1em; cursor: pointer; transition: all 0.2s; }
        .control-btn:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${escapeHtml(currentMindmap.title)}</h1>
        </div>
        <div class="canvas-wrapper">
            <svg id="mindmap-canvas" viewBox="0 0 1600 1000">
                ${generateSVGContent(nodes, theme)}
            </svg>
        </div>
        <div class="controls">
            <button class="control-btn" onclick="zoom(0.1)" title="Zoom avant">+</button>
            <button class="control-btn" onclick="zoom(-0.1)" title="Zoom arrière">−</button>
            <button class="control-btn" onclick="resetView()" title="Réinitialiser">⟲</button>
        </div>
    </div>
    <script>
        let currentZoom = 1;
        let panX = 0;
        let panY = 0;
        const svg = document.getElementById('mindmap-canvas');
        
        function zoom(delta) {
            currentZoom = Math.max(0.5, Math.min(2, currentZoom + delta));
            updateView();
        }
        
        function resetView() {
            currentZoom = 1;
            panX = 0;
            panY = 0;
            updateView();
        }
        
        function updateView() {
            const g = svg.querySelector('g');
            if (g) {
                g.setAttribute('transform', \`translate(\${panX}, \${panY}) scale(\${currentZoom})\`);
            }
        }
        
        let isDragging = false;
        let startX, startY;
        
        svg.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
        });
        
        svg.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            updateView();
        });
        
        svg.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            zoom(e.deltaY > 0 ? -0.1 : 0.1);
        });
    </script>
</body>
</html>`;
}

// Générer le contenu SVG pour l'export HTML
function generateSVGContent(nodes, theme) {
  let svg = "<g>";

  // Dessiner les connexions
  nodes.forEach((node) => {
    if (node.parentId !== null && !node.collapsed) {
      const parent = nodes.find((n) => n.id === node.parentId);
      if (parent) {
        svg += `<line class="connection-line" x1="${parent.x}" y1="${parent.y}" x2="${node.x}" y2="${node.y}" />`;
      }
    }
  });

  // Dessiner les nœuds
  nodes.forEach((node) => {
    if (!node.collapsed) {
      const size = node.level === 0 ? 80 : node.level === 1 ? 60 : 45;
      const fontSize = node.level === 0 ? 16 : node.level === 1 ? 14 : 12;

      svg += `<g class="node">
        <circle class="node-circle" cx="${node.x}" cy="${
        node.y
      }" r="${size}" fill="url(#gradient-${node.level})" />
        <text class="node-text" x="${node.x}" y="${
        node.y
      }" font-size="${fontSize}">${escapeHtml(node.text)}</text>
      </g>`;
    }
  });

  svg += "</g>";

  // Ajouter les gradients
  svg =
    `<defs>
    <linearGradient id="gradient-0" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${theme.secondary};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.primary};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${theme.secondary};stop-opacity:0.8" />
    </linearGradient>
    <linearGradient id="gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.primary};stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:${theme.secondary};stop-opacity:0.6" />
    </linearGradient>
  </defs>` + svg;

  return svg;
}
