// Gestion des onglets
function setupTabs() {
  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get("tab") || "redaction";

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeContent = document.getElementById(activeTab);
  if (activeContent) {
    activeContent.classList.add("active");
    const activeButton = document.querySelector(
      `[onclick="openTab(event, '${activeTab}')"]`
    );
    if (activeButton) {
      activeButton.classList.add("active");
    }
  }
}

function openTab(evt, tabName) {
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.getElementById(tabName).classList.add("active");
  evt.currentTarget.classList.add("active");

  const url = new URL(window.location);
  url.searchParams.set("tab", tabName);
  window.history.pushState({}, "", url);
}

// Gestion des champs personnalisés
function handleSelectChange(fieldId, value) {
  const textarea = document.getElementById(fieldId + "-text");
  if (value === "custom") {
    textarea.style.display = "block";
    textarea.focus();
  } else {
    textarea.style.display = "none";
    textarea.value = "";
  }
}

// Configuration des gestionnaires d'événements pour les champs
function setupFieldHandlers(fields, suffix = "") {
  fields.forEach((fieldId) => {
    const select = document.getElementById(fieldId + "-select" + suffix);
    if (select) {
      select.addEventListener("change", (e) =>
        handleSelectChange(fieldId + suffix, e.target.value)
      );
    }
  });
}

// Fonction pour basculer l'affichage du champ de texte détaillé
function toggleDetailText() {
  const textarea = document.getElementById("detail-demande");
  if (textarea.style.display === "none" || textarea.style.display === "") {
    textarea.style.display = "block";
  } else {
    textarea.style.display = "none";
  }
}

function toggleDetailTextImage() {
  const textarea = document.getElementById("detail-demande-image");
  if (textarea.style.display === "none" || textarea.style.display === "") {
    textarea.style.display = "block";
  } else {
    textarea.style.display = "none";
  }
}

function toggleDetailTextVoyage() {
  const textarea = document.getElementById("detail-demande-voyage");
  if (textarea.style.display === "none" || textarea.style.display === "") {
    textarea.style.display = "block";
  } else {
    textarea.style.display = "none";
  }
}

function toggleDetailTextCode() {
  const textarea = document.getElementById("detail-demande-code");
  if (textarea.style.display === "none" || textarea.style.display === "") {
    textarea.style.display = "block";
  } else {
    textarea.style.display = "none";
  }
}

function toggleDetailTextApp() {
  const textarea = document.getElementById("detail-demande-app");
  if (textarea.style.display === "none" || textarea.style.display === "") {
    textarea.style.display = "block";
  } else {
    textarea.style.display = "none";
  }
}

// Fonction pour obtenir la valeur d'un champ (select ou textarea)
function getFieldValue(selectId, textareaId) {
  const select = document.getElementById(selectId);
  const textarea = document.getElementById(textareaId);

  if (select.value === "custom" && textarea.value.trim() !== "") {
    return textarea.value.trim();
  }
  return select.value.trim();
}

// Génération du prompt pour la rédaction
function generatePrompt() {
  const objectif = getFieldValue("objectif-select", "objectif-text");
  const genre = getFieldValue("genre-select", "genre-text");
  const language = getFieldValue("language-select", "language-text");
  const thematique = getFieldValue("thematique-select", "thematique-text");
  const cadre = getFieldValue("cadre-select", "cadre-text");
  const pj = getFieldValue("pj-select", "pj-text");
  const ton = getFieldValue("ton-select", "ton-text");
  const detailDemande = document.getElementById("detail-demande").value.trim();

  let basePrompt = "Voici ma demande structurée pour générer du contenu :\n\n";
  if (objectif) basePrompt += `• Objectif : ${objectif}\n`;
  if (genre) basePrompt += `• Format : ${genre}\n`;
  if (language) basePrompt += `• Langue : ${language}\n`;
  if (thematique) basePrompt += `• Thématique : ${thematique}\n`;
  if (cadre) basePrompt += `• Contexte : ${cadre}\n`;
  if (pj) basePrompt += `• Public cible : ${pj}\n`;
  if (ton) basePrompt += `• Ton : ${ton}\n`;
  if (detailDemande)
    basePrompt += `\n🔎 Description détaillée :\n${detailDemande}\n`;

  basePrompt += `\n👉 Créez un contenu professionnel qui répond précisément à ces critères.\n`;

  const oproInstructions = `
🔁 Instructions OPRO :

Tu es un expert en prompt engineering. À partir du prompt ci-dessus, effectue les étapes suivantes :

1. Présente la réponse sous forme de liste à puce: une puce par prompt
2. Commence par la première puce avec le résumé du prompt original ci-dessus
3. Génère 5 variantes de prompts basés sur celui-ci.
4. Pour chaque prompt, évalue sa pertinence sur une échelle de 0 à 100.
   Critères de notation :
   - Clarté des instructions
   - Cohérence avec les critères
   - Précision des demandes
   - Capacité à guider l'IA vers un résultat optimal
5. Ajoute à la fin la commande suivante: Tu vas agir comme un expert en Prompt Engineering. En te basant sur tes connaissances, tes compétences et les prompts notés que je t'ai partagé, tu vas rédiger le prompt parfait pour cette demande.

Objectif final : identifier le meilleur prompt pour générer le contenu demandé.

Prompt de départ :
"""
${basePrompt}
"""
`;

  document.getElementById("result").textContent = oproInstructions;
}

