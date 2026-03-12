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

  // 🆕 RÉINITIALISER LES ZONES DE RÉSULTAT LORS DU CHANGEMENT D'ONGLET
  const resultIds = {
    redaction: "result",
    images: "result-image",
    voyage: "result-voyage",
    code: "result-code",
    application: "result-app",
  };

  // Vider toutes les zones de résultat sauf celle de l'onglet actif
  Object.entries(resultIds).forEach(([tab, resultId]) => {
    if (tab !== tabName) {
      const resultElement = document.getElementById(resultId);
      if (resultElement) {
        resultElement.textContent = "";
      }
    }
  });
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

// ============================================================================
// GÉNÉRATION PROMPT RÉDACTION - VERSION AMÉLIORÉE
// Implémentation : XML + Chain-of-Thought + Few-Shot + Format Strict
// ============================================================================

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
  const seo = document.getElementById("redac-seo-custom")
    ? document.getElementById("redac-seo-custom").value.trim()
    : "";
  const cta = getFieldValue("redac-cta-select", "redac-cta-custom");
  const sources = getFieldValue("redac-sources-select", "redac-sources-custom");
  const detailDemande = document.getElementById("detail-demande")
    ? document.getElementById("detail-demande").value.trim()
    : "";

  // Construction avec BALISES XML
  let basePrompt = `<demande_generation_contenu>
  <contexte>
    ${type ? `<type_contenu>${type}</type_contenu>` : ""}
    ${objectif ? `<objectif_principal>${objectif}</objectif_principal>` : ""}
    ${publicCible ? `<public_cible>${publicCible}</public_cible>` : ""}
  </contexte>
  
  <specifications>
    ${ton ? `<ton_style>${ton}</ton_style>` : ""}
    ${langue ? `<langue>${langue}</langue>` : ""}
    ${format ? `<format>${format}</format>` : ""}
    ${angle ? `<angle_approche>${angle}</angle_approche>` : ""}
    ${longueur ? `<longueur_ciblee>${longueur}</longueur_ciblee>` : ""}
    ${structure ? `<structure>${structure}</structure>` : ""}
  </specifications>
  
  ${
    seo || cta || sources
      ? `<contraintes_additionnelles>
    ${seo ? `<seo_mots_cles>${seo}</seo_mots_cles>` : ""}
    ${cta ? `<call_to_action>${cta}</call_to_action>` : ""}
    ${sources ? `<sources_references>${sources}</sources_references>` : ""}
  </contraintes_additionnelles>`
      : ""
  }
  
  ${
    detailDemande
      ? `<description_detaillee>
${detailDemande}
  </description_detaillee>`
      : ""
  }
</demande_generation_contenu>`;

  // OPRO AMÉLIORÉ avec Chain-of-Thought + Few-Shot Learning
  const oproInstructions = `<mission_optimisation_prompt>

<persona_expert>
Tu es un expert reconnu en prompt engineering avec 8+ ans d'expérience dans l'optimisation de prompts pour GPT-4, Claude et autres LLMs. Tu maîtrises les techniques avancées : Chain-of-Thought, Few-Shot Learning, et l'utilisation de balises XML pour structurer les prompts de manière hiérarchique et modulaire.
</persona_expert>

<exemples_reference>
  <exemple qualite="excellent" score="95">
    <prompt>Tu es un expert en marketing B2B avec 10 ans d'expérience. Rédige un article de blog de 1200 mots pour directeurs marketing (entreprises tech 50-200 employés) sur "L'IA transforme le lead nurturing en 2024". Ton professionnel mais accessible. Structure : intro (100 mots) + 4 sections H2 (250 mots chacune) + conclusion (150 mots). SEO : mot-clé "lead nurturing IA" (densité 1.5%), 5 statistiques 2023-2024 avec sources, 2 études de cas, CTA vers guide gratuit.</prompt>
    <raison>✅ Persona précis ✅ Public détaillé ✅ Longueur exacte ✅ Structure détaillée ✅ SEO optimisé ✅ Éléments concrets</raison>
  </exemple>
  <exemple qualite="faible" score="35">
    <prompt>Écris un article sur le marketing digital</prompt>
    <raison>❌ Aucun rôle ❌ Sujet vague ❌ Pas de public ❌ Pas de longueur ❌ Pas de structure</raison>
  </exemple>
</exemples_reference>

<methodologie_chain_of_thought>
  <etape numero="1">
    ANALYSE : Examine la demande. Identifie objectif, public, contraintes. Quels éléments manquent pour un prompt excellent ?
  </etape>
  <etape numero="2">
    GÉNÉRATION : Crée 5 variantes avec stratégies différentes :
    - Variante 1 : Focus CLARTÉ et STRUCTURE
    - Variante 2 : Focus CONTEXTE et EXEMPLES
    - Variante 3 : Focus PERSONA et TON
    - Variante 4 : Focus CONTRAINTES maximales
    - Variante 5 : Approche CRÉATIVE différente
  </etape>
  <etape numero="3">
    ÉVALUATION : Note chaque variante /100 selon :
    • Clarté (25 pts) : Instructions sans ambiguïté ?
    • Précision (25 pts) : Spécifications détaillées ?
    • Structure (25 pts) : Organisation logique ?
    • Actionnabilité (25 pts) : Directement utilisable ?
  </etape>
  <etape numero="4">
    SYNTHÈSE : Crée LE prompt optimal (95-100/100) combinant le meilleur des 5 variantes. Fournis-le d'abord en version texte brut (comme les variantes), puis en version structurée XML (en conservant la hiérarchie des balises comme dans le <prompt_utilisateur> original, mais optimisée avec les améliorations identifiées).
  </etape>
</methodologie_chain_of_thought>

<format_reponse_strict>
Pour chaque variante :

## 📋 VARIANTE [N]/5 - SCORE : [X]/100
### 🎯 Stratégie : [description]
### ✨ Prompt optimisé :
\`\`\`
[prompt complet prêt à utiliser]
\`\`\`
### 📊 Évaluation :
- Clarté : [X]/25 - [justification]
- Précision : [X]/25 - [justification]
- Structure : [X]/25 - [justification]
- Actionnabilité : [X]/25 - [justification]
**TOTAL : [X]/100**

Puis à la fin :

## 🏆 PROMPT FINAL - SCORE : [X]/100
### Version Texte Brut :
\`\`\`
[Le prompt optimal synthétisant le meilleur en texte brut]
\`\`\`
### Version XML Structurée :
\`\`\`
[Le même prompt optimal, mais reformulé en format XML hiérarchique avec balises comme <demande_generation_contenu>, <contexte>, <specifications>, etc. pour une meilleure modularité et lisibilité]
\`\`\`
### 💡 Pourquoi optimal : [explication]
</format_reponse_strict>

<prompt_utilisateur>
${basePrompt}
</prompt_utilisateur>

</mission_optimisation_prompt>`;

  document.getElementById("result").textContent = oproInstructions;
}

