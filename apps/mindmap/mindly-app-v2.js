// ===== ÉTAT DE L'APPLICATION =====
let appState = {
    mindmaps: [],
    currentMindmap: null,
    currentCenterNodeId: null, // Pour la navigation en profondeur
    navigationHistory: [], // Historique de navigation
    selectedNode: null,
    editingNode: null,
    selectedColor: 'orange',
    selectedNodeColor: 'teal',
    view: {
        zoom: 1,
        panX: 0,
        panY: 0
    },
    isDragging: false,
    dragStart: { x: 0, y: 0 }
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadMindmaps();
    renderMindmapsList();
    setupEventListeners();
});

function setupEventListeners() {
    const canvas = document.getElementById('mindmap-canvas');
    
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('wheel', handleCanvasWheel);
    
    // Touch events pour mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Redimensionnement de fenêtre
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (appState.currentMindmap) {
                renderMindmap();
            }
        }, 250);
    });
}

// ===== GESTION DES MIND MAPS =====
function loadMindmaps() {
    const saved = localStorage.getItem('mindly_mindmaps');
    if (saved) {
        appState.mindmaps = JSON.parse(saved);
    } else {
        // Créer quelques exemples
        appState.mindmaps = [
            createExampleMindmap('REPAS HEALTH', 'orange', 6),
            createExampleMindmap('ALL SERVICE ODDOO', 'purple', 4),
            createExampleMindmap('AUTO-SURVEILLANCE', 'dark-teal', 5),
            createExampleMindmap('PLAN ACTION', 'dark-teal', 7),
            createExampleMindmap('BUSINESS', 'burgundy', 3)
        ];
        saveMindmaps();
    }
}

function saveMindmaps() {
    localStorage.setItem('mindly_mindmaps', JSON.stringify(appState.mindmaps));
}