// Génération du prompt pour la rédaction
function generatePrompt() {
  const type = getFieldValue("redac-type-select", "redac-type-custom");
  const objectif = getFieldValue(
    "redac-objectif-select",
    "redac-objectif-custom"
  );
  const publicCible = getFieldValue(
    "redac-public-select",
    "redac-public-custom"
  );
  const ton = getFieldValue("redac-ton-select", "redac-ton-custom");
  const langue = getFieldValue("redac-langue-select", "redac-langue-custom");
  const format = getFieldValue("redac-format-select", "redac-format-custom");
  const angle = getFieldValue("redac-angle-select", "redac-angle-custom");
  const longueur = getFieldValue(
    "redac-longueur-select",
    "redac-longueur-custom"
  );
  const structure = getFieldValue(
    "redac-structure-select",
    "redac-structure-custom"
  );
  const seo = document.getElementById("redac-seo-custom").value.trim();
  const cta = getFieldValue("redac-cta-select", "redac-cta-custom");
  const sources = getFieldValue("redac-sources-select", "redac-sources-custom");
  const detailDemande = document.getElementById("detail-demande").value.trim();

  let basePrompt = "Voici ma demande structurée pour générer du contenu :\n\n";
  if (type) basePrompt += `• Type de contenu : ${type}\n`;
  if (objectif) basePrompt += `• Objectif principal : ${objectif}\n`;
  if (publicCible) basePrompt += `• Public cible : ${publicCible}\n`;
  if (ton) basePrompt += `• Ton / Style : ${ton}\n`;
  if (langue) basePrompt += `• Langue : ${langue}\n`;
  if (format) basePrompt += `• Format souhaité : ${format}\n`;
  if (angle) basePrompt += `• Angle / Approche : ${angle}\n`;
  if (longueur) basePrompt += `• Longueur ciblée : ${longueur}\n`;
  if (structure) basePrompt += `• Structure : ${structure}\n`;
  if (seo) basePrompt += `• SEO / Mots-clés : ${seo}\n`;
  if (cta) basePrompt += `• Call-to-Action : ${cta}\n`;
  if (sources) basePrompt += `• Sources / Références : ${sources}\n`;
  if (detailDemande)
    basePrompt += `\n🔎 Description détaillée :\n${detailDemande}\n`;

  basePrompt += `\n👉 Créez un contenu professionnel qui répond précisément à ces critères.\n`;

  const oproInstructions = `
🔁 Instructions OPRO :

Tu es un expert en prompt engineering. À partir du prompt ci-dessus, effectue les étapes suivantes :

1. Présente la réponse sous forme de liste à puce: une puce par prompt
2. Commence par la première puce avec le résumé du prompt original ci-dessus
3. Génère 5 variantes de prompts basés sur celui-ci.
4. Pour chaque prompt, évalue sa pertinence sur une échelle de 0 à 100.
   Critères de notation :
   - Clarté des instructions
   - Cohérence avec les critères
   - Précision des demandes
   - Capacité à guider l'IA vers un résultat optimal
5. Ajoute à la fin la commande suivante: Tu vas agir comme un expert en Prompt Engineering. En te basant sur tes connaissances, tes compétences et les prompts notés que je t'ai partagé, tu vas rédiger le prompt parfait pour cette demande.

Objectif final : identifier le meilleur prompt pour générer le contenu demandé.

Prompt de départ :
"""
${basePrompt}
"""
`;

  document.getElementById("result").textContent = oproInstructions;
}

// Génération du prompt SIMPLE pour la rédaction
function generateSimplePrompt() {
  const type = getFieldValue("redac-type-select", "redac-type-custom");
  const objectif = getFieldValue(
    "redac-objectif-select",
    "redac-objectif-custom"
  );
  const publicCible = getFieldValue(
    "redac-public-select",
    "redac-public-custom"
  );
  const ton = getFieldValue("redac-ton-select", "redac-ton-custom");
  const langue = getFieldValue("redac-langue-select", "redac-langue-custom");
  const format = getFieldValue("redac-format-select", "redac-format-custom");
  const angle = getFieldValue("redac-angle-select", "redac-angle-custom");
  const longueur = getFieldValue(
    "redac-longueur-select",
    "redac-longueur-custom"
  );
  const structure = getFieldValue(
    "redac-structure-select",
    "redac-structure-custom"
  );
  const seo = document.getElementById("redac-seo-custom").value.trim();
  const cta = getFieldValue("redac-cta-select", "redac-cta-custom");
  const sources = getFieldValue("redac-sources-select", "redac-sources-custom");
  const detailDemande = document.getElementById("detail-demande").value.trim();

  let simplePrompt =
    "Tu es un rédacteur professionnel expert avec 15 ans d'expérience. ";

  simplePrompt += "Voici ma demande de rédaction :\n\n";

  if (type) simplePrompt += `• Type de contenu : ${type}\n`;
  if (objectif) simplePrompt += `• Objectif principal : ${objectif}\n`;
  if (publicCible) simplePrompt += `• Public cible : ${publicCible}\n`;
  if (ton) simplePrompt += `• Ton / Style : ${ton}\n`;
  if (langue) simplePrompt += `• Langue : ${langue}\n`;
  if (format) simplePrompt += `• Format souhaité : ${format}\n`;
  if (angle) simplePrompt += `• Angle / Approche : ${angle}\n`;
  if (longueur) simplePrompt += `• Longueur ciblée : ${longueur}\n`;
  if (structure) simplePrompt += `• Structure : ${structure}\n`;
  if (seo) simplePrompt += `• SEO / Mots-clés : ${seo}\n`;
  if (cta) simplePrompt += `• Call-to-Action : ${cta}\n`;
  if (sources) simplePrompt += `• Sources / Références : ${sources}\n`;

  if (detailDemande) {
    simplePrompt += `\nDétails de la demande :\n${detailDemande}\n`;
  }

  simplePrompt += `\nAttentes :`;
  simplePrompt += `\n- Contenu structuré et professionnel adapté au public cible`;
  simplePrompt += `\n- Respect du ton et du format demandés`;
  simplePrompt += `\n- Qualité rédactionnelle irréprochable`;
  simplePrompt += `\n- Contenu pertinent et engageant`;

  document.getElementById("result").textContent = simplePrompt;
}

// Génération du prompt pour l'image
function generateImagePrompt() {
  const type = getFieldValue("img-type-select", "img-type-custom");
  const style = getFieldValue("img-style-select", "img-style-custom");
  const couleurs = getFieldValue("img-couleurs-select", "img-couleurs-custom");
  const eclairage = getFieldValue(
    "img-eclairage-select",
    "img-eclairage-custom"
  );
  const ambiance = getFieldValue("img-ambiance-select", "img-ambiance-custom");
  const format = getFieldValue("img-format-select", "img-format-custom");
  const detail = getFieldValue("img-detail-select", "img-detail-custom");
  const inspiration = getFieldValue(
    "img-inspiration-select",
    "img-inspiration-custom"
  );
  const sujet = document.getElementById("img-sujet-custom").value.trim();
  const composition = getFieldValue(
    "img-composition-select",
    "img-composition-custom"
  );
  const contexte = getFieldValue("img-contexte-select", "img-contexte-custom");
  const elements = document.getElementById("img-elements-custom").value.trim();
  const qualite = getFieldValue("img-qualite-select", "img-qualite-custom");
  const detailDemande = document
    .getElementById("detail-demande-image")
    .value.trim();

  let basePrompt = "Voici ma demande structurée pour générer une image :\n\n";
  if (type) basePrompt += `• Type d'image : ${type}\n`;
  if (style) basePrompt += `• Style artistique : ${style}\n`;
  if (couleurs) basePrompt += `• Palette de couleurs : ${couleurs}\n`;
  if (eclairage) basePrompt += `• Éclairage : ${eclairage}\n`;
  if (ambiance) basePrompt += `• Ambiance / Mood : ${ambiance}\n`;
  if (format) basePrompt += `• Format / Ratio : ${format}\n`;
  if (detail) basePrompt += `• Niveau de détail : ${detail}\n`;
  if (inspiration) basePrompt += `• Inspiration / Référence : ${inspiration}\n`;
  if (sujet) basePrompt += `• Sujet principal : ${sujet}\n`;
  if (composition) basePrompt += `• Composition : ${composition}\n`;
  if (contexte) basePrompt += `• Contexte / Lieu : ${contexte}\n`;
  if (elements) basePrompt += `• Éléments secondaires : ${elements}\n`;
  if (qualite) basePrompt += `• Qualité / Résolution : ${qualite}\n`;
  if (detailDemande)
    basePrompt += `\n🔎 Description détaillée :\n${detailDemande}\n`;

  basePrompt += `\n👉 Créez une image qui correspond précisément à ces spécifications.\n`;

  const oproInstructions = `
🔁 Instructions OPRO :

Tu es un expert en prompt engineering pour la génération d'images IA. À partir du prompt ci-dessus, effectue les étapes suivantes :

1. Présente la réponse sous forme de liste à puce: une puce par prompt
2. Commence par la première puce avec le résumé du prompt original ci-dessus
3. Génère 5 variantes de prompts basés sur celui-ci.
4. Pour chaque prompt, évalue sa pertinence sur une échelle de 0 à 100.
   Critères de notation :
   - Clarté de la description visuelle
   - Cohérence avec le style demandé
   - Précision des détails techniques
   - Capacité à guider l'IA vers l'image souhaitée
5. Ajoute à la fin la commande suivante: Tu vas agir comme un expert en Prompt Engineering spécialisé dans la génération d'images. En te basant sur tes connaissances, tes compétences et les prompts notés que je t'ai partagé, tu vas rédiger le prompt parfait pour générer cette image.

Objectif final : identifier le meilleur prompt pour créer l'image demandée.

Prompt de départ :
"""
${basePrompt}
"""
`;

  document.getElementById("result-image").textContent = oproInstructions;
}

