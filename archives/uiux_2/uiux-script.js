// État global de l'application
let projects = [];
let currentProject = null;
let componentCounter = 0;

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  loadProjects();
  loadWorkflowsList();
  renderProjectsList();
  setupColorPickers();
});

// Gestion de l'info toggle
function toggleInfo() {
  const infoContent = document.getElementById("infoContent");
  const infoToggle = document.querySelector(".info-toggle");

  if (infoContent.style.display === "none" || infoContent.style.display === "") {
    infoContent.style.display = "block";
    infoToggle.textContent = "Informations sur le designer ▲";
  } else {
    infoContent.style.display = "none";
    infoToggle.textContent = "Informations sur le designer ▼";
  }
}

// Charger les projets depuis localStorage
function loadProjects() {
  const saved = localStorage.getItem("uiux-projects");
  projects = saved ? JSON.parse(saved) : [];
}

// Sauvegarder les projets dans localStorage
function saveProjects() {
  localStorage.setItem("uiux-projects", JSON.stringify(projects));
}

// Charger la liste des workflows disponibles
function loadWorkflowsList() {
  const workflows = localStorage.getItem("workflows");
  if (workflows) {
    const workflowsList = JSON.parse(workflows);
    const select = document.getElementById("linkedWorkflow");
    if (select) {
      select.innerHTML = '<option value="">-- Aucun workflow sélectionné --</option>';
      workflowsList.forEach((workflow) => {
        const option = document.createElement("option");
        option.value = workflow.id;
        option.textContent = workflow.title;
        select.appendChild(option);
      });
    }
  }
}

// Créer un nouveau projet
function createNewProject() {
  const newProject = {
    id: Date.now(),
    title: "Nouveau Projet UI/UX",
    createdAt: new Date().toISOString(),
    titleEdited: false,
    
    // Design System
    colors: {
      primary: "#667eea",
      secondary: "#764ba2",
      accent: "#4ade80",
      background: "#0a0e27",
      text: "#e8eaf6"
    },
    typography: {
      primaryFont: "Inter",
      secondaryFont: "Inter",
      baseFontSize: 16,
      typeScale: 1.2
    },
    spacing: {
      unit: 8,
      borderRadius: 12,
      maxWidth: 1600,
      gridColumns: 12
    },
    
    // Composants
    components: [],
    
    // Layout
    layout: {
      type: "single-page",
      navType: "top",
      mainPages: "",
      mobileFriendly: true,
      tabletOptimized: true,
      desktopOptimized: true
    },
    
    // Interactions
    interactions: {
      transitionSpeed: 300,
      easingFunction: "ease-in-out",
      loadingStates: true,
      successFeedback: true,
      errorHandling: true,
      toastNotifications: true,
      hoverEffects: true,
      microInteractions: false,
      specificAnimations: ""
    },
    
    // Identité
    identity: {
      visualStyle: "minimal-evolved",
      mood: "calm",
      visualReferences: "",
      uxWritingTone: "",
      specialNotes: "",
      darkMode: false,
      adaptiveTheme: false,
      microInteractionsRich: true,
      motionDesign: false,
      elements3d: false,
      parallaxEffects: false,
      aiDriven: false,
      conversationalUI: false,
      designApproach: "atomic",
      densityLevel: "medium"
    },
    
    // Projet complet
    linkedWorkflow: "",
    stack: {
      frontend: "react",
      css: "tailwind",
      backend: "nodejs",
      database: "mongodb"
    },
    additionalInstructions: ""
  };

  projects.push(newProject);
  saveProjects();
  openProjectEditor(newProject.id);
}

