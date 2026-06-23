let data;
let activeGroup = "All";
let searchQuery = "";

const text = (id, value) => {
  const element = document.getElementById(id);
  if (element && value) element.textContent = value;
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const createLink = (href, label, className = "") => {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  if (className) link.className = className;
  if (href.startsWith("http")) {
    link.target = "_blank";
    link.rel = "noreferrer";
  }
  return link;
};

const siteMatches = (site) => {
  if (!searchQuery) return true;
  const haystack = [site.name, site.description, site.url, site.status, ...site.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(searchQuery);
};

const visibleGroups = () =>
  data.siteGroups
    .filter((group) => activeGroup === "All" || group.title === activeGroup)
    .map((group) => ({ ...group, items: group.items.filter(siteMatches) }))
    .filter((group) => group.items.length > 0);

const renderCount = (groups) => {
  const total = data.siteGroups.reduce((count, group) => count + group.items.length, 0);
  const shown = groups.reduce((count, group) => count + group.items.length, 0);
  const label = shown === 1 ? "site" : "sites";
  text("site-count", `${shown} of ${total} ${label} shown`);
};

const renderGroups = () => {
  const container = document.getElementById("site-groups");
  const groups = visibleGroups();
  container.innerHTML = "";
  renderCount(groups);

  if (groups.length === 0) {
    container.innerHTML = '<p class="empty-state">No sites match the current filters.</p>';
    return;
  }

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "site-group";

    const heading = document.createElement("div");
    heading.className = "group-heading";
    heading.innerHTML = `<h3>${escapeHtml(group.title)}</h3><p>${escapeHtml(group.description)}</p>`;

    const list = document.createElement("div");
    list.className = "site-list";

    group.items.forEach((site) => {
      const card = document.createElement("article");
      card.className = "site-card";
      const tags = site.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
      card.innerHTML = `
        <div class="site-card-top">
          <h4>${escapeHtml(site.name)}</h4>
          <span class="status">${escapeHtml(site.status)}</span>
        </div>
        <p>${escapeHtml(site.description)}</p>
        <div class="site-meta">${escapeHtml(new URL(site.url).hostname)}</div>
        <div class="tag-row">${tags}</div>
      `;
      card.appendChild(createLink(site.url, "Visit", "visit-link"));
      list.appendChild(card);
    });

    section.append(heading, list);
    container.appendChild(section);
  });
};

const renderGroupFilters = () => {
  const filters = document.getElementById("group-filters");
  filters.innerHTML = "";
  ["All", ...data.siteGroups.map((group) => group.title)].forEach((groupTitle) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = groupTitle === activeGroup ? "filter-button active" : "filter-button";
    button.textContent = groupTitle;
    button.addEventListener("click", () => {
      activeGroup = groupTitle;
      renderGroupFilters();
      renderGroups();
    });
    filters.appendChild(button);
  });
};

const setupSiteSearch = () => {
  const input = document.getElementById("site-search");
  input.addEventListener("input", () => {
    searchQuery = input.value.trim().toLowerCase();
    renderGroups();
  });
};

const renderGroupSelect = () => {
  const select = document.getElementById("group-select");
  select.innerHTML = "";
  data.siteGroups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.title;
    option.textContent = group.title;
    select.appendChild(option);
  });
};

const renderSnippet = (site) => {
  const output = document.getElementById("site-snippet");
  const snippet = {
    name: site.name,
    description: site.description,
    url: site.url,
    status: site.status,
    tags: site.tags,
  };
  output.textContent = `GitHub issue payload generated for the "${site.groupTitle}" group:\n${JSON.stringify(snippet, null, 2)}`;
};

const issueUrlFor = (site) => {
  const repo = data.repository;
  const title = `Add site: ${site.name}`;
  const body = [
    "### Site submission",
    "",
    "Please review this site entry and add it to `data/sites.json` if approved.",
    "",
    `Group: ${site.groupTitle}`,
    "",
    "```json",
    JSON.stringify(
      {
        name: site.name,
        description: site.description,
        url: site.url,
        status: site.status,
        tags: site.tags,
      },
      null,
      2,
    ),
    "```",
  ].join("\n");

  const params = new URLSearchParams({ title, body, labels: "site-submission" });
  return `https://github.com/${repo.owner}/${repo.name}/issues/new?${params}`;
};

const setupForm = () => {
  const form = document.getElementById("site-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const site = {
      groupTitle: formData.get("group").trim(),
      name: formData.get("name").trim(),
      url: formData.get("url").trim(),
      status: formData.get("status").trim(),
      description: formData.get("description").trim(),
      tags: formData
        .get("tags")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    renderSnippet(site);
    window.open(issueUrlFor(site), "_blank", "noopener,noreferrer");
  });
};

const init = async () => {
  const response = await fetch(`data/sites.json?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load data/sites.json: ${response.status}`);

  data = await response.json();
  const profile = data.profile;

  text("availability", profile.availability);
  text("hero-title", profile.name);
  text("role", profile.role);
  text("summary", profile.summary);
  text("year", new Date().getFullYear());

  document.title = `${profile.name} - Site Directory`;
  document.querySelector(".brand span:last-child").textContent = profile.domain;
  document.getElementById("github-link").href = profile.githubUrl;

  renderGroupFilters();
  setupSiteSearch();
  renderGroups();
  renderGroupSelect();
  setupForm();
};

init().catch((error) => {
  console.error(error);
  text("summary", "Site data could not be loaded. Please try again later.");
});