// Génération du prompt SIMPLE pour l'image
function generateSimpleImagePrompt() {
  const type = getFieldValue("img-type-select", "img-type-custom");
  const style = getFieldValue("img-style-select", "img-style-custom");
  const couleurs = getFieldValue("img-couleurs-select", "img-couleurs-custom");
  const eclairage = getFieldValue(
    "img-eclairage-select",
    "img-eclairage-custom"
  );
  const ambiance = getFieldValue("img-ambiance-select", "img-ambiance-custom");
  const format = getFieldValue("img-format-select", "img-format-custom");
  const detail = getFieldValue("img-detail-select", "img-detail-custom");
  const inspiration = getFieldValue(
    "img-inspiration-select",
    "img-inspiration-custom"
  );
  const sujet = document.getElementById("img-sujet-custom").value.trim();
  const composition = getFieldValue(
    "img-composition-select",
    "img-composition-custom"
  );
  const contexte = getFieldValue("img-contexte-select", "img-contexte-custom");
  const elements = document.getElementById("img-elements-custom").value.trim();
  const qualite = getFieldValue("img-qualite-select", "img-qualite-custom");
  const detailDemande = document
    .getElementById("detail-demande-image")
    .value.trim();

  let simplePrompt =
    "Tu es un expert en génération d'images IA et en design visuel. ";

  simplePrompt += "Créez une image avec ces spécifications :\n\n";

  if (type) simplePrompt += `• Type d'image : ${type}\n`;
  if (style) simplePrompt += `• Style artistique : ${style}\n`;
  if (couleurs) simplePrompt += `• Palette de couleurs : ${couleurs}\n`;
  if (eclairage) simplePrompt += `• Éclairage : ${eclairage}\n`;
  if (ambiance) simplePrompt += `• Ambiance / Mood : ${ambiance}\n`;
  if (format) simplePrompt += `• Format / Ratio : ${format}\n`;
  if (detail) simplePrompt += `• Niveau de détail : ${detail}\n`;
  if (inspiration)
    simplePrompt += `• Inspiration / Référence : ${inspiration}\n`;
  if (sujet) simplePrompt += `• Sujet principal : ${sujet}\n`;
  if (composition) simplePrompt += `• Composition : ${composition}\n`;
  if (contexte) simplePrompt += `• Contexte / Lieu : ${contexte}\n`;
  if (elements) simplePrompt += `• Éléments secondaires : ${elements}\n`;
  if (qualite) simplePrompt += `• Qualité / Résolution : ${qualite}\n`;

  if (detailDemande) {
    simplePrompt += `\nDescription de l'image souhaitée :\n${detailDemande}\n`;
  }

  simplePrompt += `\nCritères de qualité :`;
  simplePrompt += `\n- Composition harmonieuse et équilibrée`;
  simplePrompt += `\n- Cohérence stylistique`;
  simplePrompt += `\n- Qualité professionnelle`;
  simplePrompt += `\n- Impact visuel fort`;

  document.getElementById("result-image").textContent = simplePrompt;
}

// Génération du prompt pour le voyage
function generateVoyagePrompt() {
  const destination = document
    .getElementById("voyage-destination-custom")
    .value.trim();
  const objectif = getFieldValue(
    "voyage-objectif-select",
    "voyage-objectif-custom"
  );
  const type = getFieldValue("voyage-type-select", "voyage-type-custom");
  const voyageurs = getFieldValue(
    "voyage-voyageurs-select",
    "voyage-voyageurs-custom"
  );
  const duree = getFieldValue("voyage-duree-select", "voyage-duree-custom");
  const budget = getFieldValue("voyage-budget-select", "voyage-budget-custom");
  const saison = getFieldValue("voyage-saison-select", "voyage-saison-custom");
  const contraintes = getFieldValue(
    "voyage-contraintes-select",
    "voyage-contraintes-custom"
  );
  const style = getFieldValue("voyage-style-select", "voyage-style-custom");
  const references = getFieldValue(
    "voyage-references-select",
    "voyage-references-custom"
  );
  const activites = getFieldValue(
    "voyage-activites-select",
    "voyage-activites-custom"
  );
  const hebergement = getFieldValue(
    "voyage-hebergement-select",
    "voyage-hebergement-custom"
  );
  const transport = getFieldValue(
    "voyage-transport-select",
    "voyage-transport-custom"
  );
  const interets = getFieldValue(
    "voyage-interets-select",
    "voyage-interets-custom"
  );
  const detailDemande = document
    .getElementById("detail-demande-voyage")
    .value.trim();

  let basePrompt =
    "Voici ma demande structurée pour planifier mon voyage :\n\n";
  if (destination) basePrompt += `• Destination : ${destination}\n`;
  if (objectif) basePrompt += `• Objectif du voyage : ${objectif}\n`;
  if (type) basePrompt += `• Type de voyage : ${type}\n`;
  if (voyageurs) basePrompt += `• Nombre de voyageurs : ${voyageurs}\n`;
  if (duree) basePrompt += `• Durée : ${duree}\n`;
  if (budget) basePrompt += `• Budget : ${budget}\n`;
  if (saison) basePrompt += `• Saison / Période : ${saison}\n`;
  if (contraintes) basePrompt += `• Contraintes : ${contraintes}\n`;
  if (style) basePrompt += `• Style de réponse : ${style}\n`;
  if (references) basePrompt += `• Références / Inspirations : ${references}\n`;
  if (activites) basePrompt += `• Activités souhaitées : ${activites}\n`;
  if (hebergement) basePrompt += `• Type d'hébergement : ${hebergement}\n`;
  if (transport) basePrompt += `• Mode de transport : ${transport}\n`;
  if (interets) basePrompt += `• Centres d'intérêt : ${interets}\n`;
  if (detailDemande)
    basePrompt += `\n🔎 Informations complémentaires :\n${detailDemande}\n`;

  basePrompt += `\n👉 Créez un plan de voyage détaillé, pratique et personnalisé selon ces critères.\n`;

  const oproInstructions = `
🔁 Instructions OPRO :

Tu es un expert en prompt engineering pour la planification de voyages. À partir du prompt ci-dessus, effectue les étapes suivantes :

1. Présente la réponse sous forme de liste à puce: une puce par prompt
2. Commence par la première puce avec le résumé du prompt original ci-dessus
3. Génère 5 variantes de prompts basés sur celui-ci.
4. Pour chaque prompt, évalue sa pertinence sur une échelle de 0 à 100.
   Critères de notation :
   - Clarté des instructions voyage
   - Cohérence avec les contraintes
   - Précision des demandes
   - Capacité à guider l'IA vers un plan voyage utile
5. Ajoute à la fin la commande suivante: Tu vas agir comme un expert en Prompt Engineering spécialisé dans la planification de voyages. En te basant sur tes connaissances, tes compétences et les prompts notés que je t'ai partagé, tu vas rédiger le prompt parfait pour l'IA voyage.

Objectif final : identifier le meilleur prompt pour planifier le voyage demandé.

Prompt de départ :
"""
${basePrompt}
"""
`;

  document.getElementById("result-voyage").textContent = oproInstructions;
}