// Génération du prompt SIMPLE pour la rédaction (VERSION AMÉLIORÉE)
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
  const seo = document.getElementById("redac-seo-custom")
    ? document.getElementById("redac-seo-custom").value.trim()
    : "";
  const cta = getFieldValue("redac-cta-select", "redac-cta-custom");
  const sources = getFieldValue("redac-sources-select", "redac-sources-custom");
  const detailDemande = document.getElementById("detail-demande")
    ? document.getElementById("detail-demande").value.trim()
    : "";

  let simplePrompt = `<mission_redaction>
  
<persona>
Tu es un rédacteur professionnel expert avec 15 ans d'expérience. Tu maîtrises tous types de rédaction et sais adapter ton style selon le public et l'objectif.
</persona>

<demande>
  <contexte>
    ${type ? `<type>${type}</type>` : ""}
    ${objectif ? `<objectif>${objectif}</objectif>` : ""}
    ${publicCible ? `<public>${publicCible}</public>` : ""}
  </contexte>
  
  <specifications>
    ${ton ? `<ton>${ton}</ton>` : ""}
    ${langue ? `<langue>${langue}</langue>` : ""}
    ${format ? `<format>${format}</format>` : ""}
    ${angle ? `<angle>${angle}</angle>` : ""}
    ${longueur ? `<longueur>${longueur}</longueur>` : ""}
    ${structure ? `<structure>${structure}</structure>` : ""}
  </specifications>
  
  ${
    seo || cta || sources
      ? `<contraintes>
    ${seo ? `<seo>${seo}</seo>` : ""}
    ${cta ? `<cta>${cta}</cta>` : ""}
    ${sources ? `<sources>${sources}</sources>` : ""}
  </contraintes>`
      : ""
  }
  
  ${
    detailDemande
      ? `<details>
${detailDemande}
  </details>`
      : ""
  }
</demande>

<attentes>
  - Contenu structuré et professionnel adapté au public
  - Respect strict du ton et format
  - Qualité rédactionnelle irréprochable
  - Contenu pertinent et engageant
</attentes>

<livrable>
Produis directement le contenu demandé, prêt à être utilisé.
</livrable>

</mission_redaction>`;

  document.getElementById("result").textContent = simplePrompt;
}

// ============================================================================
// GÉNÉRATION PROMPT IMAGE - VERSION AMÉLIORÉE
// ============================================================================
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

  // Construction avec BALISES XML
  let basePrompt = `<demande_generation_image>
  <caracteristiques_visuelles>
    ${type ? `<type_image>${type}</type_image>` : ""}
    ${style ? `<style_artistique>${style}</style_artistique>` : ""}
    ${couleurs ? `<palette_couleurs>${couleurs}</palette_couleurs>` : ""}
    ${eclairage ? `<eclairage>${eclairage}</eclairage>` : ""}
    ${ambiance ? `<ambiance_mood>${ambiance}</ambiance_mood>` : ""}
  </caracteristiques_visuelles>
  
  <specifications_techniques>
    ${format ? `<format_ratio>${format}</format_ratio>` : ""}
    ${detail ? `<niveau_detail>${detail}</niveau_detail>` : ""}
    ${qualite ? `<qualite_resolution>${qualite}</qualite_resolution>` : ""}
  </specifications_techniques>
  
  <composition>
    ${sujet ? `<sujet_principal>${sujet}</sujet_principal>` : ""}
    ${composition ? `<type_composition>${composition}</type_composition>` : ""}
    ${contexte ? `<contexte_lieu>${contexte}</contexte_lieu>` : ""}
    ${
      elements ? `<elements_secondaires>${elements}</elements_secondaires>` : ""
    }
  </composition>
  
  ${
    inspiration
      ? `<reference_inspiration>${inspiration}</reference_inspiration>`
      : ""
  }
  
  ${
    detailDemande
      ? `<description_detaillee>
