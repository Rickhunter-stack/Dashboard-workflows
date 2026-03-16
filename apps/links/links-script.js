(() => {
  const LINKS = [
    { id: "claude", label: "Claude", url: "https://claude.ai", group: "IA" },
    { id: "grok", label: "Grok", url: "https://grok.com", group: "IA" },
    {
      id: "chatgpt",
      label: "ChatGPT",
      url: "https://chat.openai.com",
      group: "IA",
    },
    {
      id: "sheets",
      label: "Google Sheets",
      url: "https://sheets.google.com",
      group: "Productivité",
    },
    {
      id: "vercel",
      label: "Vercel",
      url: "https://vercel.com",
      group: "Dev",
    },
    {
      id: "github",
      label: "GitHub",
      url: "https://github.com",
      group: "Dev",
    },
    {
      id: "supabase",
      label: "Supabase",
      url: "https://supabase.com",
      group: "Dev",
    },
    {
      id: "bitwarden",
      label: "Bitwarden",
      url: "https://bitwarden.com",
      group: "Sécurité",
    },
  ];

  const listEl = document.getElementById("links-list");
  const toggleBtn = document.getElementById("links-toggle");

  function openLink(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function renderLinks() {
    if (!listEl) return;
    listEl.innerHTML = LINKS.map(
      (link) => `
        <button
          type="button"
          class="link-card"
          onclick="window.open('${link.url}', '_blank', 'noopener,noreferrer')"
        >
          <div class="link-info">
            <span class="link-label">${link.label}</span>
            <span class="link-url">${link.url}</span>
          </div>
          <span class="link-badge">${link.group}</span>
        </button>
      `,
    ).join("");
  }

  if (toggleBtn && listEl) {
    toggleBtn.addEventListener("click", () => {
      const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
      const next = !expanded;
      toggleBtn.setAttribute("aria-expanded", next ? "true" : "false");
      listEl.style.display = next ? "grid" : "none";
      const chev = toggleBtn.querySelector(".chevron");
      if (chev) chev.textContent = next ? "▾" : "▸";
    });
  }

  renderLinks();

  // Exposer la config pour pouvoir ajouter facilement d'autres liens depuis la console si besoin
  window.linksApp = {
    LINKS,
    openLink,
    render: renderLinks,
  };
})();