// Génération du prompt SIMPLE pour le voyage
function generateSimpleVoyagePrompt() {
  const destination = document
    .getElementById("voyage-destination-custom")
    .value.trim();
  const objectif = getFieldValue(
    "voyage-objectif-select",
    "voyage-objectif-custom"
  );
  const type = getFieldValue("voyage-type-select", "voyage-type-custom");
  const voyageurs = getFieldValue(
    "voyage-voyageurs-select",
    "voyage-voyageurs-custom"
  );
  const duree = getFieldValue("voyage-duree-select", "voyage-duree-custom");
  const budget = getFieldValue("voyage-budget-select", "voyage-budget-custom");
  const saison = getFieldValue("voyage-saison-select", "voyage-saison-custom");
  const contraintes = getFieldValue(
    "voyage-contraintes-select",
    "voyage-contraintes-custom"
  );
  const style = getFieldValue("voyage-style-select", "voyage-style-custom");
  const references = getFieldValue(
    "voyage-references-select",
    "voyage-references-custom"
  );
  const activites = getFieldValue(
    "voyage-activites-select",
    "voyage-activites-custom"
  );
  const hebergement = getFieldValue(
    "voyage-hebergement-select",
    "voyage-hebergement-custom"
  );
  const transport = getFieldValue(
    "voyage-transport-select",
    "voyage-transport-custom"
  );
  const interets = getFieldValue(
    "voyage-interets-select",
    "voyage-interets-custom"
  );
  const detailDemande = document
    .getElementById("detail-demande-voyage")
    .value.trim();

  let simplePrompt =
    "Tu es un expert tour operator et conseiller en voyages avec 20 ans d'expérience. ";

  simplePrompt +=
    "Créez-moi un plan de voyage complet et détaillé avec les critères suivants :\n\n";

  if (destination) simplePrompt += `• Destination : ${destination}\n`;
  if (objectif) simplePrompt += `• Objectif du voyage : ${objectif}\n`;
  if (type) simplePrompt += `• Type de voyage : ${type}\n`;
  if (voyageurs) simplePrompt += `• Voyageurs : ${voyageurs}\n`;
  if (duree) simplePrompt += `• Durée : ${duree}\n`;
  if (budget) simplePrompt += `• Budget : ${budget}\n`;
  if (saison) simplePrompt += `• Période : ${saison}\n`;
  if (contraintes)
    simplePrompt += `• Contraintes particulières : ${contraintes}\n`;
  if (references)
    simplePrompt += `• Références / Inspirations : ${references}\n`;
  if (activites) simplePrompt += `• Activités souhaitées : ${activites}\n`;
  if (hebergement) simplePrompt += `• Type d'hébergement : ${hebergement}\n`;
  if (transport) simplePrompt += `• Mode de transport : ${transport}\n`;
  if (interets) simplePrompt += `• Centres d'intérêt : ${interets}\n`;

  if (detailDemande) {
    simplePrompt += `\nInformations complémentaires :\n${detailDemande}\n`;
  }

  simplePrompt += `\nVeuillez inclure dans votre proposition :`;
  simplePrompt += `\n- Un itinéraire ${
    style || "détaillé"
  } adapté à mes critères`;
  simplePrompt += `\n- Des recommandations d'hébergement en accord avec mon budget`;
  simplePrompt += `\n- Des suggestions d'activités et de sites à visiter`;
  simplePrompt += `\n- Des conseils pratiques (transport, restauration, budget estimatif)`;
  simplePrompt += `\n- Des alternatives et options en cas d'imprévu`;

  document.getElementById("result-voyage").textContent = simplePrompt;
}

// Fonction pour basculer le champ détaillé du code
function toggleDetailTextCode() {
  const textarea = document.getElementById("detail-demande-code");
  if (textarea.style.display === "none" || textarea.style.display === "") {
    textarea.style.display = "block";
  } else {
    textarea.style.display = "none";
  }
}