function createExampleMindmap(name, color, childCount) {
    const now = new Date();
    return {
        id: generateId(),
        name: name,
        color: color,
        createdAt: new Date(now - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedAt: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        elementsCount: childCount,
        totalElements: 10,
        nodes: createExampleNodes(name, color, childCount)
    };
}

function createExampleNodes(centerText, centerColor, childCount) {
    const colors = ['teal', 'blue', 'purple', 'orange', 'pink', 'mint', 'peach', 'burgundy'];
    const center = {
        id: generateId(),
        text: centerText,
        color: centerColor,
        isCenter: true,
        children: []
    };
    
    const children = [];
    for (let i = 0; i < childCount; i++) {
        const child = {
            id: generateId(),
            text: `Élément ${i + 1}`,
            color: colors[i % colors.length],
            isCenter: false,
            parentId: center.id,
            children: [] // Peut avoir ses propres enfants
        };
        children.push(child);
        center.children.push(child.id);
    }
    
    return [center, ...children];
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== RENDU DE LA LISTE =====
function renderMindmapsList() {
    const list = document.getElementById('mindmaps-list');
    list.innerHTML = '';
    
    appState.mindmaps.forEach(mindmap => {
        const item = createMindmapItem(mindmap);
        list.appendChild(item);
    });
}

function createMindmapItem(mindmap) {
    const div = document.createElement('div');
    div.className = 'mindmap-item';
    div.onclick = () => openMindmap(mindmap.id);
    
    const createdDate = formatDate(mindmap.createdAt);
    const modifiedDate = formatDate(mindmap.modifiedAt);
    const progress = (mindmap.elementsCount / mindmap.totalElements) * 100;
    
    div.innerHTML = `
        <div class="mindmap-icon color-${mindmap.color}">
            ${mindmap.name}
        </div>
        <div class="mindmap-info">
            <div class="mindmap-dates">
                <div class="date-group">
                    <div class="date-label">Dernière Modif.</div>
                    <div class="date-value">${modifiedDate}</div>
                </div>
                <div class="date-group">
                    <div class="date-label">Date de Création</div>
                    <div class="date-value">${createdDate}</div>
                </div>
            </div>
            <div class="elements-label">Éléments</div>
            <div class="elements-bar">
                <div class="elements-progress" style="width: ${progress}%"></div>
            </div>
        </div>
    `;
    
    return div;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ===== NAVIGATION =====
function goHome() {
    document.getElementById('mindmap-screen').classList.remove('active');
    document.getElementById('home-screen').classList.add('active');
    appState.currentMindmap = null;
    appState.currentCenterNodeId = null;
    appState.navigationHistory = [];
    appState.selectedNode = null;
}

function openMindmap(id) {
    const mindmap = appState.mindmaps.find(m => m.id === id);
    if (!mindmap) return;
    
    appState.currentMindmap = mindmap;
    appState.view = { zoom: 1, panX: 0, panY: 0 };
    
    // Trouver le nœud central racine
    const rootNode = mindmap.nodes.find(n => n.isCenter);
    appState.currentCenterNodeId = rootNode ? rootNode.id : null;
    appState.navigationHistory = [];
    
    document.getElementById('home-screen').classList.remove('active');
    document.getElementById('mindmap-screen').classList.add('active');
    
    renderMindmap();
}

// Naviguer vers un nœud (le rendre central)
function navigateToNode(nodeId) {
    if (!appState.currentMindmap) return;
    
    const node = appState.currentMindmap.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Sauvegarder l'état actuel dans l'historique
    if (appState.currentCenterNodeId) {
        appState.navigationHistory.push(appState.currentCenterNodeId);
    }
    
    // Définir le nouveau centre
    appState.currentCenterNodeId = nodeId;
    appState.selectedNode = null;
    
    renderMindmap();
}

// Retour arrière dans la navigation
function navigateBack() {
    if (appState.navigationHistory.length === 0) return;
    
    const previousNodeId = appState.navigationHistory.pop();
    appState.currentCenterNodeId = previousNodeId;
    appState.selectedNode = null;
    
    renderMindmap();
}

// ===== RENDU DE LA MIND MAP =====
function renderMindmap() {
    if (!appState.currentMindmap) return;
    
    const container = document.getElementById('nodes-container');
    const svg = document.getElementById('connections-svg');
    
    container.innerHTML = '';
    svg.innerHTML = '';
    
    const centerNode = appState.currentMindmap.nodes.find(n => n.id === appState.currentCenterNodeId);
    if (!centerNode) return;
    
    // Obtenir les nœuds enfants du centre actuel
    const childNodes = appState.currentMindmap.nodes.filter(n => 
        centerNode.children && centerNode.children.includes(n.id)
    );
    
    // Adapter les tailles en fonction de l'écran
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 768;
    const isSmall = viewportWidth < 480;
    
    // Tailles adaptatives
    const centerSize = isSmall ? 100 : isMobile ? 120 : 140;
    const nodeSize = isSmall ? 70 : isMobile ? 80 : 100;
    const radius = isSmall ? 140 : isMobile ? 160 : 200;
    
    // Position du centre (ajustée pour mobile)
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    
    // Dessiner le bouton retour si on n'est pas à la racine
    if (appState.navigationHistory.length > 0) {
        renderBackButton();
    }
    
    // Dessiner le nœud central
    renderNode(centerNode, centerX, centerY, centerSize, true);
    
    // Dessiner les nœuds enfants en cercle
    childNodes.forEach((node, index) => {
        const angle = (Math.PI * 2 / childNodes.length) * index - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        renderNode(node, x, y, nodeSize, false, {
            index: index,
            total: childNodes.length,
            angle: angle
        });
    });
    
    // Dessiner les connexions entre nœuds enfants
    drawChildConnections(childNodes, centerX, centerY, radius);
    
    // Dessiner les boutons d'ajout
    renderAddButtons(childNodes, centerX, centerY, radius);
}

function renderBackButton() {
    const container = document.getElementById('nodes-container');
    const btn = document.createElement('button');
    btn.className = 'nav-btn back-nav-btn';
    btn.innerHTML = '🏠';
    btn.title = 'Retour';
    btn.style.position = 'absolute';
    btn.style.top = '20px';
    btn.style.left = '20px';
    
    btn.onclick = navigateBack;
    
    container.appendChild(btn);
}

function renderNode(node, x, y, size, isCenter = false, positionData = null) {
    const container = document.getElementById('nodes-container');
    const div = document.createElement('div');
    
    div.className = `node color-${node.color}`;
    if (isCenter) {
        div.classList.add('center');
    }
    if (appState.selectedNode === node.id) {
        div.classList.add('selected');
    }
    
    const transformedX = x * appState.view.zoom + appState.view.panX;
    const transformedY = y * appState.view.zoom + appState.view.panY;
    const transformedSize = size * appState.view.zoom;
    
    div.style.left = `${transformedX - transformedSize / 2}px`;
    div.style.top = `${transformedY - transformedSize / 2}px`;
    div.style.width = `${transformedSize}px`;
    div.style.height = `${transformedSize}px`;
    
    // Adapter la taille de police en fonction de la taille du nœud et du texte
    const textLength = node.text.length;
    let fontSize = 14 * appState.view.zoom;
    
    // Réduire la police si le texte est long
    if (textLength > 20) {
        fontSize *= 0.85;
    }
    if (textLength > 30) {
        fontSize *= 0.85;
    }
    
    div.style.fontSize = `${Math.max(10, Math.min(20, fontSize))}px`;
    
    // Indicateur si le nœud a des enfants
    const hasChildren = node.children && node.children.length > 0;
    const childrenIndicator = hasChildren && !isCenter ? '<div class="node-children-indicator">→</div>' : '';
    
    // Tronquer le texte si trop long pour le mobile
    const isMobile = window.innerWidth < 768;
    let displayText = node.text;
    if (isMobile && textLength > 40) {
        displayText = node.text.substring(0, 37) + '...';
    }
    
    div.innerHTML = `
        ${displayText}
        ${childrenIndicator}
        ${!isCenter ? '<div class="node-menu">...</div>' : ''}
    `;
    
    // Simple clic : sélectionner
    div.onclick = (e) => {
        e.stopPropagation();
        selectNode(node.id);
    };
    
    // Double-clic : éditer OU naviguer
    div.ondblclick = (e) => {
        e.stopPropagation();
        if (!isCenter && hasChildren) {
            // Si le nœud a des enfants, naviguer dedans
            navigateToNode(node.id);
        } else {
            // Sinon, éditer
            editNodeModal(node.id);
        }
    };
    
    container.appendChild(div);
    
    // Stocker les données de position
    node._position = { x, y, size };
    if (positionData) {
        node._positionData = positionData;
    }
}

function drawChildConnections(childNodes, centerX, centerY, radius) {
    if (childNodes.length < 2) return;
    
    const svg = document.getElementById('connections-svg');
    
    for (let i = 0; i < childNodes.length; i++) {
        const node1 = childNodes[i];
        const node2 = childNodes[(i + 1) % childNodes.length];
        
        if (!node1._position || !node2._position) continue;
        
        const x1 = node1._position.x * appState.view.zoom + appState.view.panX;
        const y1 = node1._position.y * appState.view.zoom + appState.view.panY;
        const x2 = node2._position.x * appState.view.zoom + appState.view.panX;
        const y2 = node2._position.y * appState.view.zoom + appState.view.panY;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        const centerXTransformed = centerX * appState.view.zoom + appState.view.panX;
        const centerYTransformed = centerY * appState.view.zoom + appState.view.panY;
        
        const dx = midX - centerXTransformed;
        const dy = midY - centerYTransformed;
        const len = Math.sqrt(dx * dx + dy * dy);
        const controlX = midX + (dx / len) * 30;
        const controlY = midY + (dy / len) * 30;
        
        const d = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
        
        path.setAttribute('d', d);
        path.setAttribute('class', 'connection-line');
        svg.appendChild(path);
    }
}

function renderAddButtons(childNodes, centerX, centerY, radius) {
    const container = document.getElementById('nodes-container');
    const count = childNodes.length;
    
    // Si pas d'enfants, afficher un seul bouton au centre-droit
    if (count === 0) {
        const btn = document.createElement('div');
        btn.className = 'add-node-btn';
        btn.innerHTML = '+';
        
        const x = centerX + 150;
        const y = centerY;
        
        const transformedX = x * appState.view.zoom + appState.view.panX;
        const transformedY = y * appState.view.zoom + appState.view.panY;
        
        btn.style.left = `${transformedX - 20}px`;
        btn.style.top = `${transformedY - 20}px`;
        
        btn.onclick = (e) => {
            e.stopPropagation();
            addChildNode(0);
        };
        
        container.appendChild(btn);
        return;
    }
    
    // Boutons d'ajout entre chaque paire de nœuds
    for (let i = 0; i < count; i++) {
        const angle1 = (Math.PI * 2 / count) * i - Math.PI / 2;
        const angle2 = (Math.PI * 2 / count) * (i + 1) - Math.PI / 2;
        const midAngle = (angle1 + angle2) / 2;
        
        const x = centerX + Math.cos(midAngle) * radius;
        const y = centerY + Math.sin(midAngle) * radius;
        
        const btn = document.createElement('div');
        btn.className = 'add-node-btn';
        btn.innerHTML = '+';
        
        const transformedX = x * appState.view.zoom + appState.view.panX;
        const transformedY = y * appState.view.zoom + appState.view.panY;
        
        btn.style.left = `${transformedX - 20}px`;
        btn.style.top = `${transformedY - 20}px`;
        
        btn.onclick = (e) => {
            e.stopPropagation();
            addChildNode(midAngle);
        };
        
        container.appendChild(btn);
    }
}

// ===== GESTION DES NŒUDS =====
function selectNode(nodeId) {
    appState.selectedNode = nodeId;
    renderMindmap();
}

function addChildNode(angle) {
    if (!appState.currentMindmap || !appState.currentCenterNodeId) return;
    
    const colors = ['teal', 'blue', 'purple', 'orange', 'pink', 'mint', 'peach', 'burgundy'];
    const centerNode = appState.currentMindmap.nodes.find(n => n.id === appState.currentCenterNodeId);
    
    if (!centerNode.children) {
        centerNode.children = [];
    }
    
    const newNode = {
        id: generateId(),
        text: 'Nouveau',
        color: colors[Math.floor(Math.random() * colors.length)],
        isCenter: false,
        parentId: centerNode.id,
        children: []
    };
    
    appState.currentMindmap.nodes.push(newNode);
    centerNode.children.push(newNode.id);
    appState.currentMindmap.elementsCount++;
    appState.currentMindmap.modifiedAt = new Date().toISOString();
    
    saveMindmaps();
    renderMindmap();
}

function deleteSelectedNode() {
    if (!appState.selectedNode || !appState.currentMindmap) {
        alert('Veuillez sélectionner un nœud à supprimer');
        return;
    }
    
    // Ne pas supprimer le nœud central racine
    const node = appState.currentMindmap.nodes.find(n => n.id === appState.selectedNode);
    if (!node || node.isCenter) {
        alert('Impossible de supprimer le nœud central');
        return;
    }
    
    if (!confirm(`Supprimer "${node.text}" et tous ses enfants ?`)) {
        return;
    }
    
    // Supprimer récursivement
    deleteNodeRecursive(appState.selectedNode);
    
    // Retirer de la liste des enfants du parent
    if (node.parentId) {
        const parent = appState.currentMindmap.nodes.find(n => n.id === node.parentId);
        if (parent && parent.children) {
            parent.children = parent.children.filter(id => id !== appState.selectedNode);
        }
    }
    
    appState.currentMindmap.elementsCount--;
    appState.currentMindmap.modifiedAt = new Date().toISOString();
    appState.selectedNode = null;
    
    saveMindmaps();
    renderMindmap();
}

function deleteNodeRecursive(nodeId) {
    const node = appState.currentMindmap.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Supprimer tous les enfants
    if (node.children) {
        node.children.forEach(childId => deleteNodeRecursive(childId));
    }
    
    // Supprimer le nœud lui-même
    appState.currentMindmap.nodes = appState.currentMindmap.nodes.filter(n => n.id !== nodeId);
}

function editNodeModal(nodeId) {
    const node = appState.currentMindmap.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    appState.editingNode = node;
    appState.selectedNodeColor = node.color;
    
    document.getElementById('node-text-input').value = node.text;
    
    document.querySelectorAll('#edit-modal .color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === node.color) {
            opt.classList.add('selected');
        }
    });
    
    document.getElementById('edit-modal').classList.add('active');
}

function saveNodeEdit() {
    if (!appState.editingNode) return;
    
    const text = document.getElementById('node-text-input').value.trim();
    if (!text) {
        alert('Le texte ne peut pas être vide');
        return;
    }
    
    appState.editingNode.text = text;
    appState.editingNode.color = appState.selectedNodeColor;
    appState.currentMindmap.modifiedAt = new Date().toISOString();
    
    saveMindmaps();
    closeEditModal();
    renderMindmap();
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    appState.editingNode = null;
}

function selectNodeColor(color) {
    appState.selectedNodeColor = color;
    document.querySelectorAll('#edit-modal .color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === color) {
            opt.classList.add('selected');
        }
    });
}