${detailDemande}
  </description_detaillee>`
      : ""
  }
</demande_generation_image>`;

  const oproInstructions = `<mission_optimisation_prompt_image>

<persona_expert>
Tu es un expert en prompt engineering pour IA génératives d'images (Midjourney, DALL-E, Stable Diffusion) avec 8+ ans d'expérience. Tu maîtrises la description visuelle précise, les styles artistiques, et les techniques de composition. Tu maîtrises également l'utilisation de balises XML pour structurer les prompts de manière hiérarchique et modulaire.
</persona_expert>

<exemples_reference>
  <exemple qualite="excellent" score="95">
    <prompt>Portrait photographique d'une femme d'affaires asiatique de 35 ans, confiant et dynamique. Style : photo corporate professionnelle, éclairage Rembrandt subtil, arrière-plan bureau moderne flou (f/2.8). Composition : plan américain (taille), regard caméra, sourire naturel. Vêtements : tailleur bleu marine élégant. Couleurs : tons neutres dominants (gris, bleu, blanc) avec touche de vert (plante en arrière-plan). Qualité : haute résolution 4K, netteté parfaite sur le visage, bokeh doux. Ambiance : professionnel, chaleureux, accessible.</prompt>
    <raison>✅ Sujet ultra-précis ✅ Style défini ✅ Éclairage technique ✅ Composition détaillée ✅ Couleurs spécifiques ✅ Qualité technique ✅ Ambiance claire</raison>
  </exemple>
  <exemple qualite="faible" score="30">
    <prompt>Une femme dans un bureau</prompt>
    <raison>❌ Sujet vague ❌ Pas de style ❌ Pas d'éclairage ❌ Pas de composition ❌ Pas de couleurs ❌ Pas de qualité</raison>
  </exemple>
</exemples_reference>

<methodologie_chain_of_thought>
  <etape numero="1">
    ANALYSE : Examine la demande visuelle. Identifie sujet, style, ambiance, composition. Quels détails visuels manquent ?
  </etape>
  <etape numero="2">
    GÉNÉRATION : Crée 5 variantes avec approches différentes :
    - Variante 1 : Focus DESCRIPTION VISUELLE précise
    - Variante 2 : Focus STYLE ARTISTIQUE et références
    - Variante 3 : Focus COMPOSITION et cadrage
    - Variante 4 : Focus AMBIANCE et émotions
    - Variante 5 : Approche TECHNIQUE (éclairage, qualité)
  </etape>
  <etape numero="3">
    ÉVALUATION : Note /100 selon :
    • Clarté visuelle (25 pts) : Description sans ambiguïté ?
    • Précision technique (25 pts) : Détails techniques clairs ?
    • Cohérence stylistique (25 pts) : Style unifié ?
    • Réalisabilité (25 pts) : L'IA peut-elle le générer ?
  </etape>
  <etape numero="4">
    SYNTHÈSE : Crée LE prompt optimal (95-100/100) combinant le meilleur des 5 variantes pour l'image parfaite. Fournis-le d'abord en version texte brut (comme les variantes), puis en version structurée XML (en conservant la hiérarchie des balises comme dans le <prompt_utilisateur> original, mais optimisée avec les améliorations identifiées).
  </etape>
</methodologie_chain_of_thought>

<format_reponse_strict>
## 📋 VARIANTE [N]/5 - SCORE : [X]/100
### 🎯 Stratégie : [description]
### ✨ Prompt optimisé :
\`\`\`
[prompt image complet]
\`\`\`
### 📊 Évaluation :
- Clarté visuelle : [X]/25
- Précision technique : [X]/25
- Cohérence stylistique : [X]/25
- Réalisabilité : [X]/25
**TOTAL : [X]/100**

## 🏆 PROMPT FINAL - SCORE : [X]/100
### Version Texte Brut :
\`\`\`
[Le prompt optimal synthétisant le meilleur en texte brut]
\`\`\`
### Version XML Structurée :
\`\`\`
[Le même prompt optimal, mais reformulé en format XML hiérarchique avec balises comme <demande_generation_image>, <caracteristiques_visuelles>, <specifications_techniques>, etc. pour une meilleure modularité et lisibilité]
\`\`\`
### 💡 Pourquoi optimal : [explication]
</format_reponse_strict>

<prompt_utilisateur>
${basePrompt}
</prompt_utilisateur>

</mission_optimisation_prompt_image>`;

  document.getElementById("result-image").textContent = oproInstructions;
}