// Génération du prompt OPRO pour le code
function generateCodePrompt() {
  const objectif = getFieldValue("objectif-select-code", "objectif-text-code");
  const role = getFieldValue("role-select-code", "role-text-code");
  const langage = getFieldValue("langage-select-code", "langage-text-code");
  const projet = getFieldValue("projet-select-code", "projet-text-code");
  const contraintes = getFieldValue(
    "contraintes-select-code",
    "contraintes-text-code"
  );
  const fichiers = getFieldValue("fichiers-select-code", "fichiers-text-code");
  const format = getFieldValue("format-select-code", "format-text-code");
  const niveau = getFieldValue("niveau-select-code", "niveau-text-code");
  const detailDemande = document
    .getElementById("detail-demande-code")
    .value.trim();

  let basePrompt = "Voici ma demande structurée pour générer du code :\n\n";
  if (role) basePrompt += `• Rôle : ${role}\n`;
  if (objectif) basePrompt += `• Objectif : ${objectif}\n`;
  if (langage) basePrompt += `• Langage : ${langage}\n`;
  if (projet) basePrompt += `• Type de projet : ${projet}\n`;
  if (contraintes) basePrompt += `• Contraintes : ${contraintes}\n`;
  if (fichiers) basePrompt += `• Fichiers joints : ${fichiers}\n`;
  if (format) basePrompt += `• Format de sortie : ${format}\n`;
  if (niveau) basePrompt += `• Niveau d'expertise : ${niveau}\n`;
  if (detailDemande)
    basePrompt += `\n🔎 Description détaillée :\n${detailDemande}\n`;

  basePrompt += `\n👉 Génère un code professionnel, optimisé et maintenable selon ces critères.\n`;

  const oproInstructions = `
🔁 Instructions OPRO :

Tu es un expert en prompt engineering pour le développement logiciel. À partir du prompt ci-dessus, effectue les étapes suivantes :

1. Présente la réponse sous forme de liste à puce: une puce par prompt
2. Commence par la première puce avec le résumé du prompt original ci-dessus
3. Génère 5 variantes de prompts basés sur celui-ci.
4. Pour chaque prompt, évalue sa pertinence sur une échelle de 0 à 100.
   Critères de notation :
   - Clarté des instructions techniques
   - Cohérence avec les contraintes
   - Précision des spécifications
   - Capacité à guider l'IA vers un code optimal
5. Ajoute à la fin la commande suivante: Tu vas agir comme un expert en Prompt Engineering spécialisé dans le développement logiciel. En te basant sur tes connaissances, tes compétences et les prompts notés que je t'ai partagé, tu vas rédiger le prompt parfait pour générer ce code.

Objectif final : identifier le meilleur prompt pour générer le code demandé.

Prompt de départ :
"""
${basePrompt}
"""
`;

  document.getElementById("result-code").textContent = oproInstructions;
}

// Génération du prompt SIMPLE pour le code
function generateSimpleCodePrompt() {
  const objectif = getFieldValue("objectif-select-code", "objectif-text-code");
  const role = getFieldValue("role-select-code", "role-text-code");
  const langage = getFieldValue("langage-select-code", "langage-text-code");
  const projet = getFieldValue("projet-select-code", "projet-text-code");
  const contraintes = getFieldValue(
    "contraintes-select-code",
    "contraintes-text-code"
  );
  const fichiers = getFieldValue("fichiers-select-code", "fichiers-text-code");
  const format = getFieldValue("format-select-code", "format-text-code");
  const niveau = getFieldValue("niveau-select-code", "niveau-text-code");
  const detailDemande = document
    .getElementById("detail-demande-code")
    .value.trim();

  let simplePrompt = "";

  if (role) {
    simplePrompt += `${role}. `;
  } else {
    simplePrompt += "Tu es un développeur expert avec 10+ ans d'expérience. ";
  }

  simplePrompt += "Voici ma demande de développement :\n\n";

  if (objectif) simplePrompt += `• Objectif : ${objectif}\n`;
  if (langage) simplePrompt += `• Langage/Techno : ${langage}\n`;
  if (projet) simplePrompt += `• Type de projet : ${projet}\n`;
  if (contraintes) simplePrompt += `• Contraintes : ${contraintes}\n`;
  if (niveau) simplePrompt += `• Mon niveau : ${niveau}\n`;

  if (detailDemande) {
    simplePrompt += `\nSpécifications détaillées :\n${detailDemande}\n`;
  }

  if (fichiers && fichiers !== "Aucun fichier joint") {
    simplePrompt += `\n${fichiers}\n`;
  }

  simplePrompt += `\nAttentes pour le code :`;
  simplePrompt += `\n- Code propre, commenté et bien structuré`;
  simplePrompt += `\n- Respect des best practices`;
  simplePrompt += `\n- Gestion d'erreurs robuste`;
  simplePrompt += `\n- Explications des parties complexes`;

  if (format) {
    simplePrompt += `\n\nFormat de réponse souhaité : ${format}`;
  }

  document.getElementById("result-code").textContent = simplePrompt;
}

// Fonction de copie pour le code
function copyCodeToClipboard() {
  const resultText = document.getElementById("result-code").textContent;
  if (resultText.trim() === "") {
    alert(
      "Veuillez d'abord générer un prompt en sélectionnant des options et en cliquant sur 'Générer le Prompt'"
    );
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(resultText)
      .then(() => {
        const copyButton = document.getElementById("copyButtonCode");
        copyButton.textContent = "Copié ✓";
        setTimeout(() => {
          copyButton.textContent = "📋 Copier dans le presse-papier";
        }, 2000);
      })
      .catch((err) => {
        console.error("Erreur lors de la copie: ", err);
        fallbackCopyToClipboard(resultText);
      });
  } else {
    fallbackCopyToClipboard(resultText);
  }
}

// Fonction de réinitialisation pour le code
function resetCodeForm() {
  document.getElementById("objectif-select-code").selectedIndex = 0;
  document.getElementById("role-select-code").selectedIndex = 0;
  document.getElementById("langage-select-code").selectedIndex = 0;
  document.getElementById("projet-select-code").selectedIndex = 0;
  document.getElementById("contraintes-select-code").selectedIndex = 0;
  document.getElementById("fichiers-select-code").selectedIndex = 0;
  document.getElementById("format-select-code").selectedIndex = 0;
  document.getElementById("niveau-select-code").selectedIndex = 0;
  document.getElementById("detail-demande-code").value = "";
  document.getElementById("result-code").textContent = "";
}

// ========================================
// FONCTIONS POUR L'ONGLET APPLICATION
// ========================================