// ===== CRÉATION DE MIND MAP =====
function showCreateModal() {
    appState.selectedColor = 'orange';
    document.getElementById('mindmap-name-input').value = '';
    
    document.querySelectorAll('#create-modal .color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === 'orange') {
            opt.classList.add('selected');
        }
    });
    
    document.getElementById('create-modal').classList.add('active');
}

function closeCreateModal() {
    document.getElementById('create-modal').classList.remove('active');
}

function selectColor(color) {
    appState.selectedColor = color;
    document.querySelectorAll('#create-modal .color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === color) {
            opt.classList.add('selected');
        }
    });
}

function createMindmap() {
    const name = document.getElementById('mindmap-name-input').value.trim();
    if (!name) {
        alert('Veuillez entrer un nom pour la mind map');
        return;
    }
    
    const now = new Date().toISOString();
    const newMindmap = {
        id: generateId(),
        name: name,
        color: appState.selectedColor,
        createdAt: now,
        modifiedAt: now,
        elementsCount: 0,
        totalElements: 10,
        nodes: [
            {
                id: generateId(),
                text: name,
                color: appState.selectedColor,
                isCenter: true,
                children: []
            }
        ]
    };
    
    appState.mindmaps.unshift(newMindmap);
    saveMindmaps();
    closeCreateModal();
    renderMindmapsList();
    openMindmap(newMindmap.id);
}