// Génération du prompt SIMPLE pour l'image (VERSION AMÉLIORÉE)
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

  let simplePrompt = `<mission_generation_image>

<persona>
Tu es un expert en génération d'images IA et design visuel. Tu maîtrises tous les styles artistiques et sais créer des descriptions visuelles précises.
</persona>

<demande>
  <visuels>
    ${type ? `<type>${type}</type>` : ""}
    ${style ? `<style>${style}</style>` : ""}
    ${couleurs ? `<couleurs>${couleurs}</couleurs>` : ""}
    ${eclairage ? `<eclairage>${eclairage}</eclairage>` : ""}
    ${ambiance ? `<ambiance>${ambiance}</ambiance>` : ""}
  </visuels>
  
  <composition>
    ${sujet ? `<sujet>${sujet}</sujet>` : ""}
    ${composition ? `<cadrage>${composition}</cadrage>` : ""}
    ${contexte ? `<contexte>${contexte}</contexte>` : ""}
    ${elements ? `<elements>${elements}</elements>` : ""}
  </composition>
  
  <technique>
    ${format ? `<format>${format}</format>` : ""}
    ${detail ? `<detail>${detail}</detail>` : ""}
    ${qualite ? `<qualite>${qualite}</qualite>` : ""}
    ${inspiration ? `<inspiration>${inspiration}</inspiration>` : ""}
  </technique>
  
  ${
    detailDemande
      ? `<description>
${detailDemande}
  </description>`
      : ""
  }
</demande>

<attentes>
  - Composition harmonieuse et équilibrée
  - Cohérence stylistique parfaite
  - Qualité professionnelle
  - Impact visuel fort
</attentes>

<livrable>
Génère l'image correspondant exactement à cette description.
</livrable>

</mission_generation_image>`;

  document.getElementById("result-image").textContent = simplePrompt;
}

// ============================================================================
// GÉNÉRATION PROMPT VOYAGE - VERSION AMÉLIORÉE
// ============================================================================
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

  // Construction avec BALISES XML
  let basePrompt = `<demande_planification_voyage>
  <destination_generale>${destination || "À définir"}</destination_generale>
  
  <parametres_voyage>
    ${objectif ? `<objectif>${objectif}</objectif>` : ""}
    ${type ? `<type_voyage>${type}</type_voyage>` : ""}
    ${voyageurs ? `<voyageurs>${voyageurs}</voyageurs>` : ""}
    ${duree ? `<duree>${duree}</duree>` : ""}
    ${budget ? `<budget>${budget}</budget>` : ""}
    ${saison ? `<saison_periode>${saison}</saison_periode>` : ""}
  </parametres_voyage>
  
  <preferences>
    ${style ? `<style_reponse>${style}</style_reponse>` : ""}
    ${references ? `<inspirations>${references}</inspirations>` : ""}
    ${
      activites
        ? `<activites_souhaitees>${activites}</activites_souhaitees>`
        : ""
    }
    ${interets ? `<centres_interet>${interets}</centres_interet>` : ""}
  </preferences>
  
  <logistique>
    ${hebergement ? `<type_hebergement>${hebergement}</type_hebergement>` : ""}
    ${transport ? `<mode_transport>${transport}</mode_transport>` : ""}
    ${
      contraintes
        ? `<contraintes_particulieres>${contraintes}</contraintes_particulieres>`
        : ""
    }
  </logistique>
  
  ${
    detailDemande
      ? `<informations_complementaires>