// Génération du prompt OPRO pour l'application
function generateAppPrompt() {
  const type = getFieldValue("type-select-app", "type-text-app");
  const stack = getFieldValue("stack-select-app", "stack-text-app");
  const platform = getFieldValue("platform-select-app", "platform-text-app");
  const fonction = getFieldValue("fonction-select-app", "fonction-text-app");
  const archi = getFieldValue("archi-select-app", "archi-text-app");
  const data = getFieldValue("data-select-app", "data-text-app");
  const auth = getFieldValue("auth-select-app", "auth-text-app");
  const design = getFieldValue("design-select-app", "design-text-app");
  const a11y = getFieldValue("a11y-select-app", "a11y-text-app");
  const features = getFieldValue("features-select-app", "features-text-app");
  const perf = getFieldValue("perf-select-app", "perf-text-app");
  const tests = getFieldValue("tests-select-app", "tests-text-app");
  const livrables = getFieldValue("livrables-select-app", "livrables-text-app");
  const contraintes = getFieldValue(
    "contraintes-select-app",
    "contraintes-text-app"
  );
  const publicCible = getFieldValue("public-select-app", "public-text-app");
  const detailDemande = document
    .getElementById("detail-demande-app")
    .value.trim();

  let basePrompt =
    "Voici ma demande structurée pour créer une application :\n\n";

  if (type) basePrompt += `• Type d'application : ${type}\n`;
  if (stack) basePrompt += `• Stack technique : ${stack}\n`;
  if (platform) basePrompt += `• Plateforme(s) cible : ${platform}\n`;
  if (fonction) basePrompt += `• Fonction principale : ${fonction}\n`;
  if (archi) basePrompt += `• Architecture : ${archi}\n`;
  if (data) basePrompt += `• Gestion des données : ${data}\n`;
  if (auth) basePrompt += `• Authentification : ${auth}\n`;
  if (design) basePrompt += `• Design System : ${design}\n`;
  if (a11y) basePrompt += `• Accessibilité : ${a11y}\n`;
  if (features) basePrompt += `• Features UI/UX : ${features}\n`;
  if (perf) basePrompt += `• Performance : ${perf}\n`;
  if (tests) basePrompt += `• Tests et Qualité : ${tests}\n`;
  if (livrables) basePrompt += `• Livrables attendus : ${livrables}\n`;
  if (contraintes) basePrompt += `• Contraintes : ${contraintes}\n`;
  if (publicCible) basePrompt += `• Public cible : ${publicCible}\n`;

  if (detailDemande) {
    basePrompt += `\n🔎 Description détaillée de l'application :\n${detailDemande}\n`;
  }

  basePrompt += `\n👉 Créez une application professionnelle, complète et prête à l'emploi selon ces spécifications.\n`;

  const oproInstructions = `
🔁 Instructions OPRO :

Tu es un expert en prompt engineering pour la création d'applications. À partir du prompt ci-dessus, effectue les étapes suivantes :

1. Présente la réponse sous forme de liste à puce: une puce par prompt
2. Commence par la première puce avec le résumé du prompt original ci-dessus
3. Génère 5 variantes de prompts basés sur celui-ci, en optimisant pour :
   - La clarté de l'architecture et des exigences techniques
   - La précision des spécifications UI/UX
   - La complétude des livrables (structure + code + docs)
   - L'adéquation avec le stack technique choisi
   - La qualité et maintenabilité du code produit
4. Pour chaque prompt, évalue sa pertinence sur une échelle de 0 à 100.
   Critères de notation :
   - Clarté des spécifications techniques
   - Cohérence de l'architecture proposée
   - Complétude des exigences (fonctionnelles, UI/UX, qualité)
   - Précision des contraintes et des livrables
   - Capacité à guider l'IA vers une application production-ready
5. Ajoute à la fin la commande suivante: Tu vas agir comme un Architecte Logiciel Senior & Expert Full-Stack. En te basant sur tes connaissances approfondies en développement d'applications, architecture logicielle, UI/UX et les prompts notés que je t'ai partagé, tu vas rédiger le prompt PARFAIT pour créer cette application. Le prompt doit être exhaustif, structuré et permettre de générer une application complète et professionnelle.

Objectif final : identifier le meilleur prompt pour créer l'application demandée avec une qualité production-ready.

Prompt de départ :
"""
${basePrompt}
"""
`;

  document.getElementById("result-app").textContent = oproInstructions;
}

// Génération du prompt SIMPLE pour l'application
function generateSimpleAppPrompt() {
  const type = getFieldValue("type-select-app", "type-text-app");
  const stack = getFieldValue("stack-select-app", "stack-text-app");
  const platform = getFieldValue("platform-select-app", "platform-text-app");
  const fonction = getFieldValue("fonction-select-app", "fonction-text-app");
  const archi = getFieldValue("archi-select-app", "archi-text-app");
  const data = getFieldValue("data-select-app", "data-text-app");
  const auth = getFieldValue("auth-select-app", "auth-text-app");
  const design = getFieldValue("design-select-app", "design-text-app");
  const a11y = getFieldValue("a11y-select-app", "a11y-text-app");
  const features = getFieldValue("features-select-app", "features-text-app");
  const perf = getFieldValue("perf-select-app", "perf-text-app");
  const tests = getFieldValue("tests-select-app", "tests-text-app");
  const livrables = getFieldValue("livrables-select-app", "livrables-text-app");
  const contraintes = getFieldValue(
    "contraintes-select-app",
    "contraintes-text-app"
  );
  const publicCible = getFieldValue("public-select-app", "public-text-app");
  const detailDemande = document
    .getElementById("detail-demande-app")
    .value.trim();

  let simplePrompt =
    "Rôle : Tu es un Architecte Logiciel Senior avec 15+ ans d'expérience en développement front-end, back-end, mobile et UI/UX design. Tu maîtrises parfaitement les frameworks modernes, les principes d'architecture logicielle et les best practices de développement.\n\n";

  simplePrompt +=
    "Mission : Créer une application complète selon les spécifications suivantes.\n\n";

  simplePrompt += "📋 SPÉCIFICATIONS DE L'APPLICATION\n\n";

  if (type) simplePrompt += `Type : ${type}\n`;
  if (stack) simplePrompt += `Stack technique : ${stack}\n`;
  if (platform) simplePrompt += `Plateforme(s) : ${platform}\n`;
  if (fonction) simplePrompt += `Fonction principale : ${fonction}\n`;
  if (publicCible) simplePrompt += `Public cible : ${publicCible}\n`;

  if (detailDemande) {
    simplePrompt += `\nDescription de l'application :\n${detailDemande}\n`;
  }

  simplePrompt += "\n🏗️ ARCHITECTURE & TECHNIQUE\n\n";
  if (archi) simplePrompt += `Architecture : ${archi}\n`;
  if (data) simplePrompt += `Gestion des données : ${data}\n`;
  if (auth) simplePrompt += `Authentification : ${auth}\n`;

  simplePrompt += "\n🎨 DESIGN & UX\n\n";
  if (design) simplePrompt += `Design System : ${design}\n`;
  if (a11y) simplePrompt += `Accessibilité : ${a11y}\n`;
  if (features) simplePrompt += `Features UI/UX : ${features}\n`;

  simplePrompt += "\n⚡ PERFORMANCE & QUALITÉ\n\n";
  if (perf) simplePrompt += `Performance : ${perf}\n`;
  if (tests) simplePrompt += `Tests : ${tests}\n`;

  if (contraintes) {
    simplePrompt += `\n⚠️ Contraintes : ${contraintes}\n`;
  }

  simplePrompt += "\n📦 LIVRABLES ATTENDUS\n\n";
  if (livrables) {
    simplePrompt += `${livrables}\n`;
  } else {
    simplePrompt += "- Arborescence complète du projet\n";
    simplePrompt += "- Code source complet et commenté\n";
    simplePrompt += "- README avec instructions de lancement\n";
    simplePrompt += "- Fichiers de configuration nécessaires\n";
  }

  simplePrompt += "\n✅ CRITÈRES DE QUALITÉ\n\n";
  simplePrompt += "- Code propre, modulaire et maintenable\n";
  simplePrompt += "- Respect des best practices et conventions\n";
  simplePrompt += "- Documentation claire et complète\n";
  simplePrompt += "- Interface utilisateur intuitive et responsive\n";
  simplePrompt += "- Gestion d'erreurs robuste\n";
  simplePrompt += "- Application prête pour la production\n";

  if (stack && stack.includes("vanilla")) {
    simplePrompt +=
      "\n⚠️ IMPORTANT : Utilise uniquement du code vanilla (HTML/CSS/JavaScript pur) sans framework ni dépendance externe, sauf si absolument nécessaire et justifié.\n";
  }

  document.getElementById("result-app").textContent = simplePrompt;
}

