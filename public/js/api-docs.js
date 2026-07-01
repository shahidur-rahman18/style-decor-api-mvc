(function () {
  const baseUrl = document.getElementById("base-url")?.textContent?.trim() || "";
  const endpoints = JSON.parse(
    document.getElementById("endpoints-data")?.textContent || "[]"
  );

  const searchInput = document.getElementById("search");
  const filterChips = document.getElementById("filters");
  const panelBody = document.getElementById("panel-body");
  const panelRequest = document.getElementById("panel-request");
  const toast = document.getElementById("toast");

  let activeCard = null;
  let toastTimer = null;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  };

  const setPanel = ({ request, body, type = "" }) => {
    panelRequest.innerHTML = request;
    panelBody.textContent = body;
    panelBody.className = `panel-body ${type}`.trim();
  };

  const selectCard = (card) => {
    if (activeCard) {
      activeCard.classList.remove("active");
      activeCard.setAttribute("aria-expanded", "false");
      activeCard.querySelector(".endpoint-details")?.setAttribute("hidden", "");
    }

    activeCard = card;
    card.classList.add("active");
    card.setAttribute("aria-expanded", "true");

    const details = card.querySelector(".endpoint-details");
    details?.removeAttribute("hidden");

    const path = card.dataset.path;
    const method = card.dataset.method;
    const fullUrl = `${baseUrl}${path}`;
    const urlEl = card.querySelector(".full-url-text");
    if (urlEl) urlEl.textContent = fullUrl;

    const index = Number(card.dataset.index);
    const ep = endpoints[index];

    setPanel({
      request: `<span class="meta-label">Selected</span> <code>${method} ${path}</code>`,
      body: [
        ep.description,
        "",
        `Auth: ${ep.auth}`,
        ep.body ? `Body: ${ep.body}` : null,
        ep.response ? `Response: ${ep.response}` : null,
        ep.note ? `Note: ${ep.note}` : null,
        "",
        `Full URL: ${fullUrl}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  };

  const tryEndpoint = async (card) => {
    const path = card.dataset.path;
    const method = card.dataset.method;
    const fullUrl = `${baseUrl}${path}`;

    selectCard(card);
    setPanel({
      request: `<span class="meta-label">Requesting</span> <code>${method} ${fullUrl}</code>`,
      body: "Loading…",
      type: "loading",
    });

    const start = performance.now();

    try {
      const res = await fetch(fullUrl, { method, credentials: "include" });
      const elapsed = Math.round(performance.now() - start);
      const contentType = res.headers.get("content-type") || "";

      let bodyText;
      if (contentType.includes("application/json")) {
        const json = await res.json();
        bodyText = JSON.stringify(json, null, 2);
      } else {
        bodyText = await res.text();
      }

      setPanel({
        request: `<span class="meta-label">${res.status}</span> <code>${method} ${fullUrl}</code> <span style="color:var(--text-muted)">(${elapsed}ms)</span>`,
        body: bodyText,
        type: res.ok ? "success" : "error",
      });
    } catch (err) {
      setPanel({
        request: `<span class="meta-label">Error</span> <code>${method} ${fullUrl}</code>`,
        body: err.message || "Request failed",
        type: "error",
      });
    }
  };

  const copyPath = async (card) => {
    const path = card.dataset.path;
    const fullUrl = `${baseUrl}${path}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      showToast(`Copied: ${fullUrl}`);
    } catch {
      showToast("Could not copy to clipboard");
    }
  };

  document.querySelectorAll(".endpoint-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".copy-btn")) {
        e.stopPropagation();
        copyPath(card);
        return;
      }
      if (e.target.closest(".try-btn")) {
        e.stopPropagation();
        tryEndpoint(card);
        return;
      }
      selectCard(card);
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectCard(card);
      }
    });
  });

  const applyFilters = () => {
    const query = (searchInput?.value || "").toLowerCase().trim();
    const activeFilter =
      filterChips?.querySelector(".chip.active")?.dataset.filter || "all";

    document.querySelectorAll(".api-group").forEach((group) => {
      const groupName = group.dataset.group;
      const groupMatch = activeFilter === "all" || groupName === activeFilter;
      let visibleInGroup = 0;

      group.querySelectorAll(".endpoint-card").forEach((card) => {
        const path = card.dataset.path.toLowerCase();
        const method = card.dataset.method.toLowerCase();
        const desc = card.querySelector(".endpoint-desc")?.textContent.toLowerCase() || "";
        const searchMatch =
          !query ||
          path.includes(query) ||
          method.includes(query) ||
          desc.includes(query);

        const show = groupMatch && searchMatch;
        card.classList.toggle("hidden", !show);
        if (show) visibleInGroup++;
      });

      group.classList.toggle("hidden", visibleInGroup === 0);
    });
  };

  searchInput?.addEventListener("input", applyFilters);

  filterChips?.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    filterChips.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    applyFilters();
  });
})();