${detailDemande}
  </informations_complementaires>`
      : ""
  }
</demande_planification_voyage>`;

  const oproInstructions = `<mission_optimisation_prompt_voyage>

<persona_expert>
Tu es un expert en prompt engineering pour planification de voyages avec 8+ ans d'expérience. Tu maîtrises l'organisation d'itinéraires, les destinations mondiales, et la création de plans de voyage personnalisés. Tu maîtrises également l'utilisation de balises XML pour structurer les prompts de manière hiérarchique et modulaire.
</persona_expert>

<exemples_reference>
  <exemple qualite="excellent" score="95">
    <prompt>Planifie un voyage de 10 jours au Japon pour un couple trentenaire passionné de culture et gastronomie, budget 3500€/personne, en avril (saison des cerisiers). Itinéraire : Tokyo (4 jours) → Kyoto (3 jours) → Osaka (2 jours) + excursion Nara (1 jour). Hébergement : ryokans traditionnels + hôtels modernes. Inclure : 3 expériences culinaires (omakase, kaiseki, street food), temples incontournables, quartiers authentiques, conseils transports (JR Pass). Éviter pièges touristiques. Format : planning jour par jour avec horaires, budget détaillé, conseils pratiques (réservations, étiquette).</prompt>
    <raison>✅ Destination précise ✅ Profil voyageurs détaillé ✅ Budget exact ✅ Durée et période ✅ Itinéraire structuré ✅ Préférences claires ✅ Contraintes ✅ Format défini</raison>
  </exemple>
  <exemple qualite="faible" score="30">
    <prompt>Un voyage au Japon</prompt>
    <raison>❌ Pas de durée ❌ Pas de budget ❌ Pas de profil ❌ Pas d'itinéraire ❌ Pas de préférences</raison>
  </exemple>
</exemples_reference>

<methodologie_chain_of_thought>
  <etape numero="1">
    ANALYSE : Examine la demande voyage. Identifie destination, profil voyageurs, budget, durée, préférences. Quels éléments manquent pour un plan complet ?
  </etape>
  <etape numero="2">
    GÉNÉRATION : Crée 5 variantes avec approches différentes :
    - Variante 1 : Focus ITINÉRAIRE détaillé jour par jour
    - Variante 2 : Focus BUDGET et optimisation coûts
    - Variante 3 : Focus EXPÉRIENCES et activités uniques
    - Variante 4 : Focus LOGISTIQUE (transports, réservations)
    - Variante 5 : Approche LOCALE et hors sentiers battus
  </etape>
  <etape numero="3">
    ÉVALUATION : Note /100 selon :
    • Clarté de l'itinéraire (25 pts) : Planning précis ?
    • Faisabilité (25 pts) : Réaliste et réalisable ?
    • Personnalisation (25 pts) : Adapté au profil ?
    • Complétude (25 pts) : Tous aspects couverts ?
  </etape>
  <etape numero="4">
    SYNTHÈSE : Crée LE prompt optimal (95-100/100) combinant le meilleur des 5 variantes pour le voyage parfait. Fournis-le d'abord en version texte brut (comme les variantes), puis en version structurée XML (en conservant la hiérarchie des balises comme dans le <prompt_utilisateur> original, mais optimisée avec les améliorations identifiées).
  </etape>
</methodologie_chain_of_thought>

<format_reponse_strict>
## 📋 VARIANTE [N]/5 - SCORE : [X]/100
### 🎯 Stratégie : [description]
### ✨ Prompt optimisé :
\`\`\`
[prompt voyage complet]
\`\`\`
### 📊 Évaluation :
- Clarté de l'itinéraire : [X]/25
- Faisabilité : [X]/25
- Personnalisation : [X]/25
- Complétude : [X]/25
**TOTAL : [X]/100**

## 🏆 PROMPT FINAL - SCORE : [X]/100
### Version Texte Brut :
\`\`\`
[Le prompt optimal synthétisant le meilleur en texte brut]
\`\`\`
### Version XML Structurée :
\`\`\`
[Le même prompt optimal, mais reformulé en format XML hiérarchique avec balises comme <demande_planification_voyage>, <parametres_voyage>, <preferences>, etc. pour une meilleure modularité et lisibilité]
\`\`\`
### 💡 Pourquoi optimal : [explication]
</format_reponse_strict>

<prompt_utilisateur>
${basePrompt}
</prompt_utilisateur>

</mission_optimisation_prompt_voyage>`;

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

  let simplePrompt = `<mission_planification_voyage>

<persona>
Tu es un expert tour operator et conseiller en voyages avec 20 ans d'expérience. Tu connais les meilleures destinations, optimises les budgets, et crées des itinéraires sur-mesure.
</persona>

<demande_voyage>
  <destination_generale>${
    destination || "À définir selon recommandations"
  }</destination_generale>
  
  <parametres>
    ${objectif ? `<objectif>${objectif}</objectif>` : ""}
    ${type ? `<type_voyage>${type}</type_voyage>` : ""}
    ${voyageurs ? `<voyageurs>${voyageurs}</voyageurs>` : ""}
    ${duree ? `<duree>${duree}</duree>` : ""}
    ${budget ? `<budget>${budget}</budget>` : ""}
    ${saison ? `<periode>${saison}</periode>` : ""}
  </parametres>
  
  <preferences>
    ${style ? `<style_itineraire>${style}</style_itineraire>` : ""}
    ${references ? `<inspirations>${references}</inspirations>` : ""}
    ${activites ? `<activites>${activites}</activites>` : ""}
    ${interets ? `<centres_interet>${interets}</centres_interet>` : ""}
  </preferences>
  
  <logistique>
    ${hebergement ? `<hebergement>${hebergement}</hebergement>` : ""}
    ${transport ? `<transport>${transport}</transport>` : ""}
    ${contraintes ? `<contraintes>${contraintes}</contraintes>` : ""}
  </logistique>
  
  ${
    detailDemande
      ? `<informations_complementaires>
${detailDemande}
  </informations_complementaires>`
      : ""
  }
</demande_voyage>

<livrables_attendus>
  - Itinéraire ${style || "détaillé jour par jour"} adapté aux critères
  - Recommandations d'hébergement selon le budget
  - Suggestions d'activités et sites à visiter
  - Conseils pratiques (transport, restauration, budget estimatif)
  - Alternatives et options en cas d'imprévu
</livrables_attendus>

<attentes>
  - Plan de voyage complet et réaliste
  - Optimisation budget/expérience
  - Conseils pratiques et actionnables
  - Itinéraire équilibré et agréable
</attentes>

<livrable>
Crée un plan de voyage détaillé, personnalisé et prêt à être suivi.
</livrable>

</mission_planification_voyage>`;

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

  // Construction avec BALISES XML
  let basePrompt = `<demande_generation_code>
  <contexte_projet>
    ${objectif ? `<objectif>${objectif}</objectif>` : ""}
    ${projet ? `<type_projet>${projet}</type_projet>` : ""}
    ${role ? `<role_developpeur>${role}</role_developpeur>` : ""}
  </contexte_projet>
  
  <specifications_techniques>
    ${langage ? `<langage_technologie>${langage}</langage_technologie>` : ""}
    ${contraintes ? `<contraintes>${contraintes}</contraintes>` : ""}
    ${format ? `<format_sortie>${format}</format_sortie>` : ""}
  </specifications_techniques>
  
  ${fichiers ? `<fichiers_joints>${fichiers}</fichiers_joints>` : ""}
  ${
    niveau
      ? `<niveau_expertise_utilisateur>${niveau}</niveau_expertise_utilisateur>`
      : ""
  }
  
  ${
    detailDemande
      ? `<description_detaillee>