// ===== INTERACTIONS CANVAS =====
function handleCanvasMouseDown(e) {
    if (e.target.id === 'mindmap-canvas' || e.target.id === 'connections-svg' || e.target.id === 'nodes-container') {
        appState.isDragging = true;
        appState.dragStart = {
            x: e.clientX - appState.view.panX,
            y: e.clientY - appState.view.panY
        };
        e.target.closest('.mindmap-canvas').classList.add('grabbing');
    }
}

function handleCanvasMouseMove(e) {
    if (appState.isDragging) {
        appState.view.panX = e.clientX - appState.dragStart.x;
        appState.view.panY = e.clientY - appState.dragStart.y;
        renderMindmap();
    }
}

function handleCanvasMouseUp(e) {
    if (appState.isDragging) {
        appState.isDragging = false;
        document.querySelector('.mindmap-canvas').classList.remove('grabbing');
    }
}

function handleCanvasWheel(e) {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, appState.view.zoom * delta));
    
    appState.view.zoom = newZoom;
    renderMindmap();
}

// Touch events
let touchStartDistance = 0;

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        appState.isDragging = true;
        appState.dragStart = {
            x: e.touches[0].clientX - appState.view.panX,
            y: e.touches[0].clientY - appState.view.panY
        };
    } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistance = Math.sqrt(dx * dx + dy * dy);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && appState.isDragging) {
        appState.view.panX = e.touches[0].clientX - appState.dragStart.x;
        appState.view.panY = e.touches[0].clientY - appState.dragStart.y;
        renderMindmap();
    } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const scale = distance / touchStartDistance;
        appState.view.zoom = Math.max(0.3, Math.min(3, appState.view.zoom * scale));
        touchStartDistance = distance;
        
        renderMindmap();
    }
}

