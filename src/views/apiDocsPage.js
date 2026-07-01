const apiEndpoints = require("../data/apiEndpoints");

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const methodClass = (method) => method.toLowerCase();

const renderEndpointCard = (endpoint, index) => {
  const tags = [
    endpoint.auth && `<span class="tag tag-auth">${escapeHtml(endpoint.auth)}</span>`,
    endpoint.rateLimit &&
      `<span class="tag tag-rate">${escapeHtml(endpoint.rateLimit)}</span>`,
  ]
    .filter(Boolean)
    .join("");

  const meta = [
    endpoint.body &&
      `<div class="meta-row"><span class="meta-label">Body</span><code>${escapeHtml(endpoint.body)}</code></div>`,
    endpoint.response &&
      `<div class="meta-row"><span class="meta-label">Response</span><code>${escapeHtml(endpoint.response)}</code></div>`,
    endpoint.note &&
      `<div class="meta-row note"><span class="meta-label">Note</span><span>${escapeHtml(endpoint.note)}</span></div>`,
  ]
    .filter(Boolean)
    .join("");

  return `
    <article
      class="endpoint-card"
      data-index="${index}"
      data-method="${escapeHtml(endpoint.method)}"
      data-path="${escapeHtml(endpoint.path)}"
      data-tryable="${endpoint.tryable ? "true" : "false"}"
      tabindex="0"
      role="button"
      aria-expanded="false"
    >
      <div class="endpoint-header">
        <span class="method method-${methodClass(endpoint.method)}">${escapeHtml(endpoint.method)}</span>
        <code class="endpoint-path">${escapeHtml(endpoint.path)}</code>
        <div class="endpoint-actions">
          <button type="button" class="btn-icon copy-btn" title="Copy path" aria-label="Copy path">⎘</button>
          ${
            endpoint.tryable
              ? '<button type="button" class="btn-try try-btn">Try it</button>'
              : ""
          }
        </div>
      </div>
      <p class="endpoint-desc">${escapeHtml(endpoint.description)}</p>
      ${tags ? `<div class="endpoint-tags">${tags}</div>` : ""}
      <div class="endpoint-details" hidden>
        ${meta}
        <div class="full-url">
          <span class="meta-label">Full URL</span>
          <code class="full-url-text"></code>
        </div>
      </div>
    </article>
  `;
};

const flatEndpoints = apiEndpoints.flatMap((group) => group.endpoints);

const renderGroups = () =>
  apiEndpoints
    .map(
      (group) => `
    <section class="api-group" data-group="${escapeHtml(group.group.toLowerCase())}">
      <div class="group-header">
        <h2>${escapeHtml(group.group)}</h2>
        <p>${escapeHtml(group.description)}</p>
        <span class="group-count">${group.endpoints.length} endpoint${group.endpoints.length === 1 ? "" : "s"}</span>
      </div>
      <div class="endpoint-grid">
        ${group.endpoints
          .map((ep) => {
            const index = flatEndpoints.indexOf(ep);
            return renderEndpointCard(ep, index);
          })
          .join("")}
      </div>
    </section>
  `
    )
    .join("");

const renderApiDocsPage = (baseUrl) => {
  const safeBase = escapeHtml(baseUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Style Decor API — Endpoints</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/api-docs.css" />
</head>
<body>
  <div class="page-bg" aria-hidden="true"></div>

  <header class="hero">
    <div class="hero-inner">
      <p class="eyebrow">Style Decor · Backend API</p>
      <h1>API Endpoints</h1>
      <p class="hero-sub">
        Click any endpoint to see details. Public GET routes can be tried live.
        Protected routes need <code>Authorization: Bearer &lt;token&gt;</code>.
      </p>
      <div class="hero-meta">
        <div class="stat">
          <span class="stat-value">${flatEndpoints.length}</span>
          <span class="stat-label">Endpoints</span>
        </div>
        <div class="stat">
          <span class="stat-value">${apiEndpoints.length}</span>
          <span class="stat-label">Groups</span>
        </div>
        <div class="stat">
          <span class="stat-value live-dot">●</span>
          <span class="stat-label">Base: <code id="base-url">${safeBase}</code></span>
        </div>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="toolbar">
      <div class="search-wrap">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="search" id="search" placeholder="Search path, method, or description…" autocomplete="off" />
      </div>
      <div class="filter-chips" id="filters">
        <button type="button" class="chip active" data-filter="all">All</button>
        ${apiEndpoints
          .map(
            (g) =>
              `<button type="button" class="chip" data-filter="${escapeHtml(g.group.toLowerCase())}">${escapeHtml(g.group)}</button>`
          )
          .join("")}
      </div>
    </div>

    <div class="layout">
      <div class="endpoints-col" id="endpoint-list">
        ${renderGroups()}
      </div>

      <aside class="response-panel" id="response-panel" aria-live="polite">
        <div class="panel-header">
          <h3>Response Preview</h3>
          <button type="button" class="btn-icon panel-close" id="panel-close" aria-label="Close panel">×</button>
        </div>
        <div class="panel-request" id="panel-request">
          <span class="meta-label">Waiting for request…</span>
        </div>
        <pre class="panel-body" id="panel-body">Click <strong>Try it</strong> on a public GET endpoint, or select any card to inspect details.</pre>
      </aside>
    </div>
  </main>

  <footer class="footer">
    <p>Contract reference: <code>API_CONTRACT.md</code> · Hybrid JWT auth (B1–B8 complete)</p>
  </footer>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <script id="endpoints-data" type="application/json">${JSON.stringify(flatEndpoints)}</script>
  <script src="/js/api-docs.js"></script>
</body>
</html>`;
};

module.exports = { renderApiDocsPage, apiEndpoints };