${detailDemande}
  </description_detaillee>`
      : ""
  }
</demande_generation_code>`;

  const oproInstructions = `<mission_optimisation_prompt_code>

<persona_expert>
Tu es un expert en prompt engineering pour développement logiciel avec 8+ ans d'expérience. Tu maîtrises tous les langages, frameworks, architectures, et best practices de développement. Tu maîtrises également l'utilisation de balises XML pour structurer les prompts de manière hiérarchique et modulaire.
</persona_expert>

<exemples_reference>
  <exemple qualite="excellent" score="95">
    <prompt>Développe une API REST en Node.js/Express pour gestion d'utilisateurs. Stack : Node 18+, Express 4.18, MongoDB avec Mongoose, JWT pour auth. Architecture : controllers/services/models séparés. Features : CRUD utilisateurs (register, login, profile, update, delete), middleware auth JWT, validation Joi, hash bcrypt, rate limiting, CORS. Code : ES6+, async/await, gestion erreurs centralisée, logs Winston. Tests : Jest (unitaires + intégration), coverage >80%. Livrables : code commenté, README avec setup, collection Postman, .env.example. Contraintes : sécurité OWASP, codes HTTP standards, réponses JSON uniformes.</prompt>
    <raison>✅ Stack précis ✅ Architecture définie ✅ Features listées ✅ Best practices ✅ Tests spécifiés ✅ Livrables clairs ✅ Contraintes sécurité</raison>
  </exemple>
  <exemple qualite="faible" score="30">
    <prompt>Fais une API en Node.js</prompt>
    <raison>❌ Pas de features ❌ Pas d'architecture ❌ Pas de livrables ❌ Pas de contraintes</raison>
  </exemple>
</exemples_reference>

<methodologie_chain_of_thought>
  <etape numero="1">
    ANALYSE : Examine la demande code. Identifie objectif, stack, features, architecture. Quels aspects techniques manquent ?
  </etape>
  <etape numero="2">
    GÉNÉRATION : Crée 5 variantes avec approches différentes :
    - Variante 1 : Focus ARCHITECTURE et structure code
    - Variante 2 : Focus FEATURES et fonctionnalités complètes
    - Variante 3 : Focus QUALITÉ (tests, docs, best practices)
    - Variante 4 : Focus SÉCURITÉ et robustesse
    - Variante 5 : Focus PERFORMANCE et optimisation
  </etape>
  <etape numero="3">
    ÉVALUATION : Note /100 selon :
    • Clarté technique (25 pts) : Specs techniques claires ?
    • Complétude (25 pts) : Tous aspects couverts ?
    • Best practices (25 pts) : Code quality standards ?
    • Actionnabilité (25 pts) : Directement implémentable ?
  </etape>
  <etape numero="4">
    SYNTHÈSE : Crée LE prompt optimal (95-100/100) combinant le meilleur des 5 variantes pour un code production ready. Fournis-le d'abord en version texte brut (comme les variantes), puis en version structurée XML (en conservant la hiérarchie des balises comme dans le <prompt_utilisateur> original, mais optimisée avec les améliorations identifiées).
  </etape>
</methodologie_chain_of_thought>

<format_reponse_strict>
Pour chaque variante :

## 📋 VARIANTE [N]/5 - SCORE : [X]/100
### 🎯 Stratégie : [description]
### ✨ Prompt optimisé :
\`\`\`
[prompt code complet]
\`\`\`
### 📊 Évaluation :
- Clarté technique : [X]/25 - [justification]
- Complétude : [X]/25 - [justification]
- Best practices : [X]/25 - [justification]
- Actionnabilité : [X]/25 - [justification]
**TOTAL : [X]/100**

Puis à la fin :

## 🏆 PROMPT FINAL - SCORE : [X]/100
### Version Texte Brut :
\`\`\`
[Le prompt optimal synthétisant le meilleur en texte brut]
\`\`\`
### Version XML Structurée :
\`\`\`
[Le même prompt optimal, mais reformulé en format XML hiérarchique avec balises comme <demande_generation_code>, <contexte_projet>, <specifications_techniques>, etc. pour une meilleure modularité et lisibilité]
\`\`\`
### 💡 Pourquoi optimal : [explication]
</format_reponse_strict>

<prompt_utilisateur>
${basePrompt}
</prompt_utilisateur>

</mission_optimisation_prompt_code>`;

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

  let simplePrompt = `<mission_generation_code>

<persona>
${
  role
    ? role
    : "Tu es un développeur expert avec 10+ ans d'expérience. Tu maîtrises les best practices et écris du code propre et maintenable."
}
</persona>

<demande>
  <contexte>
    ${objectif ? `<objectif>${objectif}</objectif>` : ""}
    ${langage ? `<langage>${langage}</langage>` : ""}
    ${projet ? `<projet>${projet}</projet>` : ""}
  </contexte>
  
  <contraintes>
    ${contraintes ? `<techniques>${contraintes}</techniques>` : ""}
    ${niveau ? `<niveau_utilisateur>${niveau}</niveau_utilisateur>` : ""}
    ${format ? `<format>${format}</format>` : ""}
  </contraintes>
  
  ${
    detailDemande
      ? `<specifications>