function handleTouchEnd(e) {
    appState.isDragging = false;
}

// ===== UTILITAIRES =====
function showMenu() {
    alert('Menu (à implémenter)');
}

function showLayersPanel() {
    // Afficher un menu contextuel avec les actions
    if (!appState.selectedNode) {
        alert('Sélectionnez un nœud pour afficher les actions');
        return;
    }
    
    const actions = [
        'Éditer',
        'Supprimer',
        'Dupliquer (à venir)'
    ];
    
    const choice = prompt('Actions disponibles:\n1. Éditer\n2. Supprimer\n\nEntrez le numéro :');
    
    if (choice === '1') {
        editNodeModal(appState.selectedNode);
    } else if (choice === '2') {
        deleteSelectedNode();
    }
}

// Fermer les modales en cliquant à l'extérieur
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Raccourcis clavier
document.addEventListener('keydown', (e) => {
    // Suppr ou Delete pour supprimer le nœud sélectionné
    if ((e.key === 'Delete' || e.key === 'Backspace') && appState.selectedNode) {
        e.preventDefault();
        deleteSelectedNode();
    }
    
    // Échap pour déselectionner
    if (e.key === 'Escape') {
        appState.selectedNode = null;
        renderMindmap();
    }
    
    // Entrée pour éditer
    if (e.key === 'Enter' && appState.selectedNode) {
        editNodeModal(appState.selectedNode);
    }
});