// Afficher la liste des projets
function renderProjectsList() {
  const container = document.getElementById("projects-list");

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎨</div>
        <div class="empty-state-text">Aucun projet créé</div>
        <div class="empty-state-subtext">Cliquez sur "Nouveau Projet UI/UX" pour commencer</div>
      </div>
    `;
    return;
  }

  container.innerHTML = projects
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(
      (project) => `
    <div class="project-card" onclick="openProjectEditor(${project.id})">
      <div class="project-card-header">
        <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
        <button class="delete-project-btn" onclick="event.stopPropagation(); deleteProjectFromList(${project.id})">
          🗑️
        </button>
      </div>
      <div class="project-card-date">
        Créé le ${formatDate(project.createdAt)}
      </div>
      <div class="project-card-info">
        <span class="project-badge">${project.stack.frontend}</span>
        <span class="project-badge">${project.stack.css}</span>
        ${project.linkedWorkflow ? '<span class="project-badge">🔗 Workflow</span>' : ''}
      </div>
    </div>
  `
    )
    .join("");
}

// Ouvrir l'éditeur de projet
function openProjectEditor(projectId) {
  currentProject = projects.find((p) => p.id === projectId);

  if (!currentProject) {
    console.error("Projet non trouvé");
    return;
  }

  document.getElementById("home-view").style.display = "none";
  document.getElementById("project-editor").style.display = "block";
  
  loadProjectData();
  renderComponents();
  loadWorkflowsList();
}

// Charger les données du projet dans le formulaire
function loadProjectData() {
  const p = currentProject;
  
  // Titre
  const titleInput = document.getElementById("project-title");
  titleInput.value = p.title;
  titleInput.onfocus = function() {
    if (!p.titleEdited) {
      this.value = "";
      p.titleEdited = true;
      this.select();
    }
  };
  
  // Couleurs
  setColorPicker("primaryColor", p.colors.primary);
  setColorPicker("secondaryColor", p.colors.secondary);
  setColorPicker("accentColor", p.colors.accent);
  setColorPicker("bgColor", p.colors.background);
  setColorPicker("textColor", p.colors.text);
  
  // Typographie
  document.getElementById("primaryFont").value = p.typography.primaryFont;
  document.getElementById("secondaryFont").value = p.typography.secondaryFont;
  document.getElementById("baseFontSize").value = p.typography.baseFontSize;
  document.getElementById("typeScale").value = p.typography.typeScale;
  
  // Espacements
  document.getElementById("spacingUnit").value = p.spacing.unit;
  document.getElementById("borderRadius").value = p.spacing.borderRadius;
  document.getElementById("maxWidth").value = p.spacing.maxWidth;
  document.getElementById("gridColumns").value = p.spacing.gridColumns;
  
  // Layout
  document.getElementById("layoutType").value = p.layout.type;
  document.getElementById("navType").value = p.layout.navType;
  document.getElementById("mainPages").value = p.layout.mainPages;
  document.getElementById("mobileFriendly").checked = p.layout.mobileFriendly;
  document.getElementById("tabletOptimized").checked = p.layout.tabletOptimized;
  document.getElementById("desktopOptimized").checked = p.layout.desktopOptimized;
  
  // Interactions
  document.getElementById("transitionSpeed").value = p.interactions.transitionSpeed;
  document.getElementById("easingFunction").value = p.interactions.easingFunction;
  document.getElementById("loadingStates").checked = p.interactions.loadingStates;
  document.getElementById("successFeedback").checked = p.interactions.successFeedback;
  document.getElementById("errorHandling").checked = p.interactions.errorHandling;
  document.getElementById("toastNotifications").checked = p.interactions.toastNotifications;
  document.getElementById("hoverEffects").checked = p.interactions.hoverEffects;
  document.getElementById("microInteractions").checked = p.interactions.microInteractions;
  document.getElementById("specificAnimations").value = p.interactions.specificAnimations;
  
  // Identité
  document.getElementById("visualStyle").value = p.identity.visualStyle;
  document.getElementById("mood").value = p.identity.mood;
  document.getElementById("visualReferences").value = p.identity.visualReferences;
  document.getElementById("uxWritingTone").value = p.identity.uxWritingTone || "";
  document.getElementById("specialNotes").value = p.identity.specialNotes;
  document.getElementById("darkMode").checked = p.identity.darkMode || false;
  document.getElementById("adaptiveTheme").checked = p.identity.adaptiveTheme || false;
  document.getElementById("microInteractionsRich").checked = p.identity.microInteractionsRich !== false;
  document.getElementById("motionDesign").checked = p.identity.motionDesign || false;
  document.getElementById("3dElements").checked = p.identity.elements3d || false;
  document.getElementById("parallaxEffects").checked = p.identity.parallaxEffects || false;
  document.getElementById("aiDriven").checked = p.identity.aiDriven || false;
  document.getElementById("conversationalUI").checked = p.identity.conversationalUI || false;
  document.getElementById("designApproach").value = p.identity.designApproach || "atomic";
  document.getElementById("densityLevel").value = p.identity.densityLevel || "medium";
  
  // Projet complet
  document.getElementById("linkedWorkflow").value = p.linkedWorkflow;
  document.getElementById("frontendFramework").value = p.stack.frontend;
  document.getElementById("cssFramework").value = p.stack.css;
  document.getElementById("backend").value = p.stack.backend;
  document.getElementById("database").value = p.stack.database;
  document.getElementById("additionalInstructions").value = p.additionalInstructions;
}

// Setup des color pickers
function setupColorPickers() {
  const colorIds = ["primaryColor", "secondaryColor", "accentColor", "bgColor", "textColor"];
  
  colorIds.forEach(id => {
    const colorPicker = document.getElementById(id);
    const textInput = document.getElementById(id + "Text");
    
    if (colorPicker && textInput) {
      colorPicker.addEventListener("input", (e) => {
        textInput.value = e.target.value;
      });
      
      textInput.addEventListener("input", (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          colorPicker.value = e.target.value;
        }
      });
    }
  });
}

function setColorPicker(id, value) {
  const colorPicker = document.getElementById(id);
  const textInput = document.getElementById(id + "Text");
  if (colorPicker) colorPicker.value = value;
  if (textInput) textInput.value = value;
}

// Composants
function addComponent() {
  const component = {
    id: Date.now() + componentCounter++,
    name: "Nouveau Composant",
    type: "button",
    description: "",
    states: ""
  };
  
  currentProject.components.push(component);
  renderComponents();
}

function renderComponents() {
  const container = document.getElementById("componentsList");
  
  if (currentProject.components.length === 0) {
    container.innerHTML = `
      <div class="empty-components">
        Aucun composant défini. Ajoutez vos composants UI.
      </div>
    `;
    return;
  }
  
  container.innerHTML = currentProject.components.map((comp, index) => `
    <div class="component-item">
      <div class="component-header">
        <input 
          type="text" 
          class="component-name" 
          value="${escapeHtml(comp.name)}"
          onchange="updateComponent(${comp.id}, 'name', this.value)"
          placeholder="Nom du composant"
        />
        <select 
          class="component-type"
          onchange="updateComponent(${comp.id}, 'type', this.value)"
        >
          <option value="button" ${comp.type === 'button' ? 'selected' : ''}>Button</option>
          <option value="input" ${comp.type === 'input' ? 'selected' : ''}>Input</option>
          <option value="card" ${comp.type === 'card' ? 'selected' : ''}>Card</option>
          <option value="modal" ${comp.type === 'modal' ? 'selected' : ''}>Modal</option>
          <option value="navbar" ${comp.type === 'navbar' ? 'selected' : ''}>Navbar</option>
          <option value="sidebar" ${comp.type === 'sidebar' ? 'selected' : ''}>Sidebar</option>
          <option value="table" ${comp.type === 'table' ? 'selected' : ''}>Table</option>
          <option value="form" ${comp.type === 'form' ? 'selected' : ''}>Form</option>
          <option value="dropdown" ${comp.type === 'dropdown' ? 'selected' : ''}>Dropdown</option>
          <option value="tabs" ${comp.type === 'tabs' ? 'selected' : ''}>Tabs</option>
          <option value="other" ${comp.type === 'other' ? 'selected' : ''}>Autre</option>
        </select>
        <button class="delete-component-btn" onclick="deleteComponent(${comp.id})">🗑️</button>
      </div>
      <textarea 
        class="component-description"
        onchange="updateComponent(${comp.id}, 'description', this.value)"
        placeholder="Description du composant (style, comportement...)"
      >${escapeHtml(comp.description)}</textarea>
      <textarea 
        class="component-states"
        onchange="updateComponent(${comp.id}, 'states', this.value)"
        placeholder="États du composant (hover, active, disabled, loading...)"
        rows="2"
      >${escapeHtml(comp.states)}</textarea>
    </div>
  `).join("");
}

function updateComponent(id, field, value) {
  const comp = currentProject.components.find(c => c.id === id);
  if (comp) {
    comp[field] = value;
  }
}

function deleteComponent(id) {
  currentProject.components = currentProject.components.filter(c => c.id !== id);
  renderComponents();
}

// Sauvegarder le projet
function saveProject() {
  if (!currentProject) return;

  // Récupérer toutes les valeurs
  currentProject.title = document.getElementById("project-title").value || "Projet sans titre";
  
  // Couleurs
  currentProject.colors.primary = document.getElementById("primaryColor").value;
  currentProject.colors.secondary = document.getElementById("secondaryColor").value;
  currentProject.colors.accent = document.getElementById("accentColor").value;
  currentProject.colors.background = document.getElementById("bgColor").value;
  currentProject.colors.text = document.getElementById("textColor").value;
  
  // Typographie
  currentProject.typography.primaryFont = document.getElementById("primaryFont").value;
  currentProject.typography.secondaryFont = document.getElementById("secondaryFont").value;
  currentProject.typography.baseFontSize = parseInt(document.getElementById("baseFontSize").value);
  currentProject.typography.typeScale = parseFloat(document.getElementById("typeScale").value);
  
  // Espacements
  currentProject.spacing.unit = parseInt(document.getElementById("spacingUnit").value);
  currentProject.spacing.borderRadius = parseInt(document.getElementById("borderRadius").value);
  currentProject.spacing.maxWidth = parseInt(document.getElementById("maxWidth").value);
  currentProject.spacing.gridColumns = parseInt(document.getElementById("gridColumns").value);
  
  // Layout
  currentProject.layout.type = document.getElementById("layoutType").value;
  currentProject.layout.navType = document.getElementById("navType").value;
  currentProject.layout.mainPages = document.getElementById("mainPages").value;
  currentProject.layout.mobileFriendly = document.getElementById("mobileFriendly").checked;
  currentProject.layout.tabletOptimized = document.getElementById("tabletOptimized").checked;
  currentProject.layout.desktopOptimized = document.getElementById("desktopOptimized").checked;
  
  // Interactions
  currentProject.interactions.transitionSpeed = parseInt(document.getElementById("transitionSpeed").value);
  currentProject.interactions.easingFunction = document.getElementById("easingFunction").value;
  currentProject.interactions.loadingStates = document.getElementById("loadingStates").checked;
  currentProject.interactions.successFeedback = document.getElementById("successFeedback").checked;
  currentProject.interactions.errorHandling = document.getElementById("errorHandling").checked;
  currentProject.interactions.toastNotifications = document.getElementById("toastNotifications").checked;
  currentProject.interactions.hoverEffects = document.getElementById("hoverEffects").checked;
  currentProject.interactions.microInteractions = document.getElementById("microInteractions").checked;
  currentProject.interactions.specificAnimations = document.getElementById("specificAnimations").value;
  
  // Identité
  currentProject.identity.visualStyle = document.getElementById("visualStyle").value;
  currentProject.identity.mood = document.getElementById("mood").value;
  currentProject.identity.visualReferences = document.getElementById("visualReferences").value;
  currentProject.identity.uxWritingTone = document.getElementById("uxWritingTone").value;
  currentProject.identity.specialNotes = document.getElementById("specialNotes").value;
  currentProject.identity.darkMode = document.getElementById("darkMode").checked;
  currentProject.identity.adaptiveTheme = document.getElementById("adaptiveTheme").checked;
  currentProject.identity.microInteractionsRich = document.getElementById("microInteractionsRich").checked;
  currentProject.identity.motionDesign = document.getElementById("motionDesign").checked;
  currentProject.identity.elements3d = document.getElementById("3dElements").checked;
  currentProject.identity.parallaxEffects = document.getElementById("parallaxEffects").checked;
  currentProject.identity.aiDriven = document.getElementById("aiDriven").checked;
  currentProject.identity.conversationalUI = document.getElementById("conversationalUI").checked;
  currentProject.identity.designApproach = document.getElementById("designApproach").value;
  currentProject.identity.densityLevel = document.getElementById("densityLevel").value;
  
  // Projet complet
  currentProject.linkedWorkflow = document.getElementById("linkedWorkflow").value;
  currentProject.stack.frontend = document.getElementById("frontendFramework").value;
  currentProject.stack.css = document.getElementById("cssFramework").value;
  currentProject.stack.backend = document.getElementById("backend").value;
  currentProject.stack.database = document.getElementById("database").value;
  currentProject.additionalInstructions = document.getElementById("additionalInstructions").value;

  saveProjects();

  // Animation de confirmation
  const saveBtn = document.querySelector(".save-btn");
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "✓ Sauvegardé !";
  saveBtn.style.background = "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)";

  setTimeout(() => {
    saveBtn.textContent = originalText;
    saveBtn.style.background = "";
  }, 2000);
}

// Exporter le brief complet
function exportProject() {
  if (!currentProject) return;
  
  saveProject(); // Sauvegarder avant d'exporter
  
  let brief = generateBrief(currentProject);
  
  document.getElementById("exportContent").value = brief;
  document.getElementById("exportModal").style.display = "flex";
}

function generateBrief(project) {
  let brief = `# BRIEF COMPLET POUR DÉVELOPPEMENT APPLICATION
# Projet: ${project.title}
# Généré le: ${new Date().toLocaleString('fr-FR')}

================================================================================
📋 CONTEXTE DU PROJET
================================================================================

`;

  // Workflow associé
  if (project.linkedWorkflow) {
    const workflows = JSON.parse(localStorage.getItem("workflows") || "[]");
    const workflow = workflows.find(w => w.id == project.linkedWorkflow);
    
    if (workflow) {
      brief += `## WORKFLOW FONCTIONNEL: ${workflow.title}\n\n`;
      brief += `Le workflow décrit le processus suivant en ${workflow.cardCount} étapes:\n\n`;
      
      workflow.cards.forEach((card, index) => {
        brief += `### Étape ${card.order}: ${card.title}\n`;
        brief += `Type: ${card.type === 'input' ? 'INPUT (Données d\'entrée)' : card.type === 'output' ? 'OUTPUT (Données de sortie)' : 'PROCESSUS'}\n`;
        brief += `Description: ${card.description}\n\n`;
      });
      
      brief += `\n`;
    }
  }

  brief += `================================================================================
🎨 DESIGN SYSTEM
================================================================================

## PALETTE DE COULEURS

Couleur primaire: ${project.colors.primary}
  → Utilisation: Boutons principaux, liens, éléments d'action primaire

Couleur secondaire: ${project.colors.secondary}
  → Utilisation: Boutons secondaires, éléments d'accentuation

Couleur accent: ${project.colors.accent}
  → Utilisation: Succès, validation, highlights

Couleur de fond: ${project.colors.background}
  → Utilisation: Arrière-plan principal de l'application

Couleur de texte: ${project.colors.text}
  → Utilisation: Texte principal, contenu

IMPORTANT: Créer une palette de nuances pour chaque couleur (lighter, light, base, dark, darker)

## TYPOGRAPHIE

Police principale: ${project.typography.primaryFont}
  → Pour: Titres, headers, éléments importants

Police secondaire: ${project.typography.secondaryFont}
  → Pour: Corps de texte, paragraphes

Taille de base: ${project.typography.baseFontSize}px
Échelle typographique: ${project.typography.typeScale}

Hiérarchie des tailles (calculée avec l'échelle):
  - H1: ${Math.round(project.typography.baseFontSize * Math.pow(project.typography.typeScale, 5))}px
  - H2: ${Math.round(project.typography.baseFontSize * Math.pow(project.typography.typeScale, 4))}px
  - H3: ${Math.round(project.typography.baseFontSize * Math.pow(project.typography.typeScale, 3))}px
  - H4: ${Math.round(project.typography.baseFontSize * Math.pow(project.typography.typeScale, 2))}px
  - Body: ${project.typography.baseFontSize}px
  - Small: ${Math.round(project.typography.baseFontSize / project.typography.typeScale)}px

## ESPACEMENTS & GRILLE

Unité de base: ${project.spacing.unit}px
  → Tous les espacements doivent être des multiples de cette unité
  → Petits espacements: ${project.spacing.unit}px, ${project.spacing.unit * 2}px
  → Moyens espacements: ${project.spacing.unit * 3}px, ${project.spacing.unit * 4}px
  → Grands espacements: ${project.spacing.unit * 6}px, ${project.spacing.unit * 8}px

Border radius: ${project.spacing.borderRadius}px
  → Boutons, cards, inputs doivent utiliser ce radius

Largeur maximale du container: ${project.spacing.maxWidth}px
Nombre de colonnes de la grille: ${project.spacing.gridColumns}

================================================================================
🧩 COMPOSANTS UI
================================================================================

`;

  if (project.components.length > 0) {
    project.components.forEach((comp, index) => {
      brief += `## COMPOSANT ${index + 1}: ${comp.name.toUpperCase()}\n\n`;
      brief += `Type: ${comp.type}\n\n`;
      if (comp.description) {
        brief += `Description:\n${comp.description}\n\n`;
      }
      if (comp.states) {
        brief += `États à implémenter:\n${comp.states}\n\n`;
      }
      brief += `---\n\n`;
    });
  } else {
    brief += `Aucun composant spécifique défini. Utiliser les composants standards du framework choisi.\n\n`;
  }

  brief += `================================================================================
📐 LAYOUT & NAVIGATION
================================================================================

## STRUCTURE GÉNÉRALE

Type de layout: ${project.layout.type}
  ${project.layout.type === 'single-page' ? '→ Application sur une seule page (Single Page Application)' : ''}
  ${project.layout.type === 'multi-page' ? '→ Site multi-pages avec navigation entre les pages' : ''}
  ${project.layout.type === 'dashboard' ? '→ Interface de type tableau de bord avec widgets' : ''}
  ${project.layout.type === 'app' ? '→ Application web complète (SPA)' : ''}

Navigation principale: ${project.layout.navType}
  ${project.layout.navType === 'top' ? '→ Barre de navigation en haut de page' : ''}
  ${project.layout.navType === 'side' ? '→ Barre de navigation latérale (sidebar)' : ''}
  ${project.layout.navType === 'both' ? '→ Navigation combinée: top bar + sidebar' : ''}
  ${project.layout.navType === 'mobile-bottom' ? '→ Navigation en bas pour mobile' : ''}

`;

  if (project.layout.mainPages) {
    brief += `## PAGES PRINCIPALES\n\n`;
    const pages = project.layout.mainPages.split('\n').filter(p => p.trim());
    pages.forEach((page, index) => {
      brief += `${index + 1}. ${page.trim()}\n`;
    });
    brief += `\n`;
  }

  brief += `## RESPONSIVE DESIGN\n\n`;
  brief += `Mobile First: ${project.layout.mobileFriendly ? 'OUI ✓' : 'NON'}\n`;
  brief += `Optimisé Tablette: ${project.layout.tabletOptimized ? 'OUI ✓' : 'NON'}\n`;
  brief += `Optimisé Desktop: ${project.layout.desktopOptimized ? 'OUI ✓' : 'NON'}\n\n`;

  if (project.layout.mobileFriendly) {
    brief += `IMPORTANT: Développer en approche Mobile First. Commencer par la version mobile puis adapter pour les écrans plus larges.\n\n`;
  }

  brief += `Breakpoints recommandés:
  - Mobile: < 768px
  - Tablette: 768px - 1024px
  - Desktop: > 1024px

================================================================================
✨ INTERACTIONS & ANIMATIONS
================================================================================

## STYLE D'ANIMATIONS

Vitesse des transitions: ${project.interactions.transitionSpeed}ms
Easing function: ${project.interactions.easingFunction}

Appliquer ces valeurs à:
  - Hover sur les boutons et liens
  - Transitions entre les pages/vues
  - Ouverture/fermeture des modals
  - Apparition/disparition des éléments

## FEEDBACKS UTILISATEUR

`;

  const feedbacks = [];
  if (project.interactions.loadingStates) feedbacks.push("États de chargement (spinners, skeletons)");
  if (project.interactions.successFeedback) feedbacks.push("Messages de succès");
  if (project.interactions.errorHandling) feedbacks.push("Gestion et affichage des erreurs");
  if (project.interactions.toastNotifications) feedbacks.push("Notifications toast");
  if (project.interactions.hoverEffects) feedbacks.push("Effets au survol");
  if (project.interactions.microInteractions) feedbacks.push("Micro-interactions avancées");

  feedbacks.forEach(feedback => {
    brief += `✓ ${feedback}\n`;
  });

  if (project.interactions.specificAnimations) {
    brief += `\n## ANIMATIONS SPÉCIFIQUES\n\n${project.interactions.specificAnimations}\n`;
  }

  brief += `\n================================================================================
🎭 IDENTITÉ VISUELLE & STYLE UI/UX
================================================================================

## STYLE VISUEL

Style UI/UX choisi: ${project.identity.visualStyle || project.identity.generalStyle}
Mood général: ${project.identity.mood}

`;

  // Description détaillée du style
  const styleDescriptions = {
    "minimal-evolved": "Minimalisme évolué - Interface claire et fonctionnelle avec accent sur la typographie et les micro-interactions. Palette limitée, espaces généreux, animations subtiles.",
    "flat-dark": "Flat Dark - Style sobre et fintech avec grille stricte, haute densité d'information, contrastes élevés.",
    "swiss-minimal": "Swiss Minimal - Design typographique fort, grille rigoureuse, hiérarchie claire, sans fioritures.",
    "minimal-slate": "Minimal Slate - Tons neutres avec accents subtils, élégance sobre, espaces bien pensés.",
    "neumorphic": "Neumorphisme - Soft UI avec ombres douces et lumières diffuses, effet tactile et élégant.",
    "glassmorphism": "Glassmorphisme - Effets de verre dépoli, profondeur translucide, backdrop-filter, élégance premium.",
    "oled": "OLED - Noir pur (#000000) avec accents vifs, contraste maximal, économie d'énergie sur écrans OLED.",
    "warm-gradient": "Warm Gradient - Dégradés chaleureux, atmosphère accueillante, couleurs organiques.",
    "brutal": "Brutalisme numérique - Contrastes extrêmes, typographie massive, layouts asymétriques, casse les codes.",
    "bold-ui": "Bold UI - Design audacieux avec contrastes forts, couleurs vives, typographie impactante.",
    "neon": "Néon/Cyberpunk - Couleurs fluorescentes, effets lumineux, ambiance futuriste et énergique.",
    "3d-ui": "UI 3D/Immersive - Objets 3D légers (WebGL/Three.js), parallaxe, profondeur, perspective dynamique.",
    "narrative": "UX Narrative - Storytelling intégré, motion design expressif, expérience émotionnelle complète.",
    "corporate": "Corporate - Professional, fiable, structuré, codes visuels business.",
    "elegant": "Élégant/Premium - Raffinement, attention aux détails, qualité perçue élevée.",
    "minimalist": "Minimaliste - Simplicité, clarté, fonctionnel."
  };

  brief += `${styleDescriptions[project.identity.visualStyle || project.identity.generalStyle] || 'Style personnalisé'}\n\n`;

  // Caractéristiques UI activées
  brief += `## CARACTÉRISTIQUES UI ACTIVÉES\n\n`;
  
  const features = [];
  if (project.identity.darkMode) features.push("✓ Dark Mode par défaut");
  if (project.identity.adaptiveTheme) features.push("✓ Thème adaptatif (clair/sombre automatique)");
  if (project.identity.microInteractionsRich) features.push("✓ Micro-interactions riches");
  if (project.identity.motionDesign) features.push("✓ Motion design expressif");
  if (project.identity.elements3d) features.push("✓ Éléments 3D (WebGL, Three.js)");
  if (project.identity.parallaxEffects) features.push("✓ Effets parallaxe");
  if (project.identity.aiDriven) features.push("✓ Interface adaptative AI-driven");
  if (project.identity.conversationalUI) features.push("✓ UI conversationnelle (chatbot)");
  
  if (features.length > 0) {
    features.forEach(f => brief += `${f}\n`);
  } else {
    brief += `Interface standard.\n`;
  }

  if (project.identity.designApproach) {
    brief += `\n## APPROCHE DESIGN\n\n`;
    brief += `Méthodologie: ${project.identity.designApproach}\n`;
    brief += `Densité: ${project.identity.densityLevel || 'medium'}\n\n`;
  }

  if (project.identity.uxWritingTone) {
    brief += `## TON & UX WRITING\n\n${project.identity.uxWritingTone}\n\n`;
  }

  if (project.identity.visualReferences) {
    brief += `## RÉFÉRENCES VISUELLES\n\n${project.identity.visualReferences}\n\n`;
  }

  if (project.identity.specialNotes) {
    brief += `## POINTS D'ATTENTION\n\n${project.identity.specialNotes}\n\n`;
  }

  brief += `================================================================================
🛠️ STACK TECHNIQUE
================================================================================

Framework Frontend: ${project.stack.frontend.toUpperCase()}
Framework CSS: ${project.stack.css.toUpperCase()}
Backend: ${project.stack.backend.toUpperCase()}
Base de données: ${project.stack.database.toUpperCase()}

## INSTRUCTIONS DE DÉVELOPPEMENT

`;

  if (project.additionalInstructions) {
    brief += `${project.additionalInstructions}\n\n`;
  }

  brief += `## BEST PRACTICES À SUIVRE

1. Code propre et bien commenté
2. Architecture modulaire et maintenable
3. Performance optimisée (lazy loading, code splitting)
4. Accessibilité (WCAG 2.1 niveau AA minimum)
5. SEO optimisé (si applicable)
6. Responsive design sur tous les appareils
7. Tests unitaires pour les fonctions critiques
8. Gestion d'état cohérente
9. Sécurité (validation des inputs, protection XSS, CSRF)
10. Documentation technique

================================================================================
📝 INSTRUCTIONS FINALES POUR LE LLM
================================================================================

En tant que développeur expert, vous devez:

1. ANALYSER ce brief en détail et comprendre tous les requis
2. CRÉER une architecture technique solide basée sur la stack choisie
3. DÉVELOPPER le code en suivant scrupuleusement les spécifications du design system
4. IMPLÉMENTER toutes les fonctionnalités décrites dans le workflow
5. RESPECTER les guidelines UI/UX (couleurs, typographie, espacements, animations)
6. ASSURER la qualité du code (clean code, best practices, performance)
7. TESTER les fonctionnalités principales
8. DOCUMENTER le code et fournir des instructions de déploiement

IMPORTANT: 
- Suivre EXACTEMENT les couleurs et la typographie spécifiées
- Respecter les espacements et le border radius définis
- Implémenter TOUTES les étapes du workflow
- Créer une expérience utilisateur fluide et intuitive
- Le code doit être production-ready

================================================================================
FIN DU BRIEF
================================================================================
`;

  return brief;
}

function closeExportModal() {
  document.getElementById("exportModal").style.display = "none";
}

function copyToClipboard() {
  const content = document.getElementById("exportContent");
  content.select();
  document.execCommand('copy');
  
  const btn = document.querySelector(".copy-btn");
  const originalText = btn.textContent;
  btn.textContent = "✓ Copié !";
  
  setTimeout(() => {
    btn.textContent = originalText;
  }, 2000);
}

// Retour à l'accueil
function backToHome() {
  document.getElementById("home-view").style.display = "block";
  document.getElementById("project-editor").style.display = "none";
  currentProject = null;
  renderProjectsList();
}

// Supprimer le projet actuel
function deleteCurrentProject() {
  if (!currentProject) return;

  if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${currentProject.title}" ?`)) {
    projects = projects.filter((p) => p.id !== currentProject.id);
    saveProjects();
    backToHome();
  }
}

// Supprimer un projet depuis la liste
function deleteProjectFromList(projectId) {
  const project = projects.find((p) => p.id === projectId);

  if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) {
    projects = projects.filter((p) => p.id !== projectId);
    saveProjects();
    renderProjectsList();
  }
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