${detailDemande}
  </specifications>`
      : ""
  }
  
  ${
    fichiers && fichiers !== "Aucun fichier joint"
      ? `<fichiers>${fichiers}</fichiers>`
      : ""
  }
</demande>

<attentes>
  - Code propre, commenté et structuré
  - Respect des best practices du langage
  - Gestion d'erreurs robuste
  - Explications des parties complexes
</attentes>

<livrable>
Produis le code demandé, prêt à être utilisé.
</livrable>

</mission_generation_code>`;

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

  // Construction avec BALISES XML
  let basePrompt = `<demande_creation_application>
  <caracteristiques_generales>
    ${type ? `<type_application>${type}</type_application>` : ""}
    ${fonction ? `<fonction_principale>${fonction}</fonction_principale>` : ""}
    ${publicCible ? `<public_cible>${publicCible}</public_cible>` : ""}
  </caracteristiques_generales>
  
  <stack_technique>
    ${stack ? `<technologies>${stack}</technologies>` : ""}
    ${platform ? `<plateformes>${platform}</plateformes>` : ""}
    ${archi ? `<architecture>${archi}</architecture>` : ""}
  </stack_technique>
  
  <fonctionnalites>
    ${data ? `<gestion_donnees>${data}</gestion_donnees>` : ""}
    ${auth ? `<authentification>${auth}</authentification>` : ""}
    ${features ? `<features_ui_ux>${features}</features_ui_ux>` : ""}
  </fonctionnalites>
  
  <qualite_production>
    ${design ? `<design_system>${design}</design_system>` : ""}
    ${a11y ? `<accessibilite>${a11y}</accessibilite>` : ""}
    ${perf ? `<performance>${perf}</performance>` : ""}
    ${tests ? `<tests_qualite>${tests}</tests_qualite>` : ""}
  </qualite_production>
  
  <livrables_contraintes>
    ${livrables ? `<livrables_attendus>${livrables}</livrables_attendus>` : ""}
    ${
      contraintes
        ? `<contraintes_techniques>${contraintes}</contraintes_techniques>`
        : ""
    }
  </livrables_contraintes>
  
  ${
    detailDemande
      ? `<description_detaillee>
