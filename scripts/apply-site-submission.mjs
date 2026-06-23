import { readFileSync, writeFileSync } from "node:fs";

const jsonBlockPattern = /```json\s*([\s\S]*?)\s*```/i;
const groupPattern = /^Group:\s*(.+)$/im;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

export const parseIssueSubmission = (body) => {
  const groupMatch = body.match(groupPattern);
  assert(groupMatch, "Issue body must include a Group line");

  const jsonMatch = body.match(jsonBlockPattern);
  assert(jsonMatch, "Issue body must include a fenced json block");

  const site = JSON.parse(jsonMatch[1]);
  assert(site.name && typeof site.name === "string", "Site name is required");
  assert(site.description && typeof site.description === "string", "Site description is required");
  assert(site.url && typeof site.url === "string", "Site URL is required");
  new URL(site.url);

  return {
    groupTitle: groupMatch[1].trim(),
    site: {
      name: site.name.trim(),
      description: site.description.trim(),
      url: site.url.trim(),
      status: (site.status || "Online").trim(),
      tags: Array.isArray(site.tags) ? site.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    },
  };
};

export const applySiteSubmission = (body, dataPath = "data/sites.json") => {
  const submission = parseIssueSubmission(body);
  const data = JSON.parse(readFileSync(dataPath, "utf8"));
  const group = data.siteGroups.find((item) => item.title === submission.groupTitle);
  assert(group, `Unknown site group: ${submission.groupTitle}`);

  const normalizedUrl = submission.site.url.replace(/\/$/, "").toLowerCase();
  const duplicate = group.items.some((site) => site.url.replace(/\/$/, "").toLowerCase() === normalizedUrl);
  assert(!duplicate, `A site with this URL already exists in ${submission.groupTitle}`);

  group.items.push(submission.site);
  writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);
  return submission;
};

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  const body = process.env.ISSUE_BODY;
  assert(body, "ISSUE_BODY environment variable is required");
  const result = applySiteSubmission(body);
  console.log(`Added ${result.site.name} to ${result.groupTitle}`);
}