let data;

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

const renderStats = () => {
  const stats = document.getElementById("stats");
  stats.innerHTML = "";
  data.stats.forEach((item) => {
    const wrapper = document.createElement("div");
    const value = document.createElement("dt");
    const label = document.createElement("dd");
    value.textContent = item.value;
    label.textContent = item.label;
    wrapper.append(value, label);
    stats.appendChild(wrapper);
  });
};

const renderHighlights = () => {
  const highlights = document.getElementById("highlights");
  highlights.innerHTML = "";
  data.highlights.forEach((item) => {
    const article = document.createElement("article");
    article.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p>`;
    highlights.appendChild(article);
  });
};

const renderGroups = () => {
  const groups = document.getElementById("site-groups");
  groups.innerHTML = "";

  data.siteGroups.forEach((group) => {
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
        <div class="tag-row">${tags}</div>
      `;
      card.appendChild(createLink(site.url, "Visit site", "visit-link"));
      list.appendChild(card);
    });

    section.append(heading, list);
    groups.appendChild(section);
  });
};

const renderSkills = () => {
  const skillList = document.getElementById("skills-list");
  skillList.innerHTML = "";
  data.skills.forEach((skill) => {
    const row = document.createElement("div");
    row.className = "skill-row";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(skill.name)}</strong>
        <span>${skill.level}%</span>
      </div>
      <div class="meter"><i style="width: ${skill.level}%"></i></div>
    `;
    skillList.appendChild(row);
  });
};

const renderContacts = () => {
  const contacts = document.getElementById("contact-links");
  contacts.innerHTML = "";
  data.contacts.forEach((item) => {
    contacts.appendChild(createLink(item.url, item.label, "contact-link"));
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

  const params = new URLSearchParams({
    title,
    body,
    labels: "site-submission",
  });
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
  const response = await fetch("data/sites.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load data/sites.json: ${response.status}`);
  }

  data = await response.json();
  const profile = data.profile;

  text("availability", profile.availability);
  text("hero-title", profile.name);
  text("role", profile.role);
  text("summary", profile.summary);
  text("about-copy", profile.about);
  text("year", new Date().getFullYear());

  document.title = `${profile.name} - Personal Homepage`;
  document.querySelector(".brand span:last-child").textContent = profile.domain;
  document.getElementById("github-link").href = profile.githubUrl;

  renderStats();
  renderHighlights();
  renderGroups();
  renderSkills();
  renderContacts();
  renderGroupSelect();
  setupForm();
};

init().catch((error) => {
  console.error(error);
  text("summary", "Site data could not be loaded. Please try again later.");
});