${detailDemande}
  </description_detaillee>`
      : ""
  }
</demande_creation_application>`;

  const oproInstructions = `<mission_optimisation_prompt_application>

<persona_expert>
Tu es un Architecte Logiciel Senior avec 10+ ans d'expérience en développement full-stack. Tu maîtrises parfaitement les frameworks modernes, l'architecture logicielle, UI/UX design et DevOps. Tu maîtrises également l'utilisation de balises XML pour structurer les prompts de manière hiérarchique et modulaire.
</persona_expert>

<exemples_reference>
  <exemple qualite="excellent" score="95">
    <prompt>Crée une app web e-commerce complète. Stack : React 18 + TypeScript, Next.js 14 (App Router), TailwindCSS, Prisma + PostgreSQL, NextAuth. Features : catalogue produits (filtres, recherche, pagination), panier (localStorage + sync DB), checkout Stripe, espace user (commandes, profil), admin dashboard (produits, commandes). Architecture : Server Components, API routes, middleware auth, validation Zod. UI : Design system cohérent, responsive mobile-first, dark mode. Performance : ISR pages produits, optimisation images (next/image), lazy loading. Tests : Jest + React Testing Library (>70% coverage). Livrables : code TypeScript strict, README complet, Storybook composants, seed data, Dockerfile.</prompt>
    <raison>✅ Stack moderne détaillé ✅ Features complètes ✅ Architecture claire ✅ UI/UX spécifiée ✅ Performance optimisée ✅ Tests définis ✅ Livrables précis</raison>
  </exemple>
  <exemple qualite="faible" score="30">
    <prompt>Fais une app e-commerce</prompt>
    <raison>❌ Pas de stack ❌ Pas de features ❌ Pas d'architecture ❌ Pas de livrables</raison>
  </exemple>
</exemples_reference>

<methodologie_chain_of_thought>
  <etape numero="1">
    ANALYSE : Examine la demande app. Identifie type, stack, features, architecture, UI/UX. Quels aspects manquent ?
  </etape>
  <etape numero="2">
    GÉNÉRATION : Crée 5 variantes avec focus différents :
    - Variante 1 : Focus ARCHITECTURE et structure projet
    - Variante 2 : Focus FEATURES et expérience utilisateur
    - Variante 3 : Focus UI/UX et design cohérent
    - Variante 4 : Focus QUALITÉ (tests, docs, maintenabilité)
    - Variante 5 : Focus PERFORMANCE et scalabilité
  </etape>
  <etape numero="3">
    ÉVALUATION : Note /100 selon :
    • Clarté architecture (25 pts) : Structure claire ?
    • Complétude features (25 pts) : Toutes fonctionnalités ?
    • Qualité production (25 pts) : Production-ready ?
    • Livrables (25 pts) : Tout fourni ?
  </etape>
  <etape numero="4">
    SYNTHÈSE : Crée LE prompt optimal (95-100/100) combinant le meilleur des 5 variantes pour une app complet. Fournis-le d'abord en version texte brut (comme les variantes), puis en version structurée XML (en conservant la hiérarchie des balises comme dans le <prompt_utilisateur> original, mais optimisée avec les améliorations identifiées).
  </etape>
</methodologie_chain_of_thought>

<format_reponse_strict>
Pour chaque variante :

## 📋 VARIANTE [N]/5 - SCORE : [X]/100
### 🎯 Stratégie : [description]
### ✨ Prompt optimisé :
\`\`\`
[prompt application complet]
\`\`\`
### 📊 Évaluation :
- Clarté architecture : [X]/25 - [justification]
- Complétude features : [X]/25 - [justification]
- Qualité production : [X]/25 - [justification]
- Livrables : [X]/25 - [justification]
**TOTAL : [X]/100**

Puis à la fin :

## 🏆 PROMPT FINAL - SCORE : [X]/100
### Version Texte Brut :
\`\`\`
[Le prompt optimal synthétisant le meilleur en texte brut]
\`\`\`
### Version XML Structurée :
\`\`\`
[Le même prompt optimal, mais reformulé en format XML hiérarchique avec balises comme <demande_creation_application>, <caracteristiques_generales>, <stack_technique>, etc. pour une meilleure modularité et lisibilité]
\`\`\`
### 💡 Pourquoi optimal : [explication]
</format_reponse_strict>

<prompt_utilisateur>
${basePrompt}
</prompt_utilisateur>

</mission_optimisation_prompt_application>`;

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

  let simplePrompt = `<mission_creation_application>

<persona>
Tu es un Architecte Logiciel Senior avec 15+ ans d'expérience en développement full-stack, mobile et UI/UX design. Tu maîtrises les frameworks modernes et les principes d'architecture logicielle.
</persona>

<specifications_application>
  <general>
    ${type ? `<type>${type}</type>` : ""}
    ${fonction ? `<fonction>${fonction}</fonction>` : ""}
    ${publicCible ? `<public>${publicCible}</public>` : ""}
  </general>
  
  <technique>
    ${stack ? `<stack>${stack}</stack>` : ""}
    ${platform ? `<platform>${platform}</platform>` : ""}
    ${archi ? `<architecture>${archi}</architecture>` : ""}
  </technique>
  
  <fonctionnalites>
    ${data ? `<donnees>${data}</donnees>` : ""}
    ${auth ? `<auth>${auth}</auth>` : ""}
    ${features ? `<ui_ux>${features}</ui_ux>` : ""}
  </fonctionnalites>
  
  <qualite>
    ${design ? `<design>${design}</design>` : ""}
    ${a11y ? `<accessibilite>${a11y}</accessibilite>` : ""}
    ${perf ? `<performance>${perf}</performance>` : ""}
    ${tests ? `<tests>${tests}</tests>` : ""}
  </qualite>
  
  ${livrables ? `<livrables>${livrables}</livrables>` : ""}
  ${contraintes ? `<contraintes>${contraintes}</contraintes>` : ""}
  
  ${
    detailDemande
      ? `<details>
${detailDemande}
  </details>`
      : ""
  }
</specifications_application>

<attentes>
  - Application complète et production-ready
  - Code structuré selon best practices
  - UI/UX professionnelle et intuitive
  - Documentation et livrables complets
</attentes>

<livrable>
Crée l'application complète selon ces spécifications.
</livrable>

</mission_creation_application>`;

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

  // Fonction pour agrandir automatiquement un textarea
  function autoResizeTextarea(textarea) {
    textarea.style.height = "auto"; // Réinitialise la hauteur pour calculer la nouvelle
    textarea.style.height = textarea.scrollHeight + "px"; // Ajuste à la hauteur du contenu
  }

  // Appliquer à tous les textareas de description détaillée
  const detailTextareas = [
    document.getElementById("detail-demande"),
    document.getElementById("detail-demande-image"),
    document.getElementById("detail-demande-voyage"),
    document.getElementById("detail-demande-code"),
    document.getElementById("detail-demande-app"),
  ];

  detailTextareas.forEach((textarea) => {
    if (textarea) {
      textarea.addEventListener("input", () => autoResizeTextarea(textarea));
      // Appliquer une fois au chargement pour ajuster si du texte est pré-rempli
      autoResizeTextarea(textarea);
    }
  });
});