// Fonction de copie pour l'application
function copyAppToClipboard() {
  const resultText = document.getElementById("result-app").textContent;
  if (resultText.trim() === "") {
    alert(
      "Veuillez d'abord générer un prompt en sélectionnant des options et en cliquant sur 'Générer le Prompt'"
    );
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(resultText)
      .then(() => {
        const copyButton = document.getElementById("copyButtonApp");
        copyButton.textContent = "Copié ✓";
        setTimeout(() => {
          copyButton.textContent = "📋 Copier dans le presse-papier";
        }, 2000);
      })
      .catch((err) => {
        console.error("Erreur lors de la copie: ", err);
        fallbackCopyToClipboard(resultText);
      });
  } else {
    fallbackCopyToClipboard(resultText);
  }
}

// Fonction de réinitialisation pour l'onglet Rédaction
function resetForm() {
  document.getElementById("redac-type-select").selectedIndex = 0;
  document.getElementById("redac-objectif-select").selectedIndex = 0;
  document.getElementById("redac-public-select").selectedIndex = 0;
  document.getElementById("redac-ton-select").selectedIndex = 0;
  document.getElementById("redac-langue-select").selectedIndex = 0;
  document.getElementById("redac-format-select").selectedIndex = 0;
  document.getElementById("redac-angle-select").selectedIndex = 0;
  document.getElementById("redac-longueur-select").selectedIndex = 0;
  document.getElementById("redac-structure-select").selectedIndex = 0;
  document.getElementById("redac-cta-select").selectedIndex = 0;
  document.getElementById("redac-sources-select").selectedIndex = 0;

  const customs = [
    "redac-type-custom",
    "redac-objectif-custom",
    "redac-public-custom",
    "redac-ton-custom",
    "redac-langue-custom",
    "redac-format-custom",
    "redac-angle-custom",
    "redac-longueur-custom",
    "redac-structure-custom",
    "redac-cta-custom",
    "redac-sources-custom",
    "redac-seo-custom",
  ];
  customs.forEach((id) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.value = "";
      elem.style.display = "none";
    }
  });

  document.getElementById("detail-demande").value = "";
  document.getElementById("result").textContent = "";
}

// Fonction de réinitialisation pour l'onglet Génération d'images
function resetImageForm() {
  document.getElementById("img-type-select").selectedIndex = 0;
  document.getElementById("img-style-select").selectedIndex = 0;
  document.getElementById("img-couleurs-select").selectedIndex = 0;
  document.getElementById("img-eclairage-select").selectedIndex = 0;
  document.getElementById("img-ambiance-select").selectedIndex = 0;
  document.getElementById("img-format-select").selectedIndex = 0;
  document.getElementById("img-detail-select").selectedIndex = 0;
  document.getElementById("img-inspiration-select").selectedIndex = 0;
  document.getElementById("img-composition-select").selectedIndex = 0;
  document.getElementById("img-contexte-select").selectedIndex = 0;
  document.getElementById("img-qualite-select").selectedIndex = 0;

  const customs = [
    "img-type-custom",
    "img-style-custom",
    "img-couleurs-custom",
    "img-eclairage-custom",
    "img-ambiance-custom",
    "img-format-custom",
    "img-detail-custom",
    "img-inspiration-custom",
    "img-composition-custom",
    "img-contexte-custom",
    "img-qualite-custom",
  ];
  customs.forEach((id) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.value = "";
      elem.style.display = "none";
    }
  });

  document.getElementById("detail-demande-image").value = "";
  document.getElementById("result-image").textContent = "";
}

// Fonction de réinitialisation pour l'onglet Planification voyage
function resetVoyageForm() {
  document.getElementById("voyage-objectif-select").selectedIndex = 0;
  document.getElementById("voyage-type-select").selectedIndex = 0;
  document.getElementById("voyage-voyageurs-select").selectedIndex = 0;
  document.getElementById("voyage-duree-select").selectedIndex = 0;
  document.getElementById("voyage-budget-select").selectedIndex = 0;
  document.getElementById("voyage-saison-select").selectedIndex = 0;
  document.getElementById("voyage-contraintes-select").selectedIndex = 0;
  document.getElementById("voyage-style-select").selectedIndex = 0;
  document.getElementById("voyage-references-select").selectedIndex = 0;
  document.getElementById("voyage-activites-select").selectedIndex = 0;
  document.getElementById("voyage-hebergement-select").selectedIndex = 0;
  document.getElementById("voyage-transport-select").selectedIndex = 0;
  document.getElementById("voyage-interets-select").selectedIndex = 0;

  const customs = [
    "voyage-objectif-custom",
    "voyage-type-custom",
    "voyage-voyageurs-custom",
    "voyage-duree-custom",
    "voyage-budget-custom",
    "voyage-saison-custom",
    "voyage-contraintes-custom",
    "voyage-style-custom",
    "voyage-references-custom",
    "voyage-activites-custom",
    "voyage-hebergement-custom",
    "voyage-transport-custom",
    "voyage-interets-custom",
  ];
  customs.forEach((id) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.value = "";
      elem.style.display = "none";
    }
  });

  document.getElementById("detail-demande-voyage").value = "";
  document.getElementById("result-voyage").textContent = "";
}

// Fonction de réinitialisation pour l'onglet Génération de Code
function resetCodeForm() {
  document.getElementById("objectif-select-code").selectedIndex = 0;
  document.getElementById("role-select-code").selectedIndex = 0;
  document.getElementById("langage-select-code").selectedIndex = 0;
  document.getElementById("projet-select-code").selectedIndex = 0;
  document.getElementById("contraintes-select-code").selectedIndex = 0;
  document.getElementById("fichiers-select-code").selectedIndex = 0;
  document.getElementById("format-select-code").selectedIndex = 0;
  document.getElementById("niveau-select-code").selectedIndex = 0;

  const customs = [
    "objectif-text-code",
    "role-text-code",
    "langage-text-code",
    "projet-text-code",
    "contraintes-text-code",
    "fichiers-text-code",
    "format-text-code",
    "niveau-text-code",
  ];
  customs.forEach((id) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.value = "";
      elem.style.display = "none";
    }
  });

  document.getElementById("detail-demande-code").value = "";
  document.getElementById("result-code").textContent = "";
}

// Fonction de réinitialisation pour l'onglet Génération application
function resetAppForm() {
  document.getElementById("type-select-app").selectedIndex = 0;
  document.getElementById("stack-select-app").selectedIndex = 0;
  document.getElementById("platform-select-app").selectedIndex = 0;
  document.getElementById("fonction-select-app").selectedIndex = 0;
  document.getElementById("archi-select-app").selectedIndex = 0;
  document.getElementById("data-select-app").selectedIndex = 0;
  document.getElementById("auth-select-app").selectedIndex = 0;
  document.getElementById("design-select-app").selectedIndex = 0;
  document.getElementById("a11y-select-app").selectedIndex = 0;
  document.getElementById("features-select-app").selectedIndex = 0;
  document.getElementById("perf-select-app").selectedIndex = 0;
  document.getElementById("tests-select-app").selectedIndex = 0;
  document.getElementById("livrables-select-app").selectedIndex = 0;
  document.getElementById("contraintes-select-app").selectedIndex = 0;
  document.getElementById("public-select-app").selectedIndex = 0;

  const customs = [
    "type-text-app",
    "stack-text-app",
    "platform-text-app",
    "fonction-text-app",
    "archi-text-app",
    "data-text-app",
    "auth-text-app",
    "design-text-app",
    "a11y-text-app",
    "features-text-app",
    "perf-text-app",
    "tests-text-app",
    "livrables-text-app",
    "contraintes-text-app",
    "public-text-app",
  ];
  customs.forEach((id) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.value = "";
      elem.style.display = "none";
    }
  });

  document.getElementById("detail-demande-app").value = "";
  document.getElementById("result-app").textContent = "";
}

function toggleInfo() {
  const infoContent = document.getElementById("infoContent");
  const toggleButton = document.querySelector(".info-toggle");
  if (infoContent.style.display === "block") {
    infoContent.style.display = "none";
    toggleButton.textContent = "Informations sur le générateur ▼";
  } else {
    infoContent.style.display = "block";
    toggleButton.textContent = "Informations sur le générateur ▲";
  }
}

// Fonctions de copie dans le presse-papier
function copyToClipboard() {
  const resultText = document.getElementById("result").textContent;
  if (resultText.trim() === "") {
    alert(
      "Veuillez d'abord générer un prompt en sélectionnant des options et en cliquant sur 'Générer le Prompt'"
    );
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(resultText)
      .then(() => {
        const copyButton = document.getElementById("copyButton");
        copyButton.textContent = "Copié ✓";
        setTimeout(() => {
          copyButton.textContent = "📋 Copier dans le presse-papier";
        }, 2000);
      })
      .catch((err) => {
        console.error("Erreur lors de la copie: ", err);
        fallbackCopyToClipboard(resultText);
      });
  } else {
    fallbackCopyToClipboard(resultText);
  }
}

function copyImageToClipboard() {
  const resultText = document.getElementById("result-image").textContent;
  if (resultText.trim() === "") {
    alert(
      "Veuillez d'abord générer un prompt en sélectionnant des options et en cliquant sur 'Générer le Prompt'"
    );
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(resultText)
      .then(() => {
        const copyButton = document.getElementById("copyButtonImage");
        copyButton.textContent = "Copié ✓";
        setTimeout(() => {
          copyButton.textContent = "📋 Copier dans le presse-papier";
        }, 2000);
      })
      .catch((err) => {
        console.error("Erreur lors de la copie: ", err);
        fallbackCopyToClipboard(resultText);
      });
  } else {
    fallbackCopyToClipboard(resultText);
  }
}

function copyVoyageToClipboard() {
  const resultText = document.getElementById("result-voyage").textContent;
  if (resultText.trim() === "") {
    alert(
      "Veuillez d'abord générer un prompt en sélectionnant des options et en cliquant sur 'Générer le Prompt'"
    );
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(resultText)
      .then(() => {
        const copyButton = document.getElementById("copyButtonVoyage");
        copyButton.textContent = "Copié ✓";
        setTimeout(() => {
          copyButton.textContent = "📋 Copier dans le presse-papier";
        }, 2000);
      })
      .catch((err) => {
        console.error("Erreur lors de la copie: ", err);
        fallbackCopyToClipboard(resultText);
      });
  } else {
    fallbackCopyToClipboard(resultText);
  }
}

// Méthode alternative pour la copie dans le presse-papier
function fallbackCopyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    alert("Texte copié dans le presse-papier");
  } catch (err) {
    console.error("Erreur lors de la copie: ", err);
    alert("Une erreur est survenue lors de la copie");
  }
  document.body.removeChild(textarea);
}

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Configuration des onglets
  setupTabs();

  // Ajouter des écouteurs pour touchstart sur tous les boutons
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.addEventListener("touchstart", (event) => {
      event.preventDefault();
      button.click();
    });
  });

  // Gestion des champs pour l'onglet rédaction
  setupFieldHandlers([
    "redac-type",
    "redac-objectif",
    "redac-public",
    "redac-ton",
    "redac-langue",
    "redac-format",
    "redac-angle",
    "redac-longueur",
    "redac-structure",
    "redac-cta",
    "redac-sources",
  ]);

  // Gestion des champs pour l'onglet image
  setupFieldHandlers(
    [
      "img-type",
      "img-style",
      "img-couleurs",
      "img-eclairage",
      "img-ambiance",
      "img-format",
      "img-detail",
      "img-inspiration",
      "img-composition",
      "img-contexte",
      "img-qualite",
    ],
    ""
  );

  // Gestion des champs pour l'onglet voyage
  setupFieldHandlers(
    [
      "voyage-objectif",
      "voyage-type",
      "voyage-voyageurs",
      "voyage-duree",
      "voyage-budget",
      "voyage-saison",
      "voyage-contraintes",
      "voyage-style",
      "voyage-references",
      "voyage-activites",
      "voyage-hebergement",
      "voyage-transport",
      "voyage-interets",
    ],
    ""
  );

  // Gestion des champs pour l'onglet code
  setupFieldHandlers(
    [
      "objectif",
      "role",
      "langage",
      "projet",
      "contraintes",
      "fichiers",
      "format",
      "niveau",
    ],
    "-code"
  );

  // Gestion des champs pour l'onglet application
  setupFieldHandlers(
    [
      "type",
      "stack",
      "platform",
      "fonction",
      "archi",
      "data",
      "auth",
      "design",
      "a11y",
      "features",
      "perf",
      "tests",
      "livrables",
      "contraintes",
      "public",
    ],
    "-app"
  );

  // Suppression des options masquées
  document.querySelectorAll("option[hidden]").forEach((option) => {
    option.remove();
  });
